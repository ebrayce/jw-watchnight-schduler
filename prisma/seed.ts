import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  });

