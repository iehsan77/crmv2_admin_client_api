import ActionsBtns from "@/components/ActionsBtns";

import { FiUsers } from "react-icons/fi";

import Link from "next/link";

export const ProfilesListColumns = ({
  page = 1,
  rpp = 10,
  onEdit,
  onDelete,
  onRestore,
}) => [
  {
    name: "#",
    cell: (record, index) => (page - 1) * rpp + index + 1,
    width: "80px",
    center: "center", // Correct usage: boolean not string
    style: { textAlign: "center" },
  },
  {
    name: "Title",
    selector: (record) => (
      <Link
        className="cursor-pointer text-[#1E3A8A] hover:text-blue-800"
        href={ADMIN_PATHS?.PROFILE_VIEW(record?.id)}
      >
        {record?.title}
      </Link>
    ),
  },
  {
    name: "Description",
    selector: (record) => record?.excerpt,
    sortable: true,
    // maxWidth: "500px",
    wrap: true,
  },
  {
    name: "Permissions",
    selector: (record) => (
      <Link
        className="cursor-pointer underline text-[#1E3A8A] hover:text-blue-800"
        href={ADMIN_PATHS?.PROFILE_VIEW(record?.id)}
      >
        {record?.permissions?.length ?? 0}
      </Link>
    ),
    width: "150px",
    center: "center",
  },
  {
    name: "Users",
    selector: (record) => (
      <Link
        className="cursor-pointer underline text-[#1E3A8A] hover:text-blue-800"
        href={ADMIN_PATHS?.PROFILE_VIEW(record?.id)}
      >
        {record?.users?.length ?? 0}
      </Link>
    ),
    width: "150px",
    center: "center",
  },
  {
    name: "Is Active",
    selector: (record) => (record?.active ? "Yes" : "No"),
    sortable: true,
    width: "150px",
    center: "center",
  },
  {
    name: "Sort By",
    selector: (record) => record?.sort_by,
    sortable: true,
    width: "150px",
    center: "center",
  },
  {
    name: "Actions",
    cell: (record) => (
      <>
        <Link href={ADMIN_PATHS?.PROFILE_VIEW(record?.id)}>
          <FiUsers className="mx-3" />
        </Link>
        <ActionsBtns
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      </>
    ),
    width: "150px",
    center: "center",
    style: { textAlign: "center" },
  },
];
