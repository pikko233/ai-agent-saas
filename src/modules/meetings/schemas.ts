import { z } from "zod";

export const meetingsInsertSchema = z.object({
  name: z.string().min(1, { message: "会议名称必填项" }),
  agentId: z.string().min(1, { message: "智能体必选项" }),
});

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
  id: z.string().min(1, { message: "缺少会议ID参数" }),
});
