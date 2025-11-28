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
      bundling: {
        minify: true,
        sourceMap: true,
        // aws-sdk v2 は Lambda ランタイムに同梱されているので external にする
        externalModules: ["aws-sdk", "@aws-sdk/*"],
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
    // 6. HTTP API 定義
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

    //
    // 7. 出力
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
