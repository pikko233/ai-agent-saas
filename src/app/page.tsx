"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (!isPending && (!session || error)) {
      router.replace("/sign-in");
    }
  }, [isPending, session, error, router]);

  // Session 还在加载，暂时不要判断未登录
  if (isPending) {
    return <div className="p-4">加载中...</div>;
  }

  // 等待 useEffect 完成跳转，避免闪现原页面
  if (!session || error) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <p>{session.user.name}</p>

      <Button
        onClick={async () => {
          await authClient.signOut();
          router.replace("/sign-in");
        }}
      >
        退出登录
      </Button>
    </div>
  );
}
