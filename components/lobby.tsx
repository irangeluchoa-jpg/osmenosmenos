"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Mic, Video, Copy, Check, ArrowRight } from "lucide-react"

interface LobbyProps {
  onJoin: (name: string, room: string) => void
}

function GainBar() {
  const [levels, setLevels] = useState<number[]>(Array(12).fill(0))
  useEffect(() => {
    const interval = setInterval(() => {
      setLevels(Array(12).fill(0).map(() => Math.random()))
    }, 120)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex items-end gap-px h-8">
      {levels.map((level, i) => (
        <motion.div
          key={i}
          animate={{ height: `${Math.max(10, level * 100)}%` }}
          transition={{ duration: 0.1 }}
          className={`w-1.5 ${level > 0.7 ? "bg-neon" : level > 0.4 ? "bg-neon/60" : "bg-neon/20"}`}
        />
      ))}
    </div>
  )
}

export function Lobby({ onJoin }: LobbyProps) {
  const [name, setName] = useState("")
  const [roomId, setRoomId] = useState(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join("")
  })
  const [customRoom, setCustomRoom] = useState("")
  const [mode, setMode] = useState<"create" | "join">("create")
  const [copied, setCopied] = useState(false)
  const [micActive, setMicActive] = useState(true)
  const [camActive, setCamActive] = useState(true)
  const [nameFocused, setNameFocused] = useState(false)
  const [roomFocused, setRoomFocused] = useState(false)

  const activeRoom = mode === "create" ? roomId : customRoom
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${origin}?room=${activeRoom}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeRoom, origin])

  const handleJoin = useCallback(() => {
    const finalRoom = mode === "create" ? roomId : customRoom.trim().toUpperCase()
    if (name.trim() && finalRoom) onJoin(name.trim(), finalRoom)
  }, [name, roomId, customRoom, mode, onJoin])

  return (
    <div className="flex items-center justify-center min-h-screen grid-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col w-full max-w-md mx-4"
      >
        <div className="border border-[rgba(255,255,255,0.08)] bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-neon" />
            <h1 className="text-sm font-mono text-neon uppercase tracking-[0.3em] neon-text">Os Menos Menos</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex mb-6 border border-[rgba(255,255,255,0.08)]">
            <button
              onClick={() => setMode("create")}
              className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-widest transition-colors ${
                mode === "create" ? "bg-neon/10 text-neon" : "text-muted-foreground hover:text-chrome"
              }`}
            >
              Criar Sala
            </button>
            <button
              onClick={() => setMode("join")}
              className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-widest transition-colors ${
                mode === "join" ? "bg-neon/10 text-neon" : "text-muted-foreground hover:text-chrome"
              }`}
            >
              Entrar em Sala
            </button>
          </div>

          {mode === "create" ? (
            <>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Room ID</p>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 border border-[rgba(255,255,255,0.08)] bg-muted px-3 py-2">
                  <span className="text-sm font-mono text-chrome tracking-[0.15em]">{roomId}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center w-10 h-10 border border-[rgba(255,255,255,0.08)] text-chrome/60 hover:text-neon hover:border-neon/30 transition-colors"
                  aria-label="Copiar link"
                >
                  {copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Room ID</p>
              <div className={`flex items-center border px-3 py-2 mb-6 transition-colors ${
                roomFocused ? "border-neon bg-[rgba(209,255,0,0.03)]" : "border-[rgba(255,255,255,0.08)] bg-muted"
              }`}>
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value.toUpperCase())}
                  onFocus={() => setRoomFocused(true)}
                  onBlur={() => setRoomFocused(false)}
                  placeholder="COLE O CÓDIGO DA SALA..."
                  maxLength={8}
                  className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none tracking-widest uppercase"
                />
              </div>
            </>
          )}

          {/* Callsign */}
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Callsign</p>
          <div className={`flex items-center border px-3 py-2 mb-6 transition-colors ${
            nameFocused ? "border-neon bg-[rgba(209,255,0,0.03)]" : "border-[rgba(255,255,255,0.08)] bg-muted"
          }`}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="ENTER CALLSIGN..."
              maxLength={16}
              className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none tracking-widest uppercase"
            />
          </div>

          {/* Device Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Microphone</span>
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`flex items-center justify-center w-8 h-8 border transition-colors ${
                    micActive ? "border-neon/30 text-neon" : "border-[rgba(255,255,255,0.08)] text-chrome/40"
                  }`}
                >
                  <Mic size={14} strokeWidth={1.5} />
                </button>
              </div>
              {micActive && <GainBar />}
            </div>
            <div className="w-px h-16 bg-[rgba(255,255,255,0.08)]" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Camera</span>
                <button
                  onClick={() => setCamActive(!camActive)}
                  className={`flex items-center justify-center w-8 h-8 border transition-colors ${
                    camActive ? "border-neon/30 text-neon" : "border-[rgba(255,255,255,0.08)] text-chrome/40"
                  }`}
                >
                  <Video size={14} strokeWidth={1.5} />
                </button>
              </div>
              {camActive && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-neon" />
                  <span className="text-[9px] font-mono text-neon/60 uppercase">Active</span>
                </div>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={!name.trim() || (mode === "join" && !customRoom.trim())}
            className={`w-full flex items-center justify-center gap-2 py-3 border font-mono text-xs uppercase tracking-[0.3em] transition-all ${
              name.trim() && (mode === "create" || customRoom.trim())
                ? "border-neon bg-neon/5 text-neon hover:bg-neon/10 neon-glow"
                : "border-[rgba(255,255,255,0.05)] text-muted-foreground cursor-not-allowed"
            }`}
          >
            {mode === "create" ? "Criar e Entrar" : "Entrar na Sala"}
            <ArrowRight size={14} strokeWidth={1.5} />
          </motion.button>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border border-t-0 border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Protocol v3.2.1</span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Powered by LiveKit</span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">E2E Encrypted</span>
        </div>
      </motion.div>
    </div>
  )
}
