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

export const normalizeStoragePath = (value) => {
  if (!value) return null;
  const rawValue = String(value);
  if (!/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/^\/+/, '');
  }

  try {
    const url = new URL(rawValue);
    const markers = ['public', 'sign', 'authenticated'].map(
      access => `/storage/v1/object/${access}/${env.SUPABASE_STORAGE_BUCKET}/`
    );
    const marker = markers.find(candidate => url.pathname.includes(candidate));
    if (!marker) return rawValue;
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
  } catch {
    return rawValue;
  }
};

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
  uploadProfilePhoto: async ({ schoolId, entityType, entityId, dataUrl }) => {
    if (!['student', 'pickup-person'].includes(entityType)) {
      const error = new Error('Jenis pemilik foto profil tidak valid');
      error.statusCode = 400;
      throw error;
    }
    const { buffer, contentType, extension } = decodePhoto(dataUrl);
    const path = [
      safePathSegment(schoolId),
      'profiles',
      entityType,
      safePathSegment(entityId),
      `${Date.now()}-${randomUUID()}.${extension}`
    ].join('/');
    const { error } = await assertSupabaseConfigured()
      .storage.from(env.SUPABASE_STORAGE_BUCKET)
      .upload(path, buffer, { contentType, cacheControl: '3600', upsert: false });
    if (error) {
      const wrappedError = new Error(`Supabase mengunggah foto profil gagal: ${error.message}`);
      wrappedError.statusCode = 503;
      throw wrappedError;
    }
    return { path };
  },

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
    if (String(path).startsWith('/')) return path;
    const storagePath = normalizeStoragePath(path);
    if (/^(https?:|data:)/i.test(storagePath)) return storagePath;
    const { data, error } = await assertSupabaseConfigured()
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);
    if (error) {
      const wrappedError = new Error(`Supabase membuat URL foto privat gagal: ${error.message}`);
      wrappedError.statusCode = 503;
      throw wrappedError;
    }
    return data.signedUrl;
  },

  removeMany: async (paths) => {
    const validPaths = paths.filter(Boolean);
    if (!validPaths.length) return;
    const { error } = await assertSupabaseConfigured()
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove(validPaths);

    if (error) {
      throw new Error(`Supabase menghapus foto verifikasi gagal: ${error.message}`);
    }
  },
  remove: async (path) => {
    if (!path) return;
    return storageService.removeMany([path]);
  }
};
