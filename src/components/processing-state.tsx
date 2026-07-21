import { EmptyState } from "./empty-state";

export const ProcessingState = () => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/processing.svg"
        title="会议已结束"
        description="这场会议刚刚结束，内容总结正在生成，请稍等片刻..."
      />
    </div>
  );
};
