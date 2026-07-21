import { VideoIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./ui/button";
import Link from "next/link";

interface Props {
  meetingId: string;
}

export const ActiveState = ({ meetingId }: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/upcoming.svg"
        title="会议正在进行中"
        description="当所有参与者退出，会议将会自动结束"
      />
      <div className="flex flex-col-reverse md:flex-row md:justify-center items-center gap-2 w-full">
        <Button
          nativeButton={false}
          render={<Link href={`/call/${meetingId}`} />}
          className="w-full md:w-auto"
          size="lg"
        >
          <VideoIcon />
          加入会议
        </Button>
      </div>
    </div>
  );
};
