"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import Loader from "@/components/Loader";

import {formatIndustryName} from "@/helper/GeneralFunctions"

import useCompaniesStore from "@/stores/settings/useCompaniesStore";

export default function CompaniesSidebar() {
  const { companies, fetchCompanies, setViewCompany } = useCompaniesStore();
  const [loading, setLoading] = useState(true);
  const { setOpen } = useSidebar();

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      await fetchCompanies();
      setLoading(false);
    };

    loadCompanies();
  }, [fetchCompanies]);

  // ✅ Set first company as default after loading completes
  useEffect(() => {
    if (!loading && companies.length > 0) {
      setViewCompany(companies[0]);
    }
  }, [loading, companies, setViewCompany]);


  return (
    <div className="flex overflow-hidden">
      <div className="hidden flex-1 md:flex flex-col border-r">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              All Companies List
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {loading ? (
                <Loader color="text-gray-300" />
              ) : (
                companies &&
                companies.map((company, index) => (
                  <a
                    href="#"
                    key={index}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                    onClick={() => setViewCompany(company)}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="text-xs">
                        {formatIndustryName(company.industry)}
                      </span>
                    </div>
                    <span className="font-medium">{company.company_name}</span>
                    <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                      {company.company_size}
                    </span>
                    <p>{company.address}</p>
                  </a>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </div>
  );
}
