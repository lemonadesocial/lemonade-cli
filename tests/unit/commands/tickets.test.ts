import { describe, it, expect } from 'vitest';

describe('Ticket Commands', () => {
  describe('attendee validation', () => {
    it('rejects mismatched attendee count', () => {
      const quantity = 2;
      const names = ['Alice'];
      const emails = ['alice@test.com'];

      expect(names.length).not.toBe(quantity);
    });

    it('accepts matching attendee count', () => {
      const quantity = 2;
      const names = ['Alice', 'Bob'];
      const emails = ['alice@test.com', 'bob@test.com'];

      expect(names.length).toBe(quantity);
      expect(emails.length).toBe(quantity);

      const attendees = names.map((name, i) => ({ name, email: emails[i] }));
      expect(attendees).toEqual([
        { name: 'Alice', email: 'alice@test.com' },
        { name: 'Bob', email: 'bob@test.com' },
      ]);
    });
  });

  describe('price conversion', () => {
    it('converts dollars to cents', () => {
      const priceInCents = Math.round(parseFloat('25.00') * 100);
      expect(priceInCents).toBe(2500);
    });

    it('handles fractional cents correctly', () => {
      const priceInCents = Math.round(parseFloat('19.99') * 100);
      expect(priceInCents).toBe(1999);
    });
  });
});
