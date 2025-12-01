import Image from "next/image";
import React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const RecordNotFound = ({simple = false}) => {
  return (
    <>
      {simple ? (
        <>
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Sorry!.</AlertTitle>
            <AlertDescription>
              <p>Record not found.</p>
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center max-w-xl mx-auto my-5 p-4 space-y-6 md:space-y-0 md:space-x-6">
          <div className="">
            <Image
              src="/images/no-data-abstract.png"
              alt="Record Not Found"
              width={194}
              height={150}
              //   className="h-auto"
            />
          </div>
          <div className="flex-1 md:w-1/2 text-center md:text-left">
            <p className="text-muted-foreground mb-6">
              No associated objects of this type exist or you don't have
              permission to view them.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordNotFound;
