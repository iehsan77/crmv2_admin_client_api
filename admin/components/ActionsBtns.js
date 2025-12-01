"use client";
import { FaRegEdit, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

export default function ActionsBtns({
  record,
  onEdit = () => {},
  onDelete = () => {},
  onRestore = () => {},
}) {
  return (
    <div className="flex gap-2">
      {record?.deleted ? (
        
        <button
            className="btn btn-sm text-red"
            onClick={() => onRestore(record)}
          >
            <FaTrashRestoreAlt />
          </button>
      ) : (
        <>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onEdit(record)}
          >
            <FaRegEdit />
          </button>
          <button
            className="btn btn-sm text-red"
            onClick={() => onDelete(record)}
          >
            <FaRegTrashAlt />
          </button>
        </>
      )}
    </div>
  );
}
