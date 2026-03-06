"use client";

import { useParams } from "next/navigation";

/**
 * Extract the real route ID from the URL.
 * In static export, Apache serves pre-rendered /[route]/0/index.html
 * for all dynamic IDs, so useParams() returns "0". This hook reads
 * the actual ID from window.location.pathname instead.
 */
export function useRouteId(paramName = "id", segmentIndex = 1): string {
  const params = useParams();
  const paramValue = params[paramName] as string;

  if (typeof window === "undefined") return paramValue;

  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[segmentIndex] ?? paramValue;
}
