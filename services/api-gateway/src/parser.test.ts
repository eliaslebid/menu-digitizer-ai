import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseMenuText } from './parser.js';

describe('Menu Parser', () => {
  it('should parse simple menu items', () => {
    const text = `
      Burger 12.50
      Fries 5.00
      Coke 2.50
    `;
    const items = parseMenuText(text);
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].name, 'Burger');
    assert.strictEqual(items[0].price, 12.50);
  });

  it('should handle prices with currency symbols', () => {
    const text = `Steak $25.00`;
    const items = parseMenuText(text);
    assert.strictEqual(items[0].price, 25.00);
  });

  it('should handle dots/leaders', () => {
    const text = `Caesar Salad ........... 10.50`;
    const items = parseMenuText(text);
    assert.strictEqual(items[0].name, 'Caesar Salad');
    assert.strictEqual(items[0].price, 10.50);
  });

  it('should ignore lines without prices', () => {
    const text = `
      Starters
      Soup 5.00
    `;
    const items = parseMenuText(text);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].name, 'Soup');
  });
});
