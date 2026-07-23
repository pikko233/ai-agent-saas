import asyncio
import logging
from typing import Any, Callable, cast

import av
from aiortc.mediastreams import MediaStreamTrack
from getstream.video.rtc.track_util import PcmData


logger = logging.getLogger("meeting-agent.audio")


class HighQualityAudioForwarder:
    """Forward OpenAI WebRTC audio without the SDK's 16 kHz downsampling."""

    def __init__(
        self,
        track: MediaStreamTrack,
        callback: Callable[[PcmData], Any],
    ):
        self.track = track
        self._callback = callback
        self._task: asyncio.Task[None] | None = None
        self._logged_format = False

    async def start(self) -> None:
        if self._task is not None:
            logger.warning("High-quality audio forwarder already started")
            return
        self._task = asyncio.create_task(self._reader())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _reader(self) -> None:
        while True:
            try:
                received = await asyncio.wait_for(self.track.recv(), timeout=1.0)
                frame = cast(av.AudioFrame, received)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.debug("OpenAI audio track ended", exc_info=True)
                break

            try:
                pcm = PcmData.from_av_frame(frame)
                if pcm.channels != 1:
                    pcm = pcm.resample(
                        target_sample_rate=pcm.sample_rate,
                        target_channels=1,
                    )

                if not self._logged_format:
                    logger.info(
                        "Forwarding OpenAI audio at %d Hz, %d channel(s)",
                        pcm.sample_rate,
                        pcm.channels,
                    )
                    self._logged_format = True

                await self._callback(pcm)
            except Exception:
                logger.exception("Failed to forward OpenAI audio frame")
