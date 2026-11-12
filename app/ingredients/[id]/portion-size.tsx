"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import styles from "@/app/foods/foods.module.css";
import { primaryButtonClass } from "@/src/components/button/button";
import { PortionDialog } from "./portion-dialog";
import type { FoodNutrientBasis, FoodUnitChoice } from "@/src/lib/food-search";

function weightLabel(grams: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(grams);
  return `${text} g`;
}

function amountLabel(value: number) {
  const text = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
  return `${text} g`;
}

function customGrams(value: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return null;
  }

  const grams = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(grams) || grams <= 0 || grams > 9999) {
    return null;
  }

  return grams;
}

function energyText(kcal: number) {
  return `${new Intl.NumberFormat("en").format(kcal)} kcal`;
}

function hundredLabel(kcalPer100: number | null) {
  if (kcalPer100 === null) {
    return "100 g";
  }

  return `100 g (${energyText(kcalPer100)})`;
}

function energyLabel(kcal: number | null, grams: number, per100: boolean) {
  if (kcal === null) {
    return "No energy value";
  }

  if (per100) {
    return `${energyText(kcal)} per 100 g`;
  }

  return `${energyText(kcal)} for ${weightLabel(grams)}`;
}

export function PortionSize({
  foodId,
  signedIn,
  kcalPer100,
  units,
  nutrients,
  children,
}: {
  foodId: number;
  signedIn: boolean;
  kcalPer100: number | null;
  units: FoodUnitChoice[];
  nutrients: FoodNutrientBasis[];
  children?: ReactNode;
}) {
  const [choice, setChoice] = useState("100");
  const [custom, setCustom] = useState("");
  const selected = units.find((unit) => unit.code === choice);
  const typed = choice === "custom" ? customGrams(custom) : null;
  const grams = selected ? selected.grams : typed ?? 100;
  const per100 = choice === "100" || (choice === "custom" && typed === null);
  const kcal = kcalPer100 === null ? null : Math.round((kcalPer100 * grams) / 100);
  const savedName = selected ? selected.label.replace(/ \(.*\)$/, "") : weightLabel(grams);
  const savedGrams = new Intl.NumberFormat("en", { maximumFractionDigits: 2, useGrouping: false }).format(grams);

  return (
    <>
      <label className={styles.field}>
        Portion size
        <select value={choice} onChange={(event) => setChoice(event.target.value)}>
          {units.map((unit) => (
            <option key={unit.code} value={unit.code}>
              {unit.label}
            </option>
          ))}
          <option value="100">{hundredLabel(kcalPer100)}</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {choice === "custom" ? (
        <label className={styles.field}>
          Grams
          <input
            type="number"
            inputMode="decimal"
            min={0.1}
            max={9999}
            step={0.1}
            value={custom}
            placeholder="5"
            onChange={(event) => setCustom(event.target.value)}
          />
        </label>
      ) : null}
      {choice === "custom" && typed === null ? (
        <p className={styles.hint}>Enter a weight in grams.</p>
      ) : null}
      <p className={styles.kcal}>{energyLabel(kcal, grams, per100)}</p>
      {nutrients.length > 0 ? (
        <div className={styles.detail}>
          <table className={styles.nutrients}>
            <thead>
              <tr>
                <th className={styles.heading} scope="col">
                  Macro
                </th>
                <th className={styles.headingValue} scope="col">
                  Grams
                </th>
                <th className={styles.headingValue} scope="col">
                  Percent
                </th>
              </tr>
            </thead>
            <tbody>
              {nutrients.map((item) => (
                <tr key={item.label}>
                  <th className={styles.macro} scope="row">
                    {item.label}
                  </th>
                  <td className={styles.amount}>{amountLabel((item.per100 * grams) / 100)}</td>
                  <td className={styles.share}>{item.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {children}
        </div>
      ) : null}
      {signedIn ? (
        <div className={styles.saveBlock}>
          <PortionDialog foodId={foodId} portionName={savedName} portionGrams={savedGrams} />
        </div>
      ) : (
        <div className={styles.saveBlock}>
          <button className={`${primaryButtonClass} ${styles.save}`} type="button" disabled>
            Save a portion
          </button>
          <p className={styles.hint}>
            <Link href="/login">Sign in</Link> to save a portion.
          </p>
        </div>
      )}
    </>
  );
}
