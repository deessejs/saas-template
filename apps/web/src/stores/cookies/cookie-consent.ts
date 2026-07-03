import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ConsentCategory = "functional" | "analytics" | "marketing"

export interface CookieConsent {
  functional: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieConsentState {
  consent: CookieConsent
  hasDecided: boolean
  hasHydrated: boolean
  preferencesOpen: boolean
}

interface CookieConsentActions {
  acceptAll: () => void
  declineAll: () => void
  setCategory: (cat: ConsentCategory, value: boolean) => void
  setPreferencesOpen: (open: boolean) => void
  setHasHydrated: (value: boolean) => void
}

const STORAGE_KEY = "cookie_consent"
const CONSENT_VERSION = 1

const DEFAULT_CONSENT: CookieConsent = {
  functional: true,
  analytics: false,
  marketing: false,
}

interface PersistedState {
  consent: CookieConsent
  hasDecided: boolean
  version?: number
}

function loadStored(): PersistedState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    // Re-prompt if consent categories changed
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export const useCookieConsentStore = create<CookieConsentState & CookieConsentActions>()(
  persist(
    (set, get) => ({
      // Server: always render defaults. Client rehydrates from localStorage via skipHydration.
      consent: DEFAULT_CONSENT,
      hasDecided: false,
      hasHydrated: false,
      preferencesOpen: false,

      acceptAll: () => {
        const full: CookieConsent = { functional: true, analytics: true, marketing: true }
        set({ consent: full, hasDecided: true })
      },

      declineAll: () => {
        const minimal: CookieConsent = { functional: true, analytics: false, marketing: false }
        set({ consent: minimal, hasDecided: true })
      },

      setCategory: (cat, value) => {
        const updated = { ...get().consent, [cat]: value }
        set({ consent: updated, hasDecided: true })
      },

      setPreferencesOpen: (open) => set({ preferencesOpen: open }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true, // Prevent SSR/CSR mismatch — rehydrate manually after mount
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      // Persist version for future category changes
      partialize: (state) => ({
        consent: state.consent,
        hasDecided: state.hasDecided,
        version: CONSENT_VERSION,
      }),
    }
  )
)

// Rehydrate on client mount — call once at app startup
export function rehydrateCookieConsent() {
  useCookieConsentStore.persist.rehydrate()
}
