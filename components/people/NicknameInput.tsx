'use client'

import { useState, useRef } from 'react'

interface NicknameInputProps {
  value: string[]
  onChange: (nicknames: string[]) => void
  placeholder?: string
}

export function NicknameInput({
  value,
  onChange,
  placeholder = 'Es. Lucky, il Prof, Gio…',
}: NicknameInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addNickname(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    // Case-insensitive dedup
    if (value.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...value, trimmed])
    setInputValue('')
    inputRef.current?.focus()
  }

  function removeNickname(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addNickname(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeNickname(value.length - 1)
    }
  }

  return (
    <div>
      <div
        className="min-h-[46px] w-full rounded-2xl border border-input bg-background px-3 py-2.5 flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((nick, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs font-medium text-foreground/80"
          >
            {nick}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeNickname(i) }}
              className="text-muted-foreground hover:text-foreground ml-0.5 leading-none"
              aria-label={`Rimuovi ${nick}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <p className="text-xs text-muted-foreground/40 mt-1.5">
        Invio per aggiungere · Backspace per rimuovere
      </p>
    </div>
  )
}
