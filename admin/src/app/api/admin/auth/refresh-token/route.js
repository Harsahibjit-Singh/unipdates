// app/api/admin/auth/refresh-token/route.js
import adminDbConnect from '@/lib/adminDbConnect';
import AdminUser from '@/models/AdminUser';
import { generateAdminAccessToken, generateAdminRefreshToken, verifyAdminRefreshToken } from '@/lib/adminJwtUtils';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await adminDbConnect();
  try {
    const cookies = req.cookies;
    const refreshToken = cookies.get('admin_refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token not found.' }, { status: 401 });
    }

    const decodedToken = verifyAdminRefreshToken(refreshToken);

    if (!decodedToken || !decodedToken.adminId) {
      return NextResponse.json({ message: 'Invalid or expired refresh token.' }, { status: 403 });
    }

    const adminUser = await AdminUser.findById(decodedToken.adminId);

    if (!adminUser) {
      return NextResponse.json({ message: 'Admin user not found.' }, { status: 404 });
    }

    // Check if the refresh token is valid and belongs to the user
    // Also check sessionVersion for "logout all devices" functionality
    if (!adminUser.refreshTokens.includes(refreshToken) || decodedToken.sessionVersion !== adminUser.sessionVersion) {
      // If token exists but sessionVersion doesn't match, it means "logout all devices" was used.
      // If token doesn't exist, it might be a stale token or an attempt to use a revoked token.
      adminUser.refreshTokens = []; // Clear all tokens if an invalid token is found (security measure)
      await adminUser.save();
      return NextResponse.json({ message: 'Invalid or revoked refresh token. Please log in again.' }, { status: 403 });
    }

    // Generate new tokens
    const newAccessToken = generateAdminAccessToken(adminUser._id, adminUser.role, adminUser.sessionVersion);
    const newRefreshToken = generateAdminRefreshToken(adminUser._id, adminUser.sessionVersion);

    // Update refresh token in DB: remove old, add new
    adminUser.refreshTokens = adminUser.refreshTokens.filter((token) => token !== refreshToken);
    adminUser.refreshTokens.push(newRefreshToken);
    await adminUser.save();

    const response = NextResponse.json(
      {
        message: 'Tokens refreshed successfully',
        accessToken: newAccessToken,
      },
      { status: 200 }
    );

    // Set new refresh token as HttpOnly cookie
      response.cookies.set('admin_refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: parseInt(process.env.ADMIN_REFRESH_TOKEN_EXPIRATION_MS, 10) / 1000,
        path: '/', // ✅ cookie accessible everywhere and deletable from logout route
        sameSite: 'strict',
      });


    return response;
  } catch (error) {
    console.error("Admin Refresh Token error:", error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}