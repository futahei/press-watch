import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "@/components/ArticleCard";

describe("ArticleCard", () => {
  it("企業名・タイトル・要約・日付を表示する", () => {
    render(
      <ArticleCard
        companyName="Example Corp."
        title="新製品リリースのお知らせ"
        url="https://example.com/press/1"
        publishedAt="2025-11-01T09:00:00Z"
        summaryText="これは要約テキストです。"
        isNew={true}
      />
    );

    expect(screen.getByText("Example Corp.")).toBeInTheDocument();
    expect(screen.getByText("新製品リリースのお知らせ")).toBeInTheDocument();
    expect(screen.getByText("これは要約テキストです。")).toBeInTheDocument();
    // フォーマットされた日付（ロケール依存だが、'2025/11/01' を想定）
    expect(screen.getByText("2025/11/01")).toBeInTheDocument();

    // NEW バッジ
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("summaryText がない場合は、生成中メッセージを表示する", () => {
    render(
      <ArticleCard
        companyName="Example Corp."
        title="新製品リリースのお知らせ"
        url="https://example.com/press/1"
      />
    );

    expect(
      screen.getByText("要約はまだ生成されていません。")
    ).toBeInTheDocument();
  });
});
