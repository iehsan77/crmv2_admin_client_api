"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

import { CiFileOff } from "react-icons/ci";


export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center px-6">
      <CiFileOff  className="h-40 w-30" />
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
        Page Not Found
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        The page you're looking for doesn’t exist or has been moved.
      </p>
      <Button onClick={() => router.back()} className="flex items-center gap-2 cursor-pointer">
        <ArrowLeftIcon className="w-4 h-4" />
        Go Back
      </Button>
    </div>
  );
}
