import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function MenuIcon({ open }) {
  return (
    <div className="relative w-6 h-6">
      <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`}></span>
      <span className={`block h-0.5 w-6 bg-white my-1 transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`}></span>
      <span className={`block h-0.5 w-6 bg-white transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`}></span>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-transparent backdrop-blur-md border-white/10 border-b w-full">
      <div className="flex justify-between items-center mx-auto px-4 py-3 container">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-gradient-to-br from-bb-primary to-bb-accent rounded-md w-10 h-10 font-bold text-xl">⚡</div>
          <span className="font-bold text-lg">BrainBlitz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className="text-sm hover:underline">Inicio</Link>
          <Link to="/dashboard" className="text-sm hover:underline">Panel</Link>
          <Link to="/ranking" className="text-sm hover:underline">Ranking</Link>
          <Link to="/login" className="bg-bb-primary px-3 py-2 rounded-md text-sm">Iniciar</Link>
        </nav>

        <button
          aria-label="Abrir menú"
          className="md:hidden p-2 rounded-md"
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden bg-bb-bg-primary/95 border-t border-white/5 transition-max-h duration-300 overflow-hidden ${open ? 'max-h-60' : 'max-h-0'}`}>
        <div className="flex flex-col gap-3 px-4 py-4">
          <Link to="/" className="px-3 py-2 rounded-md">Inicio</Link>
          <Link to="/dashboard" className="px-3 py-2 rounded-md">Panel</Link>
          <Link to="/ranking" className="px-3 py-2 rounded-md">Ranking</Link>
          <Link to="/login" className="bg-bb-primary px-3 py-2 rounded-md text-white">Iniciar</Link>
        </div>
      </div>
    </header>
  )
}
