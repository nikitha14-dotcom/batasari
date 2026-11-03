import { describe, expect, it } from 'vitest';
import { WORK_SUBCATEGORIES } from '../directory';

const allLinks = WORK_SUBCATEGORIES.flatMap((subcategory) => subcategory.links);

describe('Work directory content', () => {
  it('has the seven subcategories in the agreed order (spec §4.5)', () => {
    expect(WORK_SUBCATEGORIES.map((subcategory) => subcategory.title)).toEqual([
      'Employment services & Support Agencies',
      'Job Posting Sites',
      'Employee Rights',
      'Credential recognition',
      'Networking',
      'Resume & Interview Guidance',
      'Salary Information',
    ]);
  });

  it('has 49 links, each with a unique catalog id', () => {
    const ids = allLinks.map((link) => link.id);
    expect(ids).toHaveLength(49);
    expect(new Set(ids).size).toBe(49);
    expect(ids.filter((id) => !/^WORK-[A-Z]{2}-\d{2}$/.test(id))).toEqual([]);
  });

  it('links every resource over https', () => {
    const insecure = allLinks.filter((link) => !link.url.startsWith('https://'));
    expect(insecure.map((link) => link.id)).toEqual([]);
  });

  it('keeps every description to 25 words or fewer (FR-1.4)', () => {
    const tooLong = allLinks.filter((link) => link.description.split(/\s+/).length > 25);
    expect(tooLong.map((link) => link.id)).toEqual([]);
  });

  it('gives every subcategory a blurb and exactly one tip (FR-1.3)', () => {
    for (const subcategory of WORK_SUBCATEGORIES) {
      expect(subcategory.blurb.trim()).not.toBe('');
      expect(typeof subcategory.tip).toBe('string');
      expect(subcategory.tip.trim()).not.toBe('');
    }
  });

  // Tips link figures rather than state them (FR-5.4, spec §9.3). A dollar
  // amount or a percentage is the signature of a number that goes stale.
  // Plain digits are allowed: "a 15-minute informational interview" is a
  // convention, not a figure anyone acts on.
  it('never states a dollar amount or percentage in a tip (FR-5.4)', () => {
    const withFigures = WORK_SUBCATEGORIES.filter((subcategory) => /[$%]/.test(subcategory.tip));
    expect(withFigures.map((subcategory) => subcategory.id)).toEqual([]);
  });

  it('does not repeat a source within a subcategory', () => {
    for (const subcategory of WORK_SUBCATEGORIES) {
      const names = subcategory.links.map((link) => link.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

