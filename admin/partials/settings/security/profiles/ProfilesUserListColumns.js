import Link from "next/link";
import Image from "next/image";

import { getImageUrl } from "@/helper/GeneralFunctions";

export const ProfilesUserListColumns = ({ page = 1, rpp = 10 }) => [
  {
    name: "#",
    cell: (record, index) => (page - 1) * rpp + index + 1,
    width: "80px",
    style: { textAlign: "center" },
  },
  {
    name: "Image",
    cell: (record) => (
      <Link
        className="cursor-pointer text-[#1E3A8A] hover:text-blue-800"
        href={ADMIN_PATHS?.PROFILE_VIEW(record?.id)}
      >
      
        <Image
          src={getImageUrl(record?.image)}
          alt={record?.name || "Profile Image"}
          width={40}
          height={40}
          className="object-cover"
        />
      </Link>
    ),
    width: "150px",
  },
  {
    name: "Name",
    selector: (record) => `${record?.name ?? ""} ${record?.last_name ?? ""}`,
    sortable: true,
    wrap: true,
  },
  {
    name: "Is Active",
    selector: (record) => (record?.active ? "Yes" : "No"),
    sortable: true,
    width: "150px",
  },
];
