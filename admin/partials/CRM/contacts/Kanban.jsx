"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { UserCheck, Mail, Phone, Globe } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import useContactsStore from "@/stores/crm/useContactsStore";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
  InfoItem,
  IconItem,
} from "@/helper/GeneralFunctions";
import {
  CONTACTS_SOURCES_OPTIONS,
  CONTACTS_STATUS_OPTIONS,
} from "@/constants/crm_constants";
import { COUNTRIES, STATES, USER_ROLES } from "@/constants/general_constants";
import useCommonStore from "@/stores/useCommonStore";

// --- KanbanCard ---
function KanbanCard({ record = {} }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.dndId || record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
    background: "#fff",
    borderRadius: 8,
    cursor: "grab",
  };

  const owner = record?.owner_details;
  const user = record?.user_details;
  const account = record?.account_details;
  const sourceLabel = getMocDataLabelByValue(
    CONTACTS_SOURCES_OPTIONS,
    record?.source_id
  );
  const statusLabel = getMocDataLabelByValue(
    CONTACTS_STATUS_OPTIONS,
    record?.status_id
  );
  const roleLabel = getMocDataLabelByValue(USER_ROLES, record?.role_id);

  console.log("contact record 82");
  console.log(record);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <div className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Info Section */}
        <div className="w-full md:w-4/5_ flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            {user?.image ? (
              <Image
                src={user.image}
                alt={getName(user)}
                width={48}
                height={48}
                className="rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                N/A
              </div>
            )}
            <span className="font-semibold text-base text-gray-900">
              {getName(user)}
            </span>
          </div>

          <div className="gap-x-6 gap-y-2 text-sm text-gray-700">
            <div>
              <InfoItem label="Source" value={sourceLabel} />
            </div>
            <div>
              <InfoItem label="Status" value={statusLabel} />
            </div>
            <div>
              <InfoItem label="Owner" value={getName(owner)} />
            </div>
            <div>
              <InfoItem
                label="Assigned To"
                value={getName(record?.assigned_to_details)}
              />
            </div>
            <div>
              <InfoItem label="Role" value={roleLabel} />
            </div>
            <div>
              <InfoItem label="Email" value={record?.email} />
            </div>
            <div>
              <InfoItem label="Phone" value={record?.phone} />
            </div>
            <div>
              <InfoItem label="Website" value={record?.website} />
            </div>
            <div>
              <InfoItem
                label="Country"
                value={getMocDataLabelByValue(COUNTRIES, record?.country_id)}
              />
            </div>
            <div>
              <InfoItem
                label="State"
                value={getMocDataLabelByValue(STATES, record?.state_id)}
              />
            </div>
            <div>
              <InfoItem label="Postal Code" value={record?.postal_code} />
            </div>
            <div>
              <InfoItem label="Account" value={account?.title} />
            </div>
            <div>
              <InfoItem
                label="Last Activity"
                value={formatDateTime(record?.last_activity_date)}
              />
            </div>
            <div>
              <InfoItem
                label="created Date"
                value={formatDateTime(record?.created_at)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- KanbanColumn ---
function KanbanColumn({ status_id, title, cards = [], activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: status_id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 min-w-[18rem] bg-[#F5F9FF] rounded-xl border border-gray-200 shadow-sm p-3 transition-colors ${
        isOver ? "bg-blue-50 border-blue-400" : ""
      }`}
      style={{ maxHeight: "80vh" }}
    >
      <div className="font-bold text-lg mb-3 text-gray-700 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
        {title} -{" "}
        <span className="text-xs text-gray-400">({cards.length})</span>
      </div>

      <div
        className="overflow-y-auto pr-1"
        style={{ maxHeight: "calc(80vh - 3rem)" }}
      >
        <SortableContext
          items={cards.map((c, idx) => `${status_id}-${c.id}-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="flex items-center justify-center text-gray-300 italic h-24 border-2 border-dashed border-gray-200 rounded-lg">
              No contacts
            </div>
          ) : (
            cards.map((record, index) => (
              <KanbanCard
                key={`${status_id}-${record?.id}-${index}`}
                record={{
                  ...record,
                  dndId: `${status_id}-${record.id}-${index}`,
                }}
                isActive={activeId === `${status_id}-${record.id}-${index}`}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// --- KanbanBoard ---
export default function Kanban() {
  const [activeId, setActiveId] = useState(null);

  const [loading, setLoading] = useState(false);

  const { updateContact } = useContactsStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { viewMode } = useCommonStore();

  const kanbanData = useContactsStore((s) => s.kanbanData);
  const setKanbanData = useContactsStore((s) => s.setKanbanData);
  const kanbanDataLoading = useContactsStore((s) => s.kanbanDataLoading);
  const fetchKanbanRecords = useContactsStore((s) => s.fetchKanbanRecords);

  useEffect(() => {
    fetchKanbanRecords();
  }, []);

  // Fetch Kanban Data
  /*
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await POST(crm_endpoints?.crm?.contacts?.getByStatus);
        console.log("response 204", response);

        if (response?.status === 200) {
          setKanbanData(response?.data || {});
        } else {
          handleResponse(response);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  */

  // Helper to get list by status
  const getListByStatus = (data, statusId) => {
    if (Array.isArray(data)) {
      const statusObj = data.find(
        (s) => s?.id === statusId || String(s?.id) === String(statusId)
      );
      const contacts = statusObj?.contacts || [];
      return Array.isArray(contacts) ? contacts : [];
    }
    const list = data[statusId] || [];
    return Array.isArray(list) ? list : [];
  };

  // Helper to find card location
  const getColumnAndIndexByCardId = (cardId, data) => {
    if (Array.isArray(data)) {
      // Handle array format: data is an array of status objects
      for (const statusObj of data) {
        const status = statusObj?.id;
        const list = statusObj?.contacts || [];
        if (Array.isArray(list)) {
          const idx = list.findIndex(
            (record, index) => `${status}-${record.id}-${index}` === cardId
          );
          if (idx !== -1) return { status, idx };
        }
      }
    } else if (data && typeof data === "object") {
      // Handle object format: data is { status: [records] }
      for (const [status, list] of Object.entries(data)) {
        if (Array.isArray(list)) {
          const idx = list.findIndex(
            (record, index) => `${status}-${record.id}-${index}` === cardId
          );
          if (idx !== -1) return { status, idx };
        }
      }
    }
    return { status: null, idx: -1 };
  };

  // Drag events
  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    // 🚨 If not dropped over anything, exit early (no movement)
    if (!over) return;

    const { status: sourceStatus, idx: sourceIdx } = getColumnAndIndexByCardId(
      active.id,
      kanbanData
    );
    if (sourceIdx === -1) return;

    let targetStatus = null;
    let destinationIdx = null;

    // ✅ Case 1: Dropped on a column (empty area)
    if (over && over.id && !String(over.id).includes("-")) {
      targetStatus = over.id;
      destinationIdx = getListByStatus(kanbanData, targetStatus).length;
    }
    // ✅ Case 2: Dropped on another card
    else {
      const found = getColumnAndIndexByCardId(over.id, kanbanData);
      targetStatus = found.status;
      destinationIdx = found.idx;
    }

    // 🚨 Safety check — no valid destination → cancel move
    if (!targetStatus || destinationIdx === null || destinationIdx === -1) {
      console.warn("❌ Invalid drop — reverting");
      return;
    }

    // Normalize status IDs
    const destinationStatus =
      typeof targetStatus === "string"
        ? parseInt(targetStatus.split("-")[0], 10) || targetStatus
        : targetStatus;

    // 🚨 If no change in position/status, ignore
    if (
      String(sourceStatus) === String(destinationStatus) &&
      sourceIdx === destinationIdx
    )
      return;

    const sourceList = getListByStatus(kanbanData, sourceStatus);
    const recordToMove = sourceList[sourceIdx];
    if (!recordToMove) return;

    // ✅ Build new Kanban data
    let newData;
    if (Array.isArray(kanbanData)) {
      newData = kanbanData.map((col) => {
        if (String(col.id) === String(sourceStatus)) {
          const newContacts = [...(col.contacts || [])];
          newContacts.splice(sourceIdx, 1);
          return { ...col, contacts: newContacts };
        }
        if (String(col.id) === String(destinationStatus)) {
          const newContacts = [...(col.contacts || [])];
          newContacts.splice(destinationIdx, 0, {
            ...recordToMove,
            status_id: destinationStatus,
          });
          return { ...col, contacts: newContacts };
        }
        return col;
      });
    } else {
      newData = { ...kanbanData };
      const source = [...(newData[sourceStatus] || [])];
      const dest = [...(newData[destinationStatus] || [])];

      source.splice(sourceIdx, 1);
      dest.splice(destinationIdx, 0, {
        ...recordToMove,
        status_id: destinationStatus,
      });

      newData[sourceStatus] = source;
      newData[destinationStatus] = dest;
    }

    setKanbanData(newData);

    // ✅ Update backend if status changed
    if (Number(recordToMove?.status_id) !== Number(destinationStatus)) {
      updateStatus(recordToMove.id, destinationStatus);
    }
  };

  const updateStatus = async (id, status_id) => {
    try {
      console.log("📤 API Contact:", { id, status_id });
      const response = await POST(crm_endpoints?.crm?.contacts?.updateStatus, {
        id,
        status_id,
      });
      // console.log("📥 API Response:", response);
      if (response?.status === 200) {
        toast.success("Status updated");
        // updateContact({ id, status_id });
      } else {
        handleResponse(response);
      }
    } catch (err) {
      console.error("❌ Update Error:", err);
    }
  };

  return (
    <div className="w-full overflow-x-auto py-6">
      {kanbanDataLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <LoadingSkeleton cls="h-[200px] w-[100%] rounded-md" qty={10} />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 min-w-full">
            {Array.isArray(kanbanData)
              ? kanbanData.map((status, i) => (
                  <KanbanColumn
                    key={`col-${status?.id ?? i}`}
                    status_id={status?.id}
                    title={status?.title}
                    cards={status?.contacts || []}
                    activeId={activeId}
                  />
                ))
              : Object.entries(kanbanData).map(([status, list]) => (
                  <KanbanColumn
                    key={`col-${status}`}
                    status_id={status}
                    title={status}
                    cards={list || []}
                    activeId={activeId}
                  />
                ))}
          </div>

          <DragOverlay>
            {activeId &&
              (() => {
                const { status, idx } = getColumnAndIndexByCardId(
                  activeId,
                  kanbanData
                );
                if (status && idx !== -1) {
                  const list = getListByStatus(kanbanData, status);
                  const record = list[idx];
                  return (
                    <KanbanCard
                      key={`overlay-${activeId}`}
                      record={{ ...record, dndId: activeId }}
                    />
                  );
                }
                return null;
              })()}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
