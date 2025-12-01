"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Star, SquarePen, Eye, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

export default function RecordActions({
  module,
  title,
  record,
  useStore,
  enableFavorite = true,
  enableEdit = true,
  enableView = true,
  enableDelete = true,
  viewBasePath,
}) {
  const { showDrawer } = useDrawer();

  // 🧠 Dynamically load RecordForm from correct module
  const RecordForm = dynamic(() =>
    import(`@/partials/crm/${module}/RecordForm`).catch(() => {
      console.warn(`⚠️ RecordForm not found for module: ${module}`);
      return () => (
        <div className="p-4 text-red-500">
          Missing RecordForm for <strong>{module}</strong>
        </div>
      );
    })
  );

  const markAsFavorite = useStore?.((s) => s.markAsFavorite);
  const deleteRecord = useStore?.((s) => s.deleteRecord);

  //const getViewUrl = (id) => viewBasePath || `/crm/${module}/view/${id}`;

  /*  
  const getViewUrl = (id) => {
    const basePath = "/crm";

    const relatedModules = {
      accounts: "accounts",
      deals: "deals",
    };

    // Helper to get related record URL
    const getRelatedUrl = (relatedTo, relatedId) =>
      relatedModules[relatedTo]
        ? `${basePath}/${relatedModules[relatedTo]}/view/${relatedId}`
        : "";

    // Common pattern for modules with *_for and related_to
    const moduleConfig = {
      calls: record?.call_for,
      meetings: record?.meeting_for,
      tasks: record?.task_for,
    };

    const relatedTo = record?.related_to;
    const relatedToId = record?.related_to_id;

    // ✅ Handle modules with call_for / meeting_for / task_for
    if (["calls", "meetings", "tasks"].includes(module)) {
      const forType = moduleConfig[module];

      if (forType === "leads") {
        return `${basePath}/leads/view/${id}`;
      }

      if (forType === "contacts") {
        return getRelatedUrl(relatedTo, relatedToId);
      }
    }

    // ✅ Direct module-to-view mapping
    const directModules = ["deals", "accounts", "contacts", "leads"];
    if (directModules.includes(module)) {
      return `${basePath}/${module}/view/${id}`;
    }

    return ""; // default fallback
  };
*/

  const getViewUrl = (id) => {
    const basePath = "/crm";

    // Helper: safely get first related ID
    const getRelatedToId = (record, module) => {
      if (module === "meetings") {
        const raw = record?.related_to_ids;
        if (!raw) return "";

        if (Array.isArray(raw)) return String(raw[0] || "");

        if (typeof raw === "string" && raw.startsWith("[")) {
          try {
            const arr = JSON.parse(raw);
            return String(Array.isArray(arr) ? arr[0] : arr);
          } catch {
            return raw.split(",")[0]?.trim() || "";
          }
        }

        if (typeof raw === "string" && raw.includes(",")) {
          return raw.split(",")[0]?.trim() || "";
        }

        return String(raw);
      }

      return String(record?.related_to_id || "");
    };

    const relatedModules = {
      accounts: "accounts",
      deals: "deals",
    };

    // Helper to get related record URL
    const getRelatedUrl = (relatedTo, relatedId) =>
      relatedModules[relatedTo]
        ? `${basePath}/${relatedModules[relatedTo]}/view/${relatedId}`
        : "";

    // Map module to *_for property
    const moduleConfig = {
      calls: record?.call_for,
      meetings: record?.meeting_for,
      tasks: record?.task_for,
    };

    const relatedTo = record?.related_to;
    const relatedToId = getRelatedToId(record, module); // ✅ dynamic & safe

    // ✅ Handle calls, meetings, and tasks
    if (["calls", "meetings", "tasks"].includes(module)) {
      const forType = moduleConfig[module];

      if (forType === "leads") {
        return `${basePath}/leads/view/${id}`;
      }

      if (forType === "contacts") {
        return getRelatedUrl(relatedTo, relatedToId);
      }
    }

    // ✅ Direct modules
    const directModules = ["deals", "accounts", "contacts", "leads"];
    if (directModules.includes(module)) {
      return `${basePath}/${module}/view/${id}`;
    }

    return ""; // fallback
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* ⭐ Favorite */}
      {enableFavorite && markAsFavorite && (
        <Button
          variant="outline"
          size="icon"
          title="Favorite"
          onClick={() => markAsFavorite(record?.id)}
        >
          <Star
            className={`h-4 w-4 ${
              record?.favorite === 1 ? "text-yellow-400" : "text-gray-400"
            }`}
            fill={record?.favorite === 1 ? "currentColor" : "none"}
          />
        </Button>
      )}

      {/* ✏️ Edit */}
      {enableEdit && (
        <Button
          variant="outline"
          size="icon"
          title={`Edit ${title}`}
          onClick={() =>
            showDrawer({
              title: `Edit ${title}`,
              size: "xl",
              content: <RecordForm record={record} />,
            })
          }
        >
          <SquarePen className="h-4 w-4" />
        </Button>
      )}

      {/* 👁️ View */}
      {enableView && (
        <Link href={getViewUrl(record?.id)}>
          <Button variant="outline" size="icon" title={`View ${title}`}>
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* 🗑️ Delete */}
      {enableDelete && deleteRecord && (
        <Button
          variant="outline"
          size="icon"
          title={`Delete ${title}`}
          onClick={() => deleteRecord(record?.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )}
    </div>
  );
}
