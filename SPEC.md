# SPEC — Skill Scorecards

**Consumer Reports for agent skills. An automated battery that tests ClawHub skills for correctness, reliability, and safety — published as public, evidence-backed scorecards.**
Repo: `skill-scorecards` · License: MIT (code) / methodology CC BY 4.0 · Track: Both (authority play) · Target: 4–6 weeks

---

## 0. Mission & Positioning

ClawHub hosts ~7,000–10,000+ skills. Security scanning exists (VirusTotal-class); **correctness testing does not** — and silent wrong output is the ecosystem's #1 complaint class (39.1% of 16,635 classified complaints). Scorecards runs every popular skill through a standardized battery and publishes graded, evidence-linked scorecards.

Positioning: **"Before you give a skill your calendar, your email, and your API keys — see how it actually scored."**

**Principles:**
1. **Neutral infrastructure, not a hit list.** Score behaviors, not authors. Publish the full methodology before the first ranking. Free re-runs on request. Public dispute process.
2. **Evidence or it didn't happen.** Every grade links to replayable traces (Trace Schema v1). No unexplainable scores.
3. **Deterministic where possible.** Sandboxed, mocked-world runs; LLM-judge only for output quality, sampled and rubric-versioned.

## 1. Scope

### P0
- **Crawler/indexer:** ClawHub registry metadata (name, version, author, permissions requested, install counts, repo link). Respect ToS/robots; cache with etags; incremental.
- **Static analysis:** manifest sanity, declared vs. imported permissions, dependency risk surface (known-bad packages list), license presence, docs presence.
- **Dynamic battery (the core):** run each skill in a Docker sandbox against a **mock agent world** — no network by default, mocked channels (send/receive), mocked common tools (calendar, email, files, HTTP fixture server), seeded clock. Standard scenario suite per skill category (scheduler, digest, search, messaging, automation): happy path ×3 seeds, malformed-input, missing-credential, tool-failure injection, repeated-run flakiness (5×).
- **Scoring engine:** dimensions → Correctness (verifier verdicts on outputs vs. scenario expectations), Reliability (flakiness across seeds/runs), Safety behavior (undeclared file/network/env access attempts observed in sandbox), Transparency (docs, changelog, pinned deps), Maintenance (repo recency, issue responsiveness). Grade A–F per dimension + overall; every deduction cites trace evidence.
- **Site:** static rankings index (searchable, filterable by category/grade), per-skill scorecard page (grades, evidence traces via `@agenttrust/trace-player`, history), methodology page, disputes page, author-embeddable SVG badge endpoint.
- **Ops:** batch runner with queue + resource caps on a single VM; nightly re-runs for top-500 + newly-updated skills.

### P1
- Author self-serve: "test my skill pre-publish" CLI (`scorecards run ./my-skill`) — same battery locally. (This is the future monetization seed and halves the political risk.)
- API access (JSON per skill) + webhooks for grade changes.

### Out of scope (v1)
Full security research (defer to existing scanners; link them), skills requiring real third-party accounts (mark "Not batterable — requires live credentials" honestly), monetization.

## 2. Architecture

```
packages/
  crawler/        # registry indexer → skills.db (SQLite)
  analyzer/       # static checks
  sandbox/        # Docker harness: mock agent world, tool mocks, no-net policy, resource caps
  battery/        # scenario suites per category; expectation specs
  scorer/         # verdicts (uses @agenttrust/verifiers) → dimension scores → grades
  site/           # Astro static site + trace-player island + badge endpoint (edge function)
  cli/            # scorecards run <skill> (P1, but scaffold now)
fixtures/         # golden skills: 6 hand-written reference skills (2 perfect, 2 subtly broken, 2 malicious-ish) — the calibration set
docs/             # methodology.md (versioned!), disputes.md, adr/
```

- **Sandbox is the crown jewel:** `docker run` with seccomp/no-net, tmpfs workspace, syscall-visible file/network attempt logging (audit via strace-class capture or eBPF-lite; simplest reliable mechanism wins — ADR required), hard CPU/mem/time caps, one skill per container, deterministic seed injection.
- **Mock world contract:** the mocks emit Trace Schema v1 events natively — so every battery run *is* a Blackbox-compatible trace, replayable on the site.
- **Grading is config:** weights + thresholds in `scorer/config.ts`, versioned; scorecards display the methodology version they were graded under.

