import { PlusCircle, Loader2, Image as ImageIcon, XCircle } from "lucide-react";
import React, { useState } from "react";
import crypto from "crypto";

const AddUniAdminForm = ({ colleges, showMessage, refreshData }) => {
  const [formData, setFormData] = useState({
    img_url: 'https://placehold.co/100x100/cccccc/333333?text=UA', // Default placeholder
    name: '',
    username: '',
    email: '',
    pno: '',
    passoutyear: '',
    college: '',
    role: 'uniadmin',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [profileImgFile, setProfileImgFile] = useState(null); // State for the selected file

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImgFile(file);
      // Create a local URL for immediate preview
      setFormData(prev => ({ ...prev, img_url: URL.createObjectURL(file) }));
    } else {
      setProfileImgFile(null);
      // Reset to default placeholder if no file selected
      setFormData(prev => ({ ...prev, img_url: 'https://placehold.co/100x100/cccccc/333333?text=UA' }));
    }
  };

  const generateRandomPassword = () => {
    return crypto.randomBytes(5).toString('hex').slice(0, 10); // 5 bytes = 10 hex chars
  };

  // Reusable Cloudinary upload function (can be moved to a shared utility if needed elsewhere)
  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'admin-profile-images'); // Specific folder for admin profiles
    formData.append('resourceType', 'image');

    const response = await fetch('/api/admin/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Assuming your upload endpoint is also protected
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to upload ${file.name}.`);
    }
    return data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const randomPassword = generateRandomPassword();
      let finalImgUrl = formData.img_url; // Start with current URL (could be placeholder or existing)

      // Upload profile image if a new file is selected
      if (profileImgFile) {
        finalImgUrl = await uploadFileToCloudinary(profileImgFile);
      }

      const payload = {
        ...formData,
        img_url: finalImgUrl, // Use the uploaded URL or the default/existing one
        password: randomPassword, // Send plain-text password for the backend to hash
      };

      // 1. Create the Admin User
      const createAdminResponse = await fetch('/api/admin/data/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const createAdminData = await createAdminResponse.json();
      if (!createAdminResponse.ok) {
        throw new Error(createAdminData.message || 'Failed to add uniadmin.');
      }

      // 2. Send email with the generated password using the custom email API
      const sendEmailResponse = await fetch('/api/admin/utils/send-custom-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: formData.email,
          subject: 'Your New UniUpdates Admin Account Details',
          html: `
            <p>Dear ${formData.name},</p>
            <p>Your UniUpdates Admin account has been created. Here are your login details:</p>
            <p><strong>Username:</strong> ${formData.username}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Temporary Password:</strong> <code>${randomPassword}</code></p>
            <p>For security reasons, please log in and immediately change your password using the "Forgot Password" link on the login page.</p>
            <p>Login Page: <a href="https://admin-tau-lemon.vercel.app">https://admin-tau-lemon.vercel.app</a></p>
            <p>If you did not request this, please contact support immediately.</p>
            <p>Regards,<br>UniUpdates Admin Team</p>
          `,
        }),
      });

      if (!sendEmailResponse.ok) {
        console.error("Failed to send welcome email:", await sendEmailResponse.json());
        showMessage(`Uniadmin ${formData.name} added successfully, but failed to send welcome email. Please inform them manually.`, 'error');
      } else {
        showMessage(`Uniadmin ${formData.name} added successfully! Temporary password sent to ${formData.email}.`);
      }

      // Reset form
      setFormData({
        img_url: 'https://placehold.co/100x100/cccccc/333333?text=UA',
        name: '', username: '', email: '', pno: '', passoutyear: '', college: '', role: 'uniadmin',
      });
      setProfileImgFile(null); // Clear file input
      refreshData(); // Refresh list of admins
    } catch (err) {
      console.error('Add Uniadmin error:', err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <PlusCircle className="w-7 h-7 mr-3 text-purple-600" /> Add New Uniadmin
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Image Upload */}
          <div className="md:col-span-2">
            <label htmlFor="profileImg" className="block text-lg font-semibold text-gray-700 mb-2">Profile Image</label>
            <input type="file" id="profileImg" name="profileImgFile" accept="image/*" onChange={handleProfileImgChange} className="w-full text-base text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {formData.img_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                <img src={formData.img_url} alt="Profile Preview" className="w-24 h-24 object-cover rounded-full border border-gray-200 shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x96/cccccc/333333?text=UA"; }} />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="adminName" className="block text-lg font-semibold text-gray-700 mb-2">Name</label>
            <input type="text" id="adminName" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="adminUsername" className="block text-lg font-semibold text-gray-700 mb-2">Username</label>
            <input type="text" id="adminUsername" name="username" value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="adminEmail" className="block text-lg font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" id="adminEmail" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="adminPno" className="block text-lg font-semibold text-gray-700 mb-2">Phone Number</label>
            <input type="tel" id="adminPno" name="pno" value={formData.pno} onChange={handleChange} pattern="\d{10}" maxLength="10" placeholder="10-digit number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="adminPassoutYear" className="block text-lg font-semibold text-gray-700 mb-2">Passout Year</label>
            <input type="number" id="adminPassoutYear" name="passoutyear" value={formData.passoutyear} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label htmlFor="adminCollege" className="block text-lg font-semibold text-gray-700 mb-2">Assign College</label>
            <select id="adminCollege" name="college" value={formData.college} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select a College</option>
              {colleges.map(college => (
                <option key={college._id} value={college._id}>{college.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={formLoading}
        >
          {formLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <PlusCircle className="mr-2" size={20} />}
          {formLoading ? 'Adding Uniadmin...' : 'Add Uniadmin'}
        </button>
      </form>
    </div>
  );
};

export default AddUniAdminForm;