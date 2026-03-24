"use client";

import { useI18n, Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("language.label")}
      >
        <option value="en">{t("language.en")}</option>
        <option value="ru">{t("language.ru")}</option>
        <option value="uz">{t("language.uz")}</option>
      </select>
    </label>
  );
}
