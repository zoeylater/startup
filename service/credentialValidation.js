const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maximumPasswordBytes = 72;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !email.trim()) {
    return 'Email and password are required';
  }

  const normalizedEmail = email.trim();
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return 'Enter a valid email address';
  }

  if (typeof password !== 'string' || !password) {
    return 'Email and password are required';
  }
  if (Buffer.byteLength(password, 'utf8') > maximumPasswordBytes) {
    return 'Password must be no more than 72 UTF-8 bytes';
  }

  return null;
}

module.exports = { validateCredentials };
