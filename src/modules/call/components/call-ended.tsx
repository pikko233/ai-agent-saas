import { Button } from "@/components/ui/button";
import Link from "next/link";

export const CallEnded = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center bg-radial from-sidebar-accent to-sidebar">
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">你已结束通话</h6>
            <span className="text-sm">会议摘要将在几分钟后显示</span>
          </div>
          <Button render={<Link href="/meetings" />} nativeButton={false}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
};
