"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function UserPicker({
  label,
  selectedUser,
  onSelect,
  users = [],
  loadingListing,
  onSearch,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults(users);
      setIsSearching(false);
      return;
    }

    if (onSearch) {
      setIsSearching(true);
      try {
        const results = await onSearch(term);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      const filtered = users.filter(
        (user) =>
          `${user.first_name} ${user.last_name}`
            .toLowerCase()
            .includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  // Debounce logic here
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isOpen) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchTerm);
      }, 500);
    }

    return () => {
      clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, isOpen]);

  // Sync initial users
  useEffect(() => {
    if (isOpen && searchTerm.trim() === "") {
      setSearchResults(users);
    }
  }, [users, isOpen, searchTerm]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-primary transition-colors cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {selectedUser ? (
          <>
            <Image
              src={selectedUser.profile_image || "/images/avatar.jpg"}
              alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
              width={10}
              height={10}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <p className="font-medium">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon icon="mdi:account" className="text-gray-400 text-xl" />
            </div>
            <p>Select a user</p>
          </div>
        )}
        <Icon
          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
          className="ml-auto text-gray-400"
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div
            ref={wrapperRef}
            className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">
                {label || "Select User"}
              </h3>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <Icon
                  icon={isSearching ? "svg-spinners:180-ring" : "mdi:magnify"}
                  className="absolute left-2 top-3 text-gray-400"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {loadingListing || isSearching ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-gray-200 cursor-pointer transition-all flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user?.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md flex flex-col items-center text-center ${
                      selectedUser?.id === user?.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      onSelect(user);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <Image
                      src={user?.profile_image || "/images/avatar.jpg"}
                      alt={user?.first_name}
                      width={12}
                      height={12}
                      className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white shadow"
                    />
                    <p className="font-medium text-sm">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate w-full">
                      {user.email}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Icon
                    icon="mdi:account-remove"
                    className="text-3xl mx-auto mb-2"
                  />
                  <p>No users found</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
