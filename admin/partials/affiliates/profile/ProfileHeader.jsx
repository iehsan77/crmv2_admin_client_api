"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";

import { useDrawer } from "@/context/drawer-context";
import AffiliatesForm from "../AffiliatesForm";

export default function ProfileHeader({ affiliate }) {
  const { showDrawer } = useDrawer();
  return (
    <div className="flex flex-col items-center relative p-4">
      {/* Actions Menu
      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
        Actions <MoreHorizontal className="h-5 w-5" />
      </Button>
       */}

      <div className="w-full text-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            showDrawer({
              title: "Edit Affiliate",
              size: "xl",
              content: <AffiliatesForm record={affiliate} />,
            })
          }
        >
          <Pen className="h-3 w-3" />
        </Button>
        {/* <Image
          src="/icons/action_temp.svg"
          height={40}
          width={60}
          alt="actions"
          className="mb-3 float-right"
        /> */}
      </div>

      {affiliate?.is_company ? (
        <>
          {/* Profile Image */}
          <Avatar className="w-20 h-20 border-2 border-blue-500">
            <AvatarImage src={affiliate?.logo} alt="Profile" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>

          {/* Name */}
          <h2 className="mt-2 font-semibold text-lg">
            {affiliate?.company_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Car Traders:{" "}
            <span className="text-black-500 cursor-pointer_">
              {affiliate?.vehicles_affiliated} Cars
            </span>
          </p>
        </>
      ) : (
        <>
          {/* Profile Image */}
          <Avatar className="w-20 h-20 border-2 border-blue-500">
            <AvatarImage src={affiliate?.affiliate_image} alt="Profile" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>

          {/* Name */}
          <h2 className="mt-2 font-semibold text-lg">{affiliate?.name}</h2>
          <p className="text-sm text-muted-foreground">
            Car Traders:{" "}
            <span className="text-blue-500 underline cursor-pointer_">
              {affiliate?.vehicles_affiliated} Cars
            </span>
          </p>
        </>
      )}
    </div>
  );
}
