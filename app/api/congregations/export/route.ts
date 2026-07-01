import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { stringifyCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

function toExcelSafeText(value: string): string {
  // Excel interprets leading +,-,=,@ as formulas. Prefix with apostrophe to force plain text.
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const congregations = await prisma.congregation.findMany({
    orderBy: { name: "asc" },
  });

  const rows: string[][] = [
    ["name", "overseer", "contactPrimary", "contactAlternate", "meetingDay1", "meetingDay2", "isActive"],
    ...congregations.map((congregation) => [
      congregation.name,
      congregation.overseer,
      toExcelSafeText(congregation.contactPrimary),
      toExcelSafeText(congregation.contactAlternate ?? ""),
      String(congregation.meetingDays[0] ?? ""),
      String(congregation.meetingDays[1] ?? ""),
      String(congregation.isActive),
    ]),
  ];

  const csv = stringifyCsv(rows);
  const fileName = `congregations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

