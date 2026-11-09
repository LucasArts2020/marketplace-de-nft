import { useLocation, useNavigate } from '@tanstack/react-router'
import { useId, useRef, useState } from 'react'
import { parseCatalogSearch } from '../contracts/catalog'

export function HeaderSearch({ className, inline = false }: { className: string; inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const search = parseCatalogSearch(location.pathname === '/' ? location.search : {})

  if (inline) return (
    <form role="search" className={className} onSubmit={(event) => {
      event.preventDefault()
      const q = input.current?.value.trim() ?? ''
      input.current?.blur()
      void navigate({ to: '/', search: { ...search, q, page: 1 }, resetScroll: false })
    }}>
      <button type="submit" aria-label="Buscar"><img src="/art/search.svg" alt="" /></button>
      <input key={search.q} ref={input} type="search" aria-label="Buscar NFTs" placeholder="Explorar coleções" defaultValue={search.q} />
    </form>
  )

  function openSearch() {
    setOpen(true)
    requestAnimationFrame(() => input.current?.focus())
  }

  return (
    <div className={`header-search ${className}`} data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) setOpen(false)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        event.preventDefault()
        trigger.current?.focus()
        setOpen(false)
      }}>
      <button ref={trigger} type="button" className="header-search-trigger" aria-label="Abrir busca"
        aria-expanded={open} aria-controls={id} onClick={openSearch}>
        <img src="/art/search.svg" alt="" />
      </button>
      <form id={id} role="search" className="header-search-form" inert={!open} aria-hidden={!open}
        onSubmit={(event) => {
          event.preventDefault()
          const q = input.current?.value.trim() ?? ''
          trigger.current?.focus()
          setOpen(false)
          void navigate({ to: '/', search: { ...search, q, page: 1 } })
        }}>
        <input key={search.q} ref={input} type="search" aria-label="Buscar NFTs" placeholder="Buscar NFTs"
          defaultValue={search.q} className="min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-ink px-3 text-sm" />
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-3 text-xs font-bold text-ink">Buscar</button>
      </form>
    </div>
  )
}
