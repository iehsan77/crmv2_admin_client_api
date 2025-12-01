// components/ui/soft-badge.jsx
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Define the available variants using CVA
const badgeVariants = cva(
  "inline-flex items-center rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        amber: "bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500",
        red: "bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500",
        emerald: "bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500",
        sky: "bg-sky-600/10 dark:bg-sky-600/20 hover:bg-sky-600/10 text-sky-500",
        rose: "bg-rose-600/10 dark:bg-rose-600/20 hover:bg-rose-600/10 text-rose-500",
        blue: "bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/10 text-blue-500",
        gray: "bg-gray-600/10 dark:bg-gray-600/20 hover:bg-gray-600/10 text-gray-500",
        purple: "bg-purple-600/10 dark:bg-purple-600/20 hover:bg-purple-600/10 text-purple-500",
        // Default variant
        default: "bg-primary/10 text-primary",
      },
      iconPosition: {
        left: "flex-row",
        right: "flex-row-reverse",
      },
    },
    defaultVariants: {
      variant: "default",
      iconPosition: "left",
    },
  }
);

const Badge = React.forwardRef(
  ({ className, variant, icon, iconPosition, ...props }, ref) => {
    return (
      <div
        className={cn(
          badgeVariants({ variant, iconPosition }),
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              "flex-shrink-0",
              iconPosition === "left" ? "mr-1.5" : "ml-1.5"
            )}
          >
            {icon}
          </span>
        )}
        <span>{props.children}</span>
      </div>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };