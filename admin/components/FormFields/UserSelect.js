"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export default function UserSelect({
  label,
  icon,
  error,
  helperText,
  disabled,
  placeholder = " ",
  users = [],
  onSelect,
  selectedUser,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const modalRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter((user) =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (user) => {
    onSelect(user);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      <div
        className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition"
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedUser ? (
          <>
            <Image
              src={selectedUser.profile_image}
              alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
              width={8}
              height={8}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="font-medium text-sm">
                {selectedUser.first_name} {selectedUser.last_name}
              </div>
              <div className="text-xs text-gray-500">{selectedUser.email}</div>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 flex items-center">
            <Icon icon={icon || "mdi:account-outline"} className="mr-2" />
            {placeholder}
          </div>
        )}
      </div>

      {/* Modal style picker */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div
            ref={modalRef}
            className="bg-white max-w-md w-full rounded-lg shadow-lg p-4 relative"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>

            <div className="mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-auto space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleSelect(user)}
                  >
                    <Image
                      src={user.profile_image}
                      alt={user.first_name}
                      width={8}
                      height={8}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No users found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {helperText && !error && (
        <div className="text-xs text-gray-500 mt-1">{helperText}</div>
      )}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </>
  );
}
