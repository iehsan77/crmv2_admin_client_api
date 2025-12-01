"use client";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import TextInput from "@/components/FormFields/TextInput";

const ReturnForm = ({
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
        Vehicle Return Details
      </div>

      <TextInput
        label="Received By"
        value={watch("return_received_by")}
        onChange={(val) =>
          handleChange("return_received_by", val?.target?.value)
        }
        error={errors.return_received_by?.message}
        clearError={() => clearErrors("return_received_by")}
      />

      <div className="space-y-2">
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Photos of Returned Vehicle
          </div>
          <MultiImageUpload
            name="vehicle_return_images"
            accept={{
              "image/jpeg": [".jpeg", ".jpg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            // isHide={true}
            value={watch("vehicle_return_images")}
            previewValues={
              record?.old_vehicle_return_images?.length
                ? watch("old_vehicle_return_images")
                : []
            }
            onChange={(val) => handleChange("vehicle_return_images", val)}
            setError={setError}
            setValue={setValue}
            error={errors?.vehicle_return_images?.message}
          />
        </div>
      </div>

      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Customer Agreement
      </div>

      <TextInput
        label="Received From"
        value={watch("return_received_from")}
        onChange={(val) =>
          handleChange("return_received_from", val?.target?.value)
        }
        error={errors.return_received_from?.message}
        clearError={() => clearErrors("return_received_from")}
      />

      <CheckboxInput
        title="I consent to terms & conditions."
        checked={watch("confirm_booking_return")}
        {...register("confirm_booking_return")}
        error={errors?.confirm_booking_return?.message}
      />
    </>
  );
};

export default ReturnForm;
