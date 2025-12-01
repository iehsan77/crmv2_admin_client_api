"use client";
import { formatDate } from "@/lib/formatDate";

export default function CarRentStats({ data }) {
  const dataDisplay = {
    vehiclePurchasePrice: `${data?.purchase_price || 0} AED`,
    vehiclePurchaseDate: formatDate(data?.purchase_date) || "",
    fitnessRenewalDate: formatDate(data?.fitness_renewal_date) || "",
  };

  return (
    <div className="mt-6">
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Vehicle Details & Value Fluctuation
      </h3>
      <div className="flex gap-4 flex-wrap">
        {Object.entries(dataDisplay).map(([key, value]) => (
          <div key={key} className="mr-8">
            <p className="text-sm text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </p>
            <p className="font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}