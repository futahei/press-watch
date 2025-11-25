export function SettingsContent() {
  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        現在は仮の設定画面です。今後このページに以下のような項目を追加していきます。
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
        <li>監視対象企業の追加・削除</li>
        <li>企業ごとのプレスリリース URL / セレクタの設定</li>
        <li>グループの作成・編集</li>
        <li>通知対象グループのデフォルト設定</li>
      </ul>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        ※ 管理者パスワードはサーバーの環境変数で管理され、Cookie
        によってアクセスが維持されます。
      </p>
    </section>
  );
}
