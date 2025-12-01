"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";

import { toast } from "react-hot-toast";

import Button from "@/components/Button";
import { DataTable } from "@/components/DataTable2";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDrawer } from "@/context/drawer-context";
import RecordNotFound from "@/components/RecordNotFound";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

import Columns from "./Columns";
import Filters from "./Filters";
import RecordForm from "@/partials/crm/calls/RecordForm";
import useCallsStore from "@/stores/crm/useCallsStore";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { GET } from "@/helper/ServerSideActions";

export default function RelatedCallsList({ module = "" }) {
  const title = "Calls";
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const [loading, setLoading] = useState();
  const [records, setRecords] = useState();

  const { showDrawer } = useDrawer();

  // ✅ Fetch related calls for this module
  useEffect(() => {
    if (!module || !id) return;
    const fetchRelatedCalls = async () => {
      setLoading(true)
      try {
        const response = await GET(
          crm_endpoints?.crm?.calls?.getRelatedCalls(module, id)
        );

        if (response?.status === 200) {
          setRecords(response?.data);
          toast.success("Calls received successfully");
        } else {
          handleResponse(response);
          toast.error("No calls found");
        }
      } catch (err) {
        toast.error("There is error in fetching calls");
      }
      setLoading(false)
    };
    fetchRelatedCalls();
  }, [module, id]);

  const handleAddClick = () => {
    showDrawer({
      title: `Add ${title}`,
      size: "xl",
      content: <RecordForm related_to={module} related_to_id={id} />,
    });
  };

  const columns = useMemo(() => Columns(), []);

  // ✅ safely handle missing module
  if (!module) return null;

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">{title}</h2>
          <Button onClick={handleAddClick}>
            <Plus /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeletonTable />
        ) : records?.length ? (
          <DataTable
            columns={columns}
            data={records}
            useStore={useCallsStore}
          />
        ) : (
          <RecordNotFound />
        )}
      </CardContent>
    </Card>
  );
}
