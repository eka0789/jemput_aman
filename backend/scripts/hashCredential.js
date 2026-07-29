import { createCredentialHash } from '../src/services/authService.js';

const secret = process.argv[2];
if (!secret) {
  console.error('Gunakan: npm run hash:credential -- \"password-atau-pin\"');
  process.exit(1);
}

console.log(createCredentialHash(secret));
