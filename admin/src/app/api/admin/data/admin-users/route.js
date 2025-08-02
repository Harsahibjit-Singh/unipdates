// app/api/admin/data/admin-users/route.js
import adminDbConnect from '@/lib/adminDbConnect';
import AdminUser from '@/models/AdminUser';
import College from '@/models/College'; // Import College model
import { NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/adminAuthMiddleware';
// bcrypt is not directly used here because the hashing happens in the model's pre-save hook
// import bcrypt from 'bcryptjs'; // No longer needed directly here

// GET all admin users (requires superadmin)
export const GET = adminAuthMiddleware(async (req) => {
  await adminDbConnect();
  try {
    // Populate college details for uniadmins
    const adminUsers = await AdminUser.find({}).select('-password -refreshTokens').populate('college', 'name code');
    return NextResponse.json(adminUsers, { status: 200 });
  } catch (error) {
    console.error("Admin API - Error fetching admin users:", error);
    return NextResponse.json({ message: 'Failed to fetch admin users', error: error.message }, { status: 500 });
  }
}, ['superadmin']);

// POST a new admin user (requires superadmin)
export const POST = adminAuthMiddleware(async (req) => { // This route should always be protected by superadmin
  await adminDbConnect();
  try {
    const body = await req.json();

        // Immediately trim the password after getting it from the request
    const { username, email, password: rawPassword, name, role, college, passoutyear, pno, img_url } = body;
    const password = String(rawPassword || '').trim();

    // 1. Basic validation for required fields
    if (!username || !email || !password || !name || !role || !passoutyear || !pno || !img_url) {
      return NextResponse.json({ message: 'Missing required fields (username, email, password, name, role, pno, passoutyear, img_url).' }, { status: 400 });
    }

    // 2. Check for existing user (username, email, pno) BEFORE any database modifications
    const existingAdmin = await AdminUser.findOne({ $or: [{ username }, { email }, { pno }] });
    if (existingAdmin) {
      let errorMessage = 'Admin with this detail already exists.';
      if (existingAdmin.username === username) {
        errorMessage = 'Admin with this username already exists.';
      } else if (existingAdmin.email === email) {
        errorMessage = 'Admin with this email already exists.';
      } else if (existingAdmin.pno === pno) {
        errorMessage = 'Admin with this phone number already exists.';
      }
      return NextResponse.json({ message: errorMessage }, { status: 409 }); // 409 Conflict
    }

    let targetCollege = null; // Initialize targetCollege outside the if block
    if (role === 'uniadmin') {
      if (!college) {
        return NextResponse.json({ message: 'College ID is required for uniadmin role.' }, { status: 400 });
      }
      targetCollege = await College.findById(college);
      if (!targetCollege) {
        return NextResponse.json({ message: 'Assigned college not found.' }, { status: 404 });
      }
      // Check uniAdminCount limit BEFORE creating the user
      if (targetCollege.uniAdminCount >= 2) { // Assuming a max of 2 uniadmins per college
        return NextResponse.json({ message: `College ${targetCollege.name} already has maximum uniadmins (${targetCollege.uniAdminCount}).` }, { status: 409 });
      }
    } else if (role === 'superadmin' && college) {
      return NextResponse.json({ message: 'Superadmin cannot be assigned to a college.' }, { status: 400 });
    }

    // 3. Create the new AdminUser first. The password will be hashed by the Mongoose pre('save') hook.
    const newAdminUser = new AdminUser({
      img_url,
      name,
      username,
      email,
      pno,
      password, // This 'password' is the PLAIN-TEXT password from the request body
      role,
      college: role === 'uniadmin' ? college : undefined,
      passoutyear,
    });

    // Attempt to save the admin user. If this fails, the college count will NOT be incremented.
    await newAdminUser.save(); // This is where the pre-save hook hashes the password

    // 4. If AdminUser creation is successful, then increment college count (if uniadmin)
    if (role === 'uniadmin' && targetCollege) {
      targetCollege.uniAdminCount += 1;
      await targetCollege.save(); // Save the updated college count
    }

    // Exclude sensitive data from the response
    const { password: _, refreshTokens: __, ...adminUserWithoutSensitiveData } = newAdminUser.toObject();
    return NextResponse.json(adminUserWithoutSensitiveData, { status: 201 });

  } catch (error) {
    console.error("Admin API - Error creating admin user:", error);
    // Handle Mongoose validation errors or other database errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: 400 });
    }
    // Handle duplicate key error (e.g., if a unique index constraint fails after initial findOne check)
    if (error.code === 11000) {
      // This case should ideally be caught by the findOne check above,
      // but it's a good fallback for other unique indexed fields.
      return NextResponse.json({ message: 'A user with this unique detail (email, username, or phone number) already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create admin user', error: error.message }, { status: 500 });
  }
}, ['superadmin']); // This route MUST be protected by the superadminAuthMiddleware





// export const POST = async (req) => { // <-- REMOVED adminAuthMiddleware HERE
//   await adminDbConnect();
//   try {
//     const body = await req.json();
//     const { username, email, password, name, role, college, pno, passoutyear, img_url } = body; // Added img_url and pno based on your schema

//     // IMPORTANT: Ensure you include img_url and pno in your Postman request body
//     if (!username || !email || !password || !name || !role || !pno || !passoutyear || !img_url) {
//       return NextResponse.json({ message: 'Missing required fields (username, email, password, name, role, pno, passoutyear, img_url).' }, { status: 400 });
//     }

//     // This block is for uniadmin role validation, which won't apply to superadmin creation
//     // but it's good to keep the original logic for when you revert.
//     if (role === 'uniadmin') {
//       if (!college) {
//         return NextResponse.json({ message: 'College is required for uniadmin role.' }, { status: 400 });
//       }
//       const targetCollege = await College.findById(college);
//       if (!targetCollege) {
//         return NextResponse.json({ message: 'Assigned college not found.' }, { status: 404 });
//       }
//       if (targetCollege.uniAdminCount >= 2) {
//         return NextResponse.json({ message: `College ${targetCollege.name} already has maximum uniadmins (2).` }, { status: 409 });
//       }
//       // Increment uniAdminCount for the college
//       targetCollege.uniAdminCount += 1;
//       await targetCollege.save();
//     } else if (role === 'superadmin' && college) {
//       // This ensures superadmin cannot be assigned a college
//       return NextResponse.json({ message: 'Superadmin cannot be assigned to a college.' }, { status: 400 });
//     }

//     // The password will be hashed by the AdminUserSchema.pre('save') hook
//     // You must provide the already hashed password from Step 1 in your Postman request.
//     const newAdminUser = await AdminUser.create({
//       img_url, // Add img_url
//       name,
//       username,
//       email,
//       pno, // Add pno
//       password, // Use the hashed password provided in the request body
//       role,
//       college: role === 'uniadmin' ? college : undefined,
//       passoutyear,
//     });

//     const { password: _, refreshTokens: __, ...adminUserWithoutSensitiveData } = newAdminUser.toObject();
//     return NextResponse.json(adminUserWithoutSensitiveData, { status: 201 });
//   } catch (error) {
//     console.error("Admin API - Error creating admin user:", error);
//     if (error.code === 11000) {
//       return NextResponse.json({ message: 'Admin with this email, username, or phone number already exists.' }, { status: 409 }); // Added phone number to message
//     }
//     return NextResponse.json({ message: 'Failed to create admin user', error: error.message }, { status: 400 });
//   }
// }; // <-- NO ROLE ARRAY HERE
// // TEMPORARY MODIFICATION END

