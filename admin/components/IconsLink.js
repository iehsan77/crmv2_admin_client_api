"use client";

import Link from "next/link";

export default function IconsLink() {
  return (
    <div className="text-xs">
      enter class from{" "}
      <Link
        target="_blank"
        className="text-blue-800"
        href="https://react-icons.github.io/react-icons/icons/lu/"
      >
        React Lucide icons
      </Link>
    </div>
  );
}
