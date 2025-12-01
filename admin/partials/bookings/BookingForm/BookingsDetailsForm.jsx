"use client";
import TextInput from "@/components/FormFields/TextInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";
import { useEffect } from "react";
// import getNumberOfDays from "@/helper/getNumberOfDays";

const BookingsDetailsForm = ({
  watch,
  errors,
  handleChange,
  clearErrors,
  register,
  setValue,
  setError,
}) => {
  const pickupTime = watch("pickup_time");
  const returnTime = watch("return_time");

  // Real-time validation for dates
  useEffect(() => {
    if (pickupTime && returnTime) {
      const pickup = new Date(pickupTime);
      const returnD = new Date(returnTime);
      const current = new Date();

      // Clear previous errors
      clearErrors("pickup_time");
      clearErrors("return_time");

      // Validate pickup time
      if (pickup <= current) {
        setError("pickup_time", {
          type: "manual",
          message: "Pickup time must be greater than current date/time",
        });
      }

      // Validate return time
      if (returnD <= pickup) {
        setError("return_time", {
          type: "manual",
          message: "Return time must be greater than pickup time",
        });
      }
    }
  }, [pickupTime, returnTime, setError, clearErrors]);

  // Number of days calculate karne ka function
  useEffect(() => {
    if (pickupTime && returnTime) {
      const getNumberOfDays = (startDateISO, endDateISO) => {
        const start = new Date(startDateISO);
        const end = new Date(endDateISO);

        if (end <= start) {
          return "1";
        }

        const startDate = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );
        const endDate = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );

        const diffInMs = endDate.getTime() - startDate.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        return Math.max(1, diffInDays).toString();
      };

      const days = getNumberOfDays(pickupTime, returnTime);
      setValue("number_of_days", days, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [pickupTime, returnTime, setValue]);

  // useEffect(() => {
  //   if (pickupTime && returnTime) {
  //     setValue(
  //       "number_of_days",
  //       String(getNumberOfDays(pickupTime, returnTime))
  //     );
  //   }
  // }, [pickupTime, returnTime]);

  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Booking Details
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-8">
        <DateTimePickerInput
          label="Pickup Time"
          value={watch("pickup_time")}
          onChange={(option) => handleChange("pickup_time", option)}
          error={errors.pickup_time?.message}
          clearError={() => clearErrors("pickup_time")}
          minDateTime={new Date().toISOString()}
        />
        <DateTimePickerInput
          label="Return Time"
          value={watch("return_time")}
          onChange={(option) => handleChange("return_time", option)}
          error={errors.return_time?.message}
          clearError={() => clearErrors("return_time")}
          minDateTime={watch("pickup_time") || new Date().toISOString()}
        />
        <TextInput
          label="Pickup Location"
          value={watch("pickup_location")}
          {...register("pickup_location")}
          error={errors.pickup_location?.message}
        />
        <TextInput
          label="Dropoff Location"
          value={watch("dropoff_location")}
          {...register("dropoff_location")}
          error={errors.dropoff_location?.message}
        />
      </div>
    </>
  );
};

export default BookingsDetailsForm;
