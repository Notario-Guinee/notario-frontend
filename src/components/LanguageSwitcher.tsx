import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${className}`}
      title={lang === "FR" ? "Switch to English" : "Passer en Français"}
    >
      <Globe className="h-3.5 w-3.5" />
      {lang === "FR" ? "EN" : "FR"}
    </button>
  );
}
