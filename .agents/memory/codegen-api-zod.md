---
name: Codegen api-zod index fix
description: Orval regenerates lib/api-zod/src/index.ts with a stale export that breaks typecheck — must be fixed after every codegen run.
---

After running `pnpm --filter @workspace/api-spec run codegen` (or just `orval`), Orval overwrites `lib/api-zod/src/index.ts` with two exports including `export * from "./generated/api.schemas"` — but that file does not exist in the zod split-mode output.

**Why:** Orval infers an index barrel from the api-client-react config but the zod output only produces `generated/api.ts`, not `generated/api.schemas.ts`. The generated index is wrong.

**How to apply:** After every codegen run, immediately overwrite `lib/api-zod/src/index.ts` to contain only:
```ts
export * from "./generated/api";
```
Also: run orval directly (`pnpm exec orval --config ./orval.config.ts`) rather than via `pnpm --filter @workspace/api-spec run codegen` so you can fix the index before typecheck runs. Or run codegen, accept the exit 2, fix the index, then run `pnpm run typecheck:libs` separately.
