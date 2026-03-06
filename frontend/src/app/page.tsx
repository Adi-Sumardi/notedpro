"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // SPA fallback: if the browser URL is not "/", let Next.js router handle it
    if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
      router.replace(window.location.pathname + window.location.search);
    } else {
      router.replace("/dashboard");
    }
  }, [router]);
  return null;
}
