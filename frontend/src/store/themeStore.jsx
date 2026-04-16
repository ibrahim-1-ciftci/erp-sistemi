import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  light: {
    name: 'Açık',
    preview: ['#ffffff', '#3b82f6', '#f3f4f6'],
    vars: {
      '--bg-app':       '#f3f4f6',
      '--bg-sidebar':   '#111827',
      '--bg-card':      '#ffffff',
      '--bg-input':     '#ffffff',
      '--bg-table-head':'#f9fafb',
      '--bg-hover':     '#f9fafb',
      '--text-primary': '#111827',
      '--text-secondary':'#6b7280',
      '--text-sidebar': '#d1d5db',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#e5e7eb',
      '--accent':       '#3b82f6',
      '--accent-hover': '#2563eb',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#2563eb',
    }
  },
  dark: {
    name: 'Koyu',
    preview: ['#0f172a', '#3b82f6', '#1e293b'],
    vars: {
      '--bg-app':       '#0f172a',
      '--bg-sidebar':   '#020617',
      '--bg-card':      '#1e293b',
      '--bg-input':     '#0f172a',
      '--bg-table-head':'#0f172a',
      '--bg-hover':     '#334155',
      '--text-primary': '#f1f5f9',
      '--text-secondary':'#94a3b8',
      '--text-sidebar': '#94a3b8',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#334155',
      '--accent':       '#3b82f6',
      '--accent-hover': '#2563eb',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#1d4ed8',
    }
  },
  midnight: {
    name: 'Gece Yarısı',
    preview: ['#0a0a0f', '#8b5cf6', '#13131f'],
    vars: {
      '--bg-app':       '#0a0a0f',
      '--bg-sidebar':   '#050508',
      '--bg-card':      '#13131f',
      '--bg-input':     '#0a0a0f',
      '--bg-table-head':'#0a0a0f',
      '--bg-hover':     '#1e1e30',
      '--text-primary': '#e2e8f0',
      '--text-secondary':'#7c7c9e',
      '--text-sidebar': '#7c7c9e',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#1e1e30',
      '--accent':       '#8b5cf6',
      '--accent-hover': '#7c3aed',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#6d28d9',
    }
  },
  ocean: {
    name: 'Okyanus',
    preview: ['#0c1a2e', '#06b6d4', '#0f2744'],
    vars: {
      '--bg-app':       '#0c1a2e',
      '--bg-sidebar':   '#060f1c',
      '--bg-card':      '#0f2744',
      '--bg-input':     '#0c1a2e',
      '--bg-table-head':'#0c1a2e',
      '--bg-hover':     '#163352',
      '--text-primary': '#e0f2fe',
      '--text-secondary':'#7dd3fc',
      '--text-sidebar': '#7dd3fc',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#163352',
      '--accent':       '#06b6d4',
      '--accent-hover': '#0891b2',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#0e7490',
    }
  },
  forest: {
    name: 'Orman',
    preview: ['#0a1a0f', '#22c55e', '#0f2a18'],
    vars: {
      '--bg-app':       '#0a1a0f',
      '--bg-sidebar':   '#050f08',
      '--bg-card':      '#0f2a18',
      '--bg-input':     '#0a1a0f',
      '--bg-table-head':'#0a1a0f',
      '--bg-hover':     '#163d22',
      '--text-primary': '#dcfce7',
      '--text-secondary':'#86efac',
      '--text-sidebar': '#86efac',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#163d22',
      '--accent':       '#22c55e',
      '--accent-hover': '#16a34a',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#15803d',
    }
  },
  sunset: {
    name: 'Gün Batımı',
    preview: ['#1a0a0a', '#f97316', '#2a1010'],
    vars: {
      '--bg-app':       '#1a0a0a',
      '--bg-sidebar':   '#0f0505',
      '--bg-card':      '#2a1010',
      '--bg-input':     '#1a0a0a',
      '--bg-table-head':'#1a0a0a',
      '--bg-hover':     '#3d1515',
      '--text-primary': '#fef3c7',
      '--text-secondary':'#fbbf24',
      '--text-sidebar': '#fbbf24',
      '--text-sidebar-active':'#ffffff',
      '--border':       '#3d1515',
      '--accent':       '#f97316',
      '--accent-hover': '#ea580c',
      '--accent-text':  '#ffffff',
      '--sidebar-active':'#c2410c',
    }
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('erp-theme') || 'light')

  useEffect(() => {
    const vars = THEMES[theme]?.vars || THEMES.light.vars
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('erp-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
