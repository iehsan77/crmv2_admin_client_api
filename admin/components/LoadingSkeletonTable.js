"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeletonTable({ cls = "h-10 w-full mb-3", qty = 10 }) {
  return (
    <>
      {Array.from({ length: qty }).map((_, i) => (
        <Skeleton key={i} className={"animate-pulse "+cls} />
      ))}
    </>
  );
}
