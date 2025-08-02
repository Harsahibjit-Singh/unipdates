// app/public-users/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext'; // Assuming you have an AdminAuthContext

import {
  Users,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Search,
  Download,
  BarChart,
  PieChart,
  LineChart,
  Plus,
  Key,
  Mail,
  User,
  Calendar,
  University,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// Recharts imports for data visualization
import {
  Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const PublicUsersPage = () => {
  const router = useRouter();
  // Assuming useAdminAuth provides isAdminAuthenticated, loading, and isSuperadmin
  const { isAdminAuthenticated, loading: authLoading, isSuperadmin } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('view-users'); // 'view-users', 'analytics', 'edit-user'
  const [users, setUsers] = useState([]); // All public users fetched from API
  const [colleges, setColleges] = useState([]); // List of colleges for filtering/dropdowns
  const [selectedUser, setSelectedUser] = useState(null); // For edit form

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('');
  const [selectedPassoutYearFilter, setSelectedPassoutYearFilter] = useState('');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState('all'); // 'all', 'verified', 'unverified'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Access token for API calls, assuming it's stored in localStorage by your admin auth system
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  // showMessage utility for consistent feedback
  const showMessage = useCallback((msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, 5000); // Clear message after 5 seconds
  }, []);

  // Redirect if not authenticated or not a superadmin
  useEffect(() => {
    if (!authLoading && (!isAdminAuthenticated || !isSuperadmin)) {
      router.push('/'); // Redirect to admin login
    }
  }, [isAdminAuthenticated, authLoading, isSuperadmin, router]);

  // Fetch all users from the admin API endpoint
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return; // Ensure token exists before fetching
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      // This API route should be protected by adminAuthMiddleware and return all users
      const response = await fetch('/api/admin/data/users', { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch public users.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching public users:', err);
      setError(err.message || 'Failed to load public users.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // Removed showMessage from dependency as it's useCallback itself

  // Fetch colleges (for filter dropdown) from the admin API endpoint
  const fetchColleges = useCallback(async () => {
    if (!accessToken) return;
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      const response = await fetch('/api/admin/data/colleges', { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch colleges.');
      }
      const data = await response.json();
      setColleges(data);
    } catch (err) {
      console.error('Error fetching colleges:', err);
      showMessage('Failed to load colleges for filtering.', 'error');
    }
  }, [accessToken, showMessage]);

  // Initial data fetch on component mount (if authenticated as superadmin)
  useEffect(() => {
    if (isAdminAuthenticated && isSuperadmin) {
      fetchUsers();
      fetchColleges();
    }
  }, [isAdminAuthenticated, isSuperadmin, fetchUsers, fetchColleges]);

  // Memoized list of unique passout years for the filter dropdown
  const uniquePassoutYears = useMemo(() => {
    const years = new Set(users.map(user => user.passoutYear).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [users]);

  // Memoized filtered list of users based on current filters
  const filteredUsers = useMemo(() => {
    let currentUsers = users;

    if (selectedCollegeFilter) {
      currentUsers = currentUsers.filter(user => user.college === selectedCollegeFilter);
    }

    if (selectedPassoutYearFilter) {
      currentUsers = currentUsers.filter(user => user.passoutYear === parseInt(selectedPassoutYearFilter));
    }

    if (selectedVerificationFilter !== 'all') {
      // Use 'isverified' to match the schema
      currentUsers = currentUsers.filter(user =>
        selectedVerificationFilter === 'verified' ? user.isverified : !user.isverified
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      currentUsers = currentUsers.filter(user =>
        user.name.toLowerCase().includes(lowercasedQuery) ||
        user.username.toLowerCase().includes(lowercasedQuery) ||
        user.email.toLowerCase().includes(lowercasedQuery) ||
        (user.college && user.college.toLowerCase().includes(lowercasedQuery))
      );
    }
    return currentUsers;
  }, [users, searchQuery, selectedCollegeFilter, selectedPassoutYearFilter, selectedVerificationFilter]);


  // Handler for editing a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setActiveTab('edit-user');
  };

  // Handler for deleting a user
  const handleDeleteUser = async (id) => {
    // Replace with a custom modal for confirmation in a real app
    if (!confirm('Are you sure you want to delete this public user? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user.');
      }
      showMessage('User deleted successfully!');
      fetchUsers(); // Refresh list after deletion
    } catch (err) {
      console.error('Delete User error:', err);
      showMessage(err.message || 'An error occurred during deletion.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Display loading spinner while authenticating or fetching initial data
  if (authLoading || !isAdminAuthenticated || !isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="ml-4 text-xl text-gray-700">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8 text-gray-800">
      <h1 className="text-5xl font-extrabold text-blue-800 mb-10 text-center drop-shadow-lg">
        Public Users Management
      </h1>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8 text-center shadow-md">
          <CheckCircle className="inline-block w-6 h-6 mr-2" />
          <span className="font-semibold">Success:</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 text-center shadow-md">
          <AlertCircle className="inline-block w-6 h-6 mr-2" />
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8 space-x-4">
        <TabButton active={activeTab === 'view-users'} onClick={() => setActiveTab('view-users')}>
          <Eye className="w-5 h-5 mr-2" /> View Users
        </TabButton>
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          <BarChart className="w-5 h-5 mr-2" /> Analytics
        </TabButton>
        {activeTab === 'edit-user' && ( // Show "Edit User" tab only when actively editing
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Edit User
          </TabButton>
        )}
      </div>

      {/* Main Content Area based on active tab */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {activeTab === 'view-users' && (
            <ViewUsers
              users={filteredUsers} // Pass filtered users for display
              colleges={colleges}
              uniquePassoutYears={uniquePassoutYears}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCollegeFilter={selectedCollegeFilter}
              setSelectedCollegeFilter={setSelectedCollegeFilter}
              selectedPassoutYearFilter={selectedPassoutYearFilter}
              setSelectedPassoutYearFilter={setSelectedPassoutYearFilter}
              selectedVerificationFilter={selectedVerificationFilter}
              setSelectedVerificationFilter={setSelectedVerificationFilter}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
              allUsers={users} // Pass all users for specific download options (unfiltered)
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              users={users} // Analytics uses all fetched users (unfiltered)
              colleges={colleges}
            />
          )}
          {activeTab === 'edit-user' && selectedUser && (
            <UserForm
              user={selectedUser}
              showMessage={showMessage}
              refreshData={fetchUsers} // Callback to re-fetch users after update
              colleges={colleges} // Pass colleges for dropdown in form
              onCancel={() => setActiveTab('view-users')} // Callback to go back to view tab
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PublicUsersPage;

// --- Helper Components ---

// Reusable button for tab navigation
const TabButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-md
      ${active ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'}`}
  >
    {children}
  </button>
);

// --- Download Utility Function ---
// Handles downloading data as CSV or JSON
const downloadData = (data, filename, type) => {
  let content;
  if (type === 'json') {
    content = JSON.stringify(data, null, 2); // Pretty print JSON
  } else if (type === 'csv') {
    // Define CSV headers based on UserProfileSchema fields
    const headers = [
      "User ID", "Name", "Username", "Email", "College", "Passout Year",
      "Google Login", "Verified", "Profile Picture", "Last Login Date",
      "Last Login IP", "Created At", "Updated At"
    ];
    // Map user objects to CSV rows, handling potential nulls/undefineds
    const rows = data.map(user => [
      user.userId,
      user.name,
      user.username,
      user.email,
      user.college || 'N/A',
      user.passoutYear || 'N/A',
      user.isGoogleLogin ? 'Yes' : 'No',
      user.isverified ? 'Yes' : 'No', // Use 'isverified' to match schema
      user.profilePicture || 'N/A',
      user.lastlogindate ? new Date(user.lastlogindate).toLocaleString() : 'N/A',
      user.lastloginip || 'N/A',
      new Date(user.createdAt).toLocaleDateString(),
      new Date(user.updatedAt).toLocaleDateString(),
    ]);

    // Combine headers and rows, ensuring proper CSV escaping for fields with commas/quotes
    content = headers.join(",") + "\n";
    rows.forEach(row => {
      content += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",") + "\n";
    });
  } else {
    console.error("Unsupported download type:", type);
    return;
  }

  // Create a Blob and a download link
  const blob = new Blob([content], { type: `application/${type};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click(); // Programmatically click the link to trigger download
  document.body.removeChild(link); // Clean up the temporary link
};


// --- ViewUsers Component ---
const ViewUsers = ({
  users, // This is already the filtered list for display
  colleges,
  uniquePassoutYears,
  searchQuery,
  setSearchQuery,
  selectedCollegeFilter,
  setSelectedCollegeFilter,
  selectedPassoutYearFilter,
  setSelectedPassoutYearFilter,
  selectedVerificationFilter,
  setSelectedVerificationFilter,
  handleEditUser,
  handleDeleteUser,
  allUsers // All users (unfiltered) for specific download options
}) => {

  // Function to download all users data (unfiltered)
  const handleDownloadAllUsers = (type) => {
    downloadData(allUsers, `all_public_users_data.${type}`, type);
  };

  // Function to download only unverified users data
  const handleDownloadUnverifiedUsers = (type) => {
    const unverifiedUsers = allUsers.filter(user => !user.isverified); // Use 'isverified'
    downloadData(unverifiedUsers, `unverified_public_users_data.${type}`, type);
  };

  // Function to download the currently filtered data displayed in the table
  const handleDownloadFilteredData = (type) => {
    downloadData(users, `filtered_public_users_data.${type}`, type);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <Users className="w-7 h-7 mr-3 text-purple-600" /> All Public Users
      </h2>

      {/* Search and Filter Inputs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username, email, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          />
        </div>
        <div>
          <select
            value={selectedCollegeFilter}
            onChange={(e) => setSelectedCollegeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="">All Colleges</option>
            {colleges.map(college => (
              <option key={college._id} value={college.name}>{college.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedPassoutYearFilter}
            onChange={(e) => setSelectedPassoutYearFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="">All Passout Years</option>
            {uniquePassoutYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedVerificationFilter}
            onChange={(e) => setSelectedVerificationFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Data Download Buttons */}
      <div className="mb-6 flex flex-wrap justify-end gap-3">
        {/* Download currently filtered data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadFilteredData('csv')}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-200 flex items-center"
            title="Download currently filtered data as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Filtered CSV
          </button>
          <button
            onClick={() => handleDownloadFilteredData('json')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center"
            title="Download currently filtered data as JSON"
          >
            <Download className="w-5 h-5 mr-2" /> Filtered JSON
          </button>
        </div>
        {/* Download all users data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadAllUsers('csv')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            title="Download all users data as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> All Users CSV
          </button>
          <button
            onClick={() => handleDownloadAllUsers('json')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 transition-colors duration-200 flex items-center"
            title="Download all users data as JSON"
          >
            <Download className="w-5 h-5 mr-2" /> All Users JSON
          </button>
        </div>
        {/* Download unverified users data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadUnverifiedUsers('csv')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center"
            title="Download unverified users data as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Unverified CSV
          </button>
          <button
            onClick={() => handleDownloadUnverifiedUsers('json')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200 flex items-center"
            title="Download unverified users data as JSON"
          >
            <Download className="w-5 h-5 mr-2" /> Unverified JSON
          </button>
        </div>
      </div>

      {/* User Table Display */}
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchQuery || selectedCollegeFilter || selectedPassoutYearFilter || selectedVerificationFilter !== 'all' ? `No users found matching your criteria.` : 'No public users registered yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College / Passout Year
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={user.profilePicture || "https://placehold.co/40x40/cccccc/333333?text=User"}
                      alt="Profile"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/cccccc/333333?text=User"; }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.college || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Passout: {user.passoutYear || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isGoogleLogin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.isGoogleLogin ? 'Google' : 'Manual'}
                      </span>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isverified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' // Use 'isverified'
                      }`}>
                        {user.isverified ? 'Verified' : 'Unverified'} {/* Use 'isverified' */}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="Edit User"
                    >
                      <Edit className="w-5 h-5 inline-block" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete User"
                    >
                      <Trash2 className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- UserForm Component (for Edit User functionality) ---
const UserForm = ({ user, showMessage, refreshData, colleges, onCancel }) => {
  // State for form data, initialized with existing user data
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    passoutYear: user.passoutYear || '',
    college: user.college || '',
    profilePicture: user.profilePicture || '',
    newPassword: '', // Temporary field for password reset
    profilePictureFile: null, // Temporary field for new file upload
    isverified: user.isverified || false, // Use 'isverified' to match schema
  });
  const [formLoading, setFormLoading] = useState(false);

  // Access token for API calls
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  // Generic change handler for form inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handler for profile picture file input
  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, profilePictureFile: e.target.files[0] }));
  };

  // Utility function to upload files to Cloudinary via your API
  const uploadFileToCloudinary = async (file, folder, resourceType) => {
    const uploadFormData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder); // Not used by your /api/upload-image route, but good practice
    formData.append('resourceType', resourceType); // Not used by your /api/upload-image route, but good practice

    const response = await fetch('/api/upload-image', { // Your existing Cloudinary upload endpoint
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Assuming your upload endpoint requires admin auth
      },
      body: uploadFormData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to upload ${file.name}.`);
    }
    return data.secure_url; // Assuming it returns secure_url
  };

  // Handler for form submission (update user)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData };

      // Handle profile picture upload if a new file is selected
      if (formData.profilePictureFile) {
        payload.profilePicture = await uploadFileToCloudinary(formData.profilePictureFile, 'user-profiles', 'image');
      } else if (formData.profilePicture === '') {
        // If profilePicture was explicitly cleared by the user (e.g., by clicking remove button)
        payload.profilePicture = '';
      }
      // If no new file and not cleared, existing profilePicture URL remains in payload

      // Include newPassword only if it's provided
      if (payload.newPassword) {
        payload.password = payload.newPassword; // Backend will hash this
      }

      // Remove temporary/sensitive/non-editable fields before sending to API
      delete payload.newPassword;
      delete payload.profilePictureFile;
      // These fields are managed by the system, not directly editable by admin PUT
      delete payload.isGoogleLogin;
      delete payload.googleId;
      delete payload.userId;
      delete payload.lastlogindate;
      delete payload.lastloginip;
      delete payload.sessionVersion;
      delete payload.refreshTokens;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload._id; // MongoDB _id is in params, not in body for update

      const response = await fetch(`/api/admin/data/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(', ') || `Failed to update user.`);
        }
        throw new Error(data.message || `Failed to update user.`);
      }

      showMessage(`User ${user.username} updated successfully!`);
      refreshData(); // Re-fetch all users to update the table and analytics
      onCancel(); // Go back to the view users tab
    } catch (err) {
      console.error('Update User error:', err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <Edit className="w-7 h-7 mr-3 text-purple-600" /> Edit User: {user.username}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Non-editable fields (for reference) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">User ID</label>
            <p className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">{user.userId}</p>
          </div>
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">Login Type</label>
            <p className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {user.isGoogleLogin ? 'Google Login' : 'Manual Login'}
            </p>
          </div>
        </div>

        {/* Editable Fields */}
        <div>
          <label htmlFor="name" className="block text-lg font-semibold text-gray-700 mb-2">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label htmlFor="username" className="block text-lg font-semibold text-gray-700 mb-2">Username</label>
          {/* Username is generally not editable after creation to maintain consistency for links/references */}
          <input type="text" id="username" name="username" value={formData.username} className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed" disabled />
        </div>
        <div>
          <label htmlFor="email" className="block text-lg font-semibold text-gray-700 mb-2">Email</label>
          {/* Email is generally not editable after creation to maintain consistency for auth/verification */}
          <input type="email" id="email" name="email" value={formData.email} className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed" disabled />
        </div>
        <div>
          <label htmlFor="passoutYear" className="block text-lg font-semibold text-gray-700 mb-2">Passout Year</label>
          <input type="number" id="passoutYear" name="passoutYear" value={formData.passoutYear} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="college" className="block text-lg font-semibold text-gray-700 mb-2">College</label>
          {/* Using a text input for college, but could be a dropdown of existing colleges */}
          <input type="text" id="college" name="college" value={formData.college} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          {/* Example of a select dropdown if you want to enforce existing college names: */}
          {/* <select id="college" name="college" value={formData.college} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Select College</option>
            {colleges.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select> */}
        </div>

        {/* Profile Picture Upload Section */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ImageIcon className="w-5 h-5 mr-2" /> Profile Picture</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {formData.profilePictureFile && (
            <p className="text-xs text-gray-500 mt-1">New file selected: {formData.profilePictureFile.name}</p>
          )}
          {/* Display current picture or placeholder */}
          {(formData.profilePicture || formData.profilePictureFile) && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Current Profile Picture:</p>
              <img
                src={formData.profilePictureFile ? URL.createObjectURL(formData.profilePictureFile) : formData.profilePicture || "https://placehold.co/80x80/cccccc/333333?text=User"}
                alt="Current Profile"
                className="h-20 w-20 rounded-full object-cover border border-gray-200"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/80x80/cccccc/333333?text=User"; }}
              />
              {/* Option to remove current picture (sets URL to empty string) */}
              {formData.profilePicture && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, profilePicture: '', profilePictureFile: null }))}
                  className="mt-1 text-red-600 hover:underline text-sm"
                >
                  Remove Current Picture
                </button>
              )}
            </div>
          )}
        </div>

        {/* Password Reset Section */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Key className="w-5 h-5 mr-2" /> Reset Password (Optional)</h3>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter new password to reset"
            autoComplete="new-password"
          />
          <p className="text-sm text-gray-500 mt-1">Leave blank if you don't want to change the password.</p>
        </div>

        {/* Verification Status Toggle (isverified) */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm flex items-center justify-between">
          <label htmlFor="isverified" className="text-lg font-semibold text-gray-700 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> User Verified
          </label>
          <input
            type="checkbox"
            id="isverified"
            name="isverified" // Matches schema field name
            checked={formData.isverified}
            onChange={handleChange}
            className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>


        {/* Form Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:bg-blue-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Edit className="mr-2" size={20} />}
            {formLoading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- AnalyticsDashboard Component ---
const AnalyticsDashboard = ({ users, colleges }) => {
  // Data for "Users by College" chart
  const usersByCollegeData = useMemo(() => {
    const counts = {};
    users.forEach(user => {
      const collegeName = user.college || 'Unknown College';
      counts[collegeName] = (counts[collegeName] || 0) + 1;
    });
    return Object.keys(counts).map(college => ({
      name: college,
      users: counts[college]
    })).sort((a, b) => b.users - a.users); // Sort by user count descending
  }, [users]);

  // Data for "Users by Passout Year" chart
  const usersByPassoutYearData = useMemo(() => {
    const counts = {};
    users.forEach(user => {
      const year = user.passoutYear || 'N/A';
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.keys(counts).map(year => ({
      name: year,
      users: counts[year]
    })).sort((a, b) => {
      if (a.name === 'N/A') return 1; // Push 'N/A' to the end
      if (b.name === 'N/A') return -1;
      return parseInt(b.name) - parseInt(a.name); // Sort years descending
    });
  }, [users]);

  // Data for "User Registration Over Time" chart (using createdAt)
  const registrationOverTimeData = useMemo(() => {
    const monthlyCounts = {}; // YYYY-MM -> count
    users.forEach(user => {
      const date = new Date(user.createdAt);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
    });

    // Convert to array and sort by date for charting
    const sortedData = Object.keys(monthlyCounts).sort().map(month => ({
      date: month,
      registrations: monthlyCounts[month]
    }));

    return sortedData;
  }, [users]);

  // Data for "Profile Updates Over Time" chart (using updatedAt)
  const profileUpdatesOverTimeData = useMemo(() => {
    const monthlyCounts = {}; // YYYY-MM -> count
    users.forEach(user => {
      const date = new Date(user.updatedAt);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
    });

    const sortedData = Object.keys(monthlyCounts).sort().map(month => ({
      date: month,
      updates: monthlyCounts[month]
    }));

    return sortedData;
  }, [users]);

  // Data for "Login Type Distribution" chart
  const loginTypeData = useMemo(() => {
    const googleCount = users.filter(user => user.isGoogleLogin).length;
    const manualCount = users.filter(user => !user.isGoogleLogin).length;
    return [
      { name: 'Google Login', value: googleCount },
      { name: 'Manual Login', value: manualCount },
    ].filter(item => item.value > 0); // Only include if there are users for that type
  }, [users]);

  // Data for "Verified Status Distribution" chart (using isverified)
  const verificationStatusData = useMemo(() => {
    const verifiedCount = users.filter(user => user.isverified).length; // Use 'isverified'
    const unverifiedCount = users.filter(user => !user.isverified).length; // Use 'isverified'
    return [
      { name: 'Verified', value: verifiedCount },
      { name: 'Unverified', value: unverifiedCount },
    ].filter(item => item.value > 0);
  }, [users]);

  // Data for "Users by Last Login Month" chart (proxy for active users)
  const lastLoginData = useMemo(() => {
    const monthlyCounts = {};
    users.forEach(user => {
      if (user.lastlogindate) {
        const date = new Date(user.lastlogindate);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
      }
    });
    const sortedData = Object.keys(monthlyCounts).sort().map(month => ({
      date: month,
      logins: monthlyCounts[month]
    }));
    return sortedData;
  }, [users]);


  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A6'];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <BarChart className="w-7 h-7 mr-3 text-purple-600" /> User Analytics Dashboard
      </h2>

      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No user data available for analytics.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Users by College */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Users by College</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={usersByCollegeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8884d8" name="Number of Users" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Users by Passout Year */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Users by Passout Year</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={usersByPassoutYearData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#82ca9d" name="Number of Users" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: User Registration Over Time */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Registration Over Time (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={registrationOverTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="registrations" stroke="#ffc658" name="New Registrations" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Profile Updates Over Time (Active Users Proxy) */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Updates Over Time (Monthly)</h3>
            <p className="text-sm text-gray-600 mb-4">
              This chart shows the trend of users updating their profiles, serving as a proxy for engagement/activity.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={profileUpdatesOverTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="updates" stroke="#4CAF50" name="Profile Updates" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5: Last Login Activity Over Time */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Login Activity Over Time (Monthly)</h3>
            <p className="text-sm text-gray-600 mb-4">
              This chart shows the number of users who logged in each month, indicating active user trends.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={lastLoginData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="logins" stroke="#FF5733" name="Monthly Logins" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6: Login Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Login Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={loginTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {loginTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7: Verified Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Verification Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={verificationStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {verificationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
