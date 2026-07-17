"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const HomeView = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isPending, setIsPending] = useState(false);

  if (!session) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <p>{session.user.name}</p>

      <Button
        disabled={isPending}
        onClick={() => {
          setIsPending(true);
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                setIsPending(false);
                router.push("/sign-in");
              },
            },
          });
        }}
      >
        退出登录
      </Button>
    </div>
  );
};
