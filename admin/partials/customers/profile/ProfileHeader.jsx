"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getName } from "@/helper/GeneralFunctions";
import useCustomersStore from "@/stores/customers/useCustomersStore";
import { MoreHorizontal } from "lucide-react";

export default function ProfileHeader() {


  const { customer } = useCustomersStore();

  return (
    <div className="flex flex-col items-center relative p-4">
      {/* Actions Menu */}
      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
        <MoreHorizontal className="h-5 w-5" />
      </Button>

      <Avatar className="w-20 h-20 border-2 border-blue-500">
        <AvatarImage src={""} alt="Profile" />
        <AvatarFallback>
          {getName(customer)
            .split(" ")
            .map((n) => n[0])
            .splice(0, 2)
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {/* Name */}
      <h2 className="mt-2 font-semibold text-lg">
        {customer?.is_company ? customer?.company_name : `${getName(customer)}`}
      </h2>
    </div>
  );
}
