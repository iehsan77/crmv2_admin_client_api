  export const getFormDefaultValues = (record) => {
    return {
      old_thumbnail: record?.thumbnail || "",
      old_banner: record?.banner || "",
      id: record?.id || 0,
      parent_id: record?.parent_id>0 ? { value: String(record?.parent_id), label: String(record?.parent_title) } : { value: String(0), label: String("Root Category") },
      title: record?.title || "",
      slug: record?.slug || "",
      description: record?.description || "",
      thumbnail: "",
      banner: "",
      show_in_store: record?.show_in_store || 0,
      show_in_menu: record?.show_in_menu || 0,
      seo_title: record?.seo_title || "",
      seo_keywords: record?.seo_keywords || "",
      seo_description: record?.seo_description || "",
      active: record?.active || 0,
    };
  };
  