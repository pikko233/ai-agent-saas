"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export const HomeView = () => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.hello.queryOptions({ text: "client message" }),
  );

  return <div className="flex flex-col gap-6 p-4">{data?.greeting}</div>;
};
