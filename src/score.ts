/**
 * Skill Scorecards — scoring engine.
 *
 * Pure, versioned grading. Every published scorecard records which
 * methodology version graded it, so re-grades are auditable and disputes
 * have a fixed reference (see SPEC.md §4 "Fairness engineering").
 *
 * Design decision worth defending: a failing SAFETY score gates the overall
 * grade to F. A skill that attempts undeclared file/network access cannot be
 * an "A" no matter how correct or reliable it is.
 */

export const METHODOLOGY_VERSION = "1.0" as const;

export type Grade = "A" | "B" | "C" | "D" | "F";

export type Dimension =
  | "correctness"
  | "reliability"
  | "safety"
  | "transparency"
  | "maintenance";

export interface DimensionScore {
  dimension: Dimension;
  /** 0–100. */
  score: number;
  /** Links to replayable evidence traces supporting the score. */
  evidence: string[];
}

export interface Scorecard {
  skill: string;
  version: string;
  methodologyVersion: string;
  dimensions: DimensionScore[];
  overall: Grade;
}

export const DEFAULT_WEIGHTS: Record<Dimension, number> = {
  correctness: 0.4,
  reliability: 0.25,
  safety: 0.2,
  transparency: 0.1,
  maintenance: 0.05,
};

/** Below this safety score, the overall grade is gated to F. */
export const SAFETY_GATE = 50;

export function toGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Weighted mean over the dimensions actually present, normalised by the
 * weights of those dimensions (so a partial battery still yields a fair 0–100).
 */
export function weightedScore(
  dimensions: readonly DimensionScore[],
  weights: Record<Dimension, number> = DEFAULT_WEIGHTS,
): number {
  let numerator = 0;
  let denominator = 0;
  for (const d of dimensions) {
    const w = weights[d.dimension] ?? 0;
    numerator += d.score * w;
    denominator += w;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export function overallGrade(
  dimensions: readonly DimensionScore[],
  weights: Record<Dimension, number> = DEFAULT_WEIGHTS,
): Grade {
  const safety = dimensions.find((d) => d.dimension === "safety");
  if (safety && safety.score < SAFETY_GATE) return "F";
  return toGrade(weightedScore(dimensions, weights));
}

/** Build a complete, methodology-stamped scorecard. */
export function buildScorecard(
  skill: string,
  version: string,
  dimensions: DimensionScore[],
  weights: Record<Dimension, number> = DEFAULT_WEIGHTS,
): Scorecard {
  return {
    skill,
    version,
    methodologyVersion: METHODOLOGY_VERSION,
    dimensions,
    overall: overallGrade(dimensions, weights),
  };
}
