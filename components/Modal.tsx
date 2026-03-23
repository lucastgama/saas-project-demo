"use client";

import React from "react";
import Button from "./Button";

type Props = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "success";
  children: React.ReactNode;
};

export default function Modal({
  isOpen,
  title,
  onClose,
  onConfirm,
  confirmLabel = "Confirmar",
  confirmVariant = "primary",
  children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>
        <div className="text-sm text-slate-600 mb-6">{children}</div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
