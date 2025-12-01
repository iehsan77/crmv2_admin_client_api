// components/SubmitBtn.jsx

import { Logout } from "@/helper/ServerSideActions";

import { FaSignOutAlt } from "react-icons/fa";

import { auth_endpoints } from "@/utils/auth_endpoints";
import { POST } from "@/helper/ServerSideActions";

import { handleResponse } from "@/helper/ClientSideActions";

export default function LogoutBtn({ label }) {
  const logout = async () => {
    try {

      const response = await POST(auth_endpoints?.auth?.logout);

      if (response?.status === 200) {
        await Logout();
      } else {
        handleResponse(response);
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={() => logout()}
      className="w-full px-4 py-2 bg-gray-100 text-black rounded-md flex justify-between items-center cursor-pointer border border-[#efefef]"
    >
      {label && <span>Logout</span>}
      <FaSignOutAlt className="ml-2" /> {/* Logout icon on the right */}
    </button>
  );
}
