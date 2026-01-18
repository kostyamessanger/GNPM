const assert = require('assert');
const { greet } = require('./index.js');

// Тест для функции greet
describe('Test Package', () => {
  it('должно возвращать приветствие с именем', () => {
    const result = greet('Алиса');
    assert.strictEqual(result, 'Привет, Алиса!');
  });

  it('должно работать с пустым именем', () => {
    const result = greet('');
    assert.strictEqual(result, 'Привет, !');
  });
});
