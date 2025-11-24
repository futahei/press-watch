import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class PressWatchStack extends cdk.Stack {
  public readonly articlesTable: Table;
  public readonly pushSubscriptionsTable: Table;

  public readonly getGroupArticlesFn: NodejsFunction;
  public readonly pushSubscribeFn: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- DynamoDB テーブル ---

    this.articlesTable = new Table(this, "PressWatchArticlesTable", {
      tableName: "PressWatchArticles",
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.pushSubscriptionsTable = new Table(
      this,
      "PressWatchPushSubscriptionsTable",
      {
        tableName: "PressWatchPushSubscriptions",
        partitionKey: {
          name: "id",
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    new cdk.CfnOutput(this, "ArticlesTableName", {
      value: this.articlesTable.tableName,
    });

    new cdk.CfnOutput(this, "PushSubscriptionsTableName", {
      value: this.pushSubscriptionsTable.tableName,
    });

    // --- Lambda 関数 ---

    const backendLambdaEntryDir = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "backend",
      "src",
      "lambda"
    );

    this.getGroupArticlesFn = new NodejsFunction(
      this,
      "GetGroupArticlesFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(backendLambdaEntryDir, "getGroupArticlesHandler.ts"),
        handler: "handler",
        bundling: {
          externalModules: ["aws-sdk"],
          minify: true,
          sourceMap: true,
          forceDockerBundling: false, // ★ Docker を使わずローカルビルドを強制
        },
        environment: {
          ARTICLES_TABLE_NAME: this.articlesTable.tableName,
        },
      }
    );

    this.pushSubscribeFn = new NodejsFunction(this, "PushSubscribeFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(backendLambdaEntryDir, "pushSubscribeHandler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["aws-sdk"],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false, // ★ こちらも同様
      },
      environment: {
        PUSH_SUBSCRIPTIONS_TABLE_NAME: this.pushSubscriptionsTable.tableName,
      },
    });

    this.articlesTable.grantReadData(this.getGroupArticlesFn);
    this.pushSubscriptionsTable.grantReadWriteData(this.pushSubscribeFn);

    // --- API Gateway HTTP API ---

    const httpApi = new apigwv2.HttpApi(this, "PressWatchApi", {
      apiName: "PressWatchApi",
      description: "API for PressWatch frontend",
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"], // ★ 必要に応じて Next.js の本番ドメインへ閉じる
        maxAge: cdk.Duration.days(10),
      },
    });

    // GET /groups/{groupId}/articles → Lambda
    httpApi.addRoutes({
      path: "/groups/{groupId}/articles",
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "GetGroupArticlesIntegration",
        this.getGroupArticlesFn
      ),
    });

    // POST /push/subscribe → Lambda
    httpApi.addRoutes({
      path: "/push/subscribe",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "PushSubscribeIntegration",
        this.pushSubscribeFn
      ),
    });

    // API の URL を出力
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });
  }
}
