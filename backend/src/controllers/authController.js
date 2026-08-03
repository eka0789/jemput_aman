import { authService } from '../services/authService.js';

export const login = async (req, res, next) => {
  try {
    const data = await authService.login({
      email: req.body?.email,
      password: req.body?.password
    });
    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const unlockKiosk = async (req, res, next) => {
  try {
    authService.verifyKioskPin(req.body?.pin);
    return res.status(200).json({
      success: true,
      message: 'PIN benar. Mode akses penuh dibuka.',
      data: {
        unlocked: true,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = (req, res) => res.status(200).json({
  success: true,
  data: {
    user: {
      id: req.user.id,
      school_id: req.user.school_id,
      school_ids: req.user.school_ids || [req.user.school_id],
      role: req.user.role,
      full_name: req.user.full_name
    }
  }
});
