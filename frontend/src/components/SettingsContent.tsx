"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyConfig, SimpleListCrawlConfig } from "@/lib/types";
import {
  deleteCompany,
  fetchCompanies,
  saveCompany,
  testCrawlCompany,
} from "@/lib/apiClient";

type FormState = CompanyConfig;

const emptyForm: FormState = {
  id: "",
  name: "",
  pressReleaseUrl: "",
  homepageUrl: "",
  crawlConfig: {
    type: "simpleList",
    itemSelector: "",
    titleSelector: "",
    urlSelector: "",
    dateSelector: "",
    maxItems: 20,
  },
};

export function SettingsContent() {
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isApiAvailable = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  useEffect(() => {
    (async () => {
      const list = await fetchCompanies();
      setCompanies(list);
    })();
  }, []);

  const isEditing = useMemo(
    () => Boolean(companies.find((c) => c.id === form.id)),
    [companies, form.id]
  );

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCrawlChange = (
    field: keyof SimpleListCrawlConfig,
    value: string | number | undefined
  ) => {
    setForm((prev) => ({
      ...prev,
      crawlConfig: { ...prev.crawlConfig, [field]: value },
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const onSave = async () => {
    if (!form.id || !form.name || !form.pressReleaseUrl) {
      setMessage("必須項目が不足しています (ID, 企業名, プレスリリースURL)");
      return;
    }
    setLoading(true);
    const ok = await saveCompany({
      ...form,
      crawlConfig: {
        ...form.crawlConfig,
        dateSelector: form.crawlConfig.dateSelector || undefined,
      },
    });
    setLoading(false);
    if (ok) {
      setMessage("保存しました");
      const list = await fetchCompanies();
      setCompanies(list);
      resetForm();
    } else {
      setMessage("保存に失敗しました。API 設定を確認してください。");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm(`本当に削除しますか？ (${id})`)) return;
    setLoading(true);
    const ok = await deleteCompany(id);
    setLoading(false);
    if (ok) {
      setMessage("削除しました");
      const list = await fetchCompanies();
      setCompanies(list);
      if (form.id === id) resetForm();
    } else {
      setMessage("削除に失敗しました。API 設定を確認してください。");
    }
  };

  const onTestCrawl = async (id: string) => {
    setLoading(true);
    const res = await testCrawlCompany(id);
    setLoading(false);
    if (res.ok) {
      setMessage(`テストクロール成功: ${res.count ?? 0} 件取得`);
    } else {
      setMessage(
        "テストクロールに失敗しました。セレクタやURLを確認してください。"
      );
    }
  };

  return (
    <section className="space-y-6">
      {!isApiAvailable && (
        <div className="rounded-md border border-amber-400 bg-amber-50 text-amber-700 px-4 py-3 text-sm">
          API のベースURLが未設定のため、企業設定の読み書きはできません。
          `.env.local` に NEXT_PUBLIC_API_BASE_URL を設定してください。
        </div>
      )}

      {message && (
        <div className="rounded-md border border-sky-300 bg-sky-50 text-sky-800 px-4 py-2 text-sm">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">企業一覧</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            登録済みの監視対象企業を表示します。編集したい企業を選択してください。
          </p>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {companies.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                企業が登録されていません。
              </p>
            )}
            {companies.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-3 justify-between bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="space-y-1 text-sm">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {c.name}{" "}
                    <span className="text-xs text-slate-500">({c.id})</span>
                  </div>
                  <div className="text-xs text-slate-500 break-all">
                    {c.pressReleaseUrl}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    item: {c.crawlConfig.itemSelector} / title:{" "}
                    {c.crawlConfig.titleSelector}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <button
                    className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                    onClick={() => setForm(c)}
                  >
                    編集
                  </button>
                  <button
                    className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-900/40"
                    onClick={() => onDelete(c.id)}
                    disabled={loading}
                  >
                    削除
                  </button>
                  <button
                    className="px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                    onClick={() => onTestCrawl(c.id)}
                    disabled={loading}
                  >
                    テスト
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">企業の追加 / 更新</h2>
          <div className="space-y-2 text-sm">
            <label className="flex flex-col gap-1">
              <span className="font-medium">企業ID (英数字)</span>
              <input
                className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                value={form.id}
                onChange={(e) => handleChange("id", e.target.value.trim())}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">企業名</span>
              <input
                className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">プレスリリース一覧 URL</span>
              <input
                className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                value={form.pressReleaseUrl}
                onChange={(e) =>
                  handleChange("pressReleaseUrl", e.target.value)
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">ホームページ URL (任意)</span>
              <input
                className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                value={form.homepageUrl ?? ""}
                onChange={(e) => handleChange("homepageUrl", e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="font-medium">itemSelector</span>
                <input
                  className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={form.crawlConfig.itemSelector}
                  onChange={(e) =>
                    handleCrawlChange("itemSelector", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">titleSelector</span>
                <input
                  className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={form.crawlConfig.titleSelector}
                  onChange={(e) =>
                    handleCrawlChange("titleSelector", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">urlSelector</span>
                <input
                  className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={form.crawlConfig.urlSelector}
                  onChange={(e) =>
                    handleCrawlChange("urlSelector", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">dateSelector (任意)</span>
                <input
                  className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={form.crawlConfig.dateSelector ?? ""}
                  onChange={(e) =>
                    handleCrawlChange("dateSelector", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">maxItems (任意)</span>
                <input
                  type="number"
                  min={1}
                  className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={form.crawlConfig.maxItems ?? ""}
                  onChange={(e) =>
                    handleCrawlChange(
                      "maxItems",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="px-3 py-1.5 rounded bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-50"
                onClick={onSave}
                disabled={loading}
              >
                {isEditing ? "更新" : "追加"}
              </button>
              <button
                className="px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                onClick={resetForm}
                disabled={loading}
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
