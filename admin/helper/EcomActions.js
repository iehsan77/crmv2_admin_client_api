export const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^\w-]+/g, "") // Remove non-word characters
    .replace(/--+/g, "-"); // Replace multiple dashes with a single dash
};

export const getCatsBreadcrumbOptions = (categories) => {
  const categoryMap = new Map();

  // Step 1: Store categories in a map for quick lookup
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, fullLabel: cat.title });
  });

  // Step 2: Construct full label paths
  categories.forEach((cat) => {
    if (cat.parent_id !== 0) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        categoryMap.get(cat.id).fullLabel = `${parent.fullLabel} > ${cat.title}`;
      }
    }
  });

  // Step 3: Convert to final select options with plain text label
  const options = Array.from(categoryMap.values()).map((cat) => {
    return {
      value: String(cat.id),
      label: cat.fullLabel, // Store as plain text
    };
  });

  // Step 4: Add "Root Category" at the top
  return [{ value: "0", label: "Root Category" }, ...options];
};

/*
export const getCatsWithParentHierarchy = (categories) => {
  const categoryMap = new Map();

  // Step 1: Store categories in a map for quick lookup
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, parents: "self" }); // Default to "self"
  });

  // Step 2: Construct the parents hierarchy for each category
  categories.forEach((cat) => {
    let parentNames = [];
    let currentParentId = cat.parent_id;

    while (currentParentId !== 0) {
      const parent = categoryMap.get(currentParentId);
      if (!parent) break; // If parent is missing, stop

      parentNames.unshift(parent.title); // Add parent title at the beginning
      currentParentId = parent.parent_id; // Move to the next parent
    }

    // If there are parent names, join them with " > ", otherwise keep "self"
    categoryMap.get(cat.id).parents = parentNames.length
      ? parentNames.join(" > ")
      : "Self";
  });

  return Array.from(categoryMap.values());
};
*/

export const getCatsWithParentHierarchy = (categories) => {
  const categoryMap = new Map();

  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, parents: "self" });
  });

  categories.forEach((cat) => {
    let parentNames = [];
    let currentParentId = cat.parent_id;
    const visited = new Set(); // Track visited IDs

    while (currentParentId !== 0) {
      if (visited.has(currentParentId)) {
        console.warn(`Cycle detected at category ID: ${currentParentId}`);
        break;
      }

      visited.add(currentParentId);
      const parent = categoryMap.get(currentParentId);
      if (!parent) break;

      parentNames.unshift(parent.title);
      currentParentId = parent.parent_id;
    }

    categoryMap.get(cat.id).parents = parentNames.length
      ? parentNames.join(" > ")
      : "Self";
  });

  return Array.from(categoryMap.values());
};


export const getDropdownFormattedData = (data) =>
  data.map(({ id, title }) => ({ value: String(id), label: title }));

export const getRandomNumber = (min = 1, max = 100000000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/*
export const getDropdownFormattedData = (data) =>
  data.map(({ id, title }) => {
    const isHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(title); // ✅ Check if title is a hex code

    return {
      value: String(id),
      label: isHexColor
        ? `<div style="display: flex; align-items: center; gap: 8px;">
             <span style="display: inline-block; width: 16px; height: 16px; background: ${title}; border-radius: 4px;"></span> 
             ${title}
           </div>`
        : title
    };
  });

export const getDropdownFormattedData = (data) =>
  data.map(({ id, title }) => {
    const isHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(title);

    return {
      value: String(id),
      label: (
        <div key={id} className="flex items-center gap-2">
          {isHexColor && <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: title }}></span>}
          <span  key={id}>{title}</span>
        </div>
      )
    };
  });


export const getDropdownFormattedData = (data) =>
  data.map(({ id, title }) => {
    const isHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(title);

    return {
      value: String(id),
      label: (
        <div key={`dropdown-${id}`} className="flex items-center gap-2">
          {isHexColor && (
            <span
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: title }}
              key={`swatch-${id}`} 
            ></span>
          )}
          <span key={`swatch-${id}`} >{title}</span>
        </div>
      ),
    };
  });
*/

export const getDropdownFormattedDataWithColor = (data) =>
  data.map(({ id, title }) => {
    const isHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(title);
    const rand1 = Math.random().toString(36).substring(2);
    const rand2 = Math.random().toString(36).substring(2);
    const rand3 = Math.random().toString(36).substring(2);
    return {
      value: String(id),
      label: (
        <div key={`dropdown-${rand1}`} className="flex items-center gap-2">
          {isHexColor && (
            <span
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: title }}
              key={`swatch-${rand2}`}
            ></span>
          )}
          <span key={`swatch-${rand3}`}>{title}</span>
        </div>
      ),
    };
  });

export const convertToCurrency = (amount, currency = "", locale = "en-US") => {
  // amount, currency = "USD", locale = "en-US"

  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0.00";
  }

  return new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency: currency || undefined,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getProductTypes = (index) => {
  const productTypes = [
    { value: "simple", label: "Simple Product" },
    { value: "variable", label: "Variable Product" },
    { value: "digital", label: "Digital Product" },
    { value: "subscription", label: "Subscription" },
    { value: "bundle", label: "Bundle Product" },
  ];

  if (index) {
    return productTypes[index];
  } else {
    return productTypes;
  }
};

export const getQuoteStages = () => {
  const productTypes = [
    { value: "Draft", label: "Draft" },
    { value: "Negotiation", label: "Negotiation" },
    { value: "Delivered", label: "Delivered" },
    { value: "On Hold", label: "On Hold" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Closed Won", label: "Closed Won" },
    { value: "Closed Lost", label: "Closed Lost" },
  ];
  return productTypes;
};
export const getSaleOrderStages = () => {
  const productTypes = [
    { value: "Created", label: "Created" },
    { value: "Approved", label: "Approved" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  return productTypes;
};

export const getInvoiceStages = () => {
  const productTypes = [
    { value: "Created", label: "Created" },
    { value: "Approved", label: "Approved" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  return productTypes;
};
export const getCarriers = () => {
  const productTypes = [
    { value: "FedEX", label: "FedEX" },
    { value: "UPS", label: "UPS" },
    { value: "USPS", label: "USPS" },
    { value: "DHL", label: "DHL" },
    { value: "BlueDart", label: "BlueDart" },
  ];
  return productTypes;
};

/*
export const getDate  = (date) => {
  return new Date(date).toISOString().split("T")[0]
};
*/

export const getDate = (date) => {
  if (!date || date === "null") return ""; // Handle null, "null", or empty values

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return ""; // Handle invalid dates

  return parsedDate.toISOString().split("T")[0];
};

export const isValidDate = (date) => {
  if (!date || date === "null") return false; // Handle null, "null", or empty values

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()); // Return true if valid, false if invalid
};


export const getFormatedNameEmail = (string) => {
  const match = string.match(/^(.*) \((.*)\)$/);
  if (!match) return null; // Return null if format is incorrect

  const name = match[1];
  const email = match[2];

  return (
    <>
      <div>{name}</div>
      <div>({email})</div>
    </>
  );
};



