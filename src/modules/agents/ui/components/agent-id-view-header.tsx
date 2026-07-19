import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRightIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

interface Props {
  agentId: string;
  agentName: string;
  onEdit: () => void;
  onRemove: () => void;
}

export const AgentIdViewHeader = ({
  agentId,
  agentName,
  onEdit,
  onRemove,
}: Props) => {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href="/agents" />}
              className="text-xl font-medium"
            >
              我的智能体
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-muted-foreground text-xl font-medium [&>svg]:size-4">
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/agents/${agentId}`} />}
              className="text-xl font-medium text-foreground"
            >
              {agentName}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove}>
              <Trash2Icon />
              删除
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
