// app/api/admin/auth/logout/route.js
import adminDbConnect from '@/lib/adminDbConnect';
import AdminUser from '@/models/AdminUser';
import { verifyAdminRefreshToken } from '@/lib/adminJwtUtils';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await adminDbConnect();
  try {
    const cookies = req.cookies;
    const refreshToken = cookies.get('admin_refreshToken')?.value;

    if (!refreshToken) {
      // If no token, already logged out or never logged in
      const response = NextResponse.json({ message: 'Already logged out.' }, { status: 200 });
      response.cookies.delete('admin_refreshToken'); // Ensure cookie is deleted
      return response;
    }

    const decodedToken = verifyAdminRefreshToken(refreshToken);

    if (decodedToken && decodedToken.adminId) {
      const adminUser = await AdminUser.findById(decodedToken.adminId);

      if (adminUser) {
        // Remove the specific refresh token from the user's array
        adminUser.refreshTokens = adminUser.refreshTokens.filter((token) => token !== refreshToken);
        await adminUser.save();
      }
    }

    // Clear the refresh token cookie
    const response = NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });
    response.cookies.delete('admin_refreshToken', { path: '/' }); // Ensure path matches where it was set

    return response;
  } catch (error) {
    console.error("Admin Logout error:", error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}