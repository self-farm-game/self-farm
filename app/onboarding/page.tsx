"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING } from "@/lib/mock-data/content";
import { useGame } from "@/lib/store/game";
import { WoodButton, Stars } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

export default function Onboarding() {
  const router = useRouter();
  const { plantTree } = useGame();
  const [step, setStep] = useState(0);
  const ob = ONBOARDING[step];

  const enterGarden = () => {
    plantTree();
    play("complete");
    router.push("/garden");
  };
  const next = () => {
    if (step < ONBOARDING.length - 1) {
      play("tap");
      setStep(step + 1);
    } else {
      enterGarden();
    }
  };

  return (
    <div
      className="sf-screen"
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
    >
      <div style={{ position: "absolute", inset: 0, background: ob.bg }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 18%, rgba(120,90,180,.18), transparent 60%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        <Stars n={40} seed={3} area={100} />
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "34px 30px 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 84,
            lineHeight: 1,
            marginBottom: 26,
            filter: "drop-shadow(0 6px 0 rgba(0,0,0,.4))",
            animation: "sf-float 5s ease-in-out infinite",
          }}
        >
          {ob.icon}
        </div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 3,
            color: "#8a7fb0",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {ob.kicker}
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.35,
            color: "#efe7d2",
            fontWeight: 600,
            maxWidth: 300,
          }}
        >
          {ob.title}
        </div>
        {ob.sub && (
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "#b9aecb",
              marginTop: 18,
              maxWidth: 280,
              fontStyle: "italic",
            }}
          >
            {ob.sub}
          </div>
        )}
      </div>

      <div style={{ position: "relative", padding: "0 28px 46px" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 22 }}>
          {ONBOARDING.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? "#caa24a" : "rgba(202,162,74,.3)",
                transition: "width .2s",
              }}
            />
          ))}
        </div>
        <WoodButton big onClick={next}>
          {ob.btn}
        </WoodButton>
        {step < ONBOARDING.length - 1 && (
          <div
            onClick={enterGarden}
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: 13,
              color: "#7d7298",
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            пропустити
          </div>
        )}
      </div>
    </div>
  );
}
