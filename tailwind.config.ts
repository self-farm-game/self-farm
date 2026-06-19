import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // soil / wood / parchment — muted natural palette
        soildeep: "#241B14",
        soil: "#33271C",
        bark: "#5A4632",
        barklight: "#7A5E40",
        parchment: "#E8D9B5",
        parchmentdim: "#C9B68C",
        dust: "#9A8B73",
        // oak foliage
        oak: "#6E8E4E",
        oakdeep: "#4C6B3A",
        // accents
        ember: "#D98A45", // warm — actions, acorn, lantern, reward
        rune: "#7FC9C2", // cool — runes, magic, progress
        shine: "#8E7FB0", // residual cave "блиск" — used sparingly for noise states
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        body: ["Onest", "system-ui", "sans-serif"],
        pixel: ['"Press Start 2P"', "monospace"],
      },
      boxShadow: {
        pixel: "0 4px 0 0 rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
