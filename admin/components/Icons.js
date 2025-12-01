"use client";

import {
  LuBadgeX,
  LuBlocks,
  LuContact,
  LuHandshake,
  LuBuilding2,
  LuClipboardCheck,
  LuCalendarCheck,
  LuPhoneCall,
  LuShoppingCart,
  LuBookOpenCheck,
  LuTags,
  LuFileSpreadsheet,
  LuFileStack,
  LuBan,
  LuBadgeDollarSign,
  LuSpeech,
  LuCloudCog,
  LuCog,
  LuServerCog,
  LuBrainCog,
  LuFolders,
  LuFolderGit2,
  LuBriefcaseBusiness,
  LuBriefcase,
  LuCornerUpLeft,
  LuFile,
  LuTrash2,
  LuBrush,
  LuSquareStack,
  LuCar,
  LuCalendarClock,
  LuMousePointerClick,
  LuCarFront,
} from "react-icons/lu";

import { MdOutlineCampaign } from "react-icons/md";
import { TfiAnnouncement } from "react-icons/tfi";

import { FaRegEdit } from "react-icons/fa";

import { GiFamilyTree, GiCheckboxTree } from "react-icons/gi";

import { SiBrenntag } from "react-icons/si";
import { TbBuildingWarehouse } from "react-icons/tb";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";

// Static map of icons
const IconsMap = {
  LuBadgeX,
  LuBlocks,
  LuContact,
  LuHandshake,
  LuBuilding2,
  LuClipboardCheck,
  LuCalendarCheck,
  LuPhoneCall,
  LuShoppingCart,
  LuBookOpenCheck,
  LuTags,
  LuFileSpreadsheet,
  LuFileStack,
  GiFamilyTree,
  GiCheckboxTree,
  SiBrenntag,
  TbBuildingWarehouse,
  LiaFileInvoiceDollarSolid,
  LuBan,
  LuBadgeDollarSign,
  LuSpeech,
  LuCloudCog,
  LuCog,
  LuServerCog,
  LuBrainCog,
  LuFolders,
  LuFolderGit2,
  LuBriefcaseBusiness,
  LuBriefcase,
  MdOutlineCampaign,
  TfiAnnouncement,
  FaRegEdit,
  LuCornerUpLeft,
  LuFile,
  LuTrash2,
  LuBrush,
  LuSquareStack,
  LuCar,
  LuCalendarClock,
  LuMousePointerClick,
  LuCarFront,
};

// Component to render the icon
export default function Icons({ iconName, className = "w-6 h-6", ...props }) {
  const IconComponent = IconsMap[iconName];
  if (!IconComponent) {
    return <LuBadgeX className={className} {...props} />;
  }
  return <IconComponent className={className} {...props} />;
}

// Utility to expose the icon map
export const SystemIcons = () => {
  return Object.keys(IconsMap);
};
