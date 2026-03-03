"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wifi, WifiOff } from "lucide-react"
import { useConnectionState, useRoomContext } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"

export function NetworkWidget() {
  const [rtt, setRtt] = useState(0)
  const [history, setHistory] = useState<number[]>(Array(30).fill(0))
  const connectionState = useConnectionState()
  const room = useRoomContext()

  useEffect(() => {
    if (!room) return
    const interval = setInterval(async () => {
      try {
        const stats = await room.engine?.publisher?.pc?.getStats()
        if (stats) {
          stats.forEach((report: any) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              const newRtt = Math.round((report.currentRoundTripTime || 0) * 1000)
              if (newRtt > 0) {
                setRtt(newRtt)
                setHistory((prev) => [...prev.slice(1), newRtt])
              }
            }
          })
        }
      } catch {}
    }, 1000)
    return () => clearInterval(interval)
  }, [room])

  const maxRtt = Math.max(...history, 1)
  const isConnected = connectionState === ConnectionState.Connected
  const isDegraded = rtt > 150

  const statusLabel = () => {
    switch (connectionState) {
      case ConnectionState.Connected: return "● Online"
      case ConnectionState.Connecting: return "◌ Conectando"
      case ConnectionState.Reconnecting: return "◌ Reconectando"
      case ConnectionState.Disconnected: return "○ Desconectado"
      default: return "◌ ..."
    }
  }

  const statusColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected: return "text-neon"
      case ConnectionState.Reconnecting: return "text-yellow-400"
      case ConnectionState.Disconnected: return "text-danger"
      default: return "text-chrome/50"
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-[rgba(255,255,255,0.08)] bg-card">
      {/* RTT graph */}
      <div className="flex items-end gap-px h-5 w-24 hidden sm:flex">
        {history.map((val, i) => (
          <div
            key={i}
            className={`w-[3px] transition-all duration-200 ${isDegraded ? "bg-danger/70" : "bg-neon/40"}`}
            style={{ height: `${Math.max(8, (val / maxRtt) * 100)}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi size={12} strokeWidth={1.5} className={isDegraded ? "text-danger" : "text-neon"} />
          ) : (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <WifiOff size={12} strokeWidth={1.5} className="text-chrome/50" />
            </motion.div>
          )}
          <span className={`text-[10px] font-mono ${isDegraded ? "text-danger" : "text-chrome"}`}>
            {isConnected && rtt > 0 ? `RTT: ${rtt}ms` : ""}
          </span>
        </div>

        <span className={`text-[10px] font-mono ${statusColor()}`}>
          {statusLabel()}
        </span>
      </div>
    </div>
  )
}
