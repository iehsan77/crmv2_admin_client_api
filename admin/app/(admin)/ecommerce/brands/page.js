"use client";
import { useState, useEffect } from "react";

import { toast } from "sonner";


import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { GET, POST_JSON } from "@/helper/ServerSideActions";

import DataTable from "react-data-table-component";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

import Image from "next/image";

import AddEdit from "./addedit";
import { dataTableHeadStyle } from "@/components/dataTableHeadStyle";

import useVendorStore from "@/stores/ecommerce/useVendorStore";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

const BrandListing = () => {
  const { vendor, loading } = useVendorStore();

  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [deleteAction, setDeleteAction] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const listUrl = ecom_endpoints?.products?.brands?.list;
  const deleteUrl = ecom_endpoints?.products?.brands?.deleteRecord(
    selectedBrand?.id,
    vendor?.vendor_website_id
  );
  const ReStoreRecord = ecom_endpoints?.products?.brands?.reStoreRecord(
    selectedBrand?.id,
    vendor?.vendor_website_id
  );
  const rowsPerPage = 20;

  // Fetch Brands - starting
  useEffect(() => {
    if (vendor?.vendor_website_id) {
      (async () => {
        setIsLoading(true);
        try {
          const response = await POST_JSON(
            ecom_endpoints?.products?.brands?.list,
            {
              vendor_website_id: vendor?.vendor_website_id,
              showAll: true,
            }
          );

          if (response?.status === 200) {
            setIsLoading(false);
            setBrands(response.data);
          }
        } catch (error) {
          setIsLoading(false);
          console.error("Error fetching product brands:", error);
          set({ loading: false });
        }
      })();
    }
  }, [vendor?.vendor_website_id]);
  // Fetch Brands - ending

  // Handle Drawer Activities - starting
  const handleOpenDrawer = (brand = null) => {
    setSelectedBrand(brand);
    setIsDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedBrand(null);
  };
  const handleSaveBrand = (newBrand) => {
    if (newBrand.id) {
      // Edit existing brand
      setBrands((brands) =>
        brands.map((brand) => (brand.id === newBrand.id ? newBrand : brand))
      );
    } else {
      // Add new brand
      setBrands((brands) => [
        ...brands,
        { ...newBrand, id: brands.length + 1 },
      ]);
    }
    handleCloseDrawer();
  };

  const handleSaveRecord = (newRecord) => {
    setBrands((records) => {
      const index = records.findIndex((record) => record.id === newRecord.id);

      if (index !== -1) {
        // Replace the existing record
        return records.map((record, i) =>
          i === index ? { ...newRecord } : record
        );
      } else {
        // Add new record
        return [...records, newRecord];
      }
    });
    handleCloseDrawer();
  };

  // Handle Drawer Activities - ending

  // Listing Columns - starting
  const columns = [
    {
      name: "#",
      cell: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
      width: "60px",
      style: { textAlign: "center" },
    },
    {
      name: "Logo",
      selector: (row) => row.logo,
      cell: (row) => (
        <Image src={row.logo} alt={row.title} width="50" height={50} />
      ),
      width: "100px",
      style: { textAlign: "center" },
    },
    { name: "Brand Name", selector: (row) => row.title, sortable: true },
    { name: "Slug", selector: (row) => row.slug, sortable: true },
    {
      name: "Is Active",
      selector: (row) => (row.active ? "Yes" : "No"),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (selectedBrand) => (
        <div className="flex justify-center items-center gap-2">
          {selectedBrand.deleted ? (
            <Icon
              className="mr-2"
              iconName="LuCornerUpLeft"
              width="1rem"
              height="1rem"
              onClick={() =>
                handleOpenModal(
                  selectedBrand,
                  "Are you sure you want to restore this record?",
                  0
                )
              }
            />
          ) : (
            <>
              <Icon
                className="mr-2"
                iconName="FaRegEdit"
                width="1rem"
                height="1rem"
                onClick={() => handleOpenDrawer(selectedBrand)}
              />
              <Icon
                className="mr-2"
                iconName="LuTrash2"
                width="1rem"
                height="1rem"
                onClick={() =>
                  handleOpenModal(
                    selectedBrand,
                    "Are you sure you want to delete this record?",
                    1
                  )
                }
              />
            </>
          )}
        </div>
      ),
      width: "100px",
      style: { textAlign: "center" },
    },
  ];

  // DELETE - starting
  const handleOpenModal = (selectedBrand, message, del) => {
    setSelectedBrand(selectedBrand);
    setDeleteAction(del);
    setConfirmationMessage(message);
    setIsModalOpen(true);
  };
  const handleDelete = async () => {
    try {
      //setBrands((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(deleteUrl);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        selectedBrand.deleted = 1;
        setBrands((brands) =>
          brands.map((r) => (r.id === selectedBrand.id ? selectedBrand : r))
        );
        toast.success("Record ha been deleted");
      } else {
        //handleResponse(response);
        toast.error("Failed to delete record!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  const handleReStore = async () => {
    try {
      //setBrands((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(ReStoreRecord);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        selectedBrand.deleted = 0;
        setBrands((brands) =>
          brands.map((r) => (r.id === selectedBrand.id ? selectedBrand : r))
        );
        toast.success("Record ha been restored");
      } else {
        //handleResponse(response);
        toast.error("Failed to delete restore!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  // DELETE - ending

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-4x1/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-3">
          Product Brands
        </h2>
        <Button
          className="text-nowrap"
          variant="outline"
          onClick={() => handleOpenDrawer()}
        >
          Add New
        </Button>
      </div>

      <div className="bg-white shadow-lg p-2 mt-3">
        {isLoading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={brands}
            pagination
            persistTableHead
            customStyles={dataTableHeadStyle}
            paginationPerPage={rowsPerPage} // Change as needed
            onChangePage={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* Drawer for Add/Edit Brand */}
      {isDrawerOpen && (
        <AddEdit
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onSave={handleSaveRecord}
          currentData={selectedBrand}
        />
      )}

      {/* Delete Confirmation Model */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4">{confirmationMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={deleteAction ? handleDelete : handleReStore}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BrandListing;
