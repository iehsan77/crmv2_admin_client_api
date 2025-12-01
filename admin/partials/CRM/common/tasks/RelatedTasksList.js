"use client";
import { useState, useRef, useEffect, useMemo } from "react";

import Button from "@/components/Button";
import { DataTable } from "@/components/DataTable2";
import { useDrawer } from "@/context/drawer-context";

import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import Columns from "./Columns";
//import Filters from "./Filters";

import RecordNotFound from "@/components/RecordNotFound";
//import RecordForm from "./RecordForm";
import RecordForm from "@/partials/crm/tasks/RecordForm";

import { useSegment } from "@/helper/GeneralFunctions";

import { useParams } from "next/navigation";

import useTasksStore from "@/stores/crm/useTasksStore";

export default function RelatedTasksList({ records = {} }) {
  const title = "Task";

  const { id } = useParams();

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

console.log("records 41")
console.log(records)

  return (
    <>
      <Card className="gap-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">Tasks</h2>
            <Button onClick={handleAddClick}>
              <Plus /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records?.length ? (
            <>
              <DataTable
                columns={columns}
                data={records}
                useStore={useTasksStore}
              />
            </>
          ) : (
            <RecordNotFound />
          )}
        </CardContent>
      </Card>
    </>
  );
}
