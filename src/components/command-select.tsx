import { ReactNode, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandResponsiveDialog,
} from "./ui/command";

interface Props {
  options: Array<{
    id: string;
    value: string;
    children: ReactNode;
  }>;
  onSelect: (value: string) => void;
  onSearch?: (value: string) => void;
  value: string;
  placeholder?: string;
  isSearchable?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const CommandSelect = ({
  options,
  onSelect,
  onSearch,
  value,
  placeholder = "请选择一个选项",
  isSearchable = true,
  isLoading = false,
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const [searchValue, setSearchValue] = useState("");

  const handleOpenChange = (open: boolean) => {
    // 每次打开搜索弹窗，重置搜索结果
    onSearch?.("");
    setOpen(open);
  };

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-9 justify-between font-normal px-2",
          !selectedOption && "text-muted-foreground",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <div>{selectedOption?.id ? selectedOption.children : placeholder}</div>
        <ChevronsUpDownIcon />
      </Button>
      <CommandResponsiveDialog open={open} onOpenChange={handleOpenChange}>
        <Command shouldFilter={!onSearch}>
          {isSearchable && (
            <CommandInput
              placeholder={placeholder}
              onValueChange={setSearchValue}
            />
          )}
          <CommandList>
            <CommandEmpty>
              <span className="text-sm text-muted-foreground">
                {isLoading ? "加载中..." : "暂无选项"}
              </span>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  {option.children}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandResponsiveDialog>
    </>
  );
};
