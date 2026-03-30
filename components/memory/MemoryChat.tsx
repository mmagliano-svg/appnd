'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/actions/messages'
import type { Message } from '@/actions/messages'

interface Props {
  memoryId: string
  currentUserId: string
  initialMessages: Message[]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Oggi'
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

function getInitials(name: string | null, email: string) {
  const src = name ?? email
  const parts = src.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

export function MemoryChat({ memoryId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText]         = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const mountedRef = useRef(false)

  // Scroll to bottom only when NEW messages arrive after mount — never on load
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase real-time subscription for new messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`memory_messages:${memoryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_messages',
          filter: `memory_id=eq.${memoryId}`,
        },
        async (payload) => {
          // Fetch full message with author info
          const { data } = await supabase
            .from('memory_messages')
            .select('id, memory_id, author_id, content, created_at, users ( display_name, email, avatar_url )')
            .eq('id', payload.new.id)
            .single()

          if (!data) return

          const u = data.users as unknown as { display_name: string | null; email: string; avatar_url: string | null } | null
          const newMsg: Message = {
            id: data.id,
            memory_id: data.memory_id,
            author_id: data.author_id,
            content: data.content,
            created_at: data.created_at,
            author: {
              display_name: u?.display_name ?? null,
              email: u?.email ?? '',
              avatar_url: u?.avatar_url ?? null,
            },
          }

          // Avoid duplicates (optimistic message already added)
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memoryId])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || isPending) return

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
      memory_id: memoryId,
      author_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
      author: { display_name: null, email: '', avatar_url: null },
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')

    startTransition(async () => {
      const result = await sendMessage(memoryId, trimmed)
      if (result.error) {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        setText(trimmed)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by day for separators
  const grouped: { day: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) {
      last.messages.push(msg)
    } else {
      grouped.push({ day, messages: [msg] })
    }
  }

  return (
    <div id="memory-chat" className="border-t border-border/40 mt-12 pt-8">
      {/* Message list */}
      <div className="space-y-6 mb-6 max-h-[480px] overflow-y-auto pr-1">
        {grouped.length === 0 && (
          <p className="text-xs text-muted-foreground/35 text-center py-4 italic">
            Scrivi qualcosa su questo momento…
          </p>
        )}

        {grouped.map(({ day, messages: dayMsgs }) => (
          <div key={day}>
            {/* Day separator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-border/40" />
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                {day}
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>

            <div className="space-y-3">
              {dayMsgs.map((msg) => {
                const isMe = msg.author_id === currentUserId
                const name = msg.author.display_name ?? msg.author.email
                const initials = getInitials(msg.author.display_name, msg.author.email)
                const isOptimistic = msg.id.startsWith('opt-')

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                        {msg.author.avatar_url ? (
                          <img
                            src={msg.author.avatar_url}
                            alt={name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-foreground/60">
                            {initials}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!isMe && (
                        <p className="text-[10px] text-muted-foreground/50 px-1">
                          {name}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                          isMe
                            ? `bg-foreground text-background ${isOptimistic ? 'opacity-60' : ''}`
                            : 'bg-muted/50 text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-muted-foreground/40 px-1">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi qualcosa su questo momento…"
          rows={1}
          className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed min-h-[44px] max-h-32 overflow-y-auto"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 hover:opacity-80 active:scale-95 transition-all disabled:opacity-30"
        >
          <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-end mt-2 px-1">
        <a
          href={`/memories/${memoryId}/contribute`}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          + Aggiungi foto o testo al ricordo
        </a>
      </div>
    </div>
  )
}
