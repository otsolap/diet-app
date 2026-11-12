"use client";

import { useId, useRef, type MouseEvent } from "react";
import { Button } from "@/src/components/button/button";
import { TextField } from "@/src/components/form/text-field";
import styles from "@/app/foods/foods.module.css";

export function PortionDialog({
  foodId,
  portionName,
  portionGrams,
}: {
  foodId: number;
  portionName: string;
  portionGrams: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const gramsRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    if (nameRef.current) {
      nameRef.current.value = portionName;
    }
    if (gramsRef.current) {
      gramsRef.current.value = portionGrams;
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
      <Button className={styles.save} type="button" onClick={open}>
        Save a portion
      </Button>
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
          <TextField
            inputRef={nameRef}
            className={styles.field}
            label="Name"
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Teaspoon"
          />
          <TextField
            inputRef={gramsRef}
            className={styles.field}
            label="Grams"
            name="grams"
            type="number"
            required
            min={0.1}
            max={9999}
            step={0.1}
            placeholder="5"
          />
          <Button className={styles.submit}>Save portion</Button>
        </form>
      </dialog>
    </>
  );
}
