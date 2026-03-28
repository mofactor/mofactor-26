import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Monofactor";
  const subtitle =
    searchParams.get("subtitle") || "Portfolio of Onur Oztaskiran";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        }}
      >
        {/* Top-left logo mark */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg width="36" height="14" viewBox="0 0 663 265" fill="none">
            <path
              d="M265 92.3775C265 106.765 282.51 113.842 292.507 103.495L381.886 10.9859C388.669 3.96493 398.013 0 407.776 0H639C652.255 0 663 10.7452 663 24V241C663 254.255 652.255 265 639 265H557.797C544.542 265 533.797 254.255 533.797 241V162.338C533.797 147.984 516.358 140.891 506.339 151.17L405.983 254.128C399.207 261.08 389.911 265 380.203 265H288C274.745 265 264 254.255 264 241V173.4C264 159.042 246.551 151.951 236.535 162.239L147.1 254.111C140.323 261.073 131.02 265 121.304 265H24C10.7452 265 0 254.255 0 241V24C0 10.7452 10.7452 0 24 0H241C254.255 0 265 10.7452 265 24V92.3775Z"
              fill="rgba(255,255,255,0.15)"
            />
          </svg>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>
            monofactor.com
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
