import { FormProvider as Form } from "react-hook-form";
import { useForm } from "react-hook-form";
import TabManager from "../TabManager";
import DropdownFilter from "@/components/DropdownFilter";
import {
  ChevronDown,
  LayoutGrid, ListFilter,
  Search,
  Table
} from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Filters = ({ viewMode, setViewMode }) => {
  const viewOptions = [
    { value: "table", label: "Table", icon: Table },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  const selectedView = viewOptions.find((v) => v.value === viewMode);
  const { showDrawer, hideDrawer } = useDrawer();

  const methods = useForm({
    defaultValues: {
      brand: [],
      model: [],
      variant: [],
    },
  });

  const { watch, register, handleSubmit, setValue } = methods;

  const onSubmit = (data) => {
    console.log("Applied Filters:", data);
    hideDrawer();
    // Your filter logic here
  };

  const FilterForm = ({ isDrawer = false }) => (
    <Form {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`${
          isDrawer
            ? "w-full grid gap-4"
            : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
        }`}
      >
        <DropdownFilter
          label="Brand"
          options={[
            { label: "Hyundai", value: "hyundai" },
            { label: "Kia", value: "kia" },
            { label: "Mercedes Benz", value: "mercedes" },
            { label: "Audi", value: "audi" },
            { label: "Land Rover", value: "landrover" },
            { label: "Nissan", value: "nissan" },
            { label: "BMW", value: "bmw" },
          ]}
          multiSelect
          value={watch("brand")}
          onChange={(val) => setValue("brand", val)}
        />

        <DropdownFilter
          label="Model"
          options={[
            { label: "Hyundai", value: "hyundai" },
            { label: "Kia", value: "kia" },
            { label: "Mercedes Benz", value: "mercedes" },
            { label: "Audi", value: "audi" },
            { label: "Land Rover", value: "landrover" },
            { label: "Nissan", value: "nissan" },
            { label: "BMW", value: "bmw" },
          ]}
          multiSelect
          value={watch("model")}
          onChange={(val) => setValue("model", val)}
        />

        <DropdownFilter
          label="Variant"
          options={[
            { label: "Hyundai", value: "hyundai" },
            { label: "Kia", value: "kia" },
            { label: "Mercedes Benz", value: "mercedes" },
            { label: "Audi", value: "audi" },
            { label: "Land Rover", value: "landrover" },
            { label: "Nissan", value: "nissan" },
            { label: "BMW", value: "bmw" },
          ]}
          multiSelect
          value={watch("variant")}
          onChange={(val) => setValue("variant", val)}
        />

        <div className="flex items-center gap-2 ml-auto">
          <Button size="lg" type="submit">
            Search
            <Search />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2 bg-transparent"
            >
              {selectedView?.icon && <selectedView.icon className="w-4 h-4" />}
              {/* {selectedView?.label} */}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup
              value={viewMode}
              onValueChange={setViewMode}
            >
              {viewOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center gap-2"
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </form>
    </Form>
  );

  return (
    <>
      <TabManager
        // availableTabs={AVAILABLE_TABS}
        initialTabs={[
          { key: "library", label: "Recently Add" },
          { key: "upcoming_bookings", label: "Upcoming Bookings" },
          { key: "available_cars", label: "Available Cars" },
          { key: "rented_cars", label: "Rented Cars" },
          { key: "maint_renewal", label: "Maint. & Renewal" },
        ]}
        allowClose={false}
        showAddView={false}
        onTabChange={(key) => console.log("Active Tab:", key)}
      />

      {/* Filter button (only visible below lg) */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            showDrawer({
              title: "Filter Model",
              size: "xl",
              content: <FilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Form visible on lg and above */}
      <div className="hidden lg:block">
        <FilterForm />
      </div>
    </>
  );
};

export default Filters;
