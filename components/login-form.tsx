type LoginFormProps = {
  action: (formData: FormData) => Promise<void>;
  showError?: boolean;
};

export function LoginForm({ action, showError = false }: LoginFormProps) {
  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 p-6">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          autoComplete="current-password"
        />
      </label>
      {showError ? <p className="text-sm text-red-700">Invalid password.</p> : null}
      <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
        Sign in
      </button>
    </form>
  );
}


