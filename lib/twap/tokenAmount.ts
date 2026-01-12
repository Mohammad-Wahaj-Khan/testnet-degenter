"use client";

const TOKEN_DECIMALS = 6;
const MULTIPLIER = Math.pow(10, TOKEN_DECIMALS);

export function toRawAmount(displayAmount: string): string {
  if (!displayAmount || displayAmount.trim() === "") return "0";
  const numericAmount = Number(displayAmount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return "0";
  return Math.floor(numericAmount * MULTIPLIER).toString();
}

export function toDisplayAmount(rawAmount: string, decimals = 6): string {
  if (!rawAmount || rawAmount === "0") return "0";
  const numericAmount = Number(rawAmount);
  if (!Number.isFinite(numericAmount)) return "0";
  return (numericAmount / MULTIPLIER).toFixed(decimals).replace(/\.?0+$/, "");
}

export function isValidDisplayAmount(displayAmount: string): boolean {
  if (!displayAmount || displayAmount.trim() === "") return false;
  const numericAmount = Number(displayAmount);
  return Number.isFinite(numericAmount) && numericAmount > 0;
}

export function formatDisplayAmount(displayAmount: string, maxDecimals = 6) {
  if (!displayAmount || displayAmount === "0") return "0";
  const numericAmount = Number(displayAmount);
  if (!Number.isFinite(numericAmount)) return "0";
  return numericAmount.toFixed(maxDecimals).replace(/\.?0+$/, "");
}
