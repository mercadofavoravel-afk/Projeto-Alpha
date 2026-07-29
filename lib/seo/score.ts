import { seoRules } from "./rules";
import type { SeoScoreResult, SeoDocument } from "./types";

export function calculateSeoScore(document: SeoDocument): SeoScoreResult {
  const checks = seoRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    points: rule.points,
    passed: rule.validate(document),
  }));

  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.points : 0),
    0,
  );
  const maxScore = checks.reduce((total, check) => total + check.points, 0);

  return {
    score,
    maxScore,
    percentage: maxScore === 0 ? 0 : Math.round((score / maxScore) * 100),
    checks,
  };
}
