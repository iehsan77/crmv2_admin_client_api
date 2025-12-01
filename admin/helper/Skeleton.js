import { Skeleton } from "@/components/ui/skeleton";

export const CounterSkeleton = () => {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[100px] w-[250px] rounded-xl" />
      </div>
    );
  };