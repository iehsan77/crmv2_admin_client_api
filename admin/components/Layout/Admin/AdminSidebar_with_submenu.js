"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Icons from "@/components/Icons";
import "@/lib/globals";
import { useUserInfo } from "@/helper/GeneralFunctions";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AdminSidebar() {
  const rawApps = useUserInfo("apps");
  const apps = Array.isArray(rawApps) ? rawApps : [rawApps];

  // Track open state per app id
  const [openMap, setOpenMap] = useState({});

  const toggleOpen = (id) => {
    setOpenMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Sidebar className="w-64">
      <SidebarHeader>
        <div className="relative w-full h-[60px] px-4 flex items-center">
          <Link href="/dashboard" className="w-full h-full relative">
            <Image
              src="/images/short-logo.png"
              alt="Businessesify"
              fill
              className="object-contain"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {apps.map((app) => {
                const isOpen = openMap[app.id] || false;

                return (
                  <Collapsible
                    key={`collapsible-${app.id}`}
                    open={isOpen}
                    onOpenChange={() => toggleOpen(app.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="w-full flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {app.icon_class ? (
                              <Icons iconName={app.icon_class} />
                            ) : (
                              <Icons iconName="LuBan" />
                            )}
                            <span>{app.title}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </CollapsibleTrigger>

                    {Array.isArray(app.modules) && app.modules.length > 0 && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {app.modules.map((module) => (
                            <SidebarMenuSubItem key={`mod-${module?.id}`}>
                              <Link
                                // href={`/${app.slug}/${module?.slug || module?.id}`}
                                href={`/${app?.slug}/${module?.slug}/${module?.custom_view_url}`}
                                className="flex items-center gap-3 ps-4"
                              >
                                <span>{module?.title}</span>
                              </Link>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

