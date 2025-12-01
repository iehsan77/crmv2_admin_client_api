"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { SmsForm } from "@/partials/settings/integrations/sms/SmsForm";
import { SmsListColumns } from "@/partials/settings/integrations/sms/SmsListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useSmsStore from "@/stores/settings/useSmsStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "SMS Integrations";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const { sms, fetchSms, setSelectedSms, deleteSms, restoreSms } =
    useSmsStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchSms();
      setLoading(false);
    };
    fetchData();
  }, [fetchSms]);

  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    fetchSms();
  }, [fetchSms]);

  const handleDelete = (record) => {
    setMessage("Are you sure you want to delete '" + record?.provider_name + "' SMS account?");
    setOnConfirm(() => deleteSms(record?.id));
    open();
  };

  const handleRestore = (record) => {
    setMessage("Are you sure you want to restore '" + record?.provider_name + "' SMS account?");
    setOnConfirm(() => restoreSms(record?.id));
    open();
  };

  const handleEditRecord = (record) => {
    setSelectedSms(record);
  };

  const columns = SmsListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <SmsForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={sms}
            pagination
            persistTableHead
            paginationPerPage={rpp}
            onChangePage={(page) => setPage(page)}
          />
        )}
      </div>
    </>
  );
}
