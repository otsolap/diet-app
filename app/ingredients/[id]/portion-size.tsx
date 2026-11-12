"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import styles from "@/app/foods/foods.module.css";
import { Button } from "@/src/components/button/button";
import { formatKcal } from "@/src/lib/format";
import type { FoodNutrientBasis, FoodUnitChoice } from "@/src/lib/food-search";
import { amountLabel, gramsInput, gramsLabel } from "@/src/lib/nutrition";
import { PortionDialog } from "./portion-dialog";

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

function hundredLabel(kcalPer100: number | null) {
  if (kcalPer100 === null) {
    return "100 g";
  }

  return `100 g (${formatKcal(kcalPer100)})`;
}

function energyLabel(kcal: number | null, grams: number, per100: boolean) {
  if (kcal === null) {
    return formatKcal(null);
  }

  if (per100) {
    return `${formatKcal(kcal)} per 100 g`;
  }

  return `${formatKcal(kcal)} for ${gramsLabel(grams)}`;
}

export function PortionSize({
  foodId,
  signedIn,
  kcalPer100,
  units,
  nutrients,
  actions,
  children,
}: {
  foodId: number;
  signedIn: boolean;
  kcalPer100: number | null;
  units: FoodUnitChoice[];
  nutrients: FoodNutrientBasis[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const [choice, setChoice] = useState("100");
  const [custom, setCustom] = useState("");
  const selected = units.find((unit) => unit.code === choice);
  const typed = choice === "custom" ? customGrams(custom) : null;
  const grams = selected ? selected.grams : typed ?? 100;
  const per100 = choice === "100" || (choice === "custom" && typed === null);
  const kcal = kcalPer100 === null ? null : Math.round((kcalPer100 * grams) / 100);
  const savedName = selected ? selected.label.replace(/ \(.*\)$/, "") : gramsLabel(grams);
  const savedGrams = gramsInput(grams);

  return (
    <>
      <div className={styles.controls}>
        {actions}
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
      </div>
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
          <Button className={styles.save} type="button" disabled>
            Save a portion
          </Button>
          <p className={styles.hint}>
            <Link href="/login">Sign in</Link> to save a portion.
          </p>
        </div>
      )}
    </>
  );
}
