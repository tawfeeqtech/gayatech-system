# Gayatech System Constitution
<!-- Spec Constitution for Gayatech Financial System -->

## Core Principles

### I. Financial Accuracy (NON-NEGOTIABLE)
Every financial operation MUST balance precisely. Wallet balances MUST always equal:
`income − expense + exchangeIn − exchangeOut` for each currency.
Any operation that modifies a wallet MUST update its `balance` field atomically via `$inc`.
No manual balance edits outside of approved API endpoints — ALL balance mutations go through CurrencyExchange or Transaction controllers.

### II. Dual-Transaction Architecture
Currency exchanges (CurrencyExchange) and financial transactions (Transaction) are SEPARATE entities:
- **Transactions**: Income/expense operations that adjust wallet balances for real-world cash flow.
- **CurrencyExchange**: Cross-wallet currency conversions that debit one wallet and credit another, WITHOUT creating a Transaction record.
- The financial summary MUST aggregate BOTH sources: `currencyStats` from CurrencyExchange + monthly aggregation from Transaction.

### III. Arabic-First UX
All UI text, labels, notifications, and error messages MUST be in Arabic (`ar` locale).
Date formatting uses `dayjs` with `dayjs/locale/ar` — NEVER `new Date()` — to avoid Ant Design v5 compatibility issues.
Right-to-left (RTL) layout is the default; LTR exceptions only for numbers and currency codes.

### IV. MERN Stack Standards
- **Backend**: Express.js + Mongoose OOP patterns (controllers → routes → server.js)
- **Frontend**: React + Ant Design + Vite + dayjs
- **Database**: MongoDB with Mongoose schemas defining virtuals and population paths
- **Pattern**: RESTful API with JWT auth, role-based access (admin/user)

### V. Security & Access Control
- JWT tokens for all authenticated routes
- Role check middleware (`roleCheck('admin')`) on sensitive operations (currency exchange CRUD, transaction creation)
- CORS configuration supports Cloudflare Tunnel domains via regex pattern `/\.trycloudflare\.com$/`
- Server binds to `0.0.0.0` for reverse-proxy compatibility

## Technology Stack

- **Runtime**: Node.js (Express server on port 5000, Vite dev server on port 5173)
- **Database**: MongoDB via Mongoose ODM
- **Frontend**: React 18 + Ant Design 5 + Vite + dayjs
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Deployment**: Cloudflare Tunnel (trycloudflare ephemeral URLs)
- **State**: React hooks (useState, useEffect, useCallback, useMemo)
- **API Client**: Axios (custom `api` instance)

## Development Workflow

1. **Spec-First**: Before coding any feature, define it via Spec Kit (constitution → spec → plan → tasks → implement)
2. **Test via API**: Verify all backend changes with curl or Postman before touching the frontend
3. **Wallet Balance Validation**: After every currency exchange or transaction operation, verify wallet balances match expected math
4. **Commit Convention**: Arabic commit messages describing WHAT changed, prefixed by type (feat/fix/docs/refactor)
5. **Deployment**: Use `npm run dev-background` pattern (server.log/client.log for stdout capture), verify via curl before announcing readiness

## Governance

This constitution supersedes ad-hoc development practices. All new features MUST go through the Spec Kit workflow:
- `/speckit-constitution` — verify principles are consistent with new feature
- `/speckit-specify` — define requirements with user stories and test scenarios
- `/speckit-plan` — create implementation plan with tech stack decisions
- `/speckit-tasks` — break into actionable tasks
- `/speckit-implement` — execute code
- `/speckit-converge` — verify code matches spec

Wallet balance integrity is the #1 quality gate. Any PR that breaks balance math MUST be rejected.
Use CLAUDE.md for runtime development guidance and project-specific conventions.

**Version**: 1.0.0 | **Ratified**: 2026-06-21 | **Last Amended**: 2026-06-21
