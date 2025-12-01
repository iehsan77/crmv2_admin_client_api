// =====================================
//  RENTIFY - Starting
// =====================================
// Vehicles - starting
export const VEHICLES_STATUS = [
  { label: "Available", value: "1" },
  { label: "Rented", value: "2" },
  { label: "Under Maintenance", value: "3" },
  { label: "Under Inspection", value: "4" },
  { label: "Unavailable", value: "5" },
  { label: "Inactive / Decommissioned", value: "6" },
  { label: "Booked", value: "7" },
];
export const LAST_ACTIVITY = [
  { label: "Last 24 Hours", value: "last_24_hours" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
];
export const VEHICLES_CONDITIONS = [
  { label: "New", value: "1" },
  { label: "Used", value: "2" },
];
export const VEHICLES_TRANSMISSIONS = [
  { label: "Manual", value: "1" },
  { label: "Automatic", value: "2" },
  { label: "Dual", value: "3" },
  { label: "Intelligen Variable", value: "4" },
];
export const VEHICLES_SEATS = [
  { label: "2 Seats", value: "2" },
  { label: "5 Seats", value: "5" },
  { label: "7 Seats", value: "7" },
  { label: "8 Seats", value: "8" },
  { label: "15 Seats", value: "15" },
];
export const VEHICLES_FUEL_TYPES = [
  { label: "Petrol", value: "1" },
  { label: "Diesel", value: "2" },
  { label: "CNG", value: "3" },
  { label: "PLG", value: "4" },
  { label: "Hybrid", value: "5" },
  { label: "Plug-in Hybrid", value: "6" },
  { label: "Electric", value: "7" },
  { label: "Hydrogen Fuel Cell", value: "8" },
];
export const VEHICLES_COLORS = [
  { label: "Black", value: "1" },
  { label: "White", value: "2" },
  { label: "Blue", value: "3" },
  { label: "Red", value: "4" },
  { label: "Green", value: "5" },
  { label: "Purple", value: "6" },
  { label: "Orange", value: "7" },
  { label: "Brown", value: "8" },
];
export const VEHICLES_AVAILABLE_VIEWS = [
  {
    title: "Availability & Booking Status",
    options: [
      { label: "All Cars", value: "all_cars", default: true },
      { label: "Available for Rent", value: "available_for_rent" },
      { label: "Rented Cars", value: "rented_cars" },
      { label: "Cancelled", value: "cancelled" },
      { label: "Pending Bookings", value: "pending_bookings" },
    ],
  },
  {
    title: "Ownership & Activity",
    options: [
      { label: "Affiliate Cars", value: "affiliate_cars", default: true },
      { label: "Active Cars", value: "active_cars", default: true },
      { label: "Inactive Cars", value: "inactive_cars", default: true },
      { label: "My Cars", value: "my_cars", default: true },
      { label: "Favorite Cars", value: "favourit_cars" },
      { label: "Recently Updated", value: "recently_updated" },
      { label: "No Recent Activity", value: "no_recent_activity" },
    ],
  },
];
export const VEHICLES_INITIAL_VIEWS = VEHICLES_AVAILABLE_VIEWS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
export const VEHICLES_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Vehicle ID", value: "vehicle_id" },
      { label: "Vehicle Name", value: "title" },
      { label: "Rent Price", value: "rent_price" },
      { label: "Status", value: "status_id", default: true },
      { label: "Last Activity", value: "last_activity", default: true },
      { label: "Brand", value: "brand_id", default: true },
      { label: "Model", value: "model_id", default: true },
      { label: "Variant", value: "variant_id", default: true },
      { label: "Transmission Type", value: "transmission_type_id", default: true },
      { label: "Seats", value: "seats" },
      { label: "Fuel Type", value: "fuel_type_id" },
    ],
  },
];
export const VEHICLES_INITIAL_FILTERS = VEHICLES_AVAILABLE_FILTERS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
export const OVERVIEW_AVAILABLE_VIEWS = [
  {
    title: "Availability & Booking Status",
    options: [
      { label: "Recently Add", value: "recently_added" },
      { label: "Upcoming Bookings", value: "upcoming_bookings" },
      { label: "Available Cars", value: "available_cars" },
      { label: "Rented Cars", value: "rented_cars" },
      { label: "Maint. Renewal", value: "maintainance_renewal" },
    ],
  },
];
export const OVERVIEW_INITIAL_VIEWS = [
  { label: "Recently Add", value: "recently_added" },
  { label: "Upcoming Bookings", value: "upcoming_bookings" },
  { label: "Available Cars", value: "available_cars" },
  { label: "Rented Cars", value: "rented_cars" },
  { label: "Maint. Renewal", value: "maintainance_renewal" },
];
export const OVERVIEW_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Brand", value: "brand_id" },
      { label: "Model", value: "model_id" },
      { label: "Body Type", value: "body_type_id" },
    ],
  },
];
export const OVERVIEW_INITIAL_FILTERS = [
  { label: "Brand", value: "brand_id" },
  { label: "Model", value: "model_id" },
  { label: "Variant", value: "variant_id" },
];
// Vehicles - ending

