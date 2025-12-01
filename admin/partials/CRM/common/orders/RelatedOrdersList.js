"use client";
import { useState, useRef, useEffect, useMemo } from "react";

import Button from "@/components/Button";
import { DataTable } from "@/components/DataTable2";
import { useDrawer } from "@/context/drawer-context";

import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import Columns from "./Columns";
import Filters from "./Filters";

import RecordNotFound from "@/components/RecordNotFound";
import RecordForm from "@/partials/crm/contacts/RecordForm";

import { useParams } from "next/navigation";

//import CardActions from "./CardActions";

import useContactsStore from "@/stores/crm/useContactsStore";

export default function RelatedOrdersList({records={}}) {
  const title = "Contacts";

  const { id } = useParams();

  const { showDrawer } = useDrawer();

  const handleAddClick = () => {
    showDrawer({
      title: `Add ${title}`,
      size: "xl",
      content: <RecordForm />,
    });
  };

  const columns = useMemo(() => Columns(), []);

  return (
    <>
      <Card className="gap-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">Orders</h2>
            {/* <CardActions /> */}
          </div>
        </CardHeader>
        <CardContent>
          {records?.length ? (
            <>
              <DataTable
                columns={columns}
                data={records}
                useStore={useContactsStore}
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
