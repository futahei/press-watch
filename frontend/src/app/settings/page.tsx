import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { SettingsContent } from "@/components/SettingsContent";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("presswatch_admin");
  const isAdmin = adminCookie?.value === "1";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">管理設定</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          監視対象の企業やグループ設定など、管理者向けの設定を行うページです。
        </p>
      </header>

      {isAdmin ? (
        <SettingsContent />
      ) : (
        <section className="max-w-md">
          <AdminLoginForm />
        </section>
      )}
    </main>
  );
}
