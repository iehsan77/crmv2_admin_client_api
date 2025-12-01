import ProductTabs from "@/components/ProductTabs";

import InputControl from "@/components/FormControls/InputControl";
  
const OtherInformation = () => {
  const tabsData = [
    {
      label: "Inventory Tracking",
      content: (
        <>
          <div className="space-y-5">
            <div>
              <InputControl
                title="Stock Quantity"
                name="stock_qty"
                type="number"
                inputWidth="w-[200px] max-w-[300px]"
                min={1}
              />
            </div>
            <div className="grid md:grid-cols-4 gap-1 md:gap-4">
              <div className="col-span-1 md:text-right">
                <h4 className="displayPara !mb-0 font-semibold">
                  Quantity Restriction
                </h4>
              </div>
              <div className="!col-span-3 space-y-5">
                <div className="flex gap-5">
                  <p>Specify the quantities to restrict purchase</p>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <InputControl
                    title="Minimum"
                    name="min_pruchase_qty"
                    type="number"
                    vertical={true}
                    min={1}
                  />
                  <InputControl
                    title="Maximum"
                    name="max_pruchase_qty"
                    type="number"
                    vertical={true}
                    min={1}
                  />
                </div>
              </div>
            </div>
            <InputControl
              title="Low Stock Limit"
              name="low_stock_limit"
              type="number"
              inputWidth="w-[200px] max-w-[300px]"
              min={0}
              extra="You'll receive a reminder when the product's stock goes below this value. Make sure you have enabled your low stock email notification in settings."
            />
          </div>
        </>
      ),
    },
    {
      label: "SEO",
      content: (
        <>
          <div className="space-y-5">
            <InputControl
              title="SEO Title"
              name="seo_title"
              type="text"
            />
            <InputControl
              title="SEO Keywords"
              name="seo_keywords"
              type="text"
              extra="Enter keywords related to your product."
            />
            <InputControl
              title="SEO Description"
              name="seo_description"
              type="text"
              extra="Type a description that summarizes your product.."
            />
          </div>
        </>
      ),
    },
    {
      label: "Shipping",
      content: (
        <>
          <div className="space-y-5 w-[80%]">
            <InputControl
              title="Shipping Weight"
              name="shipping_weight"
              type="text"
              inputWidth="w-[200px] max-w-[300px]"
              min={1}
            />
            <InputControl
              title="Width"
              name="product_width"
              type="text"
              inputWidth="w-[200px] max-w-[300px]"
              min={1}
            />
            <InputControl
              title="Height"
              name="product_height"
              type="text"
              inputWidth="w-[200px] max-w-[300px]"
              min={1}
            />
            <InputControl
              title="Length"
              name="product_length"
              type="text"
              inputWidth="w-[200px] max-w-[300px]"
              min={1}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <div>
      <ProductTabs tabs={tabsData} />
    </div>
  );
};

export default OtherInformation;
