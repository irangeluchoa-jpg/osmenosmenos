"use client"

import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Lobby } from "@/components/lobby"
import { Room } from "@/components/room"

type View = "lobby" | "call"

export default function Page() {
  const [view, setView] = useState<View>("lobby")
  const [userName, setUserName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [token, setToken] = useState("")

  const handleJoin = useCallback(async (name: string, room: string) => {
    try {
      const res = await fetch(`/api/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (data.token) {
        setToken(data.token)
        setUserName(name)
        setRoomId(room)
        setView("call")
      }
    } catch (e) {
      console.error("Erro ao obter token:", e)
    }
  }, [])

  const handleLeave = useCallback(() => {
    setView("lobby")
    setUserName("")
    setRoomId("")
    setToken("")
  }, [])

  return (
    <main className="h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {view === "lobby" ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Lobby onJoin={handleJoin} />
          </motion.div>
        ) : (
          <motion.div
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <Room userName={userName} roomId={roomId} token={token} onLeave={handleLeave} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
