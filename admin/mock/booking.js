export const MOCK_BOOKING_RECORD = [{
    id: 101,
    is_company: "0",
    company_id: 0,
    company_name: "",
    contact_person: "",
    trade_license: "",
    old_trade_license: "",
    trade_license_no: "",
    trade_license_expiry: "",
    owner_document: "",
    old_owner_document: "",
    contact_cnic: "",
    contact_cnic_expiry: "",
    country_id: 168, // e.g. Pakistan

    // Individual fields
    customer_id: 555,
    first_name: "Ali",
    last_name: "Khan",
    driving_license: "",
    old_driving_license: "https://dummyserver.com/uploads/licence.jpg",
    driving_license_no: "DL-987654",
    driving_license_expiry: "2027-06-30T00:00:00.000Z",
    registration_document: "",
    old_registration_document: "https://dummyserver.com/uploads/registration.pdf",
    passport_id: "PK1234567",
    passport_expiry: "2030-01-01T00:00:00.000Z",
    visa_no: "VISA12345",
    visa_expiry: "2028-09-01T00:00:00.000Z",
    nationality: 168, // Pakistan

    // Contact
    contact: "+92-300-1234567",
    email: "ali.khan@example.com",
    address1: "123 Main Street",
    address2: "Gulshan Block",
    postal_code: "74000",

    // Vehicle
    vehicle_id: 202,
    vehicle_registration_no: "REG-5678",
    number_plate: "ABC-1234",
    exterior_color_id: "red",
    interior_color_id: "black",
    fuel_type_id: 1, // Petrol
    fuel_level_id: 3, // Half Tank
    exterior_condition_id: 1, // Excellent
    interior_condition_id: 2, // Good
    tyre_condition_id: 1, // New
    spare_tyre: 1, // Yes
    toolkit: 1, // Available
    mileage_at_pickup: "32000",
    mileage_limit: "35000",
    pickup_time: "2025-09-20T09:00:00.000Z",
    return_time: "2025-09-25T18:00:00.000Z",
    pickup_location: "Karachi Airport",
    dropoff_location: "Karachi Saddar Office",

    // Payment
    rent_price: "5000",
    number_of_days: "5",
    security_deposit: "20000",
    payment_method: 1, // Credit Card
    payment_status: 1, // Paid
    total_rent_amount: "25000",

    // Confirmation
    confirm_booking: true,

    // Delivery
    handover_by: "Ahmed",
    vehicle_delivery_images: "",
    old_vehicle_delivery_images: [
        "https://dummyserver.com/uploads/vehicle_front.jpg",
        "https://dummyserver.com/uploads/vehicle_back.jpg",
    ],
    received_by_customer: "Ali Khan",
    confirm_booking_delivery: true,

    // Return
    received_by_staff: "Bilal",
    return_vehicle_images: "",
    old_return_vehicle_images: [
        "https://dummyserver.com/uploads/vehicle_return_front.jpg",
        "https://dummyserver.com/uploads/vehicle_return_back.jpg",
    ],
    received_from: "Ali Khan",
    confirm_booking_return: true,
}];