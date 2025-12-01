"use client";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import NumberInput from "@/components/FormFields/NumberInput";
import { useEffect } from "react";

import { PAYMENT_METHODS } from "@/constants/rentify_constants";

const PaymentInfoForm = ({
  watch,
  errors,
  handleChange,
  register,
  clearErrors,
  setValue,
}) => {
  const rentPrice = watch("rent_price");
  const securityDeposit = watch("security_deposit");
  const noOfDays = watch("number_of_days");
  const totalRentAmount = watch("total_rent_amount");

  useEffect(() => {
    if (rentPrice && noOfDays) {
      const rentTotal = parseFloat(rentPrice || 0) * parseFloat(noOfDays || 0);
      const deposit = parseFloat(securityDeposit || 0);

      const finalAmount = rentTotal + deposit;

      if (finalAmount !== totalRentAmount) {
        setValue("total_rent_amount", String(finalAmount), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else if (securityDeposit) {
      if (parseFloat(securityDeposit) !== totalRentAmount) {
        setValue("total_rent_amount", String(parseFloat(securityDeposit)), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else {
      if (totalRentAmount) {
        setValue("total_rent_amount", "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [rentPrice, noOfDays, securityDeposit, setValue, totalRentAmount]);

  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Payment Info
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-8">
        <NumberInput
          label="Car Rent Price"
          
          {...register("rent_price")}
          value={watch("rent_price")}
          error={errors.rent_price?.message}
        />
        <NumberInput
          label="Number of Days"
          
          {...register("number_of_days")}
          value={watch("number_of_days")}
          error={errors.number_of_days?.message}
          disabled
        />
        <NumberInput
          label="Security Deposit"
          
          {...register("security_deposit")}
          value={watch("security_deposit")}
          error={errors.security_deposit?.message}
        />
        <SingleSelectInput
          label="Payment Method"
          options={PAYMENT_METHODS}
          value={watch("payment_method_id")}
          onChange={(option) => handleChange("payment_method_id", option)}
          error={errors.payment_method_id?.message}
          clearError={() => clearErrors("payment_method_id")}
        />
        <SingleSelectInput
          label="Payment Status"
          options={[
            { label: "Pending", value: "1" },
            { label: "Completed", value: "2" },
            { label: "Failed", value: "3" },
          ]}
          value={watch("payment_status_id")}
          onChange={(option) => handleChange("payment_status_id", option)}
          error={errors.payment_status_id?.message}
          clearError={() => clearErrors("payment_status_id")}
        />
        <NumberInput
          label="Total Rent Amount"
          
          {...register("total_rent_amount")}
          value={watch("total_rent_amount")}
          error={errors.total_rent_amount?.message}
          disabled
        />
      </div>
    </>
  );
};

export default PaymentInfoForm;
