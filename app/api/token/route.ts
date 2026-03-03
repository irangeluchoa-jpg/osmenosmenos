import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const room = searchParams.get("room")
  const username = searchParams.get("username")

  if (!room || !username) {
    return NextResponse.json({ error: "room e username são obrigatórios" }, { status: 400 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit não configurado" }, { status: 500 })
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: username,
    ttl: "10h",
  })

  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return NextResponse.json({ token: await token.toJwt() })
}
