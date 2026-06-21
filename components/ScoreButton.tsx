"use client";

import { ReactNode } from "react";

interface ScoreButtonProps {
  label: string;
  sublabel?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "stat" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

const variantClasses: Record<NonNullable<ScoreButtonProps["variant"]>, string> = {
  primary:
    "bg-apple-blue text-white shadow-apple hover:bg-[#0066DD] active:scale-[0.98]",
  secondary:
    "bg-white text-apple-gray-900 shadow-apple border border-apple-gray-100 hover:bg-apple-gray-50 active:scale-[0.98]",
  stat:
    "bg-apple-gray-50 text-apple-gray-600 border border-apple-gray-100 hover:bg-white hover:border-apple-gray-200 active:scale-[0.97]",
  danger:
    "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 active:scale-[0.98]",
  ghost:
    "bg-transparent text-apple-blue hover:bg-apple-blue/5 active:scale-[0.98]",
};

const sizeClasses: Record<NonNullable<ScoreButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg min-h-[32px]",
  md: "px-4 py-2.5 text-sm rounded-apple min-h-[44px]",
  lg: "px-6 py-4 text-base rounded-apple-lg min-h-[56px]",
  xl: "px-8 py-6 text-lg rounded-apple-lg min-h-[80px]",
};

export default function ScoreButton({
  label,
  sublabel,
  onClick,
  type = "button",
  variant = "secondary",
  size = "md",
  disabled = false,
  active = false,
  className = "",
  children,
}: ScoreButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex flex-col items-center justify-center font-medium transition-all duration-150 select-none touch-manipulation",
        "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        active ? "ring-2 ring-apple-blue ring-offset-2" : "",
        className,
      ].join(" ")}
    >
      {children ?? (
        <>
          <span className="leading-tight">{label}</span>
          {sublabel && (
            <span className="text-[11px] font-normal opacity-70 mt-0.5">{sublabel}</span>
          )}
        </>
      )}
    </button>
  );
}
