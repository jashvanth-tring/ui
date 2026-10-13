/** Normalizes API skill_set (JSON array or legacy string) to string[]. */
export function requirementSkillsToArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Comma-separated display for tables and tooltips. */
export function requirementSkillsDisplay(raw: unknown): string {
  return requirementSkillsToArray(raw).join(', ');
}
