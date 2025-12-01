"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { GET, POST, POST_JSON } from "@/helper/ServerSideActions";
import { z } from "zod";

import { toast } from "sonner";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import CalendarInput from "@/components/FormControls/CalendarInput";
import SelectControl from "@/components/FormControls/SelectControl";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import {
  getQuoteStages,
  getCarriers,
  getRandomNumber,
} from "@/helper/EcomActions";
import { formSchema } from "./formSchema";
import { getFormDefaultValues } from "./formDefaultValues";

import { handleResponse } from "@/helper/ClientSideActions";

export default function Quotation({ record }) {

  // PAGE RELATED - starting
  const router = useRouter();
  const [hoveredRow, setHoveredRow] = useState(null);

  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([
    {
      value: "1",
      label: "Super Admin",
    },
  ]);

  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState([
    {
      value: "1",
      label: "Customer 1",
    },
    {
      value: "2",
      label: "Customer 2",
    },
  ]);

  //const [productsLoading, setProductsLoading] = useState(false);
  const [productsData, setProductsData] = useState([]);
  const [products, setProducts] = useState([]);

  const [items, setItems] = useState([
    {
      product_id: 0,
      product: "",
      description: "",
      quantity: 1,
      price: 0,
      amount: 0,
      discount: 0,
      tax: 0,
      total: 0,
    },
  ]);

  const [summary, setSummary] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    adjustment: 0,
    grand_total: 0,
  });

  const addRecordUrl = ecom_endpoints.products.quotes.create;
  // PAGE RELATED - ending

  // FORM METHODS - starting
  const defaultValues = useMemo(() => getFormDefaultValues(record), [record]);
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

  // Handle adding and removing fields dynamically
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const addQuoteItem = () => {
    setItems([
      ...items,
      {
        product_id: 0,
        product: "",
        description: "",
        quantity: 1,
        price: 0,
        amount: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    ]);
  };
  function removeQuoteItem(index) {
    const xItems = [...items]; // Copy of items
    if (xItems.length > 1) {
      if (index < 0 || index >= xItems.length) {
        console.error("Invalid index");
        return;
      } else {
        const updatedItems = xItems.filter((_, i) => i !== index);
        //setItems([]);
        setItems(updatedItems);
      }
    }
  }
  function copyItem(index) {
    setItems((prevItems) => {
      if (index < 0 || index >= prevItems.length) {
        console.error("Invalid index");
        return prevItems;
      }

      // Clone the item at the given index
      const newItem = { ...prevItems[index] };

      // Insert the new item at the same index + 1
      const updatedItems = [
        ...prevItems.slice(0, index + 1), // Copy items before the index
        newItem, // Insert duplicated item
        ...prevItems.slice(index + 1), // Copy remaining items
      ];

      return updatedItems;
    });
  }

  // Handle form submission
  const onSubmit = async (formData) => {
    try {
      /*
      const updatedQuoteItems = formData?.items.map((item) => ({
        ...item,
        product: item.product.label, // Extracting only the label
      }));
      */
      const body = {
        ...formData,
        
        sales_person_id: formData?.sales_person_id?.value ?? 0,
        sales_person_name: formData?.sales_person_id?.label ?? "",

        customer_id: formData?.customer_id?.value ?? 0,
        customer_name: formData?.customer_id?.label ?? "",

        //carrier: formData?.carrier?.value,
        //status: formData?.status?.value,

        carrier: formData?.carrier ? JSON.stringify(formData?.carrier) : "",
        status: formData?.status ? JSON.stringify(formData?.status) : "",

        items: JSON.stringify(items),
        //items: updatedQuoteItems,

        subtotal: summary?.subtotal,
        discount: summary?.discount,
        tax: summary?.tax,
        grand_total: summary?.grand_total,
      };

      const response = await POST(addRecordUrl, body);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(response?.message);
        router.push(ADMIN_PATHS?.FINANCE?.QUOTES?.LIST);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // FETCH LISTING DATA - starting
  useEffect(() => {
    const fetchContacts = async () => {
      setContactsLoading(true);
      try {
        setContacts([]);
        const body = {showAll: true};
        const response = await POST_JSON(
          ecom_endpoints.modules.contacts.userContectList,
          body
        );
        if (response?.status === 200) {
          const formatedData = response?.data.map(
            ({ id, first_name, last_name, email }) => ({
              value: String(id),
              label: first_name + " " + last_name + " (" + email + ")",
            })
          );
          setContacts(formatedData);
        }
      } catch (error) {
        console.log(error);
      }
      setContactsLoading(false);
    };

    const fetchUsers = async () => {
      setUsers([]);
      setUsersLoading(true);
      try {
        const response = await GET(ecom_endpoints?.users?.list);
        if (response?.status === 200) {
          const formatedData = response?.data.map(({ id, name, email }) => ({
            value: String(id),
            label: name + " (" + email + ")",
          }));
          setUsers(formatedData);
        }
      } catch (error) {
        console.log(error);
      }
      setUsersLoading(false);
    };

    const fetchProducts = async () => {
      try {
        const response = await POST_JSON(
          ecom_endpoints?.products?.catalog?.list, {showAll: true}
        );
        if (response?.status === 200) {
          setProductsData(response?.data);
          const formatedData = response?.data.map(({ id, title }) => ({
            value: String(id),
            label: String(title),
          }));
          setProducts(formatedData);
        }
      } catch (error) {
        console.log(error);
      }
      //setUsersLoading(false);
    };
    fetchProducts();
  }, []);
  // FETCH LISTING DATA - ending

  // CALCULATIONS - starting

  const handleProductChange = (index, product) => {
    setItems((prevItems) => {
      return prevItems.map((item, i) => {
        if (i === index) {
          const p = productsData.find((p) => p.id === Number(product.value));
          return {
            ...item,
            product_id: product.value,
            product: product,
            price: p?.price || 0,
            amount: item.quantity * (p?.price || 0),
            total: item.quantity * (p?.price || 0) - item.discount + item.tax,
          };
        }
        return item;
      });
    });
  };

  const updateItem = (index, key, value) => {
    const updatedItems = [...items];
    updatedItems[index][key] = value;

    if (key === "quantity" || key === "price") {
      updatedItems[index].amount =
        updatedItems[index].quantity * updatedItems[index].price;
    }

    updatedItems[index].total =
      updatedItems[index].amount -
      updatedItems[index].discount +
      updatedItems[index].tax;

    setItems(updatedItems);
    updateSummary(updatedItems);
  };

  const updateSummary = (updatedItems) => {
    const subtotal = updatedItems.reduce((acc, item) => acc + item.amount, 0);
    const discount = updatedItems.reduce((acc, item) => acc + item.discount, 0);
    const tax = updatedItems.reduce((acc, item) => acc + item.tax, 0);
    //const grand_total = subtotal - discount + tax + summary?.adjustment;
    const grand_total = subtotal - discount + tax;

    setSummary({
      subtotal,
      discount,
      tax,
      //adjustment: summary?.adjustment,
      grand_total,
    });
  };

  useEffect(() => {
    const updateSummary = () => {
      const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
      const discount = items.reduce(
        (acc, item) => acc + (item.discount || 0),
        0
      );
      const tax = items.reduce((acc, item) => acc + (item.tax || 0), 0);
      //const grand_total = subtotal - discount + tax + summary?.adjustment;
      const grand_total = subtotal - discount + tax;

      setSummary((prevSummary) => ({
        ...prevSummary,
        subtotal,
        discount,
        tax,
        grand_total,
      }));
    };

    updateSummary();
  }, [items]);

  // CALCULATIONS - ending

  // RESET RECORD - starting
  useEffect(() => {
    //if (record?.length) {
    if (record) {
      methods.reset(defaultValues);

      if (record?.items) {
        const xItems = JSON.parse(record?.items);
        setItems(xItems);
      }

      setSummary({
        subtotal: record?.subtotal,
        discount: record?.discount,
        tax: record?.tax,
        grand_total: record?.grand_total,
      });
    }
  }, [record, methods, defaultValues]);
  // RESET RECORD - ending


  return (
    <>
      <div className="bg-white shadow-lg p-6">
        <FormProvider
          methods={methods}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-5">
            <h4 className="display5 font-semibold">Quote Information</h4>
            <div className="grid md:grid-cols-2 container mx-auto !p-0 gap-4">
              <div className="space-y-4">
                <SelectControl
                  title="Quote Owner"
                  name="sales_person_id"
                  type="text"
                  placeholder="Quote Owner"
                  options={users}
                  isLoading={usersLoading}
                />
                <InputControl
                  title="Subject"
                  name="subject"
                  type="text"
                  placeholder="Subject"
                />

                <InputControl
                  title="Team"
                  name="team"
                  type="text"
                  placeholder="Team"
                />
                <SelectControl
                  title="Carrier"
                  name="carrier"
                  type="text"
                  placeholder="Carrier"
                  options={getCarriers()}
                />
              </div>
              <div className="space-y-4">
                {/* <SelectControl
              title="Deal Name"
              name="deal_name"
              type="text"
              placeholder="Deal Name"
              options={selectData}
            /> */}
                <CalendarInput
                  title="Quote Date"
                  name="date"
                  type="date"
                  placeholder="MM/DD/YYYY"
                />
                <SelectControl
                  title="Contact Name"
                  name="customer_id"
                  type="text"
                  placeholder="Contact Name"
                  options={contacts}
                  isLoading={contactsLoading}
                />
                <SelectControl
                  title="Quote Stage"
                  name="status"
                  type="text"
                  placeholder="Quote Stage"
                  options={getQuoteStages()}
                />
                <CalendarInput
                  title="Valid Until"
                  name="expiry_date"
                  type="date"
                  placeholder="MM/DD/YYYY"
                />
                {/* <SelectControl
              title="Account Name"
              name="account_name"
              type="text"
              placeholder="Account Name"
              options={selectData}
            /> */}
              </div>
            </div>
          </div>

          <div className="space-y-5 mx-auto">
            <h4 className="display5 font-semibold">Address Information</h4>

            <div className="grid md:grid-cols-2 container mx-auto !p-0 gap-4">
              <div className="space-y-4">
                <InputControl
                  title="Billing Street"
                  name="billing_street"
                  type="text"
                />
                <InputControl
                  title="Billing City"
                  name="billing_city"
                  type="text"
                />
                <InputControl
                  title="Billing State"
                  name="billing_state"
                  type="text"
                />
                <InputControl
                  title="Billing Code"
                  name="billing_code"
                  type="text"
                />
                <InputControl
                  title="Billing Country"
                  name="billing_country"
                  type="text"
                />
              </div>
              <div className="space-y-4">
                <InputControl
                  title="Shipping Street"
                  name="shipping_street"
                  type="text"
                />
                <InputControl
                  title="Shipping City"
                  name="shipping_city"
                  type="text"
                />
                <InputControl
                  title="Shipping State"
                  name="shipping_state"
                  type="text"
                />
                <InputControl
                  title="Shipping Code"
                  name="shipping_code"
                  type="text"
                />
                <InputControl
                  title="Shipping Country"
                  name="shipping_country"
                  type="text"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 !overflow-x-auto">
            <h4 className="display5 font-semibold">Quoted Items</h4>
            <table className="table-auto w-full border-collapse !ml-0 border border-gray-300 rounded-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-sm border border-gray-300 w-[100px]">
                    S.NO
                  </th>
                  <th className="p-2 text-sm border border-gray-300">
                    Product Name
                  </th>
                  <th className="p-2 text-sm border border-gray-300">
                    Quantity
                  </th>
                  <th className="p-2 text-sm border border-gray-300">Price</th>
                  <th className="p-2 text-sm border border-gray-300">Amount</th>
                  <th className="p-2 text-sm border border-gray-300">
                    Discount
                  </th>
                  <th className="p-2 text-sm border border-gray-300">Tax</th>
                  <th className="p-2 text-sm border border-gray-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {/* {fields.map((item, index) => ( */}
                {items.map((item, index) => (
                  <tr
                    //key={getRandomNumber()}
                    key={index}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="transition duration-300"
                  >
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      <div className="md:flex items-center justify-between ">
                        {hoveredRow === index && (
                          <div className="flex">
                            <Icon
                              //onClick={addQuoteItem}
                              onClick={() => copyItem(index)}
                              icon="tabler:copy"
                              color="gray"
                              width="1.2rem"
                              height="1.2rem"
                              className="cursor-pointer mr-2 transition-opacity duration-300"
                            />
                            <Icon
                              //onClick={ items.length > 1 ? () => remove(index) : null }
                              onClick={() => removeQuoteItem(index)}
                              icon="solar:trash-bin-2-bold"
                              color="gray"
                              width="1.2rem"
                              height="1.2rem"
                              className="cursor-pointer transition-opacity duration-300"
                            />
                          </div>
                        )}
                        <p className="text-right w-full mt-4 md:mt-0">
                          {index + 1}
                        </p>
                        {/* <p className="text-right w-full mt-4 md:mt-0">{index}</p> */}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 space-y-3">
                      <SelectControl
                        name={`items.${index}.product`}
                        type="text"
                        placeholder="Product Name"
                        options={products}
                        vertical={true}
                        onChangeOtherFunction={(e) =>
                          handleProductChange(index, e)
                        }
                      />
                      <InputControl
                        name={`items.${index}.description`}
                        type="text"
                        placeholder="Description"
                        vertical={true}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.quantity`}
                        type="number"
                        vertical={true}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                        inputClass="text-end"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.price`}
                        type="number"
                        vertical={true}
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", Number(e.target.value))
                        }
                        inputClass="text-end"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.amount`}
                        type="number"
                        vertical={true}
                        value={item.amount}
                        readOnly
                        inputClass="text-end"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.discount`}
                        type="number"
                        vertical={true}
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", Number(e.target.value))
                        }
                        inputClass="text-end"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.tax`}
                        type="number"
                        vertical={true}
                        value={item.tax}
                        onChange={(e) =>
                          updateItem(index, "tax", Number(e.target.value))
                        }
                        inputClass="text-end"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[50px] align-top">
                      <InputControl
                        name={`items.${index}.total`}
                        type="number"
                        vertical={true}
                        readOnly
                        value={item.total}
                        inputClass="text-end"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:flex justify-between space-y-5">
            <Button
              variant="primary"
              type="button"
              onClick={addQuoteItem}
              className="w-fit h-fit border-2 border-black text-sm font-medium rounded-lg hover:bg-primary  hover:text-white !text-nowrap"
            >
              Add Row
            </Button>

            <div className="container md:flex items-center  pr-0 mr-0 justify-end">
              <div className="w-full md:max-w-[500px] border border-gray-light rounded-lg">
                <div className="p-2 border-b">
                  <InputControl
                    title="Sub Total ($)"
                    name="subtotal"
                    type="text"
                    value={summary?.subtotal?.toFixed(2) || 0}
                    inputClass="text-end"
                  />
                </div>
                <div className="p-2 border-b">
                  <InputControl
                    title="Discount ($)"
                    name="discount"
                    type="text"
                    value={summary?.discount?.toFixed(2) || 0}
                    inputClass="text-end"
                  />
                </div>
                <div className="p-2 border-b">
                  <InputControl
                    title="Tax ($)"
                    name="tax"
                    type="text"
                    value={summary?.tax?.toFixed(2) || 0}
                    inputClass="text-end"
                  />
                </div>
                {/* <div className="p-2 border-b">
              <InputControl
                title="Adjustment ($)"
                name="adjustment"
                type="text"
              />
            </div> */}
                <div className="p-2">
                  <InputControl
                    title="Grand Total ($)"
                    name="grand_total"
                    type="text"
                    value={summary?.grand_total?.toFixed(2) || 0}
                    inputClass="text-end"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="display5 font-semibold">Terms and Conditions</h4>
            <div className="grid xl:grid-cols-1 container mx-auto !p-0">
              <InputControl
                title=""
                name="terms_conditions"
                placeholder="Terms and Conditions"
                type="text"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="display5 font-semibold">Description Information</h4>
            <div className="grid xl:grid-cols-1 container mx-auto !p-0">
              <InputControl
                title=""
                name="description"
                placeholder="Description"
                type="text"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-center lg:justify-between col-span-6 space-x-4 mt-6">
            <Button
              variant="outline"
              type="button"
              className="w-fit h-fit bg-black text-white text-sm font-medium rounded-lg hover:bg-primary !text-nowrap"
              onClick={() => router.push(ADMIN_PATHS?.FINANCE?.QUOTES?.LIST)}
            >
              View All Quotes
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              className="w-fit h-fit bg-black text-white text-sm font-medium rounded-lg hover:bg-primary !text-nowrap"
              //onClick={handleSubmit((data) => onSubmit(data))}
            >
              {isSubmitting ? "Loading..." : "Submit"}
            </Button>
          </div>
        </FormProvider>
      </div>
    </>
  );
}
