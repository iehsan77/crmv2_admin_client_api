"use client";
import React, { useState, useEffect } from "react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import BodyTypesForm from "@/partials/rentify/body-types/BodyTypesForm";
import BodyTypesList from "@/partials/rentify/body-types/BodyTypesList";

import useBodyTypesStore from "@/stores/rentify/useBodyTypesStore";

const BodyTypesPage = () => {
  const { showDrawer } = useDrawer();

  const [currentTab, setCurrentTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBodyTypes, setCurrentBodyTypes] = useState([]);

  const { bodyTypes, bodyTypesLoading, fetchBodyTypes } = useBodyTypesStore();

  // Fetch bodyTypes on mount
  useEffect(() => {
    fetchBodyTypes();
  }, [fetchBodyTypes]);

  // Update currentBodyTypes when bodyTypes or tab changes
  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentBodyTypes(bodyTypes);
    } else if (currentTab === "active") {
      setCurrentBodyTypes(bodyTypes.filter((cat) => cat.is_used === 1));
    } else if (currentTab === "inactive") {
      setCurrentBodyTypes(bodyTypes.filter((cat) => cat.is_used === 0));
    }
  }, [currentTab, bodyTypes]);


  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">
          Body Types Overview
        </h1>
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Body Type",
              size: "xl",
              content: <BodyTypesForm />,
            })
          }
        >
          Add Body Type
        </Button>
      </div>

      <TabManager
        initialTabs={[
          { key: "all", label: "All Body Type Library" },
          { key: "active", label: "Active Body Types" },
          { key: "inactive", label: "Inactive Body Types" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => setCurrentTab(key)}
      />

      <BodyTypesList
        loading={bodyTypesLoading}
        data={currentBodyTypes}
        page={currentPage}
      />
    </div>
  );
};

export default BodyTypesPage;
