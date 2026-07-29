import {
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual
} from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { models } from '../models/schema.js';

const HASH_ALGORITHM = 'sha256';
const HASH_ITERATIONS = 210_000;
const HASH_BYTES = 32;
const HASH_PREFIX = 'pbkdf2_sha256';

const unauthorized = () => {
  const error = new Error('Email atau password tidak valid');
  error.statusCode = 401;
  error.code = 'INVALID_CREDENTIALS';
  return error;
};

export const createCredentialHash = (secret, salt = randomBytes(16).toString('hex')) => {
  if (typeof secret !== 'string' || secret.length < 4) {
    throw new Error('Kredensial minimal 4 karakter');
  }
  const saltBytes = /^[a-f0-9]{32}$/i.test(salt) ? Buffer.from(salt, 'hex') : Buffer.from(salt);
  const digest = pbkdf2Sync(secret, saltBytes, HASH_ITERATIONS, HASH_BYTES, HASH_ALGORITHM)
    .toString('hex');
  return `${HASH_PREFIX}$${HASH_ITERATIONS}$${salt}$${digest}`;
};

export const verifyCredential = (secret, encodedHash) => {
  if (typeof secret !== 'string' || typeof encodedHash !== 'string') return false;
  const [prefix, iterationsValue, salt, expectedHex] = encodedHash.split('$');
  const iterations = Number(iterationsValue);
  if (
    prefix !== HASH_PREFIX
    || !Number.isSafeInteger(iterations)
    || iterations < 100_000
    || !salt
    || !/^[a-f0-9]{64}$/i.test(expectedHex || '')
  ) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const saltBytes = /^[a-f0-9]{32}$/i.test(salt) ? Buffer.from(salt, 'hex') : Buffer.from(salt);
  const actual = pbkdf2Sync(secret, saltBytes, iterations, HASH_BYTES, HASH_ALGORITHM);
  if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;

  // Compatibility for hashes created by the earlier Node helper that treated
  // the hexadecimal salt as UTF-8 text.
  const legacyActual = pbkdf2Sync(secret, salt, iterations, HASH_BYTES, HASH_ALGORITHM);
  return legacyActual.length === expected.length && timingSafeEqual(legacyActual, expected);
};

const passwordHashForRole = role => (
  role === 'ADMIN'
    ? env.ADMIN_PASSWORD_HASH
    : role === 'FOUNDATION'
      ? env.FOUNDATION_PASSWORD_HASH
      : ''
);

export const authService = {
  login: async ({ email, password }) => {
    if (!env.JWT_SECRET) {
      const error = new Error('Autentikasi backend belum dikonfigurasi');
      error.statusCode = 503;
      error.code = 'AUTH_NOT_CONFIGURED';
      throw error;
    }
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof password !== 'string') {
      throw unauthorized();
    }

    const user = await models.users.findByEmail(normalizedEmail);
    const passwordHash = passwordHashForRole(user?.role);
    if (!user || !passwordHash || !verifyCredential(password, passwordHash)) {
      throw unauthorized();
    }

    const schoolIds = user.role === 'FOUNDATION'
      ? (await models.schools.findAll()).map(school => school.id)
      : [user.school_id];
    const token = jwt.sign({
      id: user.id,
      school_id: user.school_id,
      school_ids: schoolIds,
      role: user.role,
      full_name: user.full_name
    }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'jemput-aman',
      audience: 'jemput-aman-web'
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        school_id: user.school_id,
        school_ids: schoolIds,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }
    };
  },

  verifyKioskPin: (pin) => {
    if (!env.KIOSK_PIN_HASH) {
      if (env.NODE_ENV !== 'production' && env.AUTH_ALLOW_DEV_MOCK && String(pin) === '1234') {
        return true;
      }
      const error = new Error('PIN kiosk production belum dikonfigurasi');
      error.statusCode = 503;
      error.code = 'KIOSK_PIN_NOT_CONFIGURED';
      throw error;
    }
    if (!/^\d{4,12}$/.test(String(pin || '')) || !verifyCredential(String(pin), env.KIOSK_PIN_HASH)) {
      const error = new Error('PIN kiosk tidak valid');
      error.statusCode = 401;
      error.code = 'INVALID_KIOSK_PIN';
      throw error;
    }
    return true;
  }
};
