import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOCALE_LABELS, type Locale } from "@/i18n/translations";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-300 dark:border-white/10 bg-white/5 dark:bg-white/5 p-0.5">
      <Globe className="size-4 text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0" aria-hidden />
      {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          aria-label={`Language: ${LOCALE_LABELS[loc]}`}
          className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            locale === loc
              ? "bg-[#1488fc] text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10"
          }`}
        >
          {loc === "en" ? "EN" : loc === "rw" ? "RW" : "FR"}
        </button>
      ))}
    </div>
  );
}
