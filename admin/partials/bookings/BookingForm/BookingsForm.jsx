"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormProvider as Form } from "react-hook-form";
import Button from "@/components/Button";
import { useCallback, useEffect, useMemo, useState } from "react";
import TabManager from "@/components/TabManager";
import CompanyBookingForm from "./BookingsCompanyForm";
import IndividualBookingForm from "./BookingsIndividualForm";
import VehicleSelectionForm from "./BookingsVehicleSelectionForm";
import BookingsDetailsForm from "./BookingsDetailsForm";
import PaymentInfoForm from "./BookingsPaymentInfoForm";
import DeliveryForm from "./BookingsDeliveryForm";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import ReturnForm from "./BookingsReturnForm";
import VehicleBookingInfoCard from "./BookingsVehicleInfoCard";

import CashPaymentForm from "@/partials/bookings/PaymentForm/CashPaymentForm";
import CardPaymentForm from "@/partials/bookings/PaymentForm/CardPaymentForm";

import { POST } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { useDrawer } from "@/context/drawer-context";
import toast from "react-hot-toast";
import { handleResponse } from "@/helper/ClientSideActions";

import useBookingsStore, {
  useBookingsViewTabsStore,
  useBookingsStatisticsStore,
  useBookingsFiltersStore,
} from "@/stores/rentify/useBookingsStore";
import useAffiliateStore from "@/stores/rentify/affiliates/useAffiliateStore";

// ✅ Reusable helper
const conditionalFile = (fileKey, oldFileKey, message) => (data, ctx) => {
  const fileVal = data?.[fileKey];
  const oldFileVal = data?.[oldFileKey];

  // Case 1: Agar purana file ek URL hai
  if (typeof oldFileVal === "string" && oldFileVal.trim() !== "") {
    return; // optional
  }

  // Case 2: Purana file empty → naya file required
  const isValidFile =
    fileVal instanceof File ||
    (Array.isArray(fileVal) &&
      fileVal.length > 0 &&
      fileVal[0] instanceof File);

  if (!isValidFile) {
    ctx.addIssue({
      path: [fileKey], // make sure this matches field name
      code: "custom",
      message,
    });
  }
};

// Helper function for file validation
const validateFile = (message = "File is required") =>
  z.any().refine((file) => {
    // If it's a string (URL from existing data), it's valid
    if (typeof file === "string" && file.length > 0) return true;
    // If it's a File object, check if it exists
    if (file instanceof File) return true;
    // Otherwise, it's invalid
    return false;
  }, message);