// Affiliates - starting
export const AFFILIATE_AVAILABLE_VIEWS = [
  {
    title: "General",
    options: [
      { label: "All Affiliates", value: "all_affiliates" },
      { label: "Favorites Affiliates", value: "favorites_affiliates" },
      { label: "Active Affiliates", value: "active_affiliates" },
      { label: "Inactive Affiliates", value: "inactive_affiliates" },
      { label: "High Vehicle Capacity", value: "high_vehicle_capacity" },
      { label: "Top Performing", value: "top_performing" },
    ],
  },
  {
    title: "By Status",
    options: [
      { label: "Newly Added", value: "newly_added" },
      { label: "Recently Updated", value: "recently_updated" },
      { label: "Document Expiring Soon", value: "document_expiring_soon" },
    ],
  },
  {
    title: "By Performance",
    options: [
      { label: "High Bookings Volume", value: "high_bookings_volume" },
      { label: "Low Bookings Volume", value: "low_bookings_volume" },
      { label: "No Bookings in Range", value: "no_bookings_in_range" },
    ],
  },
];
export const AFFILIATE_INITIAL_VIEWS = [
  { label: "All Affiliates", value: "all_affiliates" },
  { label: "Favorites Affiliates", value: "favorites_affiliates" },
  { label: "Active Affiliates", value: "active_affiliates" },
  { label: "Inactive Affiliates", value: "inactive_affiliates" },
];
export const AFFILIATE_TYPES = [
  { label: "0-2 Cars", value: "1" },
  { label: "2-5 Cars", value: "2" },
  { label: "5+ Cars", value: "3" },
];
export const AFFILIATE_COMMISSION_TYPES = [
  { label: "Revenue Share", value: "1" },
  { label: "Percentage", value: "2" },
];
export const CURRENCIES = [
  { label: "AED", value: "1" },
  { label: "USD", value: "2" },
];
// Affiliates - ending

// Booking - starting
export const BOOKINGS_AVAILABLE_VIEWS = [
  {
    title: "General",
    options: [
      { label: "All Bookings", value: "all_bookings" },
      { label: "My Bookings", value: "my_bookings" },
      /*
      { label: "Active Cars", value: "active_cars" },
      { label: "Inactive Cars", value: "inactive_cars" },
      */
      { label: "Favorite", value: "favorite" },
    ],
  },
  {
    title: "By Payment",
    options: [
      { label: "Fully Paid", value: "fully_paid" },
      { label: "Unpaid", value: "unpaid" },
      { label: "Only Deposit Paid", value: "deposit_paid" },
      { label: "Refunded", value: "refunded" },
    ],
  },
  {
    title: "Returns",
    options: [
      { label: "Overdue Returns", value: "overdue_returns" },
      { label: "Returning Today", value: "returning_today" },
    ],
  },
];
export const BOOKINGS_INITIAL_VIEWS = [
  { label: "All Bookings", value: "all_bookings" },
  { label: "My Bookings", value: "my_bookings" },
  { label: "Favorite", value: "favorite" },
];
export const BOOKINGS_AVAILABLE_FILTERS = [
  {
    title: "Booking Details",
    options: [
      { label: "Booking ID", value: "booking_uid", default: true },
      { label: "Booking Status", value: "booking_status_id", default: true },
      { label: "Booking Date", value: "pickup_time", default: true },
      { label: "Last Activity", value: "last_activity", default: true },
      // { label: "Active Cars", value: "active_cars" },
      // { label: "Inactive Cars", value: "inactive_cars" },
    ],
  },
  {
    title: "Customer Information",
    options: [
      { label: "Client Name", value: "client_name" },
      { label: "Client Phone", value: "client_phone" },
      { label: "Client Email", value: "client_email" },
    ],
  },
  {
    title: "Vehicle Information",
    options: [
      { label: "Vehicle Model", value: "model_id" },
      { label: "Vehicle Body Type", value: "body_type_id" },
    ],
  },
  {
    title: "Payment & Finance",
    options: [{ label: "Rental Fee", value: "rent_price" }],
  },
];
export const BOOKINGS_INITIAL_FILTERS = BOOKINGS_AVAILABLE_FILTERS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
export const BOOKING_STATUSES = [
  { label: "Pending", value: "1" },
  { label: "Confirmed", value: "2" },
  { label: "Delivered", value: "3" },
  { label: "Return", value: "4" },
  { label: "Closed - Won", value: "5" },
  { label: "Cancelled", value: "6" },
  
];
export const PAYMENT_STATUSES = [
  { label: "Pending", value: "1" },
  { label: "Completed", value: "2" },
  { label: "Refunded", value: "3" },
];
export const SECURITY_DEPOSIT_STATUSES = [
  { label: "Pending", value: "1" },
  { label: "Completed", value: "2" },
  { label: "Refunded", value: "3" },
];
export const PAYMENT_METHODS = [
  { label: "Cash", value: "1" },
  { label: "Credit Card", value: "2" },
  { label: "Bank Transfer", value: "3" },
];
export const REFUND_REASONS = [
  { label: "Booking Cancelled", value: "1" },
  { label: "Service Not Provided", value: "2" },
  { label: "Other", value: "3" },
];
export const BOOKING_REFUND_REQUESTS_STATUSES = [
  { label: "Requested", value: "1" },
  { label: "Under Verification", value: "2" },
  { label: "Approved", value: "3" },
  { label: "Rejected", value: "4" },
  { label: "In Process", value: "5" },
  { label: "Completed", value: "6" },
  { label: "Failed", value: "7" },
  { label: "Closed", value: "8" },
];
// Booking - ending

// =====================================
//  RENTIFY - Ending
// =====================================
