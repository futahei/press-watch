import * as path from "path";
import { Construct } from "constructs";
import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export interface PressWatchStackProps extends StackProps {
  /**
   * API を配置するリージョンなど、今後拡張する場合用のプレースホルダ。
   * 現時点では特に追加プロパティはなし。
   */
}

export class PressWatchStack extends Stack {
  constructor(scope: Construct, id: string, props?: PressWatchStackProps) {
    super(scope, id, props);

    //
    // 1. DynamoDB テーブル定義
    //
    const articlesTable = new Table(this, "PressWatchArticlesTable", {
      tableName: "PressWatchArticles",
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      removalPolicy:
        /* 本番では RETAIN にすることも検討 */
        // RemovalPolicy.RETAIN
        undefined,
    });

    const pushSubscriptionsTable = new Table(
      this,
      "PressWatchPushSubscriptionsTable",
      {
        tableName: "PressWatchPushSubscriptions",
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: "id",
          type: AttributeType.STRING,
        },
        removalPolicy: undefined,
      }
    );

    //
    // 2. Lambda 関数共通の NodejsFunction 設定
    //
    const commonNodeJsFunctionProps: Partial<NodejsFunctionProps> = {
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      depsLockFilePath: path.resolve(
        __dirname,
        "../../../backend/pnpm-lock.yaml"
      ),
      bundling: {
        minify: true,
        sourceMap: true,
        // aws-sdk v2 をバンドル対象に含める（Node.js 20 ランタイムには同梱されないため）
        externalModules: ["@aws-sdk/*"],
        nodeModules: ["openai", "aws-sdk"],
      },
    };

    //
    // 3. 記事一覧取得用 Lambda
    //
    const getGroupArticlesFunction = new NodejsFunction(
      this,
      "GetGroupArticlesFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/getGroupArticlesHandler.ts"
        ),
        handler: "handler",
        environment: {
          ARTICLES_TABLE_NAME: articlesTable.tableName,
        },
        ...commonNodeJsFunctionProps,
      }
    );

    articlesTable.grantReadData(getGroupArticlesFunction);

    // 記事詳細取得用 Lambda
    const getArticleDetailFunction = new NodejsFunction(
      this,
      "GetArticleDetailFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/getArticleDetailHandler.ts"
        ),
        handler: "handler",
        environment: {
          ARTICLES_TABLE_NAME: articlesTable.tableName,
        },
        ...commonNodeJsFunctionProps,
      }
    );

    articlesTable.grantReadData(getArticleDetailFunction);

    //
    // 4. Push 通知購読用 Lambda（既存）
    //
    const pushSubscribeFunction = new NodejsFunction(
      this,
      "PushSubscribeFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/pushSubscribeHandler.ts"
        ),
        handler: "handler",
        environment: {
          PUSH_SUBSCRIPTIONS_TABLE_NAME: pushSubscriptionsTable.tableName,
        },
        ...commonNodeJsFunctionProps,
      }
    );

    pushSubscriptionsTable.grantReadWriteData(pushSubscribeFunction);

    //
    // 5. 新規: 要約用 Lambda
    //
    const summarizeArticleFunction = new NodejsFunction(
      this,
      "SummarizeArticleFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/summarizeArticleHandler.ts"
        ),
        handler: "handler",
        // OPENAI_API_KEY は AWS Lambda の環境変数から設定する想定。
        // CDK 側では現時点では注入しない（手動または後続対応）。
        ...commonNodeJsFunctionProps,
      }
    );

    //
    // 6. 記事保存用 Lambda
    //
    const saveArticleFunction = new NodejsFunction(
      this,
      "SaveArticleFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/saveArticleHandler.ts"
        ),
        handler: "handler",
        environment: {
          ARTICLES_TABLE_NAME: articlesTable.tableName,
        },
        ...commonNodeJsFunctionProps,
      }
    );

    articlesTable.grantReadWriteData(saveArticleFunction);

    // クロール→DynamoDB 保存（要約なしのスナップショット）
    const crawlAndSaveFunction = new NodejsFunction(
      this,
      "CrawlAndSaveFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/crawlAndSaveHandler.ts"
        ),
        handler: "handler",
        environment: {
          ARTICLES_TABLE_NAME: articlesTable.tableName,
        },
        ...commonNodeJsFunctionProps,
      }
    );

    articlesTable.grantReadWriteData(crawlAndSaveFunction);

    // 単一企業クロール（試験用）
    const crawlCompanyFunction = new NodejsFunction(
      this,
      "CrawlCompanyFunction",
      {
        entry: path.resolve(
          __dirname,
          "../../../backend/src/lambda/crawlCompanyHandler.ts"
        ),
        handler: "handler",
        ...commonNodeJsFunctionProps,
      }
    );

    //
    // 7. HTTP API 定義
    //
    const httpApi = new HttpApi(this, "PressWatchHttpApi", {
      apiName: "PressWatchHttpApi",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["*"],
      },
    });

    // /groups/{groupId}/articles → 記事一覧取得
    httpApi.addRoutes({
      path: "/groups/{groupId}/articles",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetGroupArticlesIntegration",
        getGroupArticlesFunction
      ),
    });

    // /groups/{groupId}/articles/{articleId} → 記事詳細取得
    httpApi.addRoutes({
      path: "/groups/{groupId}/articles/{articleId}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetArticleDetailIntegration",
        getArticleDetailFunction
      ),
    });

    // /push/subscribe → Push 購読登録
    httpApi.addRoutes({
      path: "/push/subscribe",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "PushSubscribeIntegration",
        pushSubscribeFunction
      ),
    });

    // 新規: /summarize → 要約生成
    httpApi.addRoutes({
      path: "/summarize",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "SummarizeArticleIntegration",
        summarizeArticleFunction
      ),
    });

    // /crawl/{companyId} → クロール試験
    httpApi.addRoutes({
      path: "/crawl/{companyId}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "CrawlCompanyIntegration",
        crawlCompanyFunction
      ),
    });

    // /crawl/{companyId}/save?groupId=xxx → クロール→保存
    httpApi.addRoutes({
      path: "/crawl/{companyId}/save",
      methods: [HttpMethod.POST, HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "CrawlAndSaveIntegration",
        crawlAndSaveFunction
      ),
    });

    // 新規: /articles → 記事保存
    httpApi.addRoutes({
      path: "/articles",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "SaveArticleIntegration",
        saveArticleFunction
      ),
    });

    //
    // 8. 出力
    //
    new CfnOutput(this, "ArticlesTableName", {
      value: articlesTable.tableName,
    });

    new CfnOutput(this, "PushSubscriptionsTableName", {
      value: pushSubscriptionsTable.tableName,
    });

    new CfnOutput(this, "HttpApiUrl", {
      value: httpApi.apiEndpoint,
    });
  }
}
