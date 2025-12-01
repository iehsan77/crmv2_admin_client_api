"use client";
import React, { useState, useEffect } from "react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import ModelsForm from "@/partials/rentify/models/ModelsForm";
import ModelsList from "@/partials/rentify/models/ModelsList";

import useModelsStore from "@/stores/rentify/useModelsStore";

const ModelsPage = () => {
  const { showDrawer } = useDrawer();

  const [currentTab, setCurrentTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentModels, setCurrentModels] = useState([]);

  const { models, modelsLoading, fetchModels } = useModelsStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentModels(models);
    } else if (currentTab === "active") {
      setCurrentModels(models.filter((model) => model?.is_used === 1));
    } else if (currentTab === "inactive") {
      setCurrentModels(models.filter((model) => model?.is_used === 0));
    }
  }, [currentTab, models]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Models</h1>
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Models",
              size: "xl",
              content: <ModelsForm />,
            })
          }
        >
          Add Models
        </Button>
      </div>

      <TabManager
        initialTabs={[
          { key: "all", label: "All Models Library" },
          { key: "inactive", label: "In-Active Models" },
          { key: "active", label: "Active Models" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => setCurrentTab(key)}
      />

      <ModelsList
        loading={modelsLoading}
        data={currentModels}
        page={currentPage}
      />
    </div>
  );
};

export default ModelsPage;
