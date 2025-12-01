"use client";

import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export default function Pagination({ currentPage, totalPages, onPageChange }) {

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showRange = 1;

    const startPage = Math.max(2, currentPage - showRange);
    const endPage = Math.min(totalPages - 1, currentPage + showRange);

    // first page always
    pages.push(1);

    // left ellipsis
    if (startPage > 2) {
      pages.push("ellipsis-left");
    }

    // middle range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // right ellipsis
    if (endPage < totalPages - 1) {
      pages.push("ellipsis-right");
    }

    // last page always
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <ShadcnPagination className="mt-6">
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={cn(
              currentPage === 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {/* Page Numbers + Ellipses */}
        {getPageNumbers().map((page, idx) => {
          if (typeof page === "string") {
            return (
              <PaginationItem key={page + idx}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={currentPage === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
                className={cn(
                  "shadow-none rounded-none",
                  currentPage === page &&
                    "border-x-0 border-t-0 border-primary text-primary"
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            className={cn(
              currentPage === totalPages && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
}
