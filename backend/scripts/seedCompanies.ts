import { DynamoDbCompanyRepository } from "../src/repository/companyRepository.js";
import { COMPANY_CONFIGS } from "../src/infra/companyConfigs.js";

async function main() {
  const tableName = process.env.COMPANIES_TABLE_NAME;
  if (!tableName) {
    console.error("COMPANIES_TABLE_NAME is not set");
    process.exit(1);
  }

  const repo = new DynamoDbCompanyRepository({ tableName });
  const items = Object.values(COMPANY_CONFIGS);

  for (const c of items) {
    await repo.put(c);
    console.log(`[seed] upsert company ${c.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
