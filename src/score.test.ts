import { describe, it, expect } from "vitest";
import {
  toGrade,
  weightedScore,
  overallGrade,
  buildScorecard,
  METHODOLOGY_VERSION,
  type DimensionScore,
} from "./score";

const strong: DimensionScore[] = [
  { dimension: "correctness", score: 95, evidence: ["t1"] },
  { dimension: "reliability", score: 92, evidence: ["t2"] },
  { dimension: "safety", score: 100, evidence: ["t3"] },
  { dimension: "transparency", score: 85, evidence: [] },
  { dimension: "maintenance", score: 80, evidence: [] },
];

describe("toGrade", () => {
  it("maps scores to letter grades at the documented thresholds", () => {
    expect(toGrade(90)).toBe("A");
    expect(toGrade(89.9)).toBe("B");
    expect(toGrade(70)).toBe("C");
    expect(toGrade(59)).toBe("F");
  });
});

describe("weightedScore", () => {
  it("normalises over present dimensions", () => {
    const partial: DimensionScore[] = [{ dimension: "correctness", score: 100, evidence: [] }];
    expect(weightedScore(partial)).toBe(100);
  });
});

describe("overallGrade", () => {
  it("grades a strong skill an A", () => {
    expect(overallGrade(strong)).toBe("A");
  });

  it("gates an otherwise-excellent skill to F when safety fails", () => {
    const unsafe = strong.map((d) =>
      d.dimension === "safety" ? { ...d, score: 10 } : d,
    );
    expect(overallGrade(unsafe)).toBe("F");
  });
});

describe("buildScorecard", () => {
  it("stamps the methodology version and computes the overall grade", () => {
    const card = buildScorecard("calendar-buddy", "1.2.0", strong);
    expect(card.methodologyVersion).toBe(METHODOLOGY_VERSION);
    expect(card.overall).toBe("A");
    expect(card.skill).toBe("calendar-buddy");
  });
});
