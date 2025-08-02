// app/api/admin/generate-upload-signature/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { adminAuthMiddleware } from '@/lib/adminAuthMiddleware';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = adminAuthMiddleware(async (req) => {
  try {
    const { folder } = await req.json();
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate a signature for the upload
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({ signature, timestamp });
  } catch (error) {
    console.error("Cloudinary Signature API error:", error);
    return NextResponse.json({ message: `Failed to generate signature: ${error.message}` }, { status: 500 });
  }
}, ['superadmin', 'uniadmin']);