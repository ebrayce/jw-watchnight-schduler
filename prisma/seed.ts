import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadDotenv } from "dotenv";
import { Pool } from "pg";

loadDotenv({ path: ".env.local" });
loadDotenv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Set it in .env.local or .env before running seed.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.schedulerConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      assignmentWindowDays: 30,
      assignmentsPerDay: 1,
      weekStartsOn: 1,
      avoidConsecutiveDays: false,
    },
    update: {},
  });

  console.log("Seed complete: scheduler config ensured.");
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

