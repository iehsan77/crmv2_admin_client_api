"use client";
import React, { useState, useEffect } from "react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import FeaturesForm from "@/partials/rentify/features/FeaturesForm";
import FeaturesList from "@/partials/rentify/features/FeaturesList";

import useFeaturesStore from "@/stores/rentify/useFeaturesStore";

const FeaturesPage = () => {
  const { showDrawer } = useDrawer();

  const [currentTab, setCurrentTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFeatures, setCurrentFeatures] = useState([]);

  const { features, featuresLoading, fetchFeatures } = useFeaturesStore();

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentFeatures(features);
    } else if (currentTab === "active") {
      setCurrentFeatures(features.filter((feature) => feature?.is_used === 1));
    }
  }, [currentTab, features]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Features</h1>
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Features",
              size: "xl",
              content: <FeaturesForm />,
            })
          }
        >
          Add Features
        </Button>
      </div>

      <TabManager
        initialTabs={[
          { key: "all", label: "All Features Library" },
          { key: "active", label: "Active Features" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => setCurrentTab(key)}
      />

      <FeaturesList
        loading={featuresLoading}
        data={currentFeatures}
        page={currentPage}
      />
    </div>
  );
};

export default FeaturesPage;
