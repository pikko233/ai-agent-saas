// src/inngest/functions.ts
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { inngest } from "./client";
import JSONL from "jsonl-parse-stringify";
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

// 创建一个用于总结通话记录的agent
const summarizer = createAgent({
  name: "summarizer",
  system: `
    你是一位专业的会议总结助手。你的输出必须使用中文。

    请按以下 Markdown 结构来总结每次会议内容：

    ### 概览
    对会议内容进行详细且有吸引力的总结。聚焦主要功能、用户流程和关键要点。使用叙事风格，完整的句子。突出产品或讨论中独特或强大的方面。

    ### 要点
    将关键内容按主题分段，标注时间范围。每个部分用要点形式总结关键内容、操作或演示。

    示例：
    #### 功能演示
    - 演示了核心功能的操作流程
    - 展示了如何自动处理用户输入
    - 介绍了与其他系统的集成方式

    #### 讨论与反馈
    - 讨论了性能优化方案
    - 提出了新功能的需求
    - 确认了下一阶段的开发计划
  `.trim(),
  model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY }),
});

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing", triggers: { event: "meetings/processing" } },
  async ({ event, step }) => {
    const response = await step.run("fetch-transcript", () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      // 获取参与通话的用户
      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
          })),
        );

      // 获取参与通话的agent
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          })),
        );

      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find((user) => user.id === item.speaker_id);

        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown",
            },
          };
        }

        return {
          ...item,
          user: {
            name: speaker.name,
          },
        };
      });
    });

    const { output } = await summarizer.run(
      "请总结以下对话记录：" + JSON.stringify(transcriptWithSpeakers),
    );

    // 保存总结信息——更新数据库中对应的会议
    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: (output[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId));
    });
  },
);
