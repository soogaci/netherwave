import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7B61FF 0%, #6366f1 50%, #22d3ee 100%)",
          borderRadius: 48,
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          F
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
