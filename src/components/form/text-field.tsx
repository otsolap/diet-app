import type { InputHTMLAttributes, Ref } from "react";

export function TextField({
  label,
  className,
  inputRef,
  ...input
}: {
  label: string;
  className: string;
  inputRef?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={className}>
      {label}
      <input {...input} ref={inputRef} />
    </label>
  );
}
