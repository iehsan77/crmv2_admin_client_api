"use client"
import React from 'react'

export default function Modal({ isOpenModal, onClose, children }) {
    if (!isOpenModal) return null;
    return (
        <div>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                <div className="relative bg-white rounded-sm shadow-lg w-[500px] max-w-full p-6">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-1 right-2 text-gray-500 hover:text-gray-800"
                    >
                        ✕
                    </button>

                    {/* Modal Content */}
                    {children}
                </div>
            </div>
        </div>
    )
}
