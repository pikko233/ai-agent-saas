"use client";

import { useTRPC } from "@/trpc/client";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { useQuery } from "@tanstack/react-query";
import { CommandSelect } from "@/components/command-select";
import { useState } from "react";
import { GeneratedAvatar } from "@/components/generated-avatar";

export const AgentIdFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const trpc = useTRPC();

  const [agentSearch, setAgentSearch] = useState("");
  const { data: agents, isLoading } = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
      search: agentSearch,
    }),
  );

  return (
    <CommandSelect
      placeholder="智能体"
      className="h-9"
      options={(agents?.items ?? []).map((agent) => ({
        id: agent.id,
        value: agent.id,
        children: (
          <div className="flex items-center gap-x-2">
            <GeneratedAvatar
              variant="botttsNeutral"
              seed={agent.name}
              className="size-4"
            />
            {agent.name}
          </div>
        ),
      }))}
      isLoading={isLoading}
      value={filters.agentId ?? ""}
      onSearch={setAgentSearch}
      onSelect={(value) => setFilters({ agentId: value })}
    />
  );
};
