//import { formatDate } from "@/lib/formatDate";

import { formatDate, formatDateTime } from "@/helper/GeneralFunctions";

export default function InsuranceInformation({ data }) {
  if (!data?.insurance_information) return null; // safeguard

  console.log("data 6");
  console.log(data);

  return (
    <div className="mt-6">
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Insurance Information
      </h3>
      <div className="flex gap-4 flex-wrap">
        {Object.entries(data.insurance_information).map(([key, value]) => {
          // Format if it's a date field
          const displayValue =
            key.toLowerCase().includes("date") && value
              ? formatDate(value)
              : value;

          return (
            <div key={key} className="mr-8">
              <p className="text-sm text-muted-foreground capitalize">
                {key
                  .replace(/_/g, " ") // underscores → space
                  .replace(/([A-Z])/g, " $1") // insert space before uppercase
                  .trim()}
              </p>
              <p className="font-medium">{displayValue} </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
