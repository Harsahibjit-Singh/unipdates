// app/api/admin/auth/forgot-password/route.js
import adminDbConnect from '@/lib/adminDbConnect';
import AdminUser from '@/models/AdminUser';
import { NextResponse } from 'next/server';
// No longer need bcryptjs here, as the model handles hashing
// import bcrypt from 'bcryptjs';

export async function POST(req) {
  await adminDbConnect();
  try {
    const { email, newPassword: rawPassword } = await req.json();

    // 1. Trim the password immediately to ensure consistency
    const newPassword = String(rawPassword || '').trim();

    // 2. Enhanced validation on the trimmed password
    if (!email?.trim()) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }
    if (!newPassword) {
      return NextResponse.json({ message: 'New password is required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // 3. Find the user
    // We need to select '+password' so we can modify it.
    const adminUser = await AdminUser.findOne({ email }).select('+password');
    if (!adminUser) {
      return NextResponse.json({ message: 'Admin user not found.' }, { status: 404 });
    }

    // 4. Update password with the PLAIN-TEXT value.
    // The Mongoose pre('save') hook in your AdminUser model will automatically hash it.
    adminUser.password = newPassword;

    // 5. Invalidate old sessions and save the user
    adminUser.sessionVersion += 1; // Invalidate all existing tokens
    adminUser.refreshTokens = []; // Clear all refresh tokens
    await adminUser.save(); // The hashing happens automatically here

    return NextResponse.json({ message: 'Password reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error("Admin Forgot Password error:", error);
    return NextResponse.json({ message: 'Failed to reset password.', error: error.message }, { status: 500 });
  }
}
