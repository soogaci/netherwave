import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  );
}
