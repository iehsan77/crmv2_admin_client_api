"use client";
import { useForm, FormProvider as Form } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@iconify/react";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import { useDrawer } from "@/context/drawer-context";
import TabManager from "@/components/TabManager";
import { POST } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import toast from "react-hot-toast";
import { handleResponse } from "@/helper/ClientSideActions";

import useBookingsStore from "@/stores/rentify/useBookingsStore";

const formSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  card_no: z.string().min(16, "Invalid card number"),
  vaid_date: z.string().min(5, "Invalid vaid_date"),
  cvc: z.string().min(3, "Invalid CVC"),
  sreet_address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  zip_code: z.string().min(1, "Required"),
  payment_purpose: z.string().optional(),
  amount: z.string().min(1, { message: "required" }),
  confirm: z.boolean().refine((val) => val === true, {
    message: "You must confirm",
  }),
});

export default function CardPaymentForm({ record }) {
  const { hideDrawer } = useDrawer();

  const { fetchBookings } = useBookingsStore();

  const defaultValues = {
    first_name: record?.first_name || "",
    last_name: record?.last_name || "",
    card_no: "",
    vaid_date: "",
    cvc: "",
    sreet_address: "",
    city: "",
    country: "",
    zip_code: "",
    payment_purpose: record?.payment_purpose || "security",
    amount: record?.security_deposit || "", // default security
    confirm: false,
  };

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        id: record?.id || 0,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.payments?.save,
        body
      );
      hideDrawer();

      if (response?.status === 200) {
        toast.success("Record Saved");
        await fetchBookings();  
        
        //reset();

        // if (record && record?.id) {
        //   updatePayment(response?.data || formData);
        // } else {
        //   savePayment(response?.data || formData);
        // }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        {/* Tabs */}
        <TabManager
          availableTabs={null}
          initialTabs={[
            { key: "security", label: "Rental Security Deposit" },
            { key: "rental", label: "Rental Fee" },
          ]}
          initialActive={watch("payment_purpose")}
          allowClose={false}
          showAddView={false}
          onTabChange={(e) => {
            handleChange("payment_purpose", e);
            if (e === "security") {
              setValue("amount", record?.security_deposit || "");
            } else if (e === "rental") {
              setValue("amount", record?.rent_price || "");
            }
          }}
        />

        {/* Payment Methods */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
            Select Payment Method
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: "logos:visa", label: "Visa" },
              { icon: "logos:mastercard", label: "MasterCard" },
              { icon: "logos:american-express", label: "Amex" },
              { icon: "logos:paypal", label: "PayPal" },
              { icon: "logos:apple-pay", label: "Apple Pay" },
              { icon: "logos:google-pay", label: "Google Pay" },
              { icon: "logos:stripe", label: "Stripe" },
            ].map((m, i) => (
              <label key={i} className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="payment_method" className="" />
                <div className="border rounded-md p-2 w-12 h-10 flex items-center justify-center">
                  <Icon icon={m.icon} width={25} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Credit Card Details */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
            Credit Card Detail
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-8">
            <TextInput
              label="First Name"
              value={watch("first_name")}
              {...register("first_name")}
              error={errors.first_name?.message}
            />
            <TextInput
              label="Last Name"
              value={watch("last_name")}
              {...register("last_name")}
              error={errors.last_name?.message}
            />
            <TextInput
              label="Card Number"
              value={watch("card_no")}
              {...register("card_no")}
              error={errors.card_no?.message}
            />
            <TextInput
              label="Expiry (MM/YY)"
              value={watch("vaid_date")}
              {...register("vaid_date")}
              error={errors.vaid_date?.message}
            />
            <TextInput
              label="CVC"
              value={watch("cvc")}
              {...register("cvc")}
              error={errors.cvc?.message}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
            Billing Address
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-8">
            <TextInput
              label="Street Address"
              value={watch("sreet_address")}
              {...register("sreet_address")}
              error={errors.sreet_address?.message}
            />
            <TextInput
              label="City"
              value={watch("city")}
              {...register("city")}
              error={errors.city?.message}
            />
            <TextInput
              label="Country"
              value={watch("country")}
              {...register("country")}
              error={errors.country?.message}
            />
            <TextInput
              label="Postal/ZIP Code"
              value={watch("zip_code")}
              {...register("zip_code")}
              error={errors.zip_code?.message}
            />
          </div>
        </div>

        {/* Confirmation */}
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("confirm")} />
          <span className="text-sm">
            By providing your card information, you allow us to charge your card
            for future payments in accordance with their terms.
          </span>
        </div>
        {errors.confirm && (
          <p className="text-red-500 text-sm">{errors.confirm.message}</p>
        )}

        {/* Price Summary */}
        <div className="space-y-1 text-right">
          <p>
            Price: <span className="font-medium">{watch("amount")} AED</span>
          </p>
          {/* <p>Discount: <span className="font-medium text-red-500">-25 AED</span></p> */}
          <p className="text-lg font-semibold">
            Total Price: {watch("amount")} AED
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            type="button"
            className="bg-transparent"
            onClick={() => hideDrawer()}
          >
            Cancel
          </Button>
          <Button size="lg" type="submit" disabled={isSubmitting}>
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  );
}
