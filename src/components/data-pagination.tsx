import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DataPagination = ({ page, totalPages, onPageChange }: Props) => {
  return (
    <div className="flex items-center justify-between">
      <div className="hidden md:block flex-1 text-sm text-muted-foreground">
        第 {page} 页 / 共 {totalPages || 1} 页
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                disabled={page === 1}
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                <ChevronLeftIcon className="size-4" />
                上一页
              </Button>
            </PaginationItem>
            <PaginationItem onClick={() => onPageChange(1)}>
              <PaginationLink isActive={page === 1}>{1}</PaginationLink>
            </PaginationItem>
            {totalPages > 0 && 2 < page - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {[page - 1, page, page + 1]
              .filter(
                (pageNumber) => pageNumber >= 2 && pageNumber <= totalPages - 1,
              )
              .map((pageNumber) => (
                <PaginationItem
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                >
                  <PaginationLink isActive={page === pageNumber}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
            {totalPages > 0 && page + 1 < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {totalPages > 1 && (
              <PaginationItem onClick={() => onPageChange(totalPages)}>
                <PaginationLink isActive={page === totalPages}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <Button
                variant="outline"
                disabled={page === totalPages || totalPages === 0}
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                下一页
                <ChevronRightIcon className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
