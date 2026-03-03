"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface VideoCardProps {
  name: string
  index: number
  isSpeaking?: boolean
  isLocal?: boolean
  degraded?: boolean
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function VideoCard({ name, index, isSpeaking = false, isLocal = false, degraded = false }: VideoCardProps) {
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    latency: 12,
    bitrate: 2500,
    resolution: "1080p",
    codec: "H.264",
  })

  useEffect(() => {
    const interval = setInterval(() => {
      if (degraded) {
        setTelemetry({
          fps: randomBetween(8, 15),
          latency: randomBetween(180, 450),
          bitrate: randomBetween(80, 200),
          resolution: "180p",
          codec: "H.264/SVC-BL",
        })
      } else {
        setTelemetry({
          fps: randomBetween(58, 60),
          latency: randomBetween(8, 25),
          bitrate: randomBetween(2200, 3200),
          resolution: "1080p",
          codec: "H.264",
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [degraded])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`relative overflow-hidden border border-[rgba(255,255,255,0.08)] bg-card scanlines ${
        isSpeaking ? "border-neon neon-glow" : ""
      }`}
    >
      {/* Simulated video placeholder */}
      <div className="relative flex items-center justify-center aspect-video bg-[#050505]">
        {/* Animated participant avatar */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`flex items-center justify-center w-16 h-16 border text-lg font-mono uppercase tracking-widest ${
              isSpeaking
                ? "border-neon text-neon"
                : "border-[rgba(255,255,255,0.15)] text-chrome"
            }`}
          >
            {name.slice(0, 2)}
          </motion.div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {isLocal ? "YOU" : name}
          </span>
        </div>

        {/* Degraded overlay */}
        {degraded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[rgba(255,32,32,0.05)] flex items-center justify-center"
          >
            <div className="border border-danger/30 px-3 py-1">
              <span className="text-[10px] font-mono text-danger tracking-widest uppercase">SVC DEGRADED</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Telemetry overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-[rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-muted-foreground">
            {telemetry.resolution}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">
            {telemetry.codec}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">
            {telemetry.bitrate}kbps
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-mono ${
            telemetry.fps < 30 ? "text-danger" : "text-neon"
          }`}>
            FPS: {telemetry.fps}
          </span>
          <span className={`text-[9px] font-mono ${
            telemetry.latency > 100 ? "text-danger" : "text-chrome"
          }`}>
            {telemetry.latency}ms
          </span>
        </div>
      </div>

      {/* Live indicator */}
      {isSpeaking && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-1.5 h-1.5 bg-neon"
          />
          <span className="text-[9px] font-mono text-neon uppercase tracking-widest neon-text">Live</span>
        </div>
      )}

      {/* Name tag */}
      <div className="absolute top-2 right-2">
        <span className="text-[9px] font-mono text-chrome/60 uppercase tracking-widest">
          {isLocal ? "LOCAL" : `P-${String(index + 1).padStart(2, "0")}`}
        </span>
      </div>
    </motion.div>
  )
}
