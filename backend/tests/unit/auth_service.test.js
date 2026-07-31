import { afterEach, describe, expect, it, vi } from 'vitest';
import { pbkdf2Sync } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';
import { models } from '../../src/models/schema.js';
import {
  authService,
  createCredentialHash,
  verifyCredential
} from '../../src/services/authService.js';

const originalEnv = {
  JWT_SECRET: env.JWT_SECRET,
  ADMIN_PASSWORD_HASH: env.ADMIN_PASSWORD_HASH,
  FOUNDATION_PASSWORD_HASH: env.FOUNDATION_PASSWORD_HASH,
  KIOSK_PIN_HASH: env.KIOSK_PIN_HASH
};

afterEach(() => {
  Object.assign(env, originalEnv);
  vi.restoreAllMocks();
});

describe('Admin authentication service', () => {
  it('hashes and verifies credentials without storing plaintext', () => {
    const hash = createCredentialHash('password-kuat');

    expect(hash).not.toContain('password-kuat');
    expect(verifyCredential('password-kuat', hash)).toBe(true);
    expect(verifyCredential('password-salah', hash)).toBe(false);
  });

  it('verifies hashes generated with binary salt by the production setup script', () => {
    const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
    const digest = pbkdf2Sync('Admin!234', salt, 210_000, 32, 'sha256').toString('hex');
    const encoded = `pbkdf2_sha256$210000$${salt.toString('hex')}$${digest}`;

    expect(verifyCredential('Admin!234', encoded)).toBe(true);
    expect(verifyCredential('password-salah', encoded)).toBe(false);
  });

  it('issues a scoped JWT for a valid admin login', async () => {
    env.JWT_SECRET = 'test-secret-that-is-long-enough';
    env.ADMIN_PASSWORD_HASH = createCredentialHash('Admin!234');
    vi.spyOn(models.users, 'findByEmail').mockResolvedValue({
      id: 'usr-admin-1',
      school_id: 'school-a',
      role: 'ADMIN',
      full_name: 'Admin Sekolah',
      email: 'admin@example.test'
    });

    const result = await authService.login({
      email: 'ADMIN@example.test',
      password: 'Admin!234'
    });
    const payload = jwt.verify(result.access_token, env.JWT_SECRET, {
      issuer: 'jemput-aman',
      audience: 'jemput-aman-web'
    });

    expect(result.user.role).toBe('ADMIN');
    expect(payload.school_id).toBe('school-a');
    expect(payload.school_ids).toEqual(['school-a']);
  });

  it('rejects an invalid password with a generic response', async () => {
    env.ADMIN_PASSWORD_HASH = createCredentialHash('Admin!234');
    vi.spyOn(models.users, 'findByEmail').mockResolvedValue({
      id: 'usr-admin-1',
      school_id: 'school-a',
      role: 'ADMIN',
      full_name: 'Admin Sekolah',
      email: 'admin@example.test'
    });

    await expect(authService.login({
      email: 'admin@example.test',
      password: 'salah'
    })).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS'
    });
  });

  it('limits a foundation account to schools in the same foundation', async () => {
    env.FOUNDATION_PASSWORD_HASH = createCredentialHash('Foundation!234');
    vi.spyOn(models.users, 'findByEmail').mockResolvedValue({
      id: 'foundation-1', school_id: 'school-a', role: 'FOUNDATION',
      full_name: 'Pengurus', email: 'foundation@example.test'
    });
    vi.spyOn(models.schools, 'findById').mockResolvedValue({
      id: 'school-a', foundation_id: 'foundation-a'
    });
    vi.spyOn(models.schools, 'findByFoundation').mockResolvedValue([
      { id: 'school-a' }, { id: 'school-b' }
    ]);

    const result = await authService.login({
      email: 'foundation@example.test', password: 'Foundation!234'
    });
    expect(result.user.school_ids).toEqual(['school-a', 'school-b']);
    expect(models.schools.findByFoundation).toHaveBeenCalledWith('foundation-a');
  });

  it('allows a parent to login with their own stored credential hash', async () => {
    env.JWT_SECRET = 'test-secret-that-is-long-enough';
    vi.spyOn(models.users, 'findByEmail').mockResolvedValue({
      id: 'usr-parent-2',
      school_id: 'school-a',
      role: 'PARENT',
      full_name: 'Orang Tua',
      email: 'parent@example.test',
      password_hash: createCredentialHash('Parent!234')
    });

    const result = await authService.login({
      email: 'parent@example.test',
      password: 'Parent!234'
    });

    expect(result.user.role).toBe('PARENT');
    expect(result.user.school_id).toBe('school-a');
  });

  it('validates the kiosk PIN against its backend hash', () => {
    env.KIOSK_PIN_HASH = createCredentialHash('864275');

    expect(authService.verifyKioskPin('864275')).toBe(true);
    expect(() => authService.verifyKioskPin('111111')).toThrow('PIN kiosk tidak valid');
  });
});
