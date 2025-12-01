import Admin from "@/components/Layout/Admin/Admin";
import Providers from "./providers";
import { DrawerProvider } from "@/context/drawer-context";
// import { BookingProvider } from "@/context/booking-context";

export default function AdminLayout({ children }) {
  return (
    <Admin>
      <DrawerProvider>
          <Providers>{children}</Providers>
      </DrawerProvider>
    </Admin>
  );
}
