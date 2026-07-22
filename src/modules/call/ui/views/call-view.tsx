"use client";

import { ErrorState } from "@/components/error-state";
import { MeetingStatus } from "@/modules/meetings/types";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../../components/call-provider";

interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data: meeting } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );

  if (meeting.status === MeetingStatus.Completed) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ErrorState title="会议已结束" description="你无法再加入会议" />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={meeting.name} />;
};
