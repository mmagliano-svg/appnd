'use client'

import { useState, useRef } from 'react'
import { normalizeTag } from '@/lib/utils/tags'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Es. Luca, Sardegna, estate…',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions.filter(
    (s) =>
      (inputValue === '' || s.includes(inputValue.toLowerCase())) &&
      !value.includes(s)
  )

  function addTag(tag: string) {
    const normalized = normalizeTag(tag)
    if (!normalized || value.includes(normalized)) return
    onChange([...value, normalized])
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const showDropdown = showSuggestions && filteredSuggestions.length > 0

  return (
    <div className="relative">
      <div
        className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs font-medium text-foreground/80"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="text-muted-foreground hover:text-foreground ml-0.5 leading-none"
              aria-label={`Rimuovi ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
          {inputValue === '' && suggestions.length > 0 && (
            <p className="px-3 pt-2.5 pb-1 text-xs text-muted-foreground font-medium">
              Connessioni recenti
            </p>
          )}
          {filteredSuggestions.slice(0, 7).map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-2 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(s)
              }}
            >
              <span className="text-muted-foreground text-xs">#</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1.5">
        Invio o virgola per aggiungere · Backspace per rimuovere l'ultimo
      </p>
    </div>
  )
}
