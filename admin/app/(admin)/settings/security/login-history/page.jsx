"use client";

import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";

import { PageSubTitle } from "@/components/PageTitle";
import { GET } from "@/helper/ServerSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { handleResponse } from "@/helper/ClientSideActions";
import { formatDateTime } from "@/helper/GeneralFunctions";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function LoginHistoryPage() {
  const title = "Login History";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const perPage = 30;

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const response = await GET(crm_endpoints?.loginLog?.get);
        setLoading(false);
        if (response?.status === 200) {
          setLogs(response?.data);
        } else {
          handleResponse(response);
        }
      } catch (err) {
        toast.error(err?.message);
      }
    };
    fetchLog();
  }, []);

  const columns = [
    {
      name: "User",
      selector: (row) => row?.first_name + " " + row?.last_name || "-",
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row?.email || "-",
      sortable: true,
    },
    {
      name: "IP Address",
      selector: (row) => row?.ip_address || "-",
    },
    {
      name: "Operating System",
      selector: (row) => row?.os + " " + row?.os_version || "-",
    },
    {
      name: "Device",
      selector: (row) => row?.device + " " + row?.device_type || "-",
    },
    {
      name: "Browser",
      selector: (row) => row?.browser + " " + row?.browser_version || "-",
    },
    {
      name: "Login at",
      selector: (row) => formatDateTime(row?.createdon),
      sortable: true,
    },
    {
      name: "Logout at",
      selector: (row) =>
        row?.updatedon ? formatDateTime(row?.updatedon) : "-",
      sortable: true,
    },
    {
      name: "Duration",
      selector: (row) => row?.duration,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row?.status,
      cell: (row) => (
        <span
          className={
            row.status === "success" ? "text-green-600" : "text-red-500"
          }
        >
          {row.status === "success" ? "Success" : "Failed"}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageSubTitle title={title} />
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            columns={columns}
            data={logs}
            pagination
            paginationPerPage={perPage}
            paginationTotalRows={totalRows}
            onChangePage={(newPage) => setPage(newPage)}
            persistTableHead
          />
        )}
      </div>
    </>
  );
}
