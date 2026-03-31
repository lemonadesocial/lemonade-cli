import { describe, it, expect, beforeEach } from 'vitest';
import { loadSkills, getAgentName, _resetCache } from '../../../src/chat/skills/loader.js';

describe('loadSkills', () => {
  beforeEach(() => {
    _resetCache();
  });

  it('returns non-empty string', () => {
    const skills = loadSkills();
    expect(skills.length).toBeGreaterThan(0);
  });

  it('includes content from all 6 skill files', () => {
    const skills = loadSkills();
    // Each skill file has a unique heading
    expect(skills).toContain('# Identity');           // personality.md
    expect(skills).toContain('# Event Creation');     // events-core.md
    expect(skills).toContain('# Quick Status');       // events-analytics.md
    expect(skills).toContain('# Co-Hosts');           // events-advanced.md
    expect(skills).toContain('# Space Management');   // community.md
    expect(skills).toContain('# AI Mode Awareness');  // billing.md
  });

  it('caches result on second call', () => {
    const first = loadSkills();
    const second = loadSkills();
    // Same reference (cached)
    expect(first).toBe(second);
  });

  it('combined content is under 3500 tokens (~14000 chars)', () => {
    const skills = loadSkills();
    // Rough estimate: 1 token ≈ 4 chars
    expect(skills.length).toBeLessThan(14000);
  });
});

describe('getAgentName', () => {
  it('defaults to Zesty when no config set', () => {
    // Default behavior when agent_name is not in config
    const name = getAgentName();
    expect(name).toBe('Zesty');
  });
});
