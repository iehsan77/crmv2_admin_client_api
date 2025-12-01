"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import useUserStore from "@/stores/useUserStore";

export default function ListingViewsDropdown({
  path = "",
  currentView,
  setCurrentView = () => {},
}) {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Now it's defined

  const appSlug = useMemo(() => pathname?.split("/")?.[1] || "", [pathname]);
  const moduleSlug = useMemo(() => pathname?.split("/")?.[2] || "", [pathname]);

  const { getCurrentModuleBySlug } = useUserStore();

  const [title, setTitle] = useState("");
  const [views, setViews] = useState([]);
  const [module, setModule] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentModule = getCurrentModuleBySlug(appSlug, moduleSlug);
    if (currentModule) {
      setModule(currentModule);
    }
  }, []);
  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      try {
        const response = await GET(
          crm_endpoints?.crm?.custom_views?.getByModelId(module?.id)
        );
        setLoading(false);
        if (response?.status === 200) {
          setViews(response?.data);
        } else {
          handleResponse(response);
        }
      } catch (err) {
        console.error("❌ Fetch Error:", err);
      }
    };

    if (module?.id) {
      fetchViews();
    }
  }, [module]);

  const handleViewChange = (ukey) => {
    const selectedView = views.find(
      (view) => String(view.ukey) === String(ukey)
    );
    if (selectedView) {
      setLoading(false);
      setCurrentView(ukey);
      setTitle(selectedView.title);
    }
    router.push(`${path}/custom-view/${ukey}`);
  };

  useEffect(() => {
    if (!currentView || views.length === 0) return;

    const selectedView = views.find(
      (view) => String(view.ukey) === String(currentView)
    );

    if (selectedView) {
      setTitle(selectedView.title);
    }
  }, [currentView, views]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          {loading ? "" : title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {loading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : views.length > 0 ? (
          views.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => handleViewChange(view.ukey)}
            >
              {view.title}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No views available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
