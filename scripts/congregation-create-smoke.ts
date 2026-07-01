import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadDotenv } from "dotenv";
import { Pool } from "pg";

loadDotenv({ path: ".env.local" });
loadDotenv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Set it in .env.local or .env before running this smoke test.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const uniqueSuffix = Date.now();
  const name = `Smoke Test Congregation ${uniqueSuffix}`;

  const created = await prisma.congregation.create({
    data: {
      name,
      overseer: "Smoke Test Overseer",
      contactPrimary: "+233-200-123-456",
      contactAlternate: "+233-200-123-457",
      meetingDays: [2, 5],
      isActive: true,
    },
  });

  if (!created.id) {
    throw new Error("Create failed: no id returned.");
  }

  await prisma.congregation.delete({
    where: { id: created.id },
  });

  console.log("Congregation create smoke test passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

