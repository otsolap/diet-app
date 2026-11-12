"use client";

import { useId, useRef, type MouseEvent } from "react";
import { primaryButtonClass } from "@/src/components/button/button";
import styles from "../foods.module.css";

export function PortionDialog({ foodId }: { foodId: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  }

  return (
    <>
      <button className={`${primaryButtonClass} ${styles.save}`} type="button" onClick={open}>
        Save a portion
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClick={closeOnBackdrop}
      >
        <div className={styles.dialogHeader}>
          <h2 id={titleId} className={styles.portionTitle}>
            Save a portion
          </h2>
          <button className={styles.dialogClose} type="button" onClick={close}>
            Close
          </button>
        </div>
        <form className={styles.portionForm} method="post" action="/api/portions">
          <input type="hidden" name="foodId" value={foodId} />
          <label className={styles.field}>
            Name
            <input name="name" type="text" required maxLength={80} placeholder="Teaspoon" />
          </label>
          <label className={styles.field}>
            Grams
            <input
              name="grams"
              type="number"
              required
              min={0.1}
              max={9999}
              step={0.1}
              placeholder="5"
            />
          </label>
          <button className={`${primaryButtonClass} ${styles.submit}`} type="submit">
            Save portion
          </button>
        </form>
      </dialog>
    </>
  );
}
