// Local development
export const API_DOMAIN = "http://localhost:8006";

// Remote servers (uncomment as needed)
//export const API_DOMAIN = "http://164.92.102.85:8006";
//export const API_DOMAIN = "http://192.168.10.132:8006";
//export const API_DOMAIN = "http://192.168.1.198:8006";
//export const API_DOMAIN = "http://119.73.97.36:8006";

// SYSTEM CONSTANTS - starting
export const ACTIVE_OPTIONS = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];
export const NOIMAGE = "/images/image-placeholder-icon.png"; // rows per page
export const INDUSTRIES = [
  { value: "1", label: "Accounting" },
  { value: "2", label: "Advertising & Marketing" },
  { value: "3", label: "Agriculture" },
  { value: "4", label: "Automotive" },
  { value: "5", label: "Construction" },
  { value: "6", label: "Consulting" },
  { value: "7", label: "Consumer Goods" },
  { value: "8", label: "E-commerce" },
  { value: "9", label: "Education" },
  { value: "10", label: "Energy" },
  { value: "11", label: "Entertainment & Media" },
  { value: "12", label: "Financial Services" },
  { value: "13", label: "Government" },
  { value: "14", label: "Healthcare & Medical" },
  { value: "15", label: "Hospitality & Tourism" },
  { value: "16", label: "Human Resources" },
  { value: "17", label: "Information Technology" },
  { value: "18", label: "Legal" },
  { value: "19", label: "Logistics & Transportation" },
  { value: "20", label: "Manufacturing" },
  { value: "21", label: "Nonprofit & NGOs" },
  { value: "22", label: "Pharmaceuticals" },
  { value: "23", label: "Real Estate" },
  { value: "24", label: "Retail" },
  { value: "25", label: "Telecommunications" },
  { value: "26", label: "Utilities" },
  { value: "27", label: "Other" },
];

export const COMPANY_SIZES = [
  { value: "1-10 employees", label: "1-10 employees" },
  { value: "11-50 employees", label: "11-50 employees" },
  { value: "51-200 employees", label: "51-200 employees" },
  { value: "201-500 employees", label: "201-500 employees" },
  { value: "501-1,000 employees", label: "501-1,000 employees" },
  { value: "1,001-5,000 employees", label: "1,001-5,000 employees" },
  { value: "5,001-10,000 employees", label: "5,001-10,000 employees" },
  { value: "10,000+ employees", label: "10,000+ employees" },
];
export const LEADS_COLUMNS = [
  {
    title: "Title",
    slug: "title",
  },
  {
    title: "Lead Owner",
    slug: "lead_owner",
  },
  {
    title: "First Name",
    slug: "first_name",
  },
  {
    title: "Last Name",
    slug: "last_name",
  },
  {
    title: "Company",
    slug: "company",
  },
  {
    title: "Email",
    slug: "email",
  },
  {
    title: "Phone",
    slug: "phone",
  },
  {
    title: "Mobile",
    slug: "mobile",
  },
  {
    title: "Fax",
    slug: "fax",
  },
  {
    title: "Description",
    slug: "description",
  },
  {
    title: "Lead Source",
    slug: "lead_source",
  },
  {
    title: "Lead Status",
    slug: "lead_status",
  },
  {
    title: "Industry",
    slug: "industry",
  },
  {
    title: "Street",
    slug: "street",
  },
  {
    title: "City",
    slug: "city",
  },
  {
    title: "State",
    slug: "state",
  },
  {
    title: "Zip Code",
    slug: "zip_code",
  },
  {
    title: "Country",
    slug: "country",
  },
  {
    title: "website",
    slug: "website",
  },
  {
    title: "No. of Employees",
    slug: "no_of_employees",
  },
  {
    title: "Annual Revenue",
    slug: "annual_revenue",
  },
  {
    title: "Rating",
    slug: "rating",
  },
  {
    title: "Skype ID",
    slug: "skype_id",
  },
  {
    title: "Twitter",
    slug: "twitter",
  },
  {
    title: "Email Opt Out",
    slug: "email_opt_out",
  },
  {
    title: "Secondary Email",
    slug: "secondary_email",
  },
];
export const ALLWOED_IMAGE_TYPES = {
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
export const ALLWOED_FILE_TYPES = {
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};
export const USER_ROLES = [
  { value: "1", label: "Super Admin" },
  { value: "2", label: "Admin" },
  { value: "3", label: "Manager" },
  { value: "4", label: "Team Lead" },
  { value: "5", label: "Sales Executive" },
  { value: "6", label: "Marketing Executive" },
  { value: "7", label: "Support Agent" },
  { value: "8", label: "Accountant" },
  { value: "9", label: "HR" },
  { value: "10", label: "Developer" },
  { value: "11", label: "Client" },
  { value: "12", label: "Vendor" },
  { value: "13", label: "Guest" },
];
export const NATIONALITY = [
            { label: "American", value: "1" },
            { label: "Emirati", value: "2" },
          ];
export const COUNTRIES = [{ value: "1", label: "UAE" }];
export const STATES = [
  { value: "1", label: "Abu Dhabi" },
  { value: "2", label: "Ajman" },
  { value: "3", label: "Dubai" },
  { value: "4", label: "Fujairah" },
  { value: "5", label: "Ras Al Khaimah" },
  { value: "6", label: "Sharjah" },
  { value: "7", label: "Umm Al Quwain" },
];

// SYSTEM CONSTANTS - ending
