import asyncio
import importlib.util
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, openai, xai
from vision_agents.plugins.openai import rtc_manager as openai_rtc_manager

from high_quality_audio_forwarder import HighQualityAudioForwarder
from jitter_buffered_audio_track import JitterBufferedAudioStreamTrack


ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

# Vision Agents 使用 Stream 官方变量名；Next.js 项目沿用原有变量名。
os.environ.setdefault(
    "STREAM_API_KEY", os.getenv("NEXT_PUBLIC_STREAM_VIDEO_API_KEY", "")
)
os.environ.setdefault(
    "STREAM_API_SECRET", os.getenv("STREAM_VIDEO_SECRET_KEY", "")
)

# OpenAI's WebRTC adapter otherwise downsamples its outbound audio to 16 kHz
# before Stream encodes it again. The xAI adapter does not use this forwarder.
openai_rtc_manager.AudioForwarder = HighQualityAudioForwarder


class MeetingEdge(getstream.Edge):
    def create_audio_track(
        self,
        sample_rate: int = 48_000,
        stereo: bool = False,
    ) -> JitterBufferedAudioStreamTrack:
        return JitterBufferedAudioStreamTrack(
            sample_rate=sample_rate,
            channels=2 if stereo else 1,
        )

logging.basicConfig(
    level=os.getenv("AGENT_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("meeting-agent")

# Stream 的 INFO 日志会包含临时 TURN 凭据，只在显式调试时开启。
if os.getenv("AGENT_DEBUG_SDK_LOGS") != "1":
    for noisy_logger in (
        "aioice",
        "getstream",
        "httpx",
        "vision_agents",
        "websocket",
    ):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)


class JoinRequest(BaseModel):
    call_id: str = Field(min_length=1)
    call_type: str = Field(default="default", min_length=1)
    agent_id: str = Field(min_length=1)
    agent_name: str = Field(min_length=1)
    instructions: str = Field(min_length=1)


class SessionState(BaseModel):
    call_id: str
    status: Literal["starting", "active", "failed", "idle"]
    error: str | None = None


class RunningSession:
    def __init__(self, task: asyncio.Task[None], ready: asyncio.Event):
        self.task = task
        self.ready = ready


sessions: dict[str, RunningSession] = {}
failures: dict[str, str] = {}


def realtime_provider() -> str:
    return os.getenv("AGENT_REALTIME_PROVIDER", "xai").strip().lower()


def missing_environment() -> list[str]:
    required = ["STREAM_API_KEY", "STREAM_API_SECRET"]
    provider = realtime_provider()
    if provider == "openai":
        required.append("OPENAI_API_KEY")
    elif provider == "xai":
        required.append("XAI_API_KEY")
    else:
        required.append("AGENT_REALTIME_PROVIDER(openai|xai)")
    return [name for name in required if not os.getenv(name)]


def missing_runtime_dependencies() -> list[str]:
    proxy_values = (
        os.getenv("ALL_PROXY", ""),
        os.getenv("HTTP_PROXY", ""),
        os.getenv("HTTPS_PROXY", ""),
    )
    uses_socks = any(value.lower().startswith("socks") for value in proxy_values)
    if uses_socks and importlib.util.find_spec("socksio") is None:
        return ["socksio"]
    return []


def authorize(secret: str | None) -> None:
    configured_secret = os.getenv("AGENT_WORKER_SECRET")
    if configured_secret and secret != configured_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent worker secret",
        )


def create_realtime_llm():
    provider = realtime_provider()
    if provider == "openai":
        return openai.Realtime(
            model=os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-1.5"),
            voice=os.getenv("OPENAI_REALTIME_VOICE", "shimmer"),
            send_video=False,
        )
    if provider == "xai":
        return xai.Realtime(
            model=os.getenv(
                "XAI_REALTIME_MODEL",
                "grok-voice-think-fast-1.0",
            ),
            voice=os.getenv("XAI_REALTIME_VOICE", "eve"),
            web_search=False,
            x_search=False,
            # Speaker-to-microphone echo can otherwise make server VAD cut off
            # the agent's own response.
            vad_interrupt_response=False,
        )
    raise ValueError(
        "AGENT_REALTIME_PROVIDER must be either 'openai' or 'xai'"
    )


async def run_agent(request: JoinRequest, ready: asyncio.Event) -> None:
    try:
        voice_style = os.getenv(
            "AGENT_VOICE_STYLE",
            (
                "Use a bright, youthful, cheerful, and cute feminine speaking "
                "style. Keep it natural, warm, and clear; do not sound "
                "exaggerated or childish."
            ),
        )
        agent = Agent(
            edge=MeetingEdge(),
            agent_user=User(name=request.agent_name, id=request.agent_id),
            instructions=(
                f"{request.instructions}\n\nVoice style: {voice_style}"
            ),
            llm=create_realtime_llm(),
            processors=[],
        )
        call = await agent.create_call(request.call_type, request.call_id)

        async with agent.join(call, participant_wait_timeout=0):
            failures.pop(request.call_id, None)
            ready.set()
            logger.info(
                "%s Agent %s joined call %s with %d instruction characters",
                realtime_provider(),
                request.agent_name,
                request.call_id,
                len(request.instructions),
            )
            finish_task = asyncio.create_task(agent.finish())
            max_idle_seconds = float(
                os.getenv("AGENT_MAX_IDLE_SECONDS", "60")
            )

            while not finish_task.done():
                await asyncio.sleep(5)
                if agent.idle_for() >= max_idle_seconds:
                    logger.info(
                        "Call %s has been idle for %.0f seconds; leaving",
                        request.call_id,
                        max_idle_seconds,
                    )
                    finish_task.cancel()
                    break

            await asyncio.gather(finish_task, return_exceptions=True)
    except asyncio.CancelledError:
        raise
    except Exception as error:
        failures[request.call_id] = f"{type(error).__name__}: {error}"
        logger.exception("Agent failed for call %s", request.call_id)
        raise


def remove_finished_session(
    call_id: str, session: RunningSession, task: asyncio.Task[None]
) -> None:
    if sessions.get(call_id) is session:
        sessions.pop(call_id, None)

    if not task.cancelled():
        # Retrieve the exception so asyncio does not report an unhandled task.
        task.exception()


@asynccontextmanager
async def lifespan(_: FastAPI):
    missing = missing_environment()
    if missing:
        logger.warning("Missing required environment variables: %s", ", ".join(missing))

    if not os.getenv("AGENT_WORKER_SECRET"):
        logger.warning(
            "AGENT_WORKER_SECRET is not set; /join is unprotected and should stay local"
        )

    yield

    active_tasks = [session.task for session in sessions.values()]
    for task in active_tasks:
        task.cancel()
    if active_tasks:
        await asyncio.gather(*active_tasks, return_exceptions=True)


app = FastAPI(title="Meeting Vision Agent", lifespan=lifespan)


@app.get("/health")
async def health():
    missing = missing_environment()
    missing_dependencies = missing_runtime_dependencies()
    return {
        "status": "ok",
        "configured": not missing and not missing_dependencies,
        "realtime_provider": realtime_provider(),
        "active_sessions": len(sessions),
    }


@app.get("/ready")
async def ready():
    missing = missing_environment()
    missing_dependencies = missing_runtime_dependencies()
    if missing or missing_dependencies:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "missing_environment": missing,
                "missing_dependencies": missing_dependencies,
            },
        )
    return {"status": "ready"}


@app.get("/calls/{call_id}", response_model=SessionState)
async def call_status(
    call_id: str,
    x_agent_worker_secret: str | None = Header(default=None),
):
    authorize(x_agent_worker_secret)
    session = sessions.get(call_id)
    if session:
        return SessionState(
            call_id=call_id,
            status="active" if session.ready.is_set() else "starting",
        )
    if call_id in failures:
        return SessionState(
            call_id=call_id,
            status="failed",
            error=failures[call_id],
        )
    return SessionState(call_id=call_id, status="idle")


@app.post("/join", status_code=status.HTTP_202_ACCEPTED)
async def join(
    request: JoinRequest,
    x_agent_worker_secret: str | None = Header(default=None),
):
    authorize(x_agent_worker_secret)

    missing = missing_environment()
    missing_dependencies = missing_runtime_dependencies()
    if missing or missing_dependencies:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "missing_environment": missing,
                "missing_dependencies": missing_dependencies,
            },
        )

    current = sessions.get(request.call_id)
    if current and not current.task.done():
        return {
            "status": "already_running",
            "call_id": request.call_id,
        }

    failures.pop(request.call_id, None)
    ready_event = asyncio.Event()
    task = asyncio.create_task(run_agent(request, ready_event))
    session = RunningSession(task, ready_event)
    sessions[request.call_id] = session
    task.add_done_callback(
        lambda finished: remove_finished_session(
            request.call_id, session, finished
        )
    )

    # Surface immediate configuration/proxy failures to the webhook instead of
    # accepting a task that has already crashed. A successful RTC join can take
    # several seconds, so longer-running tasks still return 202 immediately.
    done, _ = await asyncio.wait({task}, timeout=0.25)
    if task in done and not task.cancelled():
        error = task.exception()
        if error is not None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=failures.get(request.call_id, "Agent startup failed"),
            )

    return {"status": "starting", "call_id": request.call_id}
