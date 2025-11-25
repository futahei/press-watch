"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage("パスワードを入力してください。");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage("パスワードが正しくありません。");
        } else {
          setErrorMessage(
            "ログインに失敗しました。時間をおいて再度お試しください。"
          );
        }
        return;
      }

      // 成功したらページをリロードして Cookie を反映
      window.location.reload();
    } catch (error) {
      console.error("[AdminLoginForm] login error:", error);
      setErrorMessage(
        "ログインに失敗しました。ネットワーク状態を確認してください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
    >
      <h2 className="text-sm font-semibold">管理者ログイン</h2>
      <p className="text-xs text-slate-600 dark:text-slate-300">
        管理者用パスワードを入力して settings ページへアクセスします。
      </p>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
          パスワード
        </label>
        <input
          type="password"
          autoComplete="current-password"
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {errorMessage && (
        <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium
                   bg-sky-600 text-white hover:bg-sky-700
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors"
      >
        {submitting ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
