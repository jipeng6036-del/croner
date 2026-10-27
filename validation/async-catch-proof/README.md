# Croner async catch callback reproduction

This directory contains local reproduction material for the callback-rejection fix. Both npm tarballs retain the package version `11.0.0`; they are local builds, not separately published npm releases.

| Build | Git commit | SHA-256 of included tarball |
| --- | --- | --- |
| Baseline (`dev`) | `ecf62fdc4f9584869140aad7536e2b320e9a923b` | `0bf9cde06124f087a26ce067a4b75f40743d521b18d9bb9e7a126f402794ece4` |
| Candidate | `511b29052629df0d3c95c53311bd71a7dbc7eb71` | `5224222baca309f206c4ffac047a838e1b5cbecc1f2030308aa6c1a3c2885b56` |

The candidate tree is `4eaca1665093f31f2585cf5a7a9ac799ad91c1f3`. Its change consumes a Promise rejection from the error callback without waiting for the callback to finish. The existing synchronous catch boundary, `trigger()` completion, and `protect`/busy behavior remain in place.

## Reproduce with the included packages

Use Node.js and npm in a fresh directory. From this directory, run the following commands in a shell with `mkdir`, `cd`, and `cp` (including PowerShell). Each installation is from an included local tarball, uses offline mode, and disables lifecycle scripts. The package has no runtime dependencies.

```sh
mkdir baseline-check
cd baseline-check
cp ../reproduce.mjs .
npm install --offline --ignore-scripts --no-audit --no-fund --package-lock=false ../packages/baseline.tgz
node reproduce.mjs
cd ..
```

On Node.js `24.14.0` on Windows, the baseline exits with code `1` and reports:

```text
Error: async error handler failed
```

Then test the candidate independently:

```sh
mkdir candidate-check
cd candidate-check
cp ../reproduce.mjs .
npm install --offline --ignore-scripts --no-audit --no-fund --package-lock=false ../packages/candidate.tgz
node reproduce.mjs
cd ..
```

On the same runtime, the candidate exits with code `0` and prints:

```text
survived: callback called once, job not busy
```

The script imports the installed package through its ESM export, triggers a real Cron job, and leaves Node's native unhandled-rejection behavior enabled. It installs no process rejection listeners and makes no network, model, or paid-service calls.

## Validation scope

The Windows Node.js `24.14.0` original `npm run pre-commit` and complete `npm run build` pass in UTC: baseline `678` tests, candidate `682` tests. The four added regression tests give baseline `2` failures / `2` passes and candidate `4` passes. The baseline overlay and final test differ only in line endings.

The additional Windows `America/Los_Angeles` OCPS test run fails on both baseline and candidate. Those results are preserved separately; they are not represented as passing checks. The configured non-UTC CI timezone is `America/New_York`.

The configured Linux runtime checks passed locally on both revisions:

| Runtime | Installer | Full test results (baseline → candidate) |
| --- | --- | --- |
| Node.js `18.20.8` | Task-local official npm `10.9.9` | `678` → `682` passed |
| Node.js `20.20.2` | Original npm `10.8.2` | `678` → `682` passed |
| Node.js `22.23.4` | npm `10.9.9` | `678` → `682` passed |
| Node.js `24.22.1` | npm `11.19.1` | `678` → `682` passed |
| Node.js `26.12.1` | npm `11.20.0` | `678` → `682` passed |
| Deno `2.9.8` | Deno dependency resolution | `678` → `682` passed |
| Bun `1.4.4` | `bun install` | `678` → `682` passed |

Node.js 24 also passed the original pre-commit, full build, and complete `America/New_York` test run. Deno passed format/lint/type checking, UTC and `America/New_York` full tests, and `deno publish --dry-run`. The dry run did not publish anything. `gates.DERIVED.json` lists the 40 selected successful setup, dependency-health, and project commands, their runtime versions and source-log hashes. Its 24 project-check rows link representative raw excerpts. The unchanged full-build script executes clean, version check, type checking, all tests, and distribution generation.

Node.js 18 setup uses an explicitly scoped installer exception: the original npm `10.8.2` attempts stalled, and clean baseline/candidate installs used supported official npm `10.9.9` through a task-only PATH. Global npm, the Node runtime, project dependency declarations, and CI files were unchanged. This does not establish the cause of the earlier stalls. Node.js 20 retained npm `10.8.2`. The successful Node.js 18/20 installs used task-only fetch timeout `60000`, retry count `1`, max sockets `1`, and audit enabled. The earlier stalled attempts and repaired baseline with invalid optional remnants are not counted as passing clean runs.

Node.js 26 retained npm's default esbuild install-script approval notice. No script approval was forced; these results do not claim that every third-party lifecycle script executed. Normal installs were not taken from one shared frozen lockfile. The baseline/candidate lockfiles match byte for byte within each runtime except Node.js 20. Its 96 package records retain the same versions, registry tarballs, integrity and other contents, with 25 package-placement moves. Four moved packages were reported installed, so this is not merely unused optional metadata. The two successful `npm ls --all --json` outputs match byte for byte with no reported problems, demonstrating the reported logical graph, not physical `node_modules` layout or file equality. The `tsx`/esbuild entry records and paths match. The original successful Node.js 20 runs are retained with this limitation; no fresh layout-controlled rerun is claimed. Same-environment Node.js 24/Windows regression comparisons separately establish the callback failure. The lock comparison and source hashes are recorded in `gates.DERIVED.json`.

The same included Windows-built packages also ran a 48-case CJS/ESM/UMD consumer matrix per revision on Windows Node.js `24.14.0` and Linux Node.js `24.22.1`. Each platform observed baseline `15` handler-fatal cases, `30` surviving controls and `3` intentional `catch: false` fatal controls; the candidate observed `45` surviving cases and the same `3` intentional fatal controls. The `192` expected outcomes therefore do not mean that every process exited successfully. The short `reproduce.mjs` example above was run on Windows; Linux used the complete consumer matrix. `consumers.DERIVED.json` records the detailed scope and source hashes.

The five compiled distribution members match the independent canonical Linux builds byte for byte. Whole tarballs do not: Windows README/package metadata use CRLF, while their Linux equivalents use LF; the license bytes match. This directory is a local evidence capsule, not a package release.

UMD consumer results, when listed, use a Node VM context and do not constitute browser testing. Local checks are not upstream hosted-CI results. No model or paid-service calls are part of this validation.

## Evidence and licensing

Files named `*.DERIVED.json` are curated summaries or indexes, not raw logs. Files under `evidence/` contain unchanged byte excerpts from the original logs, including terminal color bytes where present. `excerpts.DERIVED.json` records each source log's SHA-256 and the selected zero-based byte range; it also gives each excerpt's SHA-256. Long stack traces containing local filesystem paths are excluded. The local `.gitattributes` preserves these evidence bytes without Git line-ending conversion.

The two tarballs contain only the upstream README, package metadata, MIT license, CJS/ESM/UMD bundles, and TypeScript declarations. Each package includes its original MIT license; a copy is also included here as `LICENSE`. `package-audit.DERIVED.json` records all members and their hashes.
