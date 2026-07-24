"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { MeetingStatus, MeetingStatusLabelMap } from "../../types";
import { UpcomingState } from "@/components/upcoming-state";
import { ActiveState } from "@/components/active-state";
import { CancelledState } from "@/components/cancelled-state";
import { ProcessingState } from "@/components/processing-state";
import { CompletedState } from "@/components/completed-state";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: meeting } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );

  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        toast.dismiss(meetingId);
        toast.success("删除成功~");
        router.push("/meetings");
      },
      onError: (error) => {
        toast.dismiss(meetingId);
        toast.error(error.message);
      },
    }),
  );

  const [RemoveMeetingDialog, confirmRemoveMeeting] = useConfirm(
    "确定删除吗？",
    `接下来的操作会彻底删除 ${meeting.name} 的所有相关数据`,
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemoveMeeting();

    if (!ok) return;

    toast.loading("正在删除中...", { id: meetingId });
    removeMeeting.mutate({ id: meetingId });
  };

  const isUpcoming = meeting.status === MeetingStatus.Upcoming;
  const isActive = meeting.status === MeetingStatus.Active;
  const isCompleted = meeting.status === MeetingStatus.Completed;
  const isProcessing = meeting.status === MeetingStatus.Processing;
  const isCancelled = meeting.status === MeetingStatus.Cancelled;

  return (
    <>
      <RemoveMeetingDialog />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={meeting}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4 break-all">
        <MeetingIdViewHeader
          meetingId={meeting.id}
          meetingName={meeting.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={meeting.status === MeetingStatus.Cancelled}
          />
        )}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isCancelled && <CancelledState />}
        {isProcessing && <ProcessingState />}
        {isCompleted && <CompletedState data={meeting} />}
      </div>
    </>
  );
};
