"use client";
import React, { useEffect, useMemo, useState } from "react";
import FormProvider from "@/components/FormControls/FormProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";


import { Icon } from "@iconify/react";

import Image from "next/image";
import Link from "next/link";
import DataTable from "react-data-table-component";
import { dataTableHeadStyle } from "@/components/dataTableHeadStyle";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { ecom_endpoints } from "@/utils/ecom_endpoints";
import {
  getDropdownFormattedData,
  convertToCurrency,
} from "@/helper/EcomActions";

import {handleResponse} from "@/helper/ClientSideActions";
import { GET, POST, POST_JSON } from "@/helper/ServerSideActions";

import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import FileUpload from "@/components/FormControls/FileUpload";
import { Button } from "@/components/ui/button";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

const ProductVariations = () => {

  // PAGE RELATED - starting
  const rowsPerPage = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const params = useParams(); // ✅ Get route params
  const productId = params.id;

  //  DETECT COLOR - starting
  const [color, setColor] = useState("");
  const [isValidColor, setIsValidColor] = useState(false);
  const isHexColor = (code) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(code);
  //  DETECT COLOR - ending

  const [attributesData, setAttributesData] = useState([]);
  const [attributeLoading, setAttributeLoading] = useState(false);
  const [attributes, setAttributes] = useState([]);

  const [attributeValuesLoading, setAttributeValuesLoading] = useState(false);
  const [attributesValues, setAttributesValues] = useState([]);

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [deleteAction, setDeleteAction] = useState(1);
  const attributesWithValuesUrl =
    ecom_endpoints?.products?.attributes?.getAttributeWithValues();
  const getProductVariantsUrl =
    ecom_endpoints?.products?.variations?.getRecords(productId);
  const addRecordUrl = ecom_endpoints.products.variations.create;
  const deleteUrl = ecom_endpoints.products.variations.deleteRecord(productId);
  const reStoreRecordUrl = ecom_endpoints.products.variations.deleteRecord(productId);

  // PAGE RELATED - ending
  const formSchema = z.object({
    id: z.number().default(0),
    product_id: z.number().default(0),
    attribute_id: z
      .union([
        z.object({
          label: z.string().min(1, { message: "Required" }),
          value: z.string().min(1, { message: "Required" }),
        }),
        z.string(),
        z.number(),
        z.null(),
      ])
      .optional(),
    attribute_value_id: z
      .union([
        z.object({
          label: z.string().min(1, { message: "Required" }),
          value: z.string().min(1, { message: "Required" }),
        }),
        z.string(),
        z.number(),
        z.null(),
      ])
      .optional(),
    /*
    price: z.string().optional(),
    sale_price: z.string().optional(),
*/
    price: z
      .union([z.coerce.number().positive(), z.string().max(0)])
      .optional(),
    sale_price: z.union([
      z.coerce.number().positive(),
      z.string().min(1, { message: "Required" }).max(0),
    ]),
    old_image: z.string().optional(),
    image: z.union([z.instanceof(File).optional(), z.string().optional()]),
    sku: z.string().optional(),
  });

  // FETCH LISTING DATA - starting
  useEffect(() => {
    (async () => {
      try {
        setAttributeLoading(true);

        const response = await GET(attributesWithValuesUrl);

        setAttributeLoading(false);
        if (response?.status === 200) {
          setAttributesData(response?.data);
          setAttributes(getDropdownFormattedData(response?.data));
        }
      } catch (error) {
        console.error("Error fetching product records:", error);
      }
    })();
  }, [attributesWithValuesUrl]);

  useEffect(() => {
    (async () => {
      try {
        setRecordsLoading(true);
        const response = await GET(getProductVariantsUrl);

        setRecordsLoading(false);
        if (response?.status === 200) {
          setRecords(response?.data);
        }
      } catch (error) {
        console.error("Error fetching product records:", error);
      }
    })();
  }, [getProductVariantsUrl]);
  // FETCH LISTING DATA - ending

  const defaultValues = useMemo(
    () => ({
      id: record?.id ?? 0,
      attribute_id: record?.attribute_id
        ? {
            value: String(record?.attribute_id),
            label: String(record?.attribute_field_title),
          }
        : "",
      attribute_value_id: record?.attribute_value_id
        ? {
            value: String(record?.attribute_value_id),
            label: String(record?.attribute_value_title),
          }
        : "",
      price: record?.price ?? "",
      sale_price: record?.sale_price ?? "",
      old_image: record?.image ?? "",
      image: "",
    }),
    [record]
  );
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const {
    watch,
    control,
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  // FORM METHODS - ending

  // FORM SUBMISSIONS - starting
  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        
        product_id: productId,
        attribute_id: formData?.attribute_id.value,
        attribute_value_id: formData?.attribute_value_id.value,
        sku:
          "SKU-item-" +
          productId +
          formData?.attribute_id.value +
          formData?.attribute_value_id.value,
      };

      const response = await POST(addRecordUrl, body);

      if (response?.status === 200 || response?.status === 201) {
        setValue("id", 0);
        setValue("price", "");
        setValue("sale_price", "");
        setValue("old_image", "");
        setValue("image", "");

        toast.success(response?.message);
        const newRecord = response.data;
        setRecords((records) => {
          const index = records.findIndex(
            (variation) => variation.id === response.data.id
          );

          if (index !== -1) {
            // Replace the existing record
            return records.map((variation, i) =>
              i === index ? { ...newRecord } : variation
            );
          } else {
            // Add new record
            return [...records, newRecord];
          }
        });
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };
  // FORM SUBMISSIONS - ending

  //  DETECT ATTRIBUTE - starting
  const attId = watch("attribute_id");
  useEffect(() => {
    if (!attId?.value) return;

    setValue("attribute_value_id", "");
    setAttributeValuesLoading(true);
    const findValuesById = (id) => {
      const attribute = attributesData.find(
        (attr) => Number(attr?.id) === Number(id)
      );

      return attribute ? getDropdownFormattedData(attribute?.values) : [];
    };
    const values = findValuesById(attId?.value);
    detctAttribute(attId?.label);
    setAttributesValues(values);

    if (editMode) {
      setValue("attribute_value_id", {
        value: String(record?.attribute_value_id),
        label: String(record?.attribute_value_title),
      });
      //setEditMode(false)
    }

    setTimeout(() => setAttributeValuesLoading(false), 0);
  }, [attId, setValue, attributesData, editMode, record]);

  function detctAttribute(attribute) {
    //const attribute = event?.label;
    if (
      attribute &&
      !["color", "colors", "colours", "colour"].includes(
        attribute.toLowerCase()
      )
    ) {
      setColor("");
      setIsValidColor(false);
    }
  }
  const handleColorChange = (event) => {
    const selectedColor = event.label;
    if (isHexColor(selectedColor)) {
      setIsValidColor(true);
      setColor(selectedColor);
    } else {
      setIsValidColor(false);
    }
  };
  //  DETECT ATTRIBUTE - ending

  // RESET RECORD - starting
  useEffect(() => {
    methods.reset(defaultValues); // Trigger reset once data is available
  }, [record, methods, defaultValues]);
  // RESET RECORD - ending

  const columns = [
    {
      name: "#",
      cell: (record, index) => (currentPage - 1) * rowsPerPage + index + 1,
      width: "100px",
      style: { textAlign: "center" },
    },
    {
      name: "Thumbnail",
      selector: (record) => record?.logo,
      cell: (record) =>
        record?.image ? (
          <Image
            src={record?.image}
            alt={record?.sku}
            width="50"
            className="self-center"
            height={50}
          />
        ) : (
          ""
        ),
      width: "110px",
      style: { textAlign: "center" },
    },
    {
      name: "SKU",
      selector: (record) => record?.sku,
      sortable: true,
    },
    {
      name: "Attribute",
      selector: (record) => record?.attribute_field_title,
      sortable: true,
    },
    {
      name: "Attribute Value",
      selector: (record) => record?.attribute_value_title,
      sortable: true,
    },
    {
      name: "Regular Price",
      selector: (record) => convertToCurrency(record?.price),
      sortable: true,
    },
    {
      name: "Sale Price",
      selector: (record) => convertToCurrency(record?.sale_price),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (record) => (
        <div className="flex justify-center items-center gap-2">
          {record?.deleted ? (
            <Icon
              className="mr-2"
              iconName="LuCornerUpLeft"
              width="1rem"
              height="1rem"
              onClick={() =>
                handleOpenModal(
                  record,
                  "Are you sure you want to restore this record?",
                  0
                )
              }
            />
          ) : (
            <>
              <Icon
                className="mr-2 cursor-pointer"
                iconName="FaRegEdit"
                width="1rem"
                height="1rem"
                onClick={() => {
                  setRecord(record);
                  setEditMode(true);
                }}
              />
              <Icon
                className="mr-2"
                iconName="LuTrash2"
                width="1rem"
                height="1rem"
                onClick={() =>
                  handleOpenModal(
                    record,
                    "Are you sure you want to delete this record?",
                    1
                  )
                }
              />
            </>
          )}
        </div>
      ),
      width: "100px",
      style: { textAlign: "center" },
    },
  ];

  // DELETE RECORD - starting
  const handleOpenModal = (record, message, del) => {
    setRecord(record);
    setDeleteAction(del);
    setConfirmationMessage(message);
    setIsModalOpen(true);
  };
  const handleDelete = async () => {
    try {
      //setRecords((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(deleteUrl);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        record.deleted = 1;
        setRecords((records) =>
          records.map((r) => (r.id === record.id ? record : r))
        );
        toast.success("Record ha been deleted");
      } else {
        //handleResponse(response);
        toast.error("Failed to delete record!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  const handleReStore = async () => {
    try {
      //setRecords((records) => records.filter((b) => b.id !== record.id));
      const response = await GET(reStoreRecordUrl);

      // Close modal after successful deletion
      setIsModalOpen(false);

      if (response?.status === 200 || response?.status === 201) {
        record.deleted = 0;
        setRecords((records) =>
          records.map((r) => (r.id === record.id ? record : r))
        );
        toast.success("Record ha been restored");
      } else {
        //handleResponse(response);
        toast.error("Failed to delete restore!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  // DELETE RECORD - starting

  return (
    <>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <div className="container !p-0">
          <div className="grid lg:grid-cols-1 gap-4 ">
            <div className="grid grid-cols-6 gap-4 w-full p-4 border rounded-lg">
              <div className="col-span-1">
                <SelectControl
                  vertical={true}
                  title="Attribute"
                  name="attribute_id"
                  placeholder="Select Attribute"
                  options={attributes}
                  isLoading={attributeLoading}
                  //onChangeOtherFunction={detctAttribute}
                />
              </div>
              <div className="col-span-1 colorCodeDD">
                <SelectControl
                  vertical={true}
                  title="Attribute Value"
                  titleEx={
                    isValidColor && (
                      <span
                        className="h-[16px] w-[16px] ml-3 inline-block rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                      ></span>
                    )
                  }
                  name="attribute_value_id"
                  placeholder="Select Attribute Value"
                  options={attributesValues}
                  isLoading={attributeValuesLoading}
                  onChangeOtherFunction={handleColorChange}
                />
              </div>
              <div className="col-span-1">
                <InputControl
                  vertical={true}
                  title="Regular Price"
                  name="price"
                  type="number"
                />
              </div>
              <div className="col-span-1">
                <InputControl
                  vertical={true}
                  title="Sale Price"
                  name="sale_price"
                  type="number"
                />
              </div>
              <div className="col-span-1">
                <FileUpload name="image" />
              </div>
              <div className="col-span-1">
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data))}
                >
                  {isSubmitting ? "Loading..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
      <div className="container !p-0 mt-5">
        <div className="bg-white shadow-lg p-2 mt-3">
        {recordsLoading ? (
              <LoadingSkeletonTable />
            ) : (
          <DataTable
            title=""
            columns={columns}
            data={records}
            pagination
            persistTableHead
            customStyles={dataTableHeadStyle}
            paginationPerPage={rowsPerPage} // Change as needed
            onChangePage={(page) => setCurrentPage(page)}
          />
           )}
        </div>
      </div>

      {/* Delete Confirmation Model */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4">{confirmationMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={deleteAction ? handleDelete : handleReStore}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductVariations;
