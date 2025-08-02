// app/api/admin/data/featured/route.js
import adminDbConnect from '@/lib/adminDbConnect';
import Featured from '@/models/featured'; // Import the Featured model
import { NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/adminAuthMiddleware'; // Admin auth middleware

// GET all featured items (requires superadmin)
export const GET = adminAuthMiddleware(async (req) => {
  await adminDbConnect();
  try {
    console.log("Admin API: Attempting to fetch all featured items...");
    // Fetch all items and sort by creation date (newest first)
    const featuredItems = await Featured.find({}).sort({ createdOn: -1 });

    console.log(`Admin API: Found ${featuredItems.length} featured items in the database.`);
    // Log details of each fetched item for debugging
    featuredItems.forEach(item => {
      console.log(`  - ID: ${item._id}, Tagline: "${item.tagLine}", Expiry: ${item.expiryDate.toISOString()}, Created: ${item.createdOn.toISOString()}`);
    });

    return NextResponse.json(featuredItems, { status: 200 });
  } catch (error) {
    console.error("Admin API - Error fetching featured items:", error);
    return NextResponse.json({ message: 'Failed to fetch featured items', error: error.message }, { status: 500 });
  }
}, ['superadmin', 'uniadmin']); // Only superadmin and uniadmin can view featured items

// POST a new featured item (requires superadmin)
// POST a new featured item (expects JSON body with img URL)
export const POST = adminAuthMiddleware(async (req) => {
  await adminDbConnect();
  try {
    const { img, tagLine, expiryDate } = await req.json();

    if (!img || !tagLine || !expiryDate) {
      return NextResponse.json(
        { message: 'Missing required fields: image URL, tagline, or expiry date.' },
        { status: 400 }
      );
    }

    const newFeatured = await Featured.create({
      img,
      tagLine,
      expiryDate: new Date(expiryDate),
    });

    console.log("Admin API: Successfully created new featured item:", newFeatured);
    return NextResponse.json(newFeatured, { status: 201 });
  } catch (error) {
    console.error("Admin API - Error creating featured item:", error);
    return NextResponse.json(
      { message: 'Failed to create featured item.', error: error.message },
      { status: 400 }
    );
  }
}, ['superadmin']);
