"use client";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider as Form } from "react-hook-form";
import { z } from "zod";

import TextInput from "@/components/FormFields/TextInput";
import NumberInput from "@/components/FormFields/NumberInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import Button from "@/components/Button";

import { PAYMENT_METHODS, REFUND_REASONS } from "@/constants/rentify_constants";

import { useDrawer } from "@/context/drawer-context";

import toast from "react-hot-toast";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";

import useBookingsStore from "@/stores/rentify/useBookingsStore";

export default function PaymentReturnForm({ record }) {
  console.log("record 20");
  console.log(record);

  const { hideDrawer } = useDrawer();
const { fetchBookings } = useBookingsStore();
  /*
booking_id
refund_reason_id
refund_amount
refund_method_id

bank_name
iban_number
account_name
agree_refund_policy
*/

  // ✅ Validation Schema
  const formSchema = z.object({
    booking_id: z.number().default(0),

    booking_date: z.string().min(1, { message: "Booking date is required" }),
    customer_name: z.string().min(1, { message: "Full name is required" }),
    customer_email: z
      .string()
      .email({ message: "Valid email required" })
      .min(1, { message: "Email is required" }),
    customer_phone: z.string().min(1, { message: "Phone number is required" }),

    refund_reason_id: z
      .string()
      .min(1, { message: "Refund reason is required" }),
    specify_reason: z.string().optional(),
    refund_amount: z.string().min(1, { message: "Refund amount is required" }),
    refund_method_id: z.string().min(1, { message: "Select a method" }),
    bank_name: z.string().optional(),
    iban_number: z.string().optional(),
    account_name: z.string().optional(),
    bank_verified: z.boolean().optional(),
    agree_refund_policy: z.boolean().refine((val) => val === true, {
      message: "You must agree to the refund policy",
    }),
  });

  // ✅ Default values
  const defaultValues = {
    booking_id: record?.id || 0,
    booking_date: record?.pickup_time || "",
    customer_name:
      (record?.customer_details &&
        record?.customer_details?.first_name +
          " " +
          record?.customer_details?.last_name) ||
      "",
    customer_email: record?.customer_details?.email || "",
    customer_phone: record?.customer_details?.contact || "",

    refund_reason_id: record?.refund_request_details?.refund_reason_id?.toString() || "0",
    specify_reason: record?.refund_request_details?.specify_reason?.toString() || "",
    refund_amount: record?.refund_request_details?.refund_amount?.toString() || "",
    refund_method_id: record?.refund_request_details?.refund_method_id?.toString() || "0",
    bank_name: record?.refund_request_details?.bank_name?.toString() || "",
    iban_number: record?.refund_request_details?.iban_number?.toString() || "",
    account_name: record?.refund_request_details?.account_name?.toString() || "",
    bank_verified: record?.bank_verified || false,
    agree_refund_policy: record?.agree_refund_policy || false,
  };

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      //console.log("formData 89"); console.log(formData); return false;

      const body = {
        ...formData,
        bank_verified: formData?.bank_verified ? 1 : 0,
        agree_refund_policy: formData?.agree_refund_policy ? 1 : 0,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.payments?.refundRequest,
        body
      );

      console.log("response 118")
      console.log(response)

      if (response?.status === 200) {
        await fetchBookings();  
        hideDrawer();
        toast.success("Refund request submitted!");
      } else {
        toast.error(
          response?.message || "Sorry! there is problem in submitting request"
        );
      }
    } catch (error) {
      console.error("Error submitting refund:", error);
      toast.error("Something went wrong");
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
        {/* Booking Details */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-4 font-medium">
            Booking Details
          </div>
          <DatePickerInput
            label="Date & Time of Booking"
            value={watch("booking_date")}
            {...register("booking_date")}
            onChange={(val) => handleChange("booking_date", val)}
            error={errors.booking_date?.message}
          />
        </div>

        {/* Personal Details */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-4 font-medium">
            Personal Details
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <TextInput
              label="Customer Full Name"
              value={watch("customer_name")}
              error={errors.customer_name?.message}
              {...register("customer_name")}
            />
            <TextInput
              label="Contact Email"
              type="email"
              value={watch("customer_email")}
              error={errors.customer_email?.message}
              {...register("customer_email")}
            />
            <TextInput
              label="Contact Phone"
              value={watch("customer_phone")}
              error={errors.customer_phone?.message}
              {...register("customer_phone")}
            />
          </div>
        </div>

        {/* Refund Request Details */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-4 font-medium">
            Refund Request Details
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <SingleSelectInput
              label="Refund Reason"
              options={REFUND_REASONS}
              value={watch("refund_reason_id")}
              {...register("refund_reason_id")}
              onChange={(val) => handleChange("refund_reason_id", val)}
              error={errors.refund_reason_id?.message}
            />
            {watch("refund_reason_id") === "other" && (
              <TextInput
                label="Specify Reason"
                value={watch("specify_reason")}
                error={errors.specify_reason?.message}
                {...register("specify_reason")}
              />
            )}
            <NumberInput
              label="Refund Amount Requested"
              error={errors.refund_amount?.message}
              {...register("refund_amount")}
              value={watch("refund_amount")}
            />
            <SingleSelectInput
              label="Preferred Refund Method"
              options={PAYMENT_METHODS}
              value={watch("refund_method_id")}
              {...register("refund_method_id")}
              onChange={(val) => handleChange("refund_method_id", val)}
              error={errors.refund_method_id?.message}
            />
          </div>
        </div>

        {/* Bank Details */}
        {watch("refund_method_id") === "bank" && (
          <div>
            <div className="text-primary underline underline-offset-3 text-base mb-4 font-medium">
              Bank Details
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <TextInput
                label="Bank Name"
                value={watch("bank_name")}
                error={errors.bank_name?.message}
                {...register("bank_name")}
              />
              <TextInput
                label="IBAN Number"
                value={watch("iban_number")}
                error={errors.iban_number?.message}
                {...register("iban_number")}
                maxLength={35}
              />
              <TextInput
                label="Account Name"
                value={watch("account_name")}
                error={errors.account_name?.message}
                {...register("account_name")}
              />
              <CheckboxInput
                title="Bank Details Verified"
                checked={watch("bank_verified")}
                {...register("bank_verified")}
              />
            </div>
          </div>
        )}

        {/* Agreement */}
        <CheckboxInput
          title="I agree to the Refund Policy"
          checked={watch("agree_refund_policy")}
          {...register("agree_refund_policy")}
          error={errors.agree_refund_policy?.message}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={hideDrawer}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Refund Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
