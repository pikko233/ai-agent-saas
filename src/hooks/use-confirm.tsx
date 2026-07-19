import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { JSX, useState } from "react";

export const useConfirm = (
  title: string,
  description: string,
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      promise?.resolve(false);
      setPromise(null);
    }
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleOpenChange(false);
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleOpenChange(false);
  };

  const ConfirmationDialog = () => (
    <ResponsiveDialog
      open={promise !== null}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
    >
      <div className="pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end">
        <Button
          onClick={handleCancel}
          variant="outline"
          className="w-full lg:w-auto"
        >
          取消
        </Button>
        <Button onClick={handleConfirm} className="w-full lg:w-auto">
          确认
        </Button>
      </div>
    </ResponsiveDialog>
  );

  return [ConfirmationDialog, confirm];
};
