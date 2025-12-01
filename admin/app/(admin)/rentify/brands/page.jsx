"use client";
import React, { useState, useEffect } from "react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import BrandsForm from "@/partials/rentify/brands/BrandsForm";
import BrandsList from "@/partials/rentify/brands/BrandsList";

import useBrandsStore from "@/stores/rentify/useBrandsStore";

const BrandsPage = () => {
  const { showDrawer } = useDrawer();

  const [currentTab, setCurrentTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBrands, setCurrentBrands] = useState([]);

  const {
    brands,
    filteredBrands,
    brandsLoading,
    fetchBrands,
    setFilteredBrands,
  } = useBrandsStore();

  useEffect(() => {
    fetchBrands();
    setFilteredBrands();
  }, [fetchBrands]);

  /*
  const data = filteredBrands.length ? filteredBrands : brands;
  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentBrands(data);
    } else if (currentTab === "active") {
      setCurrentBrands(data.filter((brand) => brand?.is_used === 1));
    }
  }, [currentTab, brands, filteredBrands]);
*/
  // console.log(brands);

  useEffect(() => {
    setCurrentPage(1);
    if (currentTab === "all") {
      setCurrentBrands(filteredBrands);
    } else if (currentTab === "active") {
      setCurrentBrands(filteredBrands.filter((brand) => brand?.is_used === 1));
    }
  }, [currentTab, filteredBrands]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Brands</h1>
        <Button
          onClick={() =>
            showDrawer({
              title: "Add Brands",
              size: "xl",
              content: <BrandsForm />,
            })
          }
        >
          Add Brands
        </Button>
      </div>

      <TabManager
        initialTabs={[
          { key: "all", label: "All Brands Library" },
          { key: "active", label: "Active Brands" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => setCurrentTab(key)}
      />

      <BrandsList
        loading={brandsLoading}
        data={currentBrands}
        page={currentPage}
      />
    </div>
  );
};

export default BrandsPage;
