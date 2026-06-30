import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { CURRENCIES, CurrencyCode, LANGUAGES, LanguageCode, TRANSLATIONS } from "@/i18n/translations";

type Rates = Record<string, number>; // base = GBP. e.g. { USD: 1.27, EUR: 1.17 }

// Fallback rates used when the network call fails. Rough mid-market rates vs GBP.
const FALLBACK_RATES: Rates = {
  GBP: 1, USD: 1.27, EUR: 1.17, AUD: 1.93, CAD: 1.73, JPY: 198,
};

type LocaleCtx = {
  language: LanguageCode;
  currency: CurrencyCode;
  rates: Rates;
  setLanguage: (l: LanguageCode) => void;
  setCurrency: (c: CurrencyCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatPrice: (gbpAmount: number, opts?: { decimals?: number }) => string;
  convertFromGBP: (gbpAmount: number) => number;
};

const Ctx = createContext<LocaleCtx | null>(null);

const STORAGE_KEY = "bs.locale.v1";
const RATES_KEY = "bs.rates.v1";
const RATES_TTL_MS = 24 * 60 * 60 * 1000;

const detectInitial = (): { language: LanguageCode; currency: CurrencyCode } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.language) return { language: parsed.language, currency: parsed.currency };
    }
  } catch {/* noop */}
  const nav = typeof navigator !== "undefined" ? navigator.language || "en-GB" : "en-GB";
  const match = LANGUAGES.find(l => nav.toLowerCase().startsWith(l.code.toLowerCase()))
    || LANGUAGES.find(l => nav.toLowerCase().startsWith(l.code.split("-")[0]))
    || LANGUAGES[0];
  return { language: match.code, currency: match.defaultCurrency };
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const initial = useMemo(detectInitial, []);
  const [language, setLanguageState] = useState<LanguageCode>(initial.language);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initial.currency);
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);

  // Persist selection
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, currency })); } catch {/* noop */}
  }, [language, currency]);

  // Load exchange rates (GBP base) with 24h cache
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RATES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fetchedAt && Date.now() - parsed.fetchedAt < RATES_TTL_MS && parsed.rates) {
          setRates({ ...FALLBACK_RATES, ...parsed.rates });
          return;
        }
      }
    } catch {/* noop */}

    fetch("https://open.er-api.com/v6/latest/GBP")
      .then(r => r.json())
      .then(data => {
        if (data?.result === "success" && data.rates) {
          const wanted: Rates = {};
          for (const c of CURRENCIES) {
            if (data.rates[c.code]) wanted[c.code] = data.rates[c.code];
          }
          wanted.GBP = 1;
          setRates({ ...FALLBACK_RATES, ...wanted });
          try { localStorage.setItem(RATES_KEY, JSON.stringify({ fetchedAt: Date.now(), rates: wanted })); } catch {/* noop */}
        }
      })
      .catch(() => { /* fallback already set */ });
  }, []);

  const setLanguage = useCallback((l: LanguageCode) => {
    setLanguageState(l);
    // Also nudge currency to that language's default if the user hasn't overridden recently
    const match = LANGUAGES.find(x => x.code === l);
    if (match) setCurrencyState(match.defaultCurrency);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => setCurrencyState(c), []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS["en-GB"];
    let v = dict[key] ?? TRANSLATIONS["en-GB"][key] ?? key;
    if (vars) {
      for (const [k, val] of Object.entries(vars)) {
        v = v.replace(new RegExp(`\\{${k}\\}`, "g"), String(val));
      }
    }
    return v;
  }, [language]);

  const convertFromGBP = useCallback((gbp: number) => {
    const rate = rates[currency] ?? 1;
    return gbp * rate;
  }, [rates, currency]);

  const formatPrice = useCallback((gbp: number, opts?: { decimals?: number }) => {
    const converted = convertFromGBP(gbp);
    const decimals = opts?.decimals ?? (currency === "JPY" ? 0 : 0);
    try {
      return new Intl.NumberFormat(language, {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Math.round(converted));
    } catch {
      return `${currency} ${Math.round(converted)}`;
    }
  }, [convertFromGBP, currency, language]);

  const value: LocaleCtx = { language, currency, rates, setLanguage, setCurrency, t, formatPrice, convertFromGBP };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLocale = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
};
