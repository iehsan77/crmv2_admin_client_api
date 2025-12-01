import { getProductTypes } from "@/helper/EcomActions";

export const getFormDefaultValues = (recordData) => {
  const { record } = recordData;

  return {
    id: record?.id || 0,
    title: record?.title || "",
    slug: record?.slug || "",
    category_id: record?.category_id
      ? {
          value: String(record?.category_id),
          label: String(record?.category_title),
        }
      : { value: "0", label: "Root Category" },
    model_number: record?.model_number || "",
    excerpt: record?.excerpt || "",
    description: record?.description || "",
    stock_qty: record?.stock_qty || "",
    min_pruchase_qty: record?.min_pruchase_qty || "",
    max_pruchase_qty: record?.max_pruchase_qty || "",
    low_stock_limit: record?.low_stock_limit || "",
    seo_title: record?.seo_title || "",
    seo_keywords: record?.seo_keywords || "",
    seo_description: record?.seo_description || "",
    shipping_weight: record?.shipping_weight || "",
    product_width: record?.product_width || "",
    product_height: record?.product_height || "",
    product_length: record?.product_length || "",
    active: record?.active ? true : false,
    old_thumbnail: record?.thumbnail || "",
    thumbnail: "",
    cost: record?.cost || "",
    price: record?.price || "",
    sale_price: record?.sale_price || "",
    sku: record?.sku || "",
    product_type: record?.product_type
      ? getProductTypes().find(
          (product) => String(product.value) === String(record.product_type)
        ) || ""
      : "",
    tag_ids: record?.tag_ids?.length
      ? record?.tags_data?.map((tag) => ({
          value: String(tag.id),
          label: String(tag.title),
        }))
      : "",
    brand_id: record?.brand_id
      ? { value: String(record?.brand_id), label: String(record?.brand_title) }
      : "",
    stock_location_id: record?.stock_location_id
      ? {
          value: String(record?.stock_location_id),
          label: String(record?.stock_location_title),
        }
      : "",
    is_returnable: record?.is_returnable ? true : false,
    return_policy: record?.return_policy || "",
  };
};
