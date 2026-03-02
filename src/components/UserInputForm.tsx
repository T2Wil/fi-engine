"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Save } from "lucide-react";
import { getLatestInput, updateLatestInput } from "@/db/indexedDb";
import type { DashboardInput } from "@/engine/computation";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserInputFormProps {
  initial?: Partial<DashboardInput>;
  onSubmit: (input: DashboardInput) => void;
}

export function UserInputForm({ initial, onSubmit }: UserInputFormProps) {
  const { t } = useLanguage();
  const [netWorthRwf, setNetWorthRwf] = useState(initial?.netWorthRwf ?? 0);
  const [incomeRwf, setIncomeRwf] = useState(initial?.incomeRwf ?? 0);
  const [expensesRwf, setExpensesRwf] = useState(initial?.expensesRwf ?? 0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getLatestInput().then((row) => {
      if (row) {
        setNetWorthRwf(row.netWorthRwf);
        setIncomeRwf(row.incomeRwf);
        setExpensesRwf(row.expensesRwf);
      }
      setLoaded(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: DashboardInput = {
      netWorthRwf,
      incomeRwf,
      expensesRwf,
    };
    await updateLatestInput(input);
    onSubmit(input);
  };

  if (!loaded) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-2xl bg-white dark:bg-[#1e1e22]/90 backdrop-blur border border-gray-200 dark:border-white/10 p-4 sm:p-5 shadow-sm dark:shadow-none"
    >
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-[#8a8a8f] flex items-center gap-1.5">
          <Wallet className="size-3.5" />
          {t("netWorthRwf")}
        </label>
        <input
          type="number"
          min={0}
          step={10000}
          value={netWorthRwf || ""}
          onChange={(e) => setNetWorthRwf(Number(e.target.value) || 0)}
          placeholder={t("placeholderAmount", { amount: "5,000,000" })}
          className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#5a5a5f] focus:outline-none focus:ring-2 focus:ring-[#1488fc]/50"
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-[#8a8a8f] flex items-center gap-1.5">
          <TrendingUp className="size-3.5" />
          {t("monthlyIncomeRwf")}
        </label>
        <input
          type="number"
          min={0}
          step={10000}
          value={incomeRwf || ""}
          onChange={(e) => setIncomeRwf(Number(e.target.value) || 0)}
          placeholder={t("placeholderAmount", { amount: "800,000" })}
          className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#5a5a5f] focus:outline-none focus:ring-2 focus:ring-[#1488fc]/50"
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-[#8a8a8f] flex items-center gap-1.5">
          <TrendingDown className="size-3.5" />
          {t("monthlyExpensesRwf")}
        </label>
        <input
          type="number"
          min={0}
          step={10000}
          value={expensesRwf || ""}
          onChange={(e) => setExpensesRwf(Number(e.target.value) || 0)}
          placeholder={t("placeholderAmount", { amount: "500,000" })}
          className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#5a5a5f] focus:outline-none focus:ring-2 focus:ring-[#1488fc]/50"
        />
      </div>
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#1488fc] hover:bg-[#1a94ff] text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(20,136,252,0.3)]"
      >
        <Save className="size-4" />
        {t("updateDashboard")}
      </button>
    </form>
  );
}
