"use client";
import React, { useState, useEffect } from "react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import VariantsForm from "@/partials/rentify/variants/VariantsForm";
import VariantsList from "@/partials/rentify/variants/VariantsList";

import useVariantsStore from "@/stores/rentify/useVariantsStore";

const VariantsPage = () => {
  const { showDrawer } = useDrawer();

  const [currentTab, setCurrentTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentVariants, setCurrentVariants] = useState([]);

  const { variants, variantsLoading, fetchVariants } = useVariantsStore();

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentVariants(variants);
    } else if (currentTab === "active") {
      setCurrentVariants(variants.filter((variant) => variant?.is_used === 1));
    }
  }, [currentTab, variants]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Variants</h1>
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Variants",
              size: "xl",
              content: <VariantsForm />,
            })
          }
        >
          Add Variants
        </Button>
      </div>

      <TabManager
        initialTabs={[
          { key: "all", label: "All Variants Library" },
          { key: "active", label: "Active Variants" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => setCurrentTab(key)}
      />

      <VariantsList
        loading={variantsLoading}
        data={currentVariants}
        page={currentPage}
      />
    </div>
  );
};

export default VariantsPage;
