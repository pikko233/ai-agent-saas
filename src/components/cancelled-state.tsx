import { EmptyState } from "./empty-state";

export const CancelledState = () => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/cancelled.svg"
        title="会议已取消"
        description="这场会议已经被取消了～"
      />
    </div>
  );
};
