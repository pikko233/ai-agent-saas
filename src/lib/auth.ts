import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { i18n } from "@better-auth/i18n";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    i18n({
      defaultLocale: "zh-CN",
      translations: {
        "zh-CN": {
          USER_NOT_FOUND: "用户不存在",
          INVALID_EMAIL_OR_PASSWORD: "邮箱或密码错误",
          INVALID_PASSWORD: "密码错误",
          CREDENTIAL_ACCOUNT_NOT_FOUND: "未找到账号",
          EMAIL_NOT_VERIFIED: "邮箱尚未验证",
          SESSION_EXPIRED: "登录状态已过期",
        },
      },
    }),
  ],
});
