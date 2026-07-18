import { z } from "zod";

export const agentsInsertSchema = z.object({
  name: z.string().min(1, { message: "智能体名称必填" }),
  instructions: z.string().min(1, { message: "角色设定必填" }),
});
