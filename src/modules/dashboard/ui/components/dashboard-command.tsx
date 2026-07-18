import {
  Command,
  CommandResponsiveDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dispatch, SetStateAction } from "react";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  return (
    <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="搜索会议或者智能体" />
        <CommandList>
          <CommandEmpty>暂无结果</CommandEmpty>
          <CommandGroup>
            <CommandItem>Test</CommandItem>
            <CommandItem>Test2</CommandItem>
            <CommandItem>Test3</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandResponsiveDialog>
  );
};
