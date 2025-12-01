"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { LiaPlusSquare, LiaMinusSquare } from "react-icons/lia";
import { FaEdit, FaTrash } from "react-icons/fa";

import useRolesStore from "@/stores/settings/useRolesStore";
import Alert from "@/components/Alert";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";
import { GET } from "@/helper/ServerSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";

const collectTitles = (nodes) =>
  nodes.reduce(
    (acc, node) => [
      ...acc,
      node.title,
      ...(node.children ? collectTitles(node.children) : []),
    ],
    []
  );

function TreeItem({
  node,
  level = 0,
  expanded,
  toggle,
  onDeleteClick,
  selectedRoleId,
  setSelectedRoleId,
}) {
  const { setSelectedRole } = useRolesStore();
  const hasChildren = node.children?.length > 0;
  const isOpen = expanded.includes(node.title);
  const isSelected = selectedRoleId === node.id;

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation();
      toggle(node.title);
    },
    [node.title, toggle]
  );

  const onSelect = useCallback(() => setSelectedRoleId(node.id), [node.id, setSelectedRoleId]);

  return (
    <div style={{ marginLeft: level * 16 }}>
      <div
        className={`flex items-center gap-2 group relative p-1 rounded cursor-pointer ${
          isSelected ? "bg-blue-100" : ""
        }`}
        onClick={onSelect}
      >
        {hasChildren && (
          <button onClick={handleToggle} aria-label={isOpen ? "Collapse" : "Expand"}>
            {isOpen ? (
              <LiaMinusSquare className="h-5 w-5 text-gray-600 hover:text-black" />
            ) : (
              <LiaPlusSquare className="h-5 w-5 text-gray-600 hover:text-black" />
            )}
          </button>
        )}
        <span className="text-sm">{node.title}</span>
        <div className="flex gap-2 ml-2 invisible group-hover:visible">
          <button
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRole(node);
            }}
          >
            <FaEdit className="h-3.5 w-3.5 text-gray-500 hover:text-[#1E3A8A]" />
          </button>
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(node);
            }}
          >
            <FaTrash className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* {isOpen && hasChildren && (
        <div className="border-l border-dashed border-blue-600 ml-2 pl-3 space-y-2 mt-2 pt-2">
          {node.children.map((child) => (
            <TreeItem
              key={child.id || child.title}
              node={child}
              level={level + 1}
              expanded={expanded}
              toggle={toggle}
              onDeleteClick={onDeleteClick}
              selectedRoleId={selectedRoleId}
              setSelectedRoleId={setSelectedRoleId}
            />
          ))}
        </div>
      )} */}
      {isOpen && hasChildren && (
  <div className="relative ml-4 mt-2 space-y-2">
    {node.children.map((child, index) => (
      <div key={child.id || child.title} className="relative pl-4_">
        {/* Vertical dashed line */}
        <div className="absolute top-0 left-0 h-full border-l border-dashed border-blue-600" />

        {/* Horizontal dashed line connecting to the node */}
        <div className="absolute top-3 left-0 w-6 border-t border-dashed border-blue-600" />

        {/* Actual child node */}
        <TreeItem
          node={child}
          level={level + 1}
          expanded={expanded}
          toggle={toggle}
          onDeleteClick={onDeleteClick}
          selectedRoleId={selectedRoleId}
          setSelectedRoleId={setSelectedRoleId}
        />
      </div>
    ))}
  </div>
)}

    </div>
  );
}

function ReassignTreeView({ node, onSelect, excludeId, selectedId }) {
  if (node.id === excludeId) return null;

  const isSelected = selectedId === node.id;

  return (
    <div className="ml-2">
      <button
        onClick={() => onSelect(node)}
        className={`block w-full text-left text-sm p-1 rounded hover:bg-blue-50 ${
          isSelected ? "bg-blue-200 font-semibold" : ""
        }`}
        type="button"
      >
        {node.title}
      </button>
      {node.children?.length > 0 && (
        <div className="ml-4 border-l pl-2">
          {node.children.map((child) => (
            <ReassignTreeView
              key={child.id}
              node={child}
              onSelect={onSelect}
              excludeId={excludeId}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RolesTreeView() {
  const { rolesHierarchy, fetchRoles, deleteRoleFromHierarchy  } = useRolesStore();

  // Directly use store rolesHierarchy as treeData, no need for local copy
  const treeData = rolesHierarchy;

  const [expanded, setExpanded] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reassignRole, setReassignRole] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);

  // Toggle expanded titles
  const toggle = useCallback(
    (title) =>
      setExpanded((prev) =>
        prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
      ),
    []
  );

  // Expand all on treeData change
  useEffect(() => {
    if (treeData.length > 0) {
      setExpanded(collectTitles(treeData));
    } else {
      setExpanded([]);
    }
  }, [treeData]);

  const expandAll = useCallback(() => setExpanded(collectTitles(treeData)), [treeData]);
  const collapseAll = useCallback(() => setExpanded([]), []);

  const handleRoleDelete = useCallback(
    async (role, reassignedTo) => {
      if (!role?.id) return;

      try {
        const to_delete = role.id;
        const to_report_to = reassignedTo?.id || 0;

        const response = await GET(
          crm_endpoints?.settings?.roles?.reassignAndDelete(to_delete, to_report_to)
        );

        if (response?.status === 200) {
          deleteRoleFromHierarchy(to_delete);// refresh store data
          toast.success(response?.message || "Role deleted successfully");
          setDeleteTarget(null);
          setReassignRole(null);
          setShowDeleteDialog(false);
          setShowConfirmDeleteDialog(false);
        } else {
          handleResponse(response);
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    },
    [fetchRoles]
  );

  return (
    <>
      {treeData.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm space-x-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-[#1E3A8A] border py-1 px-3 hover:underline"
              >
                Expand All
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-[#1E3A8A] border py-1 px-3 hover:underline"
              >
                Collapse All
              </button>
            </div>
          </div>

          {treeData.map((node) => (
            <TreeItem
              key={node.id || node.title}
              node={node}
              expanded={expanded}
              toggle={toggle}
              onDeleteClick={(node) => {
                setDeleteTarget(node);
                if (node.children && node.children.length > 0) {
                  setShowDeleteDialog(true);
                } else {
                  setShowConfirmDeleteDialog(true);
                }
              }}
              selectedRoleId={selectedRoleId}
              setSelectedRoleId={setSelectedRoleId}
            />
          ))}

          {/* Dialog for reassign & delete */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Reassign Team Before Deleting: <strong>{deleteTarget?.title}</strong>
                </DialogTitle>
              </DialogHeader>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {treeData.map((node) => (
                  <ReassignTreeView
                    key={node.id}
                    node={node}
                    onSelect={setReassignRole}
                    excludeId={deleteTarget?.id}
                    selectedId={reassignRole?.id}
                  />
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!reassignRole) {
                      toast.error("Please select a team to reassign.");
                      return;
                    }
                    handleRoleDelete(deleteTarget, reassignRole);
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm delete dialog when no reassignment needed */}
          <Dialog
            open={showConfirmDeleteDialog}
            onOpenChange={setShowConfirmDeleteDialog}
          >
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
              </DialogHeader>
              <p>
                Are you sure you want to delete the team <strong>{deleteTarget?.title}</strong>?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRoleDelete(deleteTarget, null)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Alert variant="info">No roles found in the system.</Alert>
      )}
    </>
  );
}
