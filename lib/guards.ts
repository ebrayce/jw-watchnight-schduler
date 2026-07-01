import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";

export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }
}

