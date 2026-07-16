"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function Home() {
  const { data: session } = authClient.useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignUp = () => {
    authClient.signUp.email(
      {
        email,
        name,
        password,
      },
      {
        onSuccess: (ctx) => {
          window.alert("操作成功～");
        },
        onError: (ctx) => {
          window.alert("操作失败！");
        },
      },
    );
  };
  const onSignIn = () => {
    authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: (ctx) => {
          window.alert("操作成功～");
        },
        onError: (ctx) => {
          window.alert("操作失败！");
        },
      },
    );
  };

  if (session) {
    return (
      <div className="flex flex-col p-4 gap-6">
        <p>{session.user.name}</p>
        <Button onClick={() => authClient.signOut()}>退出登录</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
        <Input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <Button onClick={onSignUp}>注册用户</Button>
      </div>
      <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
        <Input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <Button onClick={onSignIn}>登录</Button>
      </div>
    </div>
  );
}
