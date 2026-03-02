import { useCallback, useEffect, useState } from "react";
import { MapPin, BarChart3, MessageCircle, Target } from "lucide-react";
import { RayBackground } from "@/components/RayBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserInputForm } from "@/components/UserInputForm";
import { IncomeChart } from "@/components/IncomeChart";
import { RwandaMap } from "@/components/RwandaMap";
import { FIInsightPanel } from "@/components/FIInsightPanel";
import { FIGrowthChart } from "@/components/FIGrowthChart";
import { DistrictFIChart } from "@/components/DistrictFIChart";
import { computeDashboard } from "@/engine/computation";
import type { DashboardInput, DashboardResult } from "@/engine/computation";
import { getLatestInput } from "@/db/indexedDb";
import { useLanguage } from "@/contexts/LanguageContext";

function App() {
  const { t } = useLanguage();
  const [result, setResult] = useState<DashboardResult | null>(null);

  const handleSubmit = useCallback((input: DashboardInput) => {
    setResult(computeDashboard(input));
  }, []);

  const noInputProvided =
    !result ||
    (result.input.incomeRwf === 0 &&
      result.input.expensesRwf === 0 &&
      result.input.netWorthRwf === 0);

  useEffect(() => {
    getLatestInput().then((row) => {
      if (row) {
        handleSubmit({
          netWorthRwf: row.netWorthRwf,
          incomeRwf: row.incomeRwf,
          expensesRwf: row.expensesRwf,
        });
      }
    });
  }, [handleSubmit]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-[#0f0f0f]">
      <RayBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="relative text-center mb-6 sm:mb-8">
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            {t("titleRwanda")}{" "}
            <span className="bg-gradient-to-b from-blue-600 via-blue-500 to-gray-900 dark:from-[#4da5fc] dark:via-[#4da5fc] dark:to-white bg-clip-text text-transparent italic">
              {t("titleLifestyle")}
            </span>{" "}
            {t("titleIncome")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-[#8a8a8f]">
            {t("subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_min(400px,100%)] gap-6 lg:gap-8 items-start">
          {/* Left: form, map, charts */}
          <div className="min-w-0 flex flex-col gap-6 sm:gap-8">
            <section>
              <UserInputForm initial={result?.input} onSubmit={handleSubmit} />
            </section>

            <section>
              <div className="flex items-center gap-2 text-gray-500 dark:text-[#8a8a8f] text-sm mb-2">
                <Target className="size-4" />
                <span>{t("fiProjectionTitle")}</span>
              </div>
              <FIGrowthChart result={result} />
            </section>

            <section>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-base font-medium mb-3">
                <MapPin className="size-5 text-[#1488fc]" />
                <span>{t("affordabilityByDistrict")}</span>
              </div>
              {noInputProvided ? (
                <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-8 flex items-center justify-center min-h-[320px] text-gray-500 dark:text-[#6a6a6f] text-sm">
                  {t("enterNumbersForMap")}
                </div>
              ) : (
                <RwandaMap result={result} />
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 text-gray-500 dark:text-[#8a8a8f] text-sm mb-2">
                <BarChart3 className="size-4" />
                <span>{t("incomeVsDistrictCost")}</span>
              </div>
              {noInputProvided ? (
                <div className="rounded-2xl bg-white dark:bg-[#1e1e22]/90 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-center min-h-[280px] text-gray-500 dark:text-[#6a6a6f] text-sm">
                  {t("enterNumbersForChart")}
                </div>
              ) : (
                <IncomeChart result={result} />
              )}
            </section>

            <section>
              <DistrictFIChart result={result} />
            </section>

            <footer className="pt-4 pb-2 text-center text-xs text-gray-400 dark:text-[#5a5a5f]">
              {t("footer")}
            </footer>
          </div>

          {/* Right: FI insight panel (sticky on large screens) */}
          <aside className="lg:sticky lg:top-6 w-full">
            <div className="flex items-center gap-2 text-gray-500 dark:text-[#8a8a8f] text-sm mb-2">
              <MessageCircle className="size-4" />
              <span>{t("insightFromFI")}</span>
            </div>
            <FIInsightPanel result={result} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
