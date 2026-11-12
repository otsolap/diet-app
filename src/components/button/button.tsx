import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

export const primaryButtonClass = `${styles.button} ${styles.primary}`;

export function Button({
  variant = "primary",
  className,
  type = "submit",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const variantClass = variant === "secondary" ? styles.secondary : styles.primary;
  const classes = className ? `${styles.button} ${variantClass} ${className}` : `${styles.button} ${variantClass}`;

  return <button className={classes} type={type} {...props} />;
}
