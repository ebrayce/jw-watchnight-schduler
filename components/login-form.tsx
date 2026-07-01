type LoginFormProps = {
  action: (formData: FormData) => Promise<void>;
  showError?: boolean;
};

export function LoginForm({ action, showError = false }: LoginFormProps) {
  return (
    <div className="ui-card w-full max-w-md p-8 shadow-sm">
      <form action={action} className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="ui-title text-2xl font-semibold tracking-tight">Admin Login</h1>
          <p className="ui-subtle text-sm">Enter your credentials to access the dashboard.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="ui-subtle text-sm font-medium leading-none">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="ui-input"
          />
        </div>

        {showError ? (
          <div className="ui-alert-error flex items-center gap-2 p-3 text-sm">
            <span>Invalid password. Please try again.</span>
          </div>
        ) : null}

        <button type="submit" className="ui-btn w-full px-4 py-2.5 text-sm font-medium">
          Sign in
        </button>
      </form>
    </div>
  );
}