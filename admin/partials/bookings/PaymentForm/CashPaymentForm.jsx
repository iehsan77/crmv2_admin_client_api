"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm, FormProvider as Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, XCircle } from "lucide-react";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";
import { useDrawer } from "@/context/drawer-context";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import TabManager from "@/components/TabManager";

import useBookingsStore from "@/stores/rentify/useBookingsStore";

export default function CashPaymentForm({ record }) {
  const { hideDrawer } = useDrawer();
  const [status, setStatus] = useState(null); // null | "success" | "error"

  const { fetchBookings } = useBookingsStore();

  // ✅ Schema
  const formSchema = z
    .object({
      booking_id: z.number().default(0),
      customer_id: z.string().min(1, { message: "required" }),
      amount: z.string().min(1, { message: "required" }),
      payment_date: z.string().min(1, { message: "required" }),
      transaction_id: z.string().min(1, { message: "required" }),
      terminal_id: z.string().min(1, { message: "required" }),
      receipt_no: z.string().min(1, { message: "required" }),
      payment_note: z.string().optional(),
      customer_note: z.string().optional(),
      receipt_image: z.union([z.string(), z.instanceof(File)]).optional(),
      old_receipt_image: z.string().optional(),
      payment_purpose: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const { old_receipt_image, receipt_image } = data;
      const isOldEmpty = !old_receipt_image?.trim();
      const isNewEmpty =
        !(receipt_image instanceof File) &&
        (typeof receipt_image !== "string" || !receipt_image?.trim());

      if (isOldEmpty && isNewEmpty) {
        ctx.addIssue({
          code: "custom",
          path: ["receipt_image"],
          message: "Receipt image is required",
        });
      }
    });

  // ✅ Default values
  const defaultValues = {
    booking_id: record?.id || 0,
    customer_id: record?.customer_id?.toString() || "",
    amount: record?.security_deposit?.toString() || "", // default security
    payment_date: record?.payment_date || new Date().toISOString(),
    transaction_id: record?.transaction_id || "",
    terminal_id: record?.terminal_id || "",
    receipt_no: record?.receipt_no || "",
    payment_note: record?.payment_note || "",
    customer_note: record?.customer_note || "",
    receipt_image: "",
    old_receipt_image: record?.receipt_image || "",
    payment_purpose: "security_deposit", // default tab
  };

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    clearErrors,
    formState: { isSubmitting, errors },
  } = methods;

  // ✅ Submit
  const onSubmit = async (formData) => {
    //console.log("formData 87"); console.log(formData); return false;

    try {
      const response = await POST(
        rentify_endpoints?.rentify?.payments?.save,
        formData
      );

      if (response?.status === 200) {
        await fetchBookings();
        setStatus("success");
        reset();
      } else {
        setStatus("error");
        handleResponse(response);
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        <TabManager
          availableTabs={null}
          initialTabs={[
            { key: "security_deposit", label: "Rental Security Deposit" },
            { key: "rental", label: "Rental Fee" },
          ]}
          initialActive={watch("payment_purpose")}
          allowClose={false}
          showAddView={false}
          onTabChange={(e) => {
            handleChange("payment_purpose", e);
            if (e === "security_deposit") {
              setValue("amount", record?.security_deposit?.toString() || "");
              setStatus(null);
            } else if (e === "rental") {
              setValue("amount", record?.rent_price?.toString() || "");
              setStatus(null);
            }
          }}
        />

        {/* Receipt Upload */}
        <div>
          <div className="text-base mb-2 font-medium">Receipt Image</div>
          <SingleUpload2
            name="receipt_image"
            accept={{
              "image/jpeg": [".jpeg", ".jpg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            value={
              record?.receipt_image
                ? watch("old_receipt_image")
                : watch("receipt_image")
            }
            onChange={(val) => handleChange("receipt_image", val)}
            onRemove={(val) => handleChange("old_receipt_image", val)}
            setError={setError}
            error={errors?.receipt_image?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-8">
          <TextInput
            label="Customer ID"
            value={watch("customer_id")}
            error={errors.customer_id?.message}
            {...register("customer_id")}
          />
          <TextInput
            label="Amount"
            value={watch("amount")}
            error={errors.amount?.message}
            {...register("amount")}
          />
          <DateTimePickerInput
            label="Payment Date"
            value={watch("payment_date")}
            onChange={(val) => handleChange("payment_date", val)}
            error={errors.payment_date?.message}
            clearError={() => clearErrors("payment_date")}
          />
          <TextInput
            label="Transaction ID"
            value={watch("transaction_id")}
            error={errors.transaction_id?.message}
            {...register("transaction_id")}
          />
          <TextInput
            label="Terminal ID"
            value={watch("terminal_id")}
            error={errors.terminal_id?.message}
            {...register("terminal_id")}
          />
          <TextInput
            label="Receipt No"
            value={watch("receipt_no")}
            error={errors.receipt_no?.message}
            {...register("receipt_no")}
          />
          <TextInput
            label="Payment Note"
            value={watch("payment_note")}
            error={errors.payment_note?.message}
            {...register("payment_note")}
          />
          <TextInput
            label="Customer Note"
            value={watch("customer_note")}
            error={errors.customer_note?.message}
            {...register("customer_note")}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          {status === null ? (
            <>
              <Button
                variant="outline"
                size="lg"
                type="button"
                className="bg-transparent"
                onClick={hideDrawer}
              >
                Cancel
              </Button>
              <Button size="lg" type="submit" disabled={isSubmitting}>
                Save
              </Button>
            </>
          ) : (
            status === "success" && (
              <Button
                variant="outline"
                size="lg"
                type="button"
                className="bg-transparent"
                onClick={hideDrawer}
              >
                Close
              </Button>
            )
          )}
        </div>

        {/* ✅ Status Message */}
        {status && (
          <div
            className={`mt-6 p-4 rounded-lg flex items-start gap-3 border ${
              status === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mt-1" />
            )}
            <div>
              <h3 className="font-semibold">
                {status === "success"
                  ? "Payment Successful"
                  : "Payment Unsuccessful"}
              </h3>
              <p className="text-sm">
                {status === "success"
                  ? "Your transaction has been made successfully."
                  : "Your transaction has been rejected."}
              </p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