// Helper function for date validation that accepts both Date objects and ISO strings
const validateDate = (message = "Date is required") =>
  z
    .union([
      z.string().refine((val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, message),
      z.date(),
    ])
    .transform((value) => {
      // Always return ISO string format
      if (value instanceof Date) return value.toISOString();
      return value;
    });

// Custom validation functions
const validatePickupTime = (data, ctx) => {
  const pickupTime = new Date(data.pickup_time);
  const currentTime = new Date();

  // Agar pickup time current time se pehle hai
  if (pickupTime <= currentTime) {
    ctx.addIssue({
      path: ["pickup_time"],
      code: "custom",
      message: "Pickup time must be greater than current date/time",
    });
  }
};

const validateReturnTime = (data, ctx) => {
  const pickupTime = new Date(data.pickup_time);
  const returnTime = new Date(data.return_time);

  // Agar return time pickup time se pehle hai
  if (returnTime <= pickupTime) {
    ctx.addIssue({
      path: ["return_time"],
      code: "custom",
      message: "Return time must be greater than pickup time",
    });
  }
};

export default function BookingsForm({
  record,
  delivery = false,
  returned = false,
  affiliateId = 0,
}) {
  const { fetchBookingHistory } = useAffiliateStore();
  const { fetchBookings } = useBookingsStore();
  const { activeTab } = useBookingsViewTabsStore();

  const { fetchBookingsStatistics } = useBookingsStatisticsStore();

  // Base schema with common fields
  const baseSchema = z.object({
    id: z.number().default(0),
    vehicle_id: z.string().min(1, { message: "Vehicle selection is required" }),
    vehicle_registration_no: z
      .string()
      .min(1, { message: "Vehicle registration number is required" }),
    number_plate: z
      .string()
      .min(1, { message: "Vehicle number plate is required" }),
    exterior_color_id: z
      .string()
      .min(1, { message: "Exterior color is required" }),
    interior_color_id: z
      .string()
      .min(1, { message: "Interior color is required" }),
    fuel_type_id: z.string().min(1, { message: "Fuel type is required" }),
    fuel_level_id: z.string().min(1, { message: "Fuel level is required" }),
    exterior_condition_id: z
      .string()
      .min(1, { message: "Exterior condition is required" }),
    interior_condition_id: z
      .string()
      .min(1, { message: "Interior condition is required" }),
    tyre_condition_id: z
      .string()
      .min(1, { message: "Tyre condition is required" }),
    spare_tyre: z.string().min(1, { message: "Spare tyre status is required" }),
    toolkit: z.string().min(1, { message: "Toolkit status is required" }),
    mileage_at_pickup: z
      .string()
      .min(1, { message: "Mileage at pickup is required" }),
    mileage_limit: z.string().min(1, { message: "Mileage limit is required" }),
    pickup_time: validateDate("Pick up time is required"),
    return_time: validateDate("Return time is required"),
    pickup_location: z
      .string()
      .min(1, { message: "Pick up location is required" }),
    dropoff_location: z
      .string()
      .min(1, { message: "Drop off location is required" }),
    rent_price: z.string().min(1, { message: "Rent price is required" }),
    number_of_days: z
      .string()
      .min(1, { message: "Number of days is required" }),
    security_deposit: z
      .string()
      .min(1, { message: "Security deposit is required" }),
    payment_method_id: z
      .string()
      .min(1, { message: "Payment method is required" }),
    payment_status_id: z
      .string()
      .min(1, { message: "Payment status is required" }),
    total_rent_amount: z
      .string()
      .min(1, { message: "Total rent amount is required" }),

    confirm_booking: z.boolean().refine((val) => val === true, {
      message: "You must confirm the booking.",
    }),
  });
  // Company-specific schema
  const companySchema = baseSchema.extend({
    is_company: z.number().default(1),
    //company_id: z.number().optional(),
    customer_id: z.number().optional(),
    company_name: z.string().min(1, { message: "Company name is required" }),
    contact_person: z
      .string()
      .min(1, { message: "Contact person is required" }),
    contact: z.string().min(1, { message: "Contact number is required" }),
    email: z.string().email("Valid email address is required"),
    address1: z.string().min(1, { message: "Address is required" }),
    address2: z.string().optional(),
    postal_code: z.string().optional(),

    // ✅ Trade License
    // trade_license: record
    //   ? z.array(z.any())
    //   : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    trade_license: z.array(z.any().optional()).optional(),
    old_trade_license: z.array(z.any().optional()).optional(),

    trade_license_no: z
      .string()
      .min(1, { message: "Trade license number is required" }),
    trade_license_expiry: validateDate("Trade license expiry date is required"),

    // ✅ Owner Document
    owner_document: record
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    owner_document: z.array(z.any().optional()).optional(),
    old_owner_document: z.array(z.any().optional()).optional(),

    contact_cnic: z.string().min(1, { message: "Contact CNIC is required" }),
    contact_cnic_expiry: validateDate("Contact CNIC expiry date is required"),
    nationality_id: z.string().min(1, { message: "Nationality is required" }),
    country_id: z.number().min(1, { message: "Country is required" }),
  });

  // Individual-specific schema
  const individualSchema = baseSchema.extend({
    is_company: z.number().default(0),
    customer_id: z.number().optional(),
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    contact: z.string().min(1, { message: "Contact number is required" }),
    email: z.string().email("Valid email address is required"),
    address1: z.string().min(1, { message: "Address is required" }),
    address2: z.string().optional(),
    postal_code: z.string().optional(),

    // ✅ Driving License
    // driving_license: record
    //   ? z.array(z.any())
    //   : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    driving_license: z.array(z.any().optional()).optional(),
    old_driving_license: z.array(z.any().optional()).optional(),

    driving_license_no: z
      .string()
      .min(1, { message: "Driving license number is required" }),
    driving_license_expiry: validateDate(
      "Driving license expiry date is required"
    ),

    // ✅ Registration Document
    // registration_document: record
    //   ? z.array(z.any())
    //   : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    registration_document: z.array(z.any().optional()).optional(),
    old_registration_document: z.array(z.any().optional()).optional(),

    passport_id: z.string().min(1, { message: "Passport id is required" }),
    passport_expiry: validateDate(),
    visa_no: z.string().min(1, { message: "Visa number is required" }),
    visa_expiry: validateDate(),
    nationality_id: z.string().min(1, { message: "Nationality is required" }),
  });

  const deliverySchema = z.object({
    confirm_booking: z.boolean().default(true),
    delivery_handover_by: z
      .string()
      .min(1, { message: "Handover by is required" }),
    vehicle_delivery_images: record
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    old_vehicle_delivery_images: z.array(z.any().optional()),

    delivery_received_by: z
      .string()
      .min(1, { message: "Received by customer is required" }),
    confirm_booking_delivery: z.boolean().refine((val) => val === true, {
      message: "You must confirm the delivery",
    }),
  });

  const returnSchema = z.object({
    confirm_booking: z.boolean().default(true),
    return_received_by: z
      .string()
      .min(1, { message: "Received by is required" }),
    vehicle_return_images: record
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "Please upload at least one" }),
    old_vehicle_return_images: z.array(z.any().optional()),

    return_received_from: z
      .string()
      .min(1, { message: "Received from is required" }),
    confirm_booking_return: z.boolean().refine((val) => val === true, {
      message: "You must confirm the return",
    }),
  });

  // 🔹 Company rules
  const companyRules = (data, ctx) => {
    const hasNewTL =
      Array.isArray(data.trade_license) && data.trade_license.length > 0;
    const hasOldTL =
      Array.isArray(data.old_trade_license) &&
      data.old_trade_license.length > 0;

    if (!hasNewTL && !hasOldTL) {
      ctx.addIssue({
        path: ["trade_license"],
        code: z.ZodIssueCode.custom,
        message: "Trade license is required",
      });
    }

    const hasNewOD =
      Array.isArray(data.owner_document) && data.owner_document.length > 0;
    const hasOldOD =
      Array.isArray(data.old_owner_document) &&
      data.old_owner_document.length > 0;

    if (!hasNewOD && !hasOldOD) {
      ctx.addIssue({
        path: ["owner_document"],
        code: z.ZodIssueCode.custom,
        message: "Owner document is required",
      });
    }
  };

  // 🔹 Individual rules
  const individualRules = (data, ctx) => {
    const hasNewDL =
      Array.isArray(data.driving_license) && data.driving_license.length > 0;
    const hasOldDL =
      Array.isArray(data.old_driving_license) &&
      data.old_driving_license.length > 0;

    if (!hasNewDL && !hasOldDL) {
      ctx.addIssue({
        path: ["driving_license"],
        code: z.ZodIssueCode.custom,
        message: "Driving license images are required",
      });
    }

    const hasNewRD =
      Array.isArray(data.registration_document) &&
      data.registration_document.length > 0;
    const hasOldRD =
      Array.isArray(data.old_registration_document) &&
      data.old_registration_document.length > 0;

    if (!hasNewRD && !hasOldRD) {
      ctx.addIssue({
        path: ["registration_document"],
        code: z.ZodIssueCode.custom,
        message: "Registration document is required",
      });
    }
  };

  // 🔹 Delivery rules
  const deliveryRules = (data, ctx) => {
    if (
      !data.vehicle_delivery_images ||
      (Array.isArray(data.vehicle_delivery_images) &&
        data.vehicle_delivery_images.length === 0)
    ) {
      ctx.addIssue({
        path: ["vehicle_delivery_images"],
        code: "custom",
        message: "Vehicle images are required",
      });
    }
  };

  // 🔹 Return rules
  const returnRules = (data, ctx) => {
    if (
      !data.vehicle_return_images ||
      (Array.isArray(data.vehicle_return_images) &&
        data.vehicle_return_images.length === 0)
    ) {
      ctx.addIssue({
        path: ["vehicle_return_images"],
        code: "custom",
        message: "Vehicle images are required",
      });
    }
  };

  const [isCompany, setIsCompany] = useState(
    record?.customer_details?.is_company === 1 ? "1" : "0"
  );
  // const [isCompany, setIsCompany] = useState("0");
  //const [isCompany, setIsCompany] = useState(Number(record?.is_company) ?? 0);

  const { saveBooking, updateBooking } = useBookingsStore();

  const { hideDrawer, showDrawer } = useDrawer();

  // ✅ Dynamic schema using useMemo
  const formSchema = useMemo(() => {
    let schema;

    // 1. Base schema (company / individual)
    if (isCompany === "1") {
      schema = companySchema;
    } else {
      schema = individualSchema;
    }

    // 2. Extend with delivery OR returned shapes
    if (delivery) {
      schema = schema.extend(deliverySchema.shape);
    }

    if (returned) {
      schema = schema.extend(returnSchema.shape);
    }

    // 3. Final superRefine (add rules conditionally)
    schema = schema.superRefine((data, ctx) => {
      validatePickupTime(data, ctx);
      validateReturnTime(data, ctx);
      if (isCompany === "1") {
        companyRules(data, ctx);
      } else {
        individualRules(data, ctx);
      }

      if (delivery) {
        deliveryRules(data, ctx);
      }

      if (returned) {
        returnRules(data, ctx);
      }
    });

    return schema;
  }, [isCompany, delivery, returned]);

  // ✅ Utility function for safe array checking
  const getSafeArray = (value, defaultValue = []) => {
    return Array.isArray(value) && value.length > 0 ? value : defaultValue;
  };

  const defaultValues = {
    id: record?.id || 0,
    is_company: record?.customer_details?.is_company || 0,

    // Company fields
    // company_id: record?.customer_details?.id || 0,
    company_name: record?.customer_details?.company_name || "",
    contact_person: record?.customer_details?.contact_person || "",
    trade_license: [],
    old_trade_license: getSafeArray(record?.customer_details?.trade_license),
    trade_license_no: record?.customer_details?.trade_license_no || "",
    trade_license_expiry: record?.customer_details?.trade_license_expiry || "",
    owner_document: [],
    old_owner_document: getSafeArray(record?.customer_details?.owner_document),
    contact_cnic: record?.customer_details?.contact_cnic || "",
    contact_cnic_expiry: record?.customer_details?.contact_cnic_expiry || "",
    country_id: record?.customer_details?.country_id || 0,

    // Individual fields
    first_name: record?.customer_details?.first_name || "",
    last_name: record?.customer_details?.last_name || "",
    driving_license: [],
    old_driving_license: getSafeArray(
      record?.customer_details?.driving_license
    ),
    driving_license_no: record?.customer_details?.driving_license_no || "",
    driving_license_expiry:
      record?.customer_details?.driving_license_expiry || "",
    registration_document: [],
    old_registration_document: getSafeArray(
      record?.customer_details?.registration_document
    ),
    passport_id: record?.customer_details?.passport_id || "",
    passport_expiry: record?.customer_details?.passport_expiry || "",
    visa_no: record?.customer_details?.visa_no || "",
    visa_expiry: record?.customer_details?.visa_expiry || "",

    // Common fields
    customer_id: record?.customer_details?.id || 0,
    contact: record?.customer_details?.contact || "",
    email: record?.customer_details?.email || "",
    address1: record?.customer_details?.address1 || "",
    address2: record?.customer_details?.address2 || "",
    postal_code: record?.customer_details?.postal_code || "",
    nationality_id: record?.customer_details?.nationality_id?.toString() || "",
    vehicle_id: record?.vehicle_id?.toString() || "",
    vehicle_registration_no: record?.vehicle_details?.vehicle_uid || "",
    number_plate: record?.vehicle_details?.number_plate || "",
    exterior_color_id:
      record?.vehicle_details?.exterior_color_id?.toString() || "",
    interior_color_id:
      record?.vehicle_details?.interior_color_id?.toString() || "",
    fuel_type_id: record?.vehicle_details?.fuel_type_id?.toString() || "",
    fuel_level_id: record?.fuel_level_id?.toString() || "",
    exterior_condition_id: record?.exterior_condition_id?.toString() || "",
    interior_condition_id: record?.interior_condition_id?.toString() || "",
    tyre_condition_id: record?.tyre_condition_id?.toString() || "",
    spare_tyre: String(record?.spare_tyre) || "",
    toolkit: String(record?.toolkit) || "",
    mileage_at_pickup: record?.mileage_at_pickup?.toString() || "",
    mileage_limit: record?.mileage_limit?.toString() || "",
    pickup_time: record?.pickup_time || "",
    return_time: record?.return_time || "",
    pickup_location: record?.pickup_location || "",
    dropoff_location: record?.dropoff_location || "",
    rent_price: record?.rent_price?.toString() || "",
    number_of_days: record?.number_of_days || "",
    security_deposit: record?.security_deposit?.toString() || "",
    payment_method_id: record?.payment_method_id?.toString() || "1",
    payment_status_id: record?.payment_status_id?.toString() || "1",
    total_rent_amount: record?.total_rent_amount?.toString() || "",
    confirm_booking: record?.confirm_booking === 1 ? true : false,

    // Delivery fields
    delivery_handover_by: record?.delivery_handover_by || "",
    vehicle_delivery_images: [],
    old_vehicle_delivery_images: getSafeArray(
      record?.old_vehicle_delivery_images
    ),
    delivery_received_by: record?.delivery_received_by || "",
    confirm_booking_delivery:
      record?.confirm_booking_delivery === 1 ? true : false,

    // Return fields
    return_received_by: record?.return_received_by || "",
    vehicle_return_images: [],
    old_vehicle_return_images: getSafeArray(record?.old_vehicle_return_images),
    return_received_from: record?.return_received_from || "",
    confirm_booking_return: record?.confirm_booking_return === 1 ? true : false,
  };

  // ✅ Create a custom resolver that updates when schema changes
  const resolver = useCallback(
    async (data, context, options) => {
      return zodResolver(formSchema)(data, context, options);
    },
    [formSchema]
  );

  const methods = useForm({
    resolver,
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    setValue,
    setError,
    register,
    clearErrors,
    getValues,
    formState: { isSubmitting, errors },
  } = methods;

  const { getPayload } = useBookingsFiltersStore();

  const onSubmit = async (formData) => {
    //alert("submit")
    try {
      const {
        driving_license,
        registration_document,
        trade_license,
        owner_document,
        vehicle_delivery_images,
        vehicle_return_images,
        ...restFormData
      } = formData || {};
      const body = {
        ...restFormData,
        //is_company: isCompany,
        confirm_booking: formData?.confirm_booking ? 1 : 0,
        confirm_booking_delivery: formData?.confirm_booking_delivery ? 1 : 0,

        driving_license_qty: driving_license?.length || 0,
        registration_document_qty: registration_document?.length || 0,
        trade_license_qty: trade_license?.length || 0,
        owner_document_qty: owner_document?.length || 0,
        vehicle_delivery_images_qty: vehicle_delivery_images?.length || 0,
        vehicle_return_images_qty: vehicle_return_images?.length || 0,
        ...(driving_license || []).reduce((acc, img, index) => {
          acc[`driving_license_${index}`] = img;
          return acc;
        }, {}),
        ...(registration_document || []).reduce((acc, img, index) => {
          acc[`registration_document_${index}`] = img;
          return acc;
        }, {}),
        ...(trade_license || []).reduce((acc, img, index) => {
          acc[`trade_license_${index}`] = img;
          return acc;
        }, {}),
        ...(owner_document || []).reduce((acc, img, index) => {
          acc[`owner_document_${index}`] = img;
          return acc;
        }, {}),
        ...(vehicle_delivery_images || []).reduce((acc, img, index) => {
          acc[`vehicle_delivery_images_${index}`] = img;
          return acc;
        }, {}),
        ...(vehicle_return_images || []).reduce((acc, img, index) => {
          acc[`vehicle_return_images_${index}`] = img;
          return acc;
        }, {}),
      };

      /*
      if(formData?.delivery_handover_by!="" && formData?.delivery_received_by!=""){
        body.security_deposit_status_id=2
      }

deliverySave
returnSave

      */

      //console.log("body 628"); console.log(body); return false;
      let apiURL = rentify_endpoints?.rentify?.bookings?.save;

      // Return save has the highest priority

      console.log("formData 636");
      console.log(formData);

      if (formData?.return_received_by && formData?.return_received_from) {
        ///alert("return")

        apiURL = rentify_endpoints?.rentify?.bookings?.returnSave;
      }
      // Delivery save only if return case is NOT matched
      else if (
        formData?.delivery_handover_by &&
        formData?.delivery_received_by
      ) {
        //alert("deliverings")
        apiURL = rentify_endpoints?.rentify?.bookings?.deliverySave;
      }

      const response = await POST(apiURL, body);

      //console.log("response 626"); console.log(response); return false;

      if (response?.status === 200) {
        toast.success("Record Saved");
        await fetchBookings();        
        await fetchBookingsStatistics();

        if (affiliateId) {
          const body = {
            affiliate_id: affiliateId,
            view: "all_bookings",
            booking_id: "",
            booking_date: "",
            client_id: "",
            vehicle_id: "",
            rental_period: "",
            rent_per_day: "",
            payment_status_id: "",
            security_deposit: "",
            security_payment: "",
            booking_status_id: "",
          };
          fetchBookingHistory(body);
        }

        const methodId = Number(formData?.payment_method_id);

        if (formData?.id < 1) {
          if (methodId === 1) {
            showDrawer({
              title: "POS Payment",
              size: "xl",
              content: <CashPaymentForm record={response?.data} />,
            });
          } else if (methodId === 2) {
            showDrawer({
              title: "Payment",
              size: "xl",
              content: <CardPaymentForm record={response?.data} />,
            });
          } else {
            hideDrawer();
          }
        } else {
          hideDrawer();
        }

        /*
        hideDrawer();
        if (Number(formData?.payment_method_id) === 1) {
          showDrawer({
            title: "POS Payment",
            size: "xl",
            content: <CashPaymentForm record={response?.data} />,
          });
        }
        if (Number(formData?.payment_method_id) === 2) {
          showDrawer({
            title: "Payment",
            size: "xl",
            content: <CardPaymentForm record={response?.data} />,
          });
        }
        */
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  /*
  const handleTabChange = (key) => {
    const newIsCompany = key;
    setIsCompany(newIsCompany);
    methods.reset({
      ...methods.getValues(),
      is_company: newIsCompany === "1",
      //is_company: newIsCompany===1,
    });
  };
  */

  const handleTabChange = (key) => {
    const newIsCompany = key;
    setIsCompany(newIsCompany);
    methods.reset({
      ...methods.getValues(),
      is_company: Number(newIsCompany), // ✅ ensures number (0 or 1)
    });
  };

  return (
    <Form {...methods}>
      {record?.id && <VehicleBookingInfoCard record={record} />}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
        {!record?.id && (
          <TabManager
            availableTabs={null}
            initialTabs={[
              { key: "0", label: "Personal Booking" },
              { key: "1", label: "Company Booking" },
            ]}
            initialActive={isCompany}
            allowClose={false}
            showAddView={false}
            onTabChange={handleTabChange}
          />
        )}

        {isCompany === "1" ? (
          <CompanyBookingForm
            watch={watch}
            errors={errors}
            handleChange={handleChange}
            record={record}
            setError={setError}
            setValue={setValue}
            register={register}
            clearErrors={clearErrors}
            getValues={getValues}
          />
        ) : (
          <IndividualBookingForm
            watch={watch}
            errors={errors}
            handleChange={handleChange}
            record={record}
            setError={setError}
            setValue={setValue}
            register={register}
            clearErrors={clearErrors}
            getValues={getValues}
          />
        )}

        <VehicleSelectionForm
          watch={watch}
          errors={errors}
          handleChange={handleChange}
          record={record}
          register={register}
          setValue={setValue}
          clearErrors={clearErrors}
          getValues={getValues}
          setError={setError}
          affiliateId={affiliateId}
        />

        <BookingsDetailsForm
          watch={watch}
          errors={errors}
          handleChange={handleChange}
          record={record}
          register={register}
          setValue={setValue}
          clearErrors={clearErrors}
          setError={setError}
        />

        <PaymentInfoForm
          watch={watch}
          errors={errors}
          handleChange={handleChange}
          record={record}
          register={register}
          setValue={setValue}
          clearErrors={clearErrors}
          setError={setError}
        />

        {!delivery && !returned && (
          <>
            <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
              Confirmation
            </div>

            <CheckboxInput
              title="Confirm Booking"
              checked={watch("confirm_booking")}
              {...register("confirm_booking")}
              error={errors?.confirm_booking?.message}
            />
          </>
        )}

        {delivery && (
          <DeliveryForm
            watch={watch}
            errors={errors}
            handleChange={handleChange}
            record={record}
            setError={setError}
            setValue={setValue}
            register={register}
            clearErrors={clearErrors}
            getValues={getValues}
          />
        )}

        {returned && (
          <ReturnForm
            watch={watch}
            errors={errors}
            handleChange={handleChange}
            record={record}
            setError={setError}
            setValue={setValue}
            register={register}
            clearErrors={clearErrors}
            getValues={getValues}
          />
        )}

        <div className="flex items-center justify-end gap-2">
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
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
