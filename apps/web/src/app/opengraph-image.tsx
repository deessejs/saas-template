import { ImageResponse } from "next/og"
import { APP_NAME, APP_URL } from "@workspace/ui/lib/config"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontSize: 64,
          fontWeight: "bold",
          color: "white",
        }}
      >
        {APP_NAME}
      </div>
    ),
    {
      ...size,
    }
  )
}