## 3. Milestones & Acceptance

### M0 — Scaffold (days 1–2)
Monorepo, CI, `make golden` = crawl 5 skills (fixture registry snapshot) → analyze → battery the 6 golden skills → render 6 scorecards locally.
**Accept:** pipeline runs end-to-end on fixtures in CI (<10 min).

### M1 — Crawler + static analyzer (week 1)
Registry indexing with politeness (rate limits, etag cache, resume), static checks, `skills.db`.
**Accept:** 1,000 skills indexed without bans/errors; re-crawl is incremental (<5% re-fetch); analyzer output validated on golden set.

### M2 — Sandbox + mock world (weeks 2–3) ← hardest milestone
Docker harness, tool/channel mocks emitting Trace Schema v1, no-net enforcement, resource caps, access-attempt observation.
**Accept:** the 2 "malicious-ish" golden skills' undeclared file/network attempts are observed and logged; no-net verified by an in-skill escape test; 20 real popular skills execute to completion or fail with *classified* reasons (not-batterable taxonomy: needs-credentials, needs-network, incompatible-api, crash).

### M3 — Battery + scorer (weeks 3–4)
Category scenario suites + expectation specs; scorer with grades + evidence links; calibration: hand-label the golden set + 50 real skills, tune until human/automated agreement ≥85% on overall grade (±1 letter).
**Accept:** calibration report committed (`docs/calibration-v1.md`); every grade on the site traces to ≥1 evidence link; flakiness dimension reproducible (same skill, same seeds → same grade).

### M4 — Site + badges (week 5)
Rankings index, scorecard pages with trace replays, methodology + disputes pages (published BEFORE any real rankings), SVG badges, OG cards.
**Accept:** Lighthouse ≥95; search/filter over 500 skills client-side <50ms; badge endpoint cached at edge; disputes page has a working intake (GitHub issue template + 7-day SLA statement).

### M5 — Scale run + launch (week 6)
Battery the top 500 skills by installs; manual spot-review of every D/F grade before publish (false accusations are existential); publish; nightly re-run cron for top-500 + changed skills.
**Accept:** 500 published scorecards; 100% of D/F grades human-reviewed with reviewer note; launch post: "We ran 500 agent skills through a standardized test battery — here's what we found" with aggregate stats (X% fail silently on malformed input, Y% attempt undeclared access...).

## 4. Quality Bar

- **Fairness engineering:** version-pinned grading (skill vX graded, re-graded on update); "Not batterable" is a category, never a bad grade; authors can request re-run via issue → automated within 24h.
- **Legal/comms care:** grades described as "automated battery results under methodology vN" everywhere; no fraud/malice claims — describe observed behavior ("attempted network access to <host> while declaring none") and let readers conclude; disputes SLA honored.
- **Cost control:** LLM-judge only on output-quality checks, sampled, BYO-key from your own budget with hard caps; everything else deterministic.
- **Reproducibility:** any published scorecard reproducible via `scorecards reproduce <skill@version>` from the public evidence bundle.

## 5. Interlock

- Consumes `@agenttrust/verifiers` + emits Trace Schema v1 (Blackbox repo packages).
- Evidence player = `@agenttrust/trace-player`.
- Worst findings (with author consent or when already public) → Museum exhibits.
- Launch order: after Blackbox OSS release (the shared packages must be published first).

## 6. Prompting Opus 4.8 for this repo

- "M2 sandbox: propose the access-observation mechanism as an ADR with 2 options + tradeoffs BEFORE implementing. Simplest reliable mechanism wins."
- "Scoring changes require a methodology version bump and a calibration re-run. Never tune weights ad hoc."
- "When a skill can't be tested, classify it honestly — 'not batterable' taxonomy, never a failing grade."
- "All scenario expectations live in battery/ as data (YAML), not code. New categories = new data files."
