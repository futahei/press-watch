#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PressWatchStack } from "../lib/presswatch-stack";

const app = new cdk.App();

new PressWatchStack(app, "PressWatchStack", {
  /* env は最初は未指定（デフォルトアカウント/リージョンを使う）
   * 後で明示したくなったら:
   * env: { account: "123456789012", region: "ap-northeast-1" },
   */
});
