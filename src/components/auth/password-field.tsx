"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldLabel, Input } from "@/components/ui";

export function PasswordField({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  invalid,
  hint,
  autoComplete = "current-password",
  id = "password",
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  invalid?: boolean;
  hint?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        invalid={invalid}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {hint && <p className="mt-1.5 text-meta text-ink-muted">{hint}</p>}
    </div>
  );
}
