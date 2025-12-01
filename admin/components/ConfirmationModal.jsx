"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import Button from "./Button";

const buttonStyles = {
  delete: "!bg-red-600 hover:!bg-red-700 !text-white",
  approve: "!bg-green-600 hover:!bg-green-700 !text-white",
  reject: "!bg-yellow-500 hover:!bg-yellow-600 !text-white",
  default: "!bg-blue-600 hover:!bg-primary !text-white",
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  icon = "mdi:alert",
  iconColor = "text-red-500",
  type = "default",
  isSubmitting,
}) {
  const confirmBtnClass = buttonStyles[type] || buttonStyles.default;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      if (!isSubmitting) {
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center">
            <Icon icon={icon} className={`w-10 h-10 ${iconColor}`} />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="lg"
            type="button"
            className="bg-transparent"
            onClick={onClose}
            disabled={isSubmitting}
            >
            {cancelText}
          </Button>
          <Button
            size="lg"
            type="button"
            isSubmitting={isSubmitting}
            className={confirmBtnClass}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
