import { DynamoDB, config as awsConfig } from "aws-sdk";
import type { CompanyConfig } from "../domain/models.js";

export interface CompanyRepository {
  list(): Promise<CompanyConfig[]>;
  getById(id: string): Promise<CompanyConfig | null>;
  put(config: CompanyConfig): Promise<void>;
}

export class DynamoDbCompanyRepository implements CompanyRepository {
  private readonly tableName: string;
  private readonly client: DynamoDB.DocumentClient;

  constructor(params: { tableName: string; client?: DynamoDB.DocumentClient }) {
    this.tableName = params.tableName;

    if (!awsConfig.region) {
      awsConfig.update({ region: process.env.AWS_REGION ?? "ap-northeast-1" });
    }

    this.client =
      params.client ??
      new DynamoDB.DocumentClient({
        convertEmptyValues: true,
        maxRetries: 0,
      });
  }

  async list(): Promise<CompanyConfig[]> {
    const res = await this.client
      .scan({
        TableName: this.tableName,
      })
      .promise();

    return (res.Items ?? []) as CompanyConfig[];
  }

  async getById(id: string): Promise<CompanyConfig | null> {
    const res = await this.client
      .get({
        TableName: this.tableName,
        Key: { id },
      })
      .promise();

    return (res.Item as CompanyConfig | undefined) ?? null;
  }

  async put(config: CompanyConfig): Promise<void> {
    await this.client
      .put({
        TableName: this.tableName,
        Item: config,
      })
      .promise();
  }
}
