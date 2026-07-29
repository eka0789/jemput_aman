import { describe, expect, it } from 'vitest';
import { normalizeStoragePath } from '../../src/services/storageService.js';

describe('private verification photo paths', () => {
  it('converts legacy public Supabase URLs into storage paths', () => {
    expect(normalizeStoragePath(
      'https://example.supabase.co/storage/v1/object/public/images/school/log/photo.jpg'
    )).toBe('school/log/photo.jpg');
  });

  it('converts signed URLs without retaining query tokens', () => {
    expect(normalizeStoragePath(
      'https://example.supabase.co/storage/v1/object/sign/images/school/log/photo.jpg?token=secret'
    )).toBe('school/log/photo.jpg');
  });

  it('keeps an existing storage path unchanged', () => {
    expect(normalizeStoragePath('school/log/photo.jpg')).toBe('school/log/photo.jpg');
  });
});
