import { API_DOMAIN } from "@/constants/general_constants";

export const rentify_endpoints = {
  rentify: {
    brands: {
      get: `${API_DOMAIN}/rentify/library/brands/get`,

      getForDropdown: `${API_DOMAIN}/rentify/library/brands/dropdown`,

      save: `${API_DOMAIN}/rentify/library/brands/save`,
      SelectForTenant: `${API_DOMAIN}/rentify/library/brands/select-for-tenant`,
      UnselectForTenant: `${API_DOMAIN}/rentify/library/brands/unselect-for-tenant`,
      delete: (id) => `${API_DOMAIN}/rentify/library/brands/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/library/brands/${id}/deleted/0`,
    },
    models: {
      get: `${API_DOMAIN}/rentify/library/models/get`,

      getForDropdown: `${API_DOMAIN}/rentify/library/model/dropdown`,

      save: `${API_DOMAIN}/rentify/library/models/save`,
      SelectForTenant: `${API_DOMAIN}/rentify/library/models/select-for-tenant`,
      UnselectForTenant: `${API_DOMAIN}/rentify/library/models/unselect-for-tenant`,
      delete: (id) => `${API_DOMAIN}/rentify/library/models/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/library/models/${id}/deleted/0`,
    },
    variants: {
      get: `${API_DOMAIN}/rentify/library/variants/get`,
      save: `${API_DOMAIN}/rentify/library/variants/save`,
      SelectForTenant: `${API_DOMAIN}/rentify/library/variants/select-for-tenant`,
      UnselectForTenant: `${API_DOMAIN}/rentify/library/variants/unselect-for-tenant`,
      delete: (id) => `${API_DOMAIN}/rentify/library/variants/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/library/variants/${id}/deleted/0`,
    },
    features: {
      get: `${API_DOMAIN}/rentify/library/features/get`,
      save: `${API_DOMAIN}/rentify/library/features/save`,
      SelectForTenant: `${API_DOMAIN}/rentify/library/features/select-for-tenant`,
      UnselectForTenant: `${API_DOMAIN}/rentify/library/features/unselect-for-tenant`,
      delete: (id) => `${API_DOMAIN}/rentify/library/features/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/library/features/${id}/deleted/0`,
    },
    bodyTypes: {
      get: `${API_DOMAIN}/rentify/library/body-types/get`,
      save: `${API_DOMAIN}/rentify/library/body-types/save`,
      SelectForTenant: `${API_DOMAIN}/rentify/library/body-types/select-for-tenant`,
      UnselectForTenant: `${API_DOMAIN}/rentify/library/body-types/unselect-for-tenant`,
      delete: (id) =>
        `${API_DOMAIN}/rentify/library/body-types/${id}/deleted/1`,
      restore: (id) =>
        `${API_DOMAIN}/rentify/library/body-types/${id}/deleted/0`,
    },
    vehicles: {
      getStatistics: `${API_DOMAIN}/rentify/vehicles/statistics/get`,
      getVehiclesStatus: `${API_DOMAIN}/rentify/vehicles/status/get`,

      getOverviewStats: `${API_DOMAIN}/rentify/vehicles/overview-statistics/get`,
      getBusinessOverviewChartData: `${API_DOMAIN}/rentify/vehicles/overview/get-business-overview-chart-data`,
      getBookingStatusChartData: `${API_DOMAIN}/rentify/vehicles/overview/get-booking-status-chart-data`,

      getRecentActivity: `${API_DOMAIN}/rentify/vehicles/get-recent-activity`,

      get: `${API_DOMAIN}/rentify/vehicles/get`,
      save: `${API_DOMAIN}/rentify/vehicles/save`,
      changeActiveStatus: `${API_DOMAIN}/rentify/vehicles/change-active-status`,
      delete: (id) => `${API_DOMAIN}/rentify/vehicles/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/vehicles/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/rentify/vehicles/${id}/favorite/${v}`,

      deleteOldImage: (id) =>
        `${API_DOMAIN}/rentify/vehicles/images/delete/${id}`,
      deleteOldDocument: (id) =>
        `${API_DOMAIN}/rentify/vehicles/documents/delete/${id}`,

      getVehicle: (id) => `${API_DOMAIN}/rentify/vehicles/details/get/${id}`,
    },
    bookings: {
      getStatistics: `${API_DOMAIN}/rentify/bookings/get-statistics`,
      getBookingsStatus: `${API_DOMAIN}/rentify/bookings/get-status`,
      get: `${API_DOMAIN}/rentify/bookings/get`,
      save: `${API_DOMAIN}/rentify/bookings/save`,
      deliverySave: `${API_DOMAIN}/rentify/bookings/delivery/save`,
      returnSave: `${API_DOMAIN}/rentify/bookings/return/save`,

      favorite: (id, v) => `${API_DOMAIN}/rentify/bookings/${id}/favorite/${v}`,
    },
    payments: {
      get: `${API_DOMAIN}/rentify/payments/get`,
      save: `${API_DOMAIN}/rentify/bookings/payments/save`,
      refundRequest: `${API_DOMAIN}/rentify/bookings/refund-request`,
    },
    customers: {
      get: `${API_DOMAIN}/rentify/customers/get`,
      getDetails: (id) => `${API_DOMAIN}/rentify/customers/get-details/${id}`,

      getNotes: (id) => `${API_DOMAIN}/rentify/customers/get-notes/${id}`,
      saveNote: `${API_DOMAIN}/rentify/customers/profile/add_note`,

      getAttachements: (id) =>
        `${API_DOMAIN}/rentify/customers/get-attachments/${id}`,
      saveAttachements: `${API_DOMAIN}/rentify/customers/profile/add_attachment`,
    },
    affiliates: {
      getStatistics: `${API_DOMAIN}/rentify/affiliates/get-statistics`,
      get: `${API_DOMAIN}/rentify/affiliates/get`,
      getDetails: (id) =>
        `${API_DOMAIN}/rentify/affiliates/get-profile-details/${id}`,

      //getBookingHistory: (id) => `${API_DOMAIN}/rentify/affiliates/get-profile-details/${id}/booking-history/filters`,
      getBookingHistory: `${API_DOMAIN}/rentify/affiliates/get-profile-details/booking-history`,
      getBookingHistoryPayload: (id) =>
        `${API_DOMAIN}/rentify/affiliates/get-profile-details/${id}/booking-history/payload-data`,

      save: `${API_DOMAIN}/rentify/affiliates/save`,
      changeActiveStatus: `${API_DOMAIN}/rentify/affiliates/change-active-status`,
      delete: (id) => `${API_DOMAIN}/rentify/affiliates/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/rentify/affiliates/${id}/deleted/0`,
      favorite: (id, v) =>
        `${API_DOMAIN}/rentify/affiliates/${id}/favorite/${v}`,

      deleteOldImage: (id) =>
        `${API_DOMAIN}/rentify/affiliates/documents/delete/${id}`,

      getNotes: (id) => `${API_DOMAIN}/rentify/affiliates/get-notes/${id}`,
      saveNote: `${API_DOMAIN}/rentify/affiliates/profile/add_note`,

      getAttachements: (id) =>
        `${API_DOMAIN}/rentify/affiliates/get-attachments/${id}`,
      saveAttachements: `${API_DOMAIN}/rentify/affiliates/profile/add_attachment`,
    },
  },
};
