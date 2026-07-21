import { BanIcon, VideoIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./ui/button";
import Link from "next/link";

interface Props {
  meetingId: string;
  onCancelMeeting: () => void;
  isCancelling: boolean;
}

export const UpcomingState = ({
  meetingId,
  onCancelMeeting,
  isCancelling,
}: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/upcoming.svg"
        title="会议还未开始"
        description="一旦你开始会议，就会有一条总结出现在这～"
      />
      <div className="flex flex-col-reverse md:flex-row md:justify-center items-center gap-2 w-full">
        <Button
          variant="secondary"
          className="w-full md:w-auto"
          disabled={isCancelling}
          onClick={onCancelMeeting}
          size="lg"
        >
          <BanIcon />
          取消会议
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={`/call/${meetingId}`} />}
          className="w-full md:w-auto"
          disabled={isCancelling}
          size="lg"
        >
          <VideoIcon />
          开始会议
        </Button>
      </div>
    </div>
  );
};
