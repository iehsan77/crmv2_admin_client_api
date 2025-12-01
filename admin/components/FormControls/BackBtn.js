"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BackBtn({ title = "Back" }) {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.back()}>
      {title}
    </Button>
  );
}
