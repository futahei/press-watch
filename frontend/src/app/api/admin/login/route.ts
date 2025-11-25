import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    console.error(
      "[api/admin/login] ADMIN_PASSWORD が環境変数に設定されていません。"
    );
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  let body: { password?: string };

  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const password = body.password ?? "";

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // 管理者認証用 Cookie をセット
  res.cookies.set("presswatch_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8時間
  });

  return res;
}
