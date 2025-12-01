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

import { useSegment } from "@/helper/GeneralFunctions";

import Columns from "./Columns";
import Filters from "./Filters";

import RecordForm from "@/partials/crm/calls/RecordForm";

import useCallsStore from "@/stores/crm/useCallsStore";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { GET } from "@/helper/ServerSideActions";

export default function RelatedCallsList({ records = "" }) {
  const title = "Calls";

  const [loading, setLoading] = useState();

  const source_module = useSegment(1);
  const source_module_id = useSegment(3);

  const { showDrawer } = useDrawer();

  const handleAddClick = () => {
    showDrawer({
      title: `Add ${title}`,
      size: "xl",
      content: <RecordForm />,
    });
  };

  const columns = useMemo(() => Columns(), []);

  if (!source_module) return null;

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
