"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { hasOAuthParams } from "@/lib/supabase/persistence";

export default function Home() {
  const router = useRouter();
  const { state, hydrated } = useGame();

  useEffect(() => {
    if (!hydrated) return;
    if (hasOAuthParams()) return; // wait for the Google code→session exchange
    router.replace(state.onboarded ? "/garden" : "/onboarding");
  }, [hydrated, state.onboarded, router]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c0a16",
        color: "#8a7fb0",
        fontSize: 14,
        letterSpacing: 2,
      }}
    >
      Self-Farm…
    </div>
  );
}
