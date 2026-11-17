const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCredentials } = require('./credentialValidation');

test('accepts a valid email and any non-empty password within bcrypt limits', () => {
  assert.equal(validateCredentials('player@example.com', 'a'), null);
});

test('rejects missing and malformed email values', () => {
  assert.equal(validateCredentials('', 'correct horse'), 'Email and password are required');
  assert.equal(validateCredentials('not-an-email', 'correct horse'), 'Enter a valid email address');
  assert.equal(
    validateCredentials(`${'a'.repeat(250)}@example.com`, 'correct horse'),
    'Enter a valid email address',
  );
});

test('rejects an empty password', () => {
  assert.equal(
    validateCredentials('player@example.com', ''),
    'Email and password are required',
  );
});

test('rejects passwords longer than bcrypt can safely use', () => {
  assert.equal(
    validateCredentials('player@example.com', 'a'.repeat(73)),
    'Password must be no more than 72 UTF-8 bytes',
  );
  assert.equal(validateCredentials('player@example.com', 'é'.repeat(36)), null);
  assert.equal(
    validateCredentials('player@example.com', 'é'.repeat(37)),
    'Password must be no more than 72 UTF-8 bytes',
  );
});
