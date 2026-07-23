This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI Agent 架构

项目曾使用 GetStream Node SDK 的 `connectOpenAi` 服务端代理，但该接口持续
返回 `code 42`，导致 Agent 加入会议后立即退出。当前实现改用
[Vision Agents](https://visionagents.ai/)：Next.js 继续负责页面、会议和
Webhook，独立的 Python worker 直接连接 Stream Video 与 xAI Grok Realtime。

## Getting Started

安装 Node.js 和 Agent worker 依赖：

```bash
npm install
cd agent-worker && uv sync && cd ..
```

根目录 `.env` 至少需要以下配置：

```dotenv
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=
STREAM_VIDEO_SECRET_KEY=
XAI_API_KEY=
OPENAI_API_KEY=

# 可选
AGENT_WORKER_URL=http://127.0.0.1:8787
AGENT_WORKER_SECRET=
AGENT_REALTIME_PROVIDER=xai
XAI_REALTIME_MODEL=grok-voice-think-fast-1.0
XAI_REALTIME_VOICE=eve
OPENAI_REALTIME_MODEL=gpt-realtime-1.5
OPENAI_REALTIME_VOICE=shimmer
AGENT_VOICE_STYLE=Use a bright, youthful, cheerful, and cute feminine speaking style.
AGENT_MAX_IDLE_SECONDS=60
AGENT_AUDIO_JITTER_BUFFER_MS=100
```

将 `AGENT_REALTIME_PROVIDER` 设置为 `xai` 或 `openai` 即可切换实时语音
提供商；修改环境变量后需要重启 Agent worker。

只重启 Agent worker（自动停止占用 8787 端口的旧进程）：

```bash
npm run restart:agent
```

同时启动 Next.js、ngrok 和 Vision Agent worker：

```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Worker 健康检查地址为 `http://127.0.0.1:8787/health`，配置检查地址为
`http://127.0.0.1:8787/ready`。

部署时需要单独运行 `agent-worker/Dockerfile`，并将 Next.js 的
`AGENT_WORKER_URL` 指向 worker 的内网或 HTTPS 地址。若 worker 暴露在本机以外，
必须在两端设置相同的 `AGENT_WORKER_SECRET`。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
