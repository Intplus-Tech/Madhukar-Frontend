import type { Config } from "tailwindcss";

/**
 * Design tokens transcribed from the Figma file.
 * Every colour used in a component should come from here — no raw hex in JSX.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Surfaces ────────────────────────────────────────────────
        // Supplied by the client:
        //   linear-gradient(0deg,#FFFFFF,#FFFFFF), linear-gradient(0deg,#F7F9FB,#F7F9FB)
        app: "#F7F9FB", // page background
        surface: "#FFFFFF", // cards, panels, modals
        "surface-muted": "#F7F9FB", // inset fields, table headers
            
           // Segmented control (Priority Level on the order screen)
        segment: {
          DEFAULT: "#ECEEF0",
          border: "#C6C6CD",
        },

        // ── Sidebars ────────────────────────────────────────────────
        admin: {
          sidebar: "#131B2E", // supplied by the client
          "sidebar-active": "#E8EFF7",
          "sidebar-text": "#8A93A6",
          accent: "#1E3A5F", // "Process Billing & Notify Team"
        },
        accounts: {
          sidebar: "#000000",
          "sidebar-text": "#9CA3AF",
        },

        // ── Ink ─────────────────────────────────────────────────────
          ink: {
          DEFAULT: "#000000",
          muted: "#6B7280",
          faint: "#9CA3AF",
          inverse: "#FFFFFF",
        },

        // ── Lines ───────────────────────────────────────────────────
        line: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
          faint: "#F1F3F5",
        },

        // ── Status ──────────────────────────────────────────────────
        success: {
          DEFAULT: "#00A76F", // chart bars, progress ring
          soft: "#D1FAE5", // COMPLETED pill background
          ink: "#065F46", // COMPLETED pill text
        },
        warning: {
          DEFAULT: "#F59E0B", // unchecked line-item checkbox
          soft: "#FEF3C7", // PENDING pill background
          ink: "#92400E", // PENDING pill text
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2", // URGENT badge background
          ink: "#B91C1C",
          deep: "#A11212", // "Send feedback to Sales"
        },
        info: {
          DEFAULT: "#2563EB", // "AWAITING BILL ₹42M"
          soft: "#DBEAFE", // "Visited" pill, "0% Complete" badge
          ink: "#1E40AF",
        },
        // Indigo accent introduced by the Team & Access Management design
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
          ink: "#3730A3",
          border: "#C7D2FE",
        },

        accentPurple: {
          soft: "#EDE9FE", // "Payment Collected" pill
          ink: "#5B21B6",
        },
      },

      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
      },

      fontSize: {
        // Transcribed from the Figma type scale
        eyebrow: ["11px", { lineHeight: "16px", letterSpacing: "0.06em" }],
        meta: ["12px", { lineHeight: "16px" }],
        body: ["14px", { lineHeight: "20px" }],
        "body-lg": ["16px", { lineHeight: "24px" }],
        "title-sm": ["18px", { lineHeight: "26px" }],
        title: ["20px", { lineHeight: "28px" }],
        "display-sm": ["28px", { lineHeight: "34px", letterSpacing: "-0.02em" }],
        display: ["36px", { lineHeight: "42px", letterSpacing: "-0.02em" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.025em" }],
      },

      borderRadius: {
        card: "var(--radius-card, 12px)",
        field: "10px",
        pill: "9999px",
      },

      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.04)",
        raised: "0 4px 12px -2px rgba(16,24,40,0.08)",
        modal: "0 24px 48px -12px rgba(16,24,40,0.18)",
      },

      maxWidth: {
        mobile: "430px", // sales app frame width in Figma
      },

      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
        "slide-in-right": "slide-in-right 240ms cubic-bezier(0.32,0.72,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
