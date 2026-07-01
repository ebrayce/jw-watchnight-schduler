import { randomBytes, scryptSync } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

const password = process.argv[2];

if (!password) {
  console.error("Usage: pnpm tsx scripts/generate-password-hash.ts <password>");
  process.exit(1);
}

console.log(hashPassword(password));


