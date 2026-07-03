import { create } from "zustand"

export type ConsentCategory = "functional" | "analytics" | "marketing"

export interface CookieConsent {
  functional: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieConsentState {
  consent: CookieConsent
  hasDecided: boolean
  preferencesOpen: boolean
}

interface CookieConsentActions {
  acceptAll: () => void
  declineAll: () => void
  setCategory: (cat: ConsentCategory, value: boolean) => void
  setPreferencesOpen: (open: boolean) => void
}

const STORAGE_KEY = "cookie_consent"

const DEFAULT_CONSENT: CookieConsent = {
  functional: true,
  analytics: false,
  marketing: false,
}

function loadStored(): CookieConsent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CookieConsent) : null
  } catch {
    return null
  }
}

function persist(consent: CookieConsent) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
}

export const useCookieConsentStore = create<CookieConsentState & CookieConsentActions>()(
  (set, get) => ({
    consent: loadStored() ?? DEFAULT_CONSENT,
    hasDecided: loadStored() !== null,
    preferencesOpen: false,

    acceptAll: () => {
      const full: CookieConsent = { functional: true, analytics: true, marketing: true }
      persist(full)
      set({ consent: full, hasDecided: true })
    },

    declineAll: () => {
      const minimal: CookieConsent = { functional: true, analytics: false, marketing: false }
      persist(minimal)
      set({ consent: minimal, hasDecided: true })
    },

    setCategory: (cat, value) => {
      const updated = { ...get().consent, [cat]: value }
      persist(updated)
      set({ consent: updated, hasDecided: true })
    },

    setPreferencesOpen: (open) => set({ preferencesOpen: open }),
  })
)
