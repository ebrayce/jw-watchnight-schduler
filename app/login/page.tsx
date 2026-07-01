import { loginAction } from "@/app/actions";
import { LoginForm } from "@/components/login-form";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/");
  }

  const params = await searchParams;
  const showError = params.error === "invalid";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <LoginForm action={loginAction} showError={showError} />
    </main>
  );
}

