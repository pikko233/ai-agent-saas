import { CallControls, SpeakerLayout } from "@stream-io/video-react-sdk";
import Image from "next/image";
import Link from "next/link";

interface Props {
  onLeave: () => void;
  meetingName: string;
}

export const CallActive = ({ onLeave, meetingName }: Props) => {
  return (
    <div className="flex flex-col h-full justify-between p-4 text-white">
      {/* 会议标题 */}
      <div className="bg-[#010213] p-4 flex items-center gap-4 rounded-full">
        <Link
          href="/"
          className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit"
        >
          <Image src="/logo.svg" alt="logo" width={22} height={22} />
        </Link>
        <h4 className="text-base truncate">{meetingName}</h4>
      </div>
      {/* 会议参与者 */}
      <SpeakerLayout />
      {/* 会议相关按钮 */}
      <div className="bg-[#010213] rounded-full px-4">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};
