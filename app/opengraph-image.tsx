import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Operadroom — Autonomous execution for industrial digital twins";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #050505 0%, #111111 45%, #1a1208 100%)",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 75% 20%, rgba(255,255,255,0.08) 0%, transparent 45%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 36 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 999,
              border: "3px solid white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "white",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 56,
                height: 3,
                background: "white",
                transform: "rotate(-18deg)",
                top: 42,
                left: 10,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Operadroom
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            marginBottom: 18,
          }}
        >
          A Reelin AI Product
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            maxWidth: 900,
          }}
        >
          From Predictive Alert to Completed Work Order
        </div>
      </div>
    ),
    { ...size }
  );
}
