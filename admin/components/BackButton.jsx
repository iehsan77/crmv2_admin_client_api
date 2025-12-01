"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; // optional: an icon

export default function BackButton({ label = "Back", variant = "outline" }) {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} variant={variant}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
