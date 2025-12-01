"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_PATHS } from "@/constants/paths";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PUBLIC_PATHS?.LOGIN);
  }, [router]);

  return null; // or a loading indicator
}
