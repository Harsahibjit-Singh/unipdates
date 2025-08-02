// app/featured/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext'; // Assuming this context exists

import {
  Image as ImageIcon, // Main icon for featured
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Search,
  Calendar, // For date inputs
  Tag, // For tagline
  Upload, // For upload button
  XCircle, // For removing image
} from 'lucide-react';

const FeaturedPage = () => {
  const router = useRouter();
  const { isAdminAuthenticated, loading: authLoading, isSuperadmin } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('view-featured'); // 'view-featured', 'add-featured', 'edit-featured'
  const [featuredItems, setFeaturedItems] = useState([]);
  const [selectedFeatured, setSelectedFeatured] = useState(null); // For edit form

  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
    }, 5000);
  }, []);

  // Redirect if not authenticated or not a superadmin
  useEffect(() => {
    if (!authLoading && (!isAdminAuthenticated || !isSuperadmin)) {
      router.push('/');
    }
  }, [isAdminAuthenticated, authLoading, isSuperadmin, router]);

  // Fetch all featured items
  const fetchFeaturedItems = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      const response = await fetch('/api/admin/data/featured', { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch featured items.');
      }
      const data = await response.json();
      setFeaturedItems(data);
    } catch (err) {
      console.error('Error fetching featured items:', err);
      setError(err.message || 'Failed to load featured items.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Initial data fetch on component mount (if authenticated as superadmin)
  useEffect(() => {
    if (isAdminAuthenticated && isSuperadmin) {
      fetchFeaturedItems();
    }
  }, [isAdminAuthenticated, isSuperadmin, fetchFeaturedItems]);

  // Memoized filtered list of featured items based on search query
  const filteredFeaturedItems = useMemo(() => {
    let currentItems = featuredItems;
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      currentItems = currentItems.filter(item =>
        item.tagLine.toLowerCase().includes(lowercasedQuery) ||
        new Date(item.expiryDate).toLocaleDateString().toLowerCase().includes(lowercasedQuery)
      );
    }
    return currentItems;
  }, [featuredItems, searchQuery]);

  // Handler for editing a featured item
  const handleEditFeatured = (item) => {
    setSelectedFeatured(item);
    setActiveTab('edit-featured');
  };

  // Handler for deleting a featured item
  const handleDeleteFeatured = async (id) => {
    if (!confirm('Are you sure you want to delete this featured item? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/featured/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete featured item.');
      }
      showMessage('Featured item deleted successfully!');
      fetchFeaturedItems(); // Refresh list after deletion
    } catch (err) {
      console.error('Delete Featured Item error:', err);
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
        Featured Items Management
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
        <TabButton active={activeTab === 'view-featured'} onClick={() => setActiveTab('view-featured')}>
          <Eye className="w-5 h-5 mr-2" /> View Featured
        </TabButton>
        <TabButton active={activeTab === 'add-featured'} onClick={() => { setActiveTab('add-featured'); setSelectedFeatured(null); }}>
          <PlusCircle className="w-5 h-5 mr-2" /> Add New Featured
        </TabButton>
        {activeTab === 'edit-featured' && ( // Show "Edit Featured" tab only when actively editing
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Edit Featured
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
          {activeTab === 'view-featured' && (
            <ViewFeaturedItems
              featuredItems={filteredFeaturedItems}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleEditFeatured={handleEditFeatured}
              handleDeleteFeatured={handleDeleteFeatured}
            />
          )}
          {activeTab === 'add-featured' && (
            <FeaturedForm
              type="add"
              showMessage={showMessage}
              refreshData={fetchFeaturedItems}
            />
          )}
          {activeTab === 'edit-featured' && selectedFeatured && (
            <FeaturedForm
              type="edit"
              featured={selectedFeatured}
              showMessage={showMessage}
              refreshData={fetchFeaturedItems}
              onCancel={() => setActiveTab('view-featured')}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FeaturedPage;

// --- Helper Components ---

const TabButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-md
      ${active ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'}`}
  >
    {children}
  </button>
);

// --- ViewFeaturedItems Component ---
const ViewFeaturedItems = ({
  featuredItems,
  searchQuery,
  setSearchQuery,
  handleEditFeatured,
  handleDeleteFeatured
}) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <ImageIcon className="w-7 h-7 mr-3 text-purple-600" /> All Featured Items
      </h2>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by tagline or expiry date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
        />
      </div>

      {featuredItems.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchQuery ? `No featured items found matching your criteria.` : 'No featured items added yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map(item => (
            <div key={item._id} className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200 flex flex-col">
              <div className="flex-grow">
                {item.img && (
                  <img
                    src={item.img}
                    alt={item.tagLine}
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x192/cccccc/333333?text=Image+Error"; }}
                  />
                )}
                <h3 className="text-xl font-bold text-blue-800 mb-2 line-clamp-2">{item.tagLine}</h3>
                <p className="text-sm text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(item.createdOn).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleEditFeatured(item)}
                  className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors duration-200 shadow-md"
                  title="Edit Featured Item"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteFeatured(item._id)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 shadow-md"
                  title="Delete Featured Item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- FeaturedForm Component (for Add/Edit) ---
const FeaturedForm = ({ type, featured, showMessage, refreshData, onCancel }) => {
  const [formData, setFormData] = useState({
    tagLine: featured?.tagLine || '',
    expiryDate: featured?.expiryDate ? new Date(featured.expiryDate).toISOString().split('T')[0] : '', // YYYY-MM-DD
    imageFile: null, // For new file upload
    img: featured?.img || '', // This will hold the Cloudinary URL after upload
  });
  const [formLoading, setFormLoading] = useState(false);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, imageFile: e.target.files[0] }));
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, img: '', imageFile: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let finalImageUrl = formData.img; // Start with the existing image URL

      // If a new file is selected, upload it using your /api/admin/data/upload-file endpoint
      if (formData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.imageFile);
        uploadFormData.append('folder', 'featured-items'); // Specify a folder for Cloudinary
        uploadFormData.append('resourceType', 'image'); // Specify resource type

        const uploadResponse = await fetch('/api/admin/upload-file', { // YOUR SPECIFIED ENDPOINT
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`, // Pass admin token for auth
          },
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || 'Failed to upload image via /api/admin/upload-file.');
        }
        finalImageUrl = uploadData.imageUrl; // Get the URL from your upload API's response
      } else if (type === 'add' && !formData.img) {
        // For 'add' type, if no file selected and no existing URL (which means it's required)
        throw new Error('An image file is required for new featured items.');
      }
      // If type is 'edit' and no new file, and img was cleared, finalImageUrl will be ''

      const payload = {
        tagLine: formData.tagLine,
        expiryDate: formData.expiryDate,
        img: finalImageUrl, // Send the final image URL to your backend
      };

      let response;
      if (type === 'add') {
        response = await fetch('/api/admin/data/featured', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // Send JSON now
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else { // type === 'edit'
        response = await fetch(`/api/admin/data/featured/${featured._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json', // Send JSON now
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${type} featured item.`);
      }

      showMessage(`Featured item ${type === 'add' ? 'added' : 'updated'} successfully!`);
      refreshData(); // Refresh list
      if (type === 'add') {
        // Reset form for new entry
        setFormData({
          tagLine: '',
          expiryDate: '',
          imageFile: null,
          img: '', // Reset img URL
        });
      } else {
        onCancel(); // Go back to view page after update
      }
    } catch (err) {
      console.error(`${type === 'add' ? 'Add' : 'Edit'} Featured Item error:`, err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        {type === 'add' ? <PlusCircle className="w-7 h-7 mr-3 text-purple-600" /> : <Edit className="w-7 h-7 mr-3 text-purple-600" />}
        {type === 'add' ? 'Add New Featured Item' : `Edit Featured Item`}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tagline Input */}
        <div>
          <label htmlFor="tagLine" className="block text-lg font-semibold text-gray-700 mb-2">Tagline</label>
          <input
            type="text"
            id="tagLine"
            name="tagLine"
            value={formData.tagLine}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="A catchy tagline for the featured item"
            required
            maxLength={250}
          />
        </div>

        {/* Expiry Date Input */}
        <div>
          <label htmlFor="expiryDate" className="block text-lg font-semibold text-gray-700 mb-2">Expiry Date</label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Image Upload */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ImageIcon className="w-5 h-5 mr-2" /> Featured Image</h3>
          <input
            type="file"
            id="imageFile"
            name="imageFile"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required={type === 'add' && !formData.img} // Required only for adding new item if no existing img
          />
          {formData.imageFile && (
            <p className="text-xs text-gray-500 mt-1">New file selected: {formData.imageFile.name}</p>
          )}

          {/* Image Preview and Remove Button */}
          {(formData.img || formData.imageFile) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Image Preview:</p>
              <img
                src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.img}
                alt="Featured Image Preview"
                className="w-full max-h-64 object-contain rounded-md border border-gray-300"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x150/cccccc/333333?text=Image+Load+Error"; }}
              />
              {formData.img && ( // Show remove button if there's an image URL
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 text-red-600 hover:underline text-sm flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1" /> Remove Current Image
                </button>
              )}
            </div>
          )}
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          {type === 'edit' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-300"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-8 py-3 bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:bg-blue-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : (type === 'add' ? <PlusCircle className="mr-2" size={20} /> : <Edit className="mr-2" size={20} />)}
            {formLoading ? (type === 'add' ? 'Adding...' : 'Updating...') : (type === 'add' ? 'Add Featured' : 'Update Featured')}
          </button>
        </div>
      </form>
    </div>
  );
};
