# JW Watchnight Scheduler

Secure scheduling app for assigning congregations to daily watchnight duty while preventing assignments on each congregation's local meeting days.

## Features

- Admin-only access with signed `httpOnly` session cookie
- Congregation CRUD: name, overseer, contacts, two fixed meeting days, active/inactive
- Scheduler configuration: assignment window, assignments/day, week start day, optional consecutive-day avoidance
- Auto-assignment engine with fairness balancing + random tie-breaking + conflict reasons
- Manual assignment override with meeting-day safety validation
- Audit log for schedule generation and manual overrides
- Prisma + PostgreSQL persistence

## Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Prisma ORM
- PostgreSQL
- Zod validation

## Quick Start

1. Install dependencies

```bash
pnpm install
```

2. Generate an admin password hash

```bash
pnpm auth:hash "change-me"
```

Example output format:

`<saltHex>:<hashHex>`

Copy that full value into `ADMIN_PASSWORD_HASH` in `.env.local`.

3. Create env file and fill secrets

```bash
cp .env.example .env.local
```

Required env vars in `.env.local`:

- `DATABASE_URL`
- `SESSION_SECRET` (32+ random chars)
- `ADMIN_PASSWORD_HASH` (`saltHex:hashHex`)

Generate a secure `SESSION_SECRET` (recommended):

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Set `ADMIN_PASSWORD_HASH` using the generated hash:

```dotenv
ADMIN_PASSWORD_HASH="paste-output-from-pnpm-auth-hash"
```

4. Generate Prisma client and run migration

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm db:seed
```

5. Start app

```bash
pnpm dev
```

Open `http://localhost:3000` and sign in at `/login`.

## Main Routes

- `/` dashboard
- `/congregations` manage congregations
- `/settings` scheduler configuration
- `/schedule` auto-generate + manual overrides

## Smoke Test (Scheduler Core)

Runs the pure scheduler engine without DB writes:

```bash
pnpm scheduler:smoke
```

## Security Notes

- Passwords are verified using `scrypt` and timing-safe comparison
- Session cookies are `httpOnly`, `sameSite=strict`, and `secure` in production
- Input validation is enforced with Zod in all write actions

## Troubleshooting

### Error: `SESSION_SECRET` too small (Zod)

If you see an error like:

`Too small: expected string to have >=32 characters`

update `SESSION_SECRET` in `.env.local` to a value with at least 32 characters.

Example:

```dotenv
SESSION_SECRET="replace-with-very-long-random-secret-value"
```

### Error: invalid `ADMIN_PASSWORD_HASH` format

If you see an error like this in env validation:

`ADMIN_PASSWORD_HASH` must match `saltHex:hashHex`

generate a fresh hash and copy it exactly:

```bash
pnpm auth:hash "your-admin-password"
```

Then set it in `.env.local`:

```dotenv
ADMIN_PASSWORD_HASH="<saltHex>:<hashHex>"
```

