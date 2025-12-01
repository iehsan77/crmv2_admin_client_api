"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeleton({ cls = "h-3 w-full mb-2", qty = 1 }) {
  return (
    <>
      {Array.from({ length: qty }).map((_, i) => (
        <Skeleton key={i} className={"animate-pulse mb-2 "+cls} />
      ))}
    </>
  );
}
