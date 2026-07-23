This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 项目状态

本项目原计划实现一个基于 GetStream Video 和 OpenAI Realtime API 的 AI
会议应用。目前项目暂时中止开发，主要原因是 GetStream 的
`connect_agent` 服务持续返回 `code 42`，导致 AI Agent 加入会议后立即退出。

排查过程中已经确认 Stream Video Webhook 能够正常触发，OpenAI API Key
也可以直接连接 Realtime API；更换多个 Stream SDK 版本、Realtime
模型及本地隧道后问题仍然存在，因此现阶段判断为 GetStream 服务端代理与
OpenAI Realtime API 的兼容性或服务配置问题，无法仅通过修改本项目代码解决。

仓库暂时保留当前实现和排查代码，等待 GetStream 官方修复或提供明确的迁移方案后再考虑继续开发。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
