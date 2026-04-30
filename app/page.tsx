"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadState } from "@/lib/store";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    const state = loadState();
    if (state.onboardingComplete) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  );
}
