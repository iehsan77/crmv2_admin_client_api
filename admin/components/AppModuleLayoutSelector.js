"use client";

import { FormProvider, useWatch } from "react-hook-form";
import SelectControl from "@/components/FormControls/SelectControl";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

const AppModuleLayoutSelector = ({
  methods,
  apps,
  getModulesByAppId,
  layoutsList,
  loading,
}) => {
  // watch app selection using useWatch inside FormProvider
  const appId = useWatch({ control: methods.control, name: "app" })?.value;

  const selects = [
    {
      label: "App",
      name: "app",
      options: getDropdownFormattedData(apps),
      isLoading: loading.app,
      placeholder: "--select app--",
    },
    {
      label: "Module",
      name: "module",
      options: getDropdownFormattedData(getModulesByAppId(appId)),
      isLoading: loading.module,
      placeholder: "--select module--",
    },
    {
      label: "Layout",
      name: "layout",
      options: getDropdownFormattedData(layoutsList),
      isLoading: loading.layout,
      placeholder: "--select layout--",
    },
  ];

  return (
    <FormProvider {...methods}>
      <div className="flex items-center gap-4">
        {selects.map(({ label, name, options, isLoading, placeholder }) => (
          <div key={name} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <SelectControl
              name={name}
              placeholder={placeholder}
              options={options}
              isLoading={isLoading}
            />
          </div>
        ))}
      </div>
    </FormProvider>
  );
};

export default AppModuleLayoutSelector;
