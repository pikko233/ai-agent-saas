import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import {
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "upcoming")));

    if (!existingMeeting) {
      return NextResponse.json({ error: "会议不存在" }, { status: 404 });
    }

    await db
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

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

    const call = streamVideo.video.call("default", meetingId);

    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.id,
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions,
    });
  } else if (eventType === "call.session_participant_left") {
    // 如果有人离开会议，那么就结束通话
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1]; // call_cid的格式是"type:id"

    if (!meetingId) {
      return NextResponse.json({ error: "缺少会议ID参数" }, { status: 400 });
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();
  }

  return NextResponse.json({ status: "ok" });
}
