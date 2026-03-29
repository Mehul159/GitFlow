import React from "react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function BaseModal({ isOpen, onClose, title, children, size = "md" }: BaseModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizeClasses[size]} rounded-xl border border-orange-500/30 bg-neutral-900 p-6 shadow-2xl`}>
        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

interface ModalButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "warning";
  disabled?: boolean;
  children: React.ReactNode;
}

export function ModalButton({ onClick, variant = "primary", disabled, children }: ModalButtonProps) {
  const variantClasses = {
    primary: "bg-orange-500 hover:bg-orange-600",
    secondary: "border border-neutral-700 text-neutral-300 hover:bg-neutral-800",
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-amber-500 hover:bg-amber-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}

interface ModalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function ModalInput({ value, onChange, placeholder, label, autoFocus, onKeyDown }: ModalInputProps) {
  return (
    <div className="mb-4">
      {label && <label className="mb-1 block text-sm text-neutral-400">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
    </div>
  );
}

interface ModalCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function ModalCheckbox({ checked, onChange, label, disabled }: ModalCheckboxProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-sm ${disabled ? "text-neutral-500" : "text-neutral-300"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
      />
      {label}
    </label>
  );
}

interface ModalActionsProps {
  children: React.ReactNode;
}

export function ModalActions({ children }: ModalActionsProps) {
  return <div className="flex justify-end gap-2 pt-4">{children}</div>;
}
