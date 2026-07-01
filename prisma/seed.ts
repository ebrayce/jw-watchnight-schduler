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

  const defaultCongregations = [
    {
      name: "Accra Central",
      overseer: "Bro. Kofi Mensah",
      contactPrimary: "+233-200-000-001",
      contactAlternate: "+233-200-000-101",
      meetingDays: [2, 0],
      isActive: true,
    },
    {
      name: "Tema East",
      overseer: "Bro. Daniel Asare",
      contactPrimary: "+233-200-000-002",
      contactAlternate: "+233-200-000-102",
      meetingDays: [1, 4],
      isActive: true,
    },
    {
      name: "Adenta South",
      overseer: "Bro. Felix Ofori",
      contactPrimary: "+233-200-000-003",
      contactAlternate: "+233-200-000-103",
      meetingDays: [3, 6],
      isActive: true,
    },
    {
      name: "Kasoa West",
      overseer: "Bro. Kwame Agyemang",
      contactPrimary: "+233-200-000-004",
      contactAlternate: "+233-200-000-104",
      meetingDays: [2, 5],
      isActive: true,
    },
    {
      name: "Madina North",
      overseer: "Bro. Ebenezer Addo",
      contactPrimary: "+233-200-000-005",
      contactAlternate: "+233-200-000-105",
      meetingDays: [1, 3],
      isActive: true,
    },
    {
      name: "Dansoman",
      overseer: "Bro. Joseph Nyarko",
      contactPrimary: "+233-200-000-006",
      contactAlternate: "+233-200-000-106",
      meetingDays: [4, 0],
      isActive: true,
    },
  ];

  await prisma.congregation.createMany({
    data: defaultCongregations,
    skipDuplicates: true,
  });

  const congregationCount = await prisma.congregation.count();

  console.log(`Seed complete: scheduler config ensured, total congregations=${congregationCount}.`);
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

