"use client";
import { useState, useEffect } from "react";

import toast from "react-hot-toast";

import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { GET, POST_JSON } from "@/helper/ServerSideActions";

import DataTable from "react-data-table-component";
import { Button } from "@/components/ui/button";

import Link from "next/link";

import { getColumns } from "./columns";
import AddEdit from "./addedit";
import { dataTableHeadStyle } from "@/components/dataTableHeadStyle";
import { PageSubTitle } from "@/components/PageTitle";

import useVendorStore from "@/stores/ecommerce/useVendorStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

const RecordsList = () => {
  const { vendor, loading } = useVendorStore();

  // PAGE RELATED - starting
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [deleteAction, setDeleteAction] = useState(1);
  const pageTitle = "Product Attributes";
  const listUrl = ecom_endpoints?.products?.attributes?.list;
  const deleteUrl = ecom_endpoints?.products?.attributes?.deleteRecord(
    record?.id,
    vendor?.vendor_website_id
  );
  const ReStoreRecord = ecom_endpoints?.products?.attributes?.reStoreRecord(
    record?.id,
    vendor?.vendor_website_id
  );
  const rowsPerPage = 20; // Change as needed
  // PAGE RELATED - ending

  // Fetch Records - starting
  useEffect(() => {
    if (vendor?.vendor_website_id) {
      (async () => {
        setIsLoading(true);
        try {
          const body = {
            vendor_website_id: vendor?.vendor_website_id,
            showAll: true,
          };
          const response = await POST_JSON(listUrl, body);
          if (response?.status === 200) {
            setIsLoading(false);
            setRecords(response.data);
          }
        } catch (error) {
          setIsLoading(false);
          console.error("Error fetching product records:", error);
          set({ loading: false });
        }
      })();
    }
  }, [vendor?.vendor_website_id, listUrl]);
  // Fetch Records - ending

  // Handle Drawer Activities - starting
  const handleOpenDrawer = (record = null) => {
    setRecord(record);
    setIsDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setRecord(null);
  };
  const handleSaveRecord = (newRecord) => {
    setRecords((records) => {
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

  // DELETE - starting
  const handleOpenModal = (record, message, del) => {
    setRecord(record);
    setDeleteAction(del);
    setConfirmationMessage(message);
    setIsModalOpen(true);
  };
  const handleDelete = async () => {
    try {
      //setRecords((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(deleteUrl);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        record.deleted = 1;
        setRecords((records) =>
          records.map((r) => (r.id === record.id ? record : r))
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
      //setRecords((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(ReStoreRecord);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        record.deleted = 0;
        setRecords((records) =>
          records.map((r) => (r.id === record.id ? record : r))
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

  const columns = getColumns({
    currentPage,
    rowsPerPage,
    handleOpenDrawer,
    handleOpenModal,
  });

  return (
    <>
      <PageSubTitle title={pageTitle}>
        <Link href="/attributes-values">
          <span className="text-nowrap border py-2 px-4 bg-primary text-white rounded-md cursor-pointer">
            Attribute Values
          </span>
        </Link>

        <Button
          className="text-nowrap"
          variant="outline"
          onClick={() => handleOpenDrawer()}
        >
          Add New
        </Button>
      </PageSubTitle>

      <div className="bg-white shadow-lg p-2 mt-3">
        {isLoading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={records}
            pagination
            persistTableHead
            customStyles={dataTableHeadStyle}
            paginationPerPage={rowsPerPage} // Change as needed
            onChangePage={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {isDrawerOpen && (
        <AddEdit
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onSave={handleSaveRecord}
          record={record}
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

export default RecordsList;
