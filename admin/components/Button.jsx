"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

const Button = ({
  children,
  loadingTitle,
  isSubmitting = false,
  className = "",
  ...props
}) => {
  return (
    <ShadcnButton
      type="button"
      disabled={isSubmitting}
      className={`text-sm rounded-md transition font-normal ${
        isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      {...props}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          {loadingTitle && <span>{loadingTitle}</span>}
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : (
        children
      )}
    </ShadcnButton>
  );
};

export default Button;

// "use client";
// import { Icon } from "@iconify/react";
// import React from "react";

// const Button = ({ title, loadingTitle, isSubmitting, className, ...others }) => {
//   return (
//     <button
//       type="button"
//       disabled={isSubmitting}
//       className={`text-sm bg-transparent py-2 px-4 rounded-full transition ${
//         isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
//       } ${className || ""}`}
//       {...others}
//     >
//       {isSubmitting ? (
//         <span className="flex items-center justify-center gap-2">
//           {loadingTitle && <span>{loadingTitle}</span>}
//           <span>
//             <Icon icon={"line-md:loading-alt-loop"} className="h-5 w-5" />
//           </span>
//         </span>
//       ) : (
//         title
//       )}
//     </button>
//   );
// };

// export default Button;
