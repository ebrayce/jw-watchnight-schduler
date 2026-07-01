type LoginFormProps = {
  action: (formData: FormData) => Promise<void>;
  showError?: boolean;
};

export function LoginForm({ action, showError = false }: LoginFormProps) {
  return (
    <div className="ui-card w-full max-w-md p-8">
      <form action={action} className="space-y-6">

        {/* Header Section */}
        <div className="space-y-1.5">
          <h1 className="ui-title text-2xl font-bold tracking-tight">
            Admin Login
          </h1>
          <p className="ui-subtle text-sm">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="ui-subtle text-xs font-semibold uppercase tracking-wider pl-0.5"
          >
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

        {/* System Error Banner */}
        {showError && (
          <div className="ui-alert-error flex items-center gap-2 p-3.5 text-sm font-medium">
            <svg
              className="h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>Invalid password. Please try again.</span>
          </div>
        )}

        {/* Primary Submission Trigger */}
        <button
          type="submit"
          className="ui-btn w-full py-2.5 text-sm font-semibold cursor-pointer shadow-md shadow-[var(--primary)]/10"
        >
          Sign In
        </button>

      </form>
    </div>
  );
}