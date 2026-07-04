# Skill Scorecards 🏅

**Consumer Reports for agent skills.** An automated battery that runs agent skills through standardized scenarios in a sandbox and publishes graded, evidence-backed scorecards — correctness, reliability, safety, transparency, maintenance.

> Marketplaces host thousands of agent skills. Security scanners exist; *correctness* testing doesn't — and silent wrong output is the ecosystem's #1 complaint. Scorecards is neutral infrastructure that tells you how a skill actually behaves before you hand it your calendar, your inbox, and your API keys.

---

## Status: `M0` — the scoring engine

This repo ships the **pure scoring engine** (`src/score.ts`) with its test suite and a golden scorecard fixture. The crawler, the Docker sandbox with a mocked agent world, the scenario battery, and the public site land in later milestones (see [`SPEC.md`](./SPEC.md)).

The engine is deliberately first: grading must be **versioned, fair, and reproducible** before a single public ranking exists.

## Quickstart

```bash
npm install
npm run typecheck
npm test          # thresholds, weighting, safety-gate, scorecard assembly
```

## How grading works

Five dimensions, weighted, normalized 0–100 → a letter grade:

| Dimension | Weight | Measures |
|-----------|:------:|----------|
| Correctness | 0.40 | Outputs match scenario expectations |
| Reliability | 0.25 | Stable across seeds and repeat runs (flakiness) |
| Safety | 0.20 | No undeclared file/network/env access in the sandbox |
| Transparency | 0.10 | Docs, changelog, pinned dependencies |
| Maintenance | 0.05 | Repo recency, issue responsiveness |

```ts
import { buildScorecard } from "@agenttrust/skill-scorecards";
const card = buildScorecard("calendar-buddy", "1.2.0", dimensions);
// → { overall: "A", methodologyVersion: "1.0", ... }
```

**The safety gate:** a safety score below 50 caps the overall grade at **F**, regardless of the other dimensions. A skill that attempts undeclared access cannot be an "A."

## Fairness commitments (from `SPEC.md`)

- **Methodology published before rankings.** Every card records the methodology version that graded it.
- **"Not batterable" is a category, never a bad grade** (e.g. skills needing live credentials).
- **Evidence or it didn't happen** — every deduction links to a replayable trace.
- **Disputes** get a public intake and a stated SLA; re-runs on request.

## License

MIT (code) / methodology CC BY 4.0. See [`LICENSE`](./LICENSE). Part of the **Agent Trust Suite**; consumes the trace format and verifier engine from [Blackbox](https://github.com/Kaushik-hub306/blackbox).
