type LoginFormProps = {
    action: (formData: FormData) => Promise<void>;
    showError?: boolean;
};

export function LoginForm({action, showError = false}: LoginFormProps) {
    return (
        <div
            className="card w-full max-w-md rounded-2xl p-8 shadow-lg shadow-brand-deep/10">
            <form action={action} className="space-y-6">
                {/* Header */}
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-brand-deep">
                        Admin Login
                    </h1>
                    <p className="text-sm text-brand-muted">
                        Enter your credentials to access the dashboard.
                    </p>
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="text-sm font-medium leading-none text-brand-muted"
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
                        className="w-full rounded-lg border border-brand-accent/50 bg-white px-3 py-2.5 text-sm text-brand-deep placeholder-brand-muted/70 transition-all focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                    />
                </div>

                {/* Error State */}
                {showError && (
                    <div
                        className="flex items-center gap-2 rounded-lg bg-amber-100 p-3 text-sm text-brand-deep">
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
                    className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                >
                    Sign in
                </button>
            </form>
        </div>
    );
}