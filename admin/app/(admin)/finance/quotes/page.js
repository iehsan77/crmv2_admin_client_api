"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { GET, POST_JSON } from "@/helper/ServerSideActions";

import DataTable from "react-data-table-component";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { getColumns } from "./relatedFiles/columns";
import { dataTableHeadStyle } from "@/components/dataTableHeadStyle";
import { PageSubTitle } from "@/components/PageTitle";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

const RecordsList = () => {

  // PAGE RELATED - starting
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [deleteAction, setDeleteAction] = useState(1);
  const pageTitle = "Quotations";
  const listUrl = ecom_endpoints?.products?.quotes?.getRecords();

  const deleteUrl = ecom_endpoints?.products?.quotes?.deleteRecord(record?.id);
  const ReStoreRecord = ecom_endpoints?.products?.quotes?.reStoreRecord(record?.id);
  const rowsPerPage = 20; // Change as needed
  // PAGE RELATED - ending

  // Fetch Records - starting
  useEffect(() => {
    (async () => {
        setIsLoading(true);
        try {
          const response = await GET(listUrl);
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
  }, [listUrl]);
  // Fetch Records - ending

  // DELETE RECORD - starting
  const handleOpenModal = (record, message, del) => {
    setRecord(record);
    setDeleteAction(del);
    setConfirmationMessage(message);
    setIsModalOpen(true);
  };
  /*
  const handleDelete = async () => {
    try {
      const response = await GET(deleteUrl);
      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        setRecords((records) =>
          records.map((r) => (r.id !== record.id))
        );
        toast.success("Record ha been deleted");
      } else {
        //handleStatusCode(response);
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
        //handleStatusCode(response);
        toast.error("Failed to delete restore!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  */
  const handleDelete = async () => {
    try {
      const response = await GET(deleteUrl);
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        setRecords((records) => records.filter((r) => r.id !== record.id)); // ✅ Corrected
        toast.success("Record has been deleted");
      } else {
        toast.error("Failed to delete record!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("An error occurred while deleting the record.");
    }
  };
  // DELETE RECORD - starting

  const columns = getColumns({ currentPage, rowsPerPage, handleOpenModal });

  return (
    <>
      <PageSubTitle title={pageTitle}>
        <Link href={ADMIN_PATHS?.FINANCE?.QUOTES?.ADD}>
          <Button className="text-nowrap" variant="outline">
            Add New
          </Button>
        </Link>
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
