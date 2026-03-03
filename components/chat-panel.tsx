"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send } from "lucide-react"
import { useDataChannel } from "@livekit/components-react"

interface ChatMessage {
  id: number
  user: string
  text: string
  timestamp: string
}

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  roomId: string
  userName: string
}

function getTimestamp() {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":")
}

export function ChatPanel({ open, onClose, userName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(1)

  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload)
      const parsed = JSON.parse(decoded)
      setMessages((prev) => [
        ...prev,
        { id: idCounter.current++, user: parsed.user, text: parsed.text, timestamp: getTimestamp() },
      ])
    } catch {}
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const msg = { user: userName, text: input.trim() }
    const encoded = new TextEncoder().encode(JSON.stringify(msg))
    send(encoded, {})
    setMessages((prev) => [
      ...prev,
      { id: idCounter.current++, user: "VOCÊ", text: input.trim(), timestamp: getTimestamp() },
    ])
    setInput("")
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25 }}
          className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-80 bg-card border-l border-[rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-neon" />
              <span className="text-[11px] font-mono text-neon uppercase tracking-[0.2em]">Tactical Comms</span>
            </div>
            <button onClick={onClose} className="flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto tactical-scroll p-3 space-y-1">
            {messages.length === 0 && (
              <p className="text-[10px] font-mono text-muted-foreground text-center mt-4">Nenhuma mensagem ainda...</p>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] leading-relaxed"
              >
                <span className="text-muted-foreground">[{msg.timestamp}]</span>{" "}
                <span className={msg.user === "VOCÊ" ? "text-neon" : "text-chrome"}>{msg.user}</span>{" "}
                <span className="text-muted-foreground">{">"}</span>{" "}
                <span className="text-foreground/80">{msg.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
            <div className={`flex items-center gap-2 border px-3 py-2 transition-colors ${
              focused ? "border-neon bg-[rgba(209,255,0,0.03)]" : "border-[rgba(255,255,255,0.08)] bg-muted"
            }`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type command..."
                className="flex-1 bg-transparent text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button onClick={handleSend} className="flex items-center justify-center text-neon hover:text-neon/80 transition-colors">
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
