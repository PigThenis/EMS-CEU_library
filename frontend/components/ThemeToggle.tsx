"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const saved = localStorage.getItem('theme')
    const initial = saved ? saved === 'dark' : prefersDark
    setDark(initial)
    document.documentElement.classList.toggle('dark', initial)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <button onClick={toggle} className="text-sm text-slate-700 dark:text-slate-200 hover:text-brand-700">
      {dark ? 'Light' : 'Dark'} mode
    </button>
  )
}

