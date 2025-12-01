import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
const LoadingSkeletonCard = () => {
  return (
    <Card className="py-2 px-2 flex flex-col gap-0">
      <CardHeader className="px-0 space-y-2">
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-1/4 h-6" />
      </CardHeader>
      <CardContent className="px-0 grow">
        <div className="grid grid-cols-2 gap-1 h-full">
          <div className="flex flex-col justify-end gap-2">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
          <Skeleton className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingSkeletonCard;
