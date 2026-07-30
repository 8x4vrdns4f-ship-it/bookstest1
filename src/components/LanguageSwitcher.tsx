import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/contexts/LocaleContext";
import { CURRENCIES, LANGUAGES } from "@/i18n/translations";

const LanguageSwitcher = () => {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();
  const current = LANGUAGES.find(l => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors">
        <Globe size={14} />
        <span className="hidden sm:inline">{current?.code.split("-")[0].toUpperCase()}</span>
        <span className="sm:hidden">{current?.code.split("-")[0].toUpperCase()}</span>

        <span className="text-xs opacity-70 hidden md:inline">· {currency}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide opacity-60">{t("nav.language")}</DropdownMenuLabel>
        {LANGUAGES.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)} className="cursor-pointer">
            <span className="mr-2">{l.flag}</span>
            <span className="flex-1">{l.label}</span>
            {language === l.code && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs uppercase tracking-wide opacity-60">{t("nav.currency")}</DropdownMenuLabel>
        {CURRENCIES.map(c => (
          <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} className="cursor-pointer">
            <span className="mr-2 w-5 inline-block text-center">{c.symbol}</span>
            <span className="flex-1">{c.code} <span className="opacity-60 text-xs">— {c.label}</span></span>
            {currency === c.code && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
