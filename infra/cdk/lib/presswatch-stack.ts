import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class PressWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 記事テーブル（PK: pk, SK: sk）
    const articlesTable = new Table(this, "PressWatchArticlesTable", {
      tableName: "PressWatchArticles",
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Push 購読テーブル（単純なハッシュキー）
    const pushSubscriptionsTable = new Table(
      this,
      "PressWatchPushSubscriptionsTable",
      {
        tableName: "PressWatchPushSubscriptions",
        partitionKey: { name: "id", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // グループ別記事取得 Lambda
    const getGroupArticlesFn = new NodejsFunction(
      this,
      "GetGroupArticlesFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../../backend/src/lambda/getGroupArticlesHandler.ts"
        ),
        handler: "handler",
        environment: {
          ARTICLES_TABLE_NAME: articlesTable.tableName,
        },
        bundling: {
          // aws-sdk は Lambda ランタイム同梱なので bundle せず external 扱いにする
          externalModules: ["aws-sdk", "@aws-sdk/*"],
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      }
    );

    articlesTable.grantReadData(getGroupArticlesFn);

    // 将来的に Push 購読 Lambda などを追加する場合はここに追記する

    // CloudFormation Outputs
    new cdk.CfnOutput(this, "ArticlesTableName", {
      value: articlesTable.tableName,
    });

    new cdk.CfnOutput(this, "PushSubscriptionsTableName", {
      value: pushSubscriptionsTable.tableName,
    });
  }
}
