// TopNavRight.tsx
import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutBtn from "@/components/FormControls/LogoutBtn";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useUserStore from "@/stores/useUserStore";
import Button from "@/components/Button";

export default function TopNavRight() {
  const { user } = useUserStore();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {/* Bell */}
        <Button size="icon" variant="outline" className="shrink-0 shadow-none">
          <Bell className="h-4 w-4" />
        </Button>
        {/* Settings */}
        <Button asChild size="icon" variant="outline" className="shrink-0 shadow-none">
          <Link href={ADMIN_PATHS?.SETTINGS?.PREFERENCES?.SYSTEM}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {/* Avatar + Sheet */}
      <Sheet>
        <SheetTrigger>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            {/*<div className="hidden md:flex flex-col">
              <span className="font-semibold">
                {user?.first_name + " " + user?.last_name}
              </span>
              <span className="leading-none text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>*/}
          </div>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>
                    {user?.first_name + " " + user?.last_name}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>{user?.first_name + " " + user?.last_name}</div>
                  <div className="font-normal text-sm">{user?.email}</div>
                </div>
              </div>
            </SheetTitle>
            <SheetDescription>
              <span>The area for options </span>
            </SheetDescription>
          </SheetHeader>
          <div className="p-3">
            <LogoutBtn label="LOGOUT" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// import { useEffect, useState } from "react";

// import { Bell, Settings, Home } from "lucide-react";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// import LogoutBtn from "@/components/FormControls/LogoutBtn";

// import Link from "next/link";

// // import { FaHome, FaSignOutAlt } from "react-icons/fa";

// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";

// import useUserStore from "@/stores/useUserStore";

// export default function TopNavRight() {
//   const { user } = useUserStore();

//   return (
//     <div className="p-3 ">
//       {/* Icons */}
//       <div className="flex space-x-6 items-center">
//         {/* Bell Icon */}
//         <div className="hover:text-gray-200">
//           <Bell className="h-4 w-4" />
//         </div>

//         {/* Settings Icon */}
//         <div className="hover:text-gray-200">
//           <Link href={ADMIN_PATHS?.SETTINGS?.PREFERENCES?.SYSTEM}>
//             <Settings className="h-4 w-4" />
//           </Link>
//         </div>

//         <Sheet>
//           <SheetTrigger>
//             <Avatar>
//               <AvatarImage src="https://github.com/shadcn.png" />
//               <AvatarFallback>Super Admin</AvatarFallback>
//             </Avatar>
//           </SheetTrigger>
//           <SheetContent>
//             <SheetHeader>
//               <SheetTitle>
//                 <div className="flex flex-cols items-center">
//                   <div className="me-3">
//                     <Avatar className="h-16 w-16">
//                       <AvatarImage src="https://github.com/shadcn.png" />
//                       <AvatarFallback>
//                         {user?.first_name + " " + user?.last_name}
//                       </AvatarFallback>
//                     </Avatar>
//                   </div>
//                   <div>
//                     <div>{user?.first_name + " " + user?.last_name}</div>
//                     <div className="font-normal text-sm">{user?.email}</div>
//                   </div>
//                 </div>
//               </SheetTitle>
//               <SheetDescription>
//                 <>
//                   <span>The area for options </span>
//                 </>
//               </SheetDescription>
//             </SheetHeader>
//             <div className="p-3">
//               <LogoutBtn label="LOGOUT" />
//             </div>
//           </SheetContent>
//         </Sheet>
//       </div>
//     </div>
//   );
// }
