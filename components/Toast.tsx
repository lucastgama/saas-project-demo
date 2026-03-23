"use client";

import React, { useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

const colors = {
  success: "bg-emerald-50 border-emerald-300 text-emerald-800",
  error: "bg-red-50 border-red-300 text-red-800",
  info: "bg-blue-50 border-blue-300 text-blue-800",
};

const icons = {
  success: "",
  error: "❌",
  info: "ℹ️",
};

export default function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-100 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>
        <span>{icons[type]}</span>
        {message}
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
