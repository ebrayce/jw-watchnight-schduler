type LoginFormProps = {
    action: (formData: FormData) => Promise<void>;
    showError?: boolean;
};

export function LoginForm({action, showError = false}: LoginFormProps) {
    return (
        <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <form action={action} className="space-y-6">
                {/* Header */}
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Admin Login
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Enter your credentials to access the dashboard.
                    </p>
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300"
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
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-600 dark:focus:border-zinc-50 dark:focus:bg-zinc-950 dark:focus:ring-zinc-50/10"
                    />
                </div>

                {/* Error State */}
                {showError && (
                    <div
                        className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        <svg
                            className="h-4 w-4 shrink-0"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>Invalid password. Please try again.</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-300 dark:focus:ring-offset-zinc-950"
                >
                    Sign in
                </button>
            </form>
        </div>
    );
}