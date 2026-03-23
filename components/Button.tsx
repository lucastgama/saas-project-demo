import React from "react";

type Variant = "primary" | "success" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-sm",
  success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
  outline: "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
