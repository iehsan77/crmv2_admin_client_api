"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useUserStore from "@/stores/useUserStore";

export default function ViewAllButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentModule, setCurrentModule] = useState(null);

  const { getCurrentModuleBySlug, getUserModuleUrl } = useUserStore();

  const [appSlug, currentModuleSlug] = useMemo(
    () => pathname?.split("/").filter(Boolean) || [],
    [pathname]
  );

  useEffect(() => {
    const module = getCurrentModuleBySlug(appSlug, currentModuleSlug);
    setCurrentModule(module);
  }, [appSlug, currentModuleSlug, getCurrentModuleBySlug]);

  const handleClick = () => {
    const url = `/${appSlug}/${currentModuleSlug}/${getUserModuleUrl(
      currentModuleSlug
    )}`;
    router.push(url);
  };

  return (
    <Button variant="outline" onClick={handleClick}>
      View All
    </Button>
  );
}
