import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { CallSessionStartedEvent } from "@stream-io/node-sdk";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const agentWorkerUrl =
  process.env.AGENT_WORKER_URL ?? "http://127.0.0.1:8787";

async function startVisionAgent(input: {
  callId: string;
  agentId: string;
  agentName: string;
  instructions: string;
}) {
  const headers: HeadersInit = {
    "content-type": "application/json",
  };

  if (process.env.AGENT_WORKER_SECRET) {
    headers["x-agent-worker-secret"] = process.env.AGENT_WORKER_SECRET;
  }

  const response = await fetch(`${agentWorkerUrl}/join`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      call_id: input.callId,
      call_type: "default",
      agent_id: input.agentId,
      agent_name: input.agentName,
      instructions: input.instructions,
    }),
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Vision Agent worker returned ${response.status}: ${errorBody.slice(0, 300)}`,
    );
  }
}

// getstream.io 视频流SDK的webhook 当call创建之后将对应的meeting会议状态改为active
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "请求头缺少x-signature或x-api-key" },
      { status: 400 },
    );
  }

  if (apiKey !== process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY) {
    return NextResponse.json(
      { error: "非法API Key, Invalid x-api-key" },
      { status: 401 },
    );
  }

  // Stream 可能会使用 gzip 压缩较大的 webhook。必须保留原始字节，
  // req.text() 会破坏压缩数据，导致部分事件出现 signature mismatch。
  const rawBody = Buffer.from(await req.arrayBuffer());

  let payload;

  try {
    payload = streamVideo.verifyAndParseWebhook(rawBody, signature);
  } catch {
    return NextResponse.json(
      { error: "非法签名, Invalid x-signature" },
      { status: 401 },
    );
  }

  const eventType = payload.type;
  console.log("[Stream webhook]", eventType);

  if (eventType === "call.session_started") {
    // 通话创建
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "缺少会议ID参数" }, { status: 400 });
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));

    if (!existingMeeting) {
      return NextResponse.json({ error: "会议不存在" }, { status: 404 });
    }

    if (
      existingMeeting.status === "completed" ||
      existingMeeting.status === "cancelled"
    ) {
      return NextResponse.json({ status: "ignored" });
    }

    if (existingMeeting.status === "upcoming") {
      await db
        .update(meetings)
        .set({
          status: "active",
          startedAt: new Date(),
        })
        .where(eq(meetings.id, existingMeeting.id));
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json(
        { error: "未找到该会议对应的智能体" },
        { status: 404 },
      );
    }

    try {
      await startVisionAgent({
        callId: meetingId,
        agentId: existingAgent.id,
        agentName: existingAgent.name,
        instructions: existingAgent.instructions,
      });
    } catch (error) {
      console.error("[Vision Agent] 启动失败", error);
      return NextResponse.json(
        { error: "Vision Agent worker 启动失败" },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({ status: "ok" });
}
