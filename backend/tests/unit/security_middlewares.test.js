import { describe, expect, it, vi } from 'vitest';
import { requireRole } from '../../src/middlewares/auth.js';
import { tenantMiddleware } from '../../src/middlewares/tenant.js';

const response = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe('RBAC and tenant isolation', () => {
  it('rejects a tenant header that differs from the authenticated school', () => {
    const req = {
      headers: { 'x-school-id': 'school-b' },
      query: {},
      user: { id: 'teacher-a', role: 'TEACHER', school_id: 'school-a' }
    };
    const res = response();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows only explicitly listed foundation tenants', () => {
    const req = {
      headers: { 'x-school-id': 'school-b' },
      query: {},
      user: {
        id: 'foundation-a',
        role: 'FOUNDATION',
        school_id: 'school-a',
        school_ids: ['school-a', 'school-b']
      }
    };
    const res = response();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(req.schoolId).toBe('school-b');
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks a teacher from admin-only operations', () => {
    const middleware = requireRole('ADMIN');
    const req = { user: { role: 'TEACHER' } };
    const res = response();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

