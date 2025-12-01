"use client";
import TextInput from "@/components/FormBuilder/components/fields/TextInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";

const DeliveryForm = ({
  watch,
  errors,
  handleChange,
  setError,
  clearErrors,
  setValue,
  record,
  register,
}) => {

  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Handover Details
      </div>
      {/*
      <SingleSelectInput
        label="Handover By"
        options={[
          {
            label: "John Doe",
            value: 1,
          },
        ]}
        value={watch("delivery_handover_by")}
        onChange={(option) => handleChange("delivery_handover_by", option)}
        error={errors.delivery_handover_by?.message}
        clearError={() => clearErrors("delivery_handover_by")}
      />
*/}
      <TextInput
        label="Handover By"
        value={watch("delivery_handover_by")}
        onChange={(val) => handleChange("delivery_handover_by", val?.target?.value)}
        error={errors.delivery_handover_by?.message}
        clearError={() => clearErrors("delivery_handover_by")}
      />

      <div className="space-y-2">
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Photos of Handover Vehicle
          </div>
          <MultiImageUpload
            name="vehicle_delivery_images"
            accept={{
              "image/jpeg": [".jpeg", ".jpg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            // isHide={true}
            value={watch("vehicle_delivery_images")}
            previewValues={
              record?.old_vehicle_delivery_images?.length
                ? watch("old_vehicle_delivery_images")
                : []
            }
            onChange={(val) => handleChange("vehicle_delivery_images", val)}
            setError={setError}
            setValue={setValue}
            error={errors?.vehicle_delivery_images?.message}
          />
        </div>
      </div>

      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Customer Agreement
      </div>
      {/*
      <SingleSelectInput
        label="Received By"
        options={[
          {
            label: "John Doe",
            value: 1,
          },
        ]}
        value={watch("delivery_received_by")}
        onChange={(option) => handleChange("delivery_received_by", option)}
        error={errors.delivery_received_by?.message}
        clearError={() => clearErrors("delivery_received_by")}
      />
      */}
      <TextInput
        label="Received By"
        value={watch("delivery_received_by")}
        onChange={(val) =>
          handleChange("delivery_received_by", val?.target?.value)
        }
        error={errors.delivery_received_by?.message}
        clearError={() => clearErrors("delivery_received_by")}
      />
      <CheckboxInput
        title="I consent to terms & conditions."
        checked={watch("confirm_booking_delivery")}
        {...register("confirm_booking_delivery")}
        error={errors?.confirm_booking_delivery?.message}
      />
    </>
  );
};

export default DeliveryForm;
