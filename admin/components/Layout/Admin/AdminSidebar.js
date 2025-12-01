"use client";

import Image from "next/image";
import Icons from "@/components/Icons";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";

import "@/lib/globals";
import { useUserInfo } from "@/helper/GeneralFunctions";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const rawApps = useUserInfo("apps");
  const apps = Array.isArray(rawApps) ? rawApps : [rawApps];
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Tooltip.Provider delayDuration={200}>
      <Sidebar collapsible="icon">
        {/* Logo */}
        <SidebarHeader className="py-4">
          <Link href="/dashboard">
            <Image
              src={
                state === "expanded"
                  ? "/images/logo.svg"
                  : "/images/short-logo.svg"
              }
              alt="Businessesify"
              width={69}
              height={60}
              className="h-10 w-auto mx-auto"
            />
          </Link>
        </SidebarHeader>

        {/* Menu */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.isArray(apps) &&
                  apps.map((app) => {
                    const isActive = pathname.startsWith("/" + app?.slug);

                    return (
                      <Tooltip.Root key={`app-${app.id}`}>
                        <Tooltip.Trigger asChild>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              className={`flex items-center gap-2 py-6 px-3 rounded transition-colors ${
                                isActive
                                  ? "bg-[#EAF3FE] text-primary font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <Link href={"/" + app?.slug}>
                                {app?.icon_class ? (
                                  <Icons
                                    iconName={app?.icon_class}
                                    className={`${
                                      isActive ? "text-[#2575D6]" : ""
                                    }`}
                                  />
                                ) : (
                                  <Icons
                                    iconName="LuBan"
                                    className={`${
                                      isActive ? "text-[#2575D6]" : ""
                                    }`}
                                  />
                                )}
                                <span>{app?.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </Tooltip.Trigger>

                        {/* Tooltip */}
                        <Tooltip.Content
                          side="right"
                          align="center"
                          className="bg-black text-white text-xs px-2 py-1 rounded shadow-md z-50"
                        >
                          {app?.title}
                        </Tooltip.Content>
                      </Tooltip.Root>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Tooltip.Provider>
  );
}
