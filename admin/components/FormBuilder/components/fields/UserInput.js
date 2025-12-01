"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

import Image from "next/image";

export default function UserInput({
  title,
  icon,
  error,
  helperText,
  tooltip,
  required,
  users = [],
  ...props
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>

      <div
        className={`relative rounded-md shadow-sm border border-gray-300 bg-white transition-all duration-200  ${
          required
            ? "border-l-red-400 border-l-3 focus-within:border-y-blue-500 focus-within:border-r-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-y-gray-400 group-hover:border-r-gray-400"
            : "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-gray-400"
        } ${error ? "border-red-500" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon
            icon={icon}
            className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
          />
        </div>
        {selectedUser ? (
          <div className="flex items-center pl-10 pr-10 py-2">
            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              {selectedUser.avatar ? (
                <Image
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  fill
                  style="h-full w-full rounded-full"
                />
              ) : (
                <span className="text-xs text-gray-600">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-gray-900 text-sm">{selectedUser.name}</span>
            <button
              type="button"
              className="absolute right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSelectedUser(null);
                setSearchTerm("");
              }}
            >
              <Icon icon="mdi:close" className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              className="text-sm block w-full pl-10 pr-10 py-2 rounded-md bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
              placeholder="Search users..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" />
            </div>
          </>
        )}
        {isOpen && !selectedUser && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center"
                  onMouseDown={() => {
                    setSelectedUser(user);
                    setIsOpen(false);
                  }}
                >
                  <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        style="h-full w-full rounded-full"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {user.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
      <input type="hidden" value={selectedUser?.id || ""} {...props} />

      {/* Helper Text */}
      {helperText && !error && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}

      {/* Error Message */}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}
