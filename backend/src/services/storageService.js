import { randomUUID } from 'crypto';
import { assertSupabaseConfigured } from '../config/supabase.js';
import { env } from '../config/env.js';

const MAX_PHOTO_BYTES = 1_500_000;
const DATA_URL_PATTERN = /^data:(image\/(jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;
const EXTENSIONS = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp'
};

const safePathSegment = value => String(value).replace(/[^a-z0-9_-]/gi, '-');

const decodePhoto = (dataUrl) => {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    const error = new Error('Format foto verifikasi tidak valid');
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(match[3].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) {
    const error = new Error('Ukuran foto verifikasi harus antara 1 byte dan 1,5 MB');
    error.statusCode = 400;
    throw error;
  }

  return {
    buffer,
    contentType: match[1].toLowerCase(),
    extension: EXTENSIONS[match[2].toLowerCase()]
  };
};

export const storageService = {
  uploadVerificationPhoto: async ({ schoolId, pickupLogId, dataUrl }) => {
    const { buffer, contentType, extension } = decodePhoto(dataUrl);
    const path = [
      safePathSegment(schoolId),
      'verification',
      safePathSegment(pickupLogId),
      `${Date.now()}-${randomUUID()}.${extension}`
    ].join('/');
    const bucket = assertSupabaseConfigured().storage.from(env.SUPABASE_STORAGE_BUCKET);
    const { error } = await bucket.upload(path, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

    if (error) {
      const wrappedError = new Error(`Supabase mengunggah foto verifikasi gagal: ${error.message}`);
      wrappedError.code = error.statusCode || error.name;
      wrappedError.statusCode = 503;
      throw wrappedError;
    }

    return {
      path
    };
  },

  getSignedUrl: async (path, expiresIn = 3600) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const { data, error } = await assertSupabaseConfigured()
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn);
    if (error) {
      const wrappedError = new Error(`Supabase membuat URL foto privat gagal: ${error.message}`);
      wrappedError.statusCode = 503;
      throw wrappedError;
    }
    return data.signedUrl;
  },

  remove: async (path) => {
    if (!path) return;
    const { error } = await assertSupabaseConfigured()
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase menghapus foto verifikasi gagal: ${error.message}`);
    }
  }
};
