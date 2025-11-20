export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">PressWatch へようこそ 👋</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        ここでは、登録した企業のプレスリリースを自動で監視し、 AI
        による要約と専門用語の解説を表示します。
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        現在はまだダミー画面です。今後、グループ別の記事一覧や通知設定などを追加していきます。
      </p>
    </section>
  );
}
