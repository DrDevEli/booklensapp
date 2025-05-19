// Description: This file contains the routes for authentication, including OAuth and two-factor authentication.
import express from 'express';
import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import { authMiddleware, generateCsrfToken } from '../middleware/authMiddleware.js';
import passport from 'passport';
import { generateTokens } from '../utils/jwtUtils.js';

const router = express.Router();

// CSRF token route
router.get('/csrf-token', generateCsrfToken, (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: res.locals.csrfToken
  });
});

// Login route
router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  // Check if 2FA is enabled
  if (req.user.twoFactorEnabled) {
    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication required',
      data: {
        userId: req.user._id,
        requiresTwoFactor: true
      }
    });
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(req.user._id, req.user.role);
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(req.user._id, req.user.role);
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${accessToken}&refresh=${refreshToken}`);
  }
);

// Two-factor authentication routes
router.post('/2fa/setup', authMiddleware(), AuthController.setupTwoFactor);
router.post('/2fa/verify', authMiddleware(), AuthController.verifyAndEnableTwoFactor);
router.post('/2fa/login', AuthController.verifyTwoFactor);
router.post('/2fa/disable', authMiddleware(), AuthController.disableTwoFactor);

// Password reset routes
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// Email verification
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/resend-verification', authMiddleware(), AuthController.resendVerificationEmail);

// Token refresh route
router.post('/refresh', AuthController.refreshTokens);

// Logout route
router.post('/logout', authMiddleware(), UserController.logout);

// Logout all sessions
router.post('/logout/all', authMiddleware(), AuthController.logoutAll);

export default router;
