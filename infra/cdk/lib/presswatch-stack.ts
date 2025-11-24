import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export class PressWatchStack extends cdk.Stack {
  public readonly articlesTable: Table;
  public readonly pushSubscriptionsTable: Table;

  public readonly getGroupArticlesFn: NodejsFunction;
  public readonly pushSubscribeFn: NodejsFunction;
  public readonly crawlerFn: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    // DynamoDB テーブル
    //
    this.articlesTable = new Table(this, "PressWatchArticlesTable", {
      tableName: "PressWatchArticles",
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.pushSubscriptionsTable = new Table(
      this,
      "PressWatchPushSubscriptionsTable",
      {
        tableName: "PressWatchPushSubscriptions",
        partitionKey: { name: "id", type: AttributeType.STRING },
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

    //
    // Lambda 共通 Path
    //
    const backendLambdaEntryDir = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "backend",
      "src",
      "lambda"
    );

    //
    // GetGroupArticlesFunction
    //
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
          forceDockerBundling: false,
        },
        environment: {
          ARTICLES_TABLE_NAME: this.articlesTable.tableName,
        },
      }
    );
    this.articlesTable.grantReadData(this.getGroupArticlesFn);

    //
    // PushSubscribeFunction
    //
    this.pushSubscribeFn = new NodejsFunction(this, "PushSubscribeFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(backendLambdaEntryDir, "pushSubscribeHandler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["aws-sdk"],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false,
      },
      environment: {
        PUSH_SUBSCRIPTIONS_TABLE_NAME: this.pushSubscriptionsTable.tableName,
      },
    });
    this.pushSubscriptionsTable.grantReadWriteData(this.pushSubscribeFn);

    //
    // Crawler Lambda
    //
    this.crawlerFn = new NodejsFunction(this, "CrawlerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(backendLambdaEntryDir, "crawlerHandler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["aws-sdk"],
        minify: true,
        sourceMap: true,
        forceDockerBundling: false,
      },
      environment: {
        ARTICLES_TABLE_NAME: this.articlesTable.tableName,
      },
    });
    this.articlesTable.grantReadWriteData(this.crawlerFn);

    //
    // EventBridge（12時間ごと）
    //
    new events.Rule(this, "CrawlerScheduleRule", {
      schedule: events.Schedule.expression("rate(12 hours)"),
      targets: [new targets.LambdaFunction(this.crawlerFn)],
    });

    //
    // API Gateway HTTP API
    //
    const httpApi = new apigwv2.HttpApi(this, "PressWatchApi", {
      apiName: "PressWatchApi",
      description: "API for PressWatch",
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(10),
      },
    });

    httpApi.addRoutes({
      path: "/groups/{groupId}/articles",
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "GetGroupArticlesIntegration",
        this.getGroupArticlesFn
      ),
    });

    httpApi.addRoutes({
      path: "/push/subscribe",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration(
        "PushSubscribeIntegration",
        this.pushSubscribeFn
      ),
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });
  }
}
