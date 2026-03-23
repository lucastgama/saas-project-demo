import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  children: React.ReactNode;
};

export default function Select({ label, error, className = "", id, children, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none appearance-none cursor-pointer
          ${error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"}
          bg-white ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
