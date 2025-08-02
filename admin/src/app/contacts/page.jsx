// app/contacts/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext'; // Assuming you have an AdminAuthContext

import {
  MessageSquare, // Main icon for contacts
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
  CheckCircle2, // For resolved status
  Clock, // For pending status
  Globe, // For global type
  University, // For college type
  User, // For user info
  Mail, // For email
} from 'lucide-react';

// Recharts imports for data visualization
import {
  Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const ContactPage = () => {
  const router = useRouter();
  const { isAdminAuthenticated, loading: authLoading, isSuperadmin, adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('view-contacts'); // 'view-contacts', 'analytics', 'edit-contact'
  const [contacts, setContacts] = useState([]); // All contacts fetched from API
  const [colleges, setColleges] = useState([]); // List of colleges for filtering/dropdowns (for Superadmin)
  const [selectedContact, setSelectedContact] = useState(null); // For edit form

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all', 'pending', 'resolved'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all'); // 'all', 'global', 'college'
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState(''); // For superadmin to filter by college

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

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!authLoading && (!isAdminAuthenticated || (!isSuperadmin && adminUser?.role !== 'uniadmin'))) {
      router.push('/');
    }
  }, [isAdminAuthenticated, authLoading, isSuperadmin, adminUser, router]);

  // Fetch colleges for Superadmin filter/selection
  const fetchColleges = useCallback(async () => {
    if (!accessToken || !isSuperadmin) return; // Only superadmin needs this
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
  }, [accessToken, isSuperadmin, showMessage]);

  // Fetch contact requests
  const fetchContacts = useCallback(async () => {
    if (!accessToken || !adminUser) return; // Wait for adminUser to be loaded
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      let apiUrl = '/api/admin/data/contacts';

      // Uniadmin's college filter is handled by backend middleware.
      // Superadmin can filter by college via query param.
      if (isSuperadmin && selectedCollegeFilter) {
        apiUrl += `?collegeId=${selectedCollegeFilter}`; // Assuming backend supports collegeId query
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch contact requests.');
      }
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      console.error('Error fetching contact requests:', err);
      setError(err.message || 'Failed to load contact requests.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, adminUser, isSuperadmin, selectedCollegeFilter]);

  // Initial data fetch on component mount
  useEffect(() => {
    if (isAdminAuthenticated && adminUser) {
      fetchContacts();
      if (isSuperadmin) {
        fetchColleges(); // Fetch colleges only for superadmin
      }
    }
  }, [isAdminAuthenticated, adminUser, isSuperadmin, fetchContacts, fetchColleges]);

  // Memoized filtered list of contacts based on current filters
  const filteredContacts = useMemo(() => {
    let currentContacts = contacts;

    if (selectedStatusFilter !== 'all') {
      currentContacts = currentContacts.filter(contact => contact.status === selectedStatusFilter);
    }

    if (selectedTypeFilter !== 'all') {
      currentContacts = currentContacts.filter(contact => contact.relatedWith === selectedTypeFilter);
    }

    // Note: selectedCollegeFilter for superadmin is handled by fetchContacts API call.
    // For uniadmin, their college is already implicitly filtered by the backend.

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      currentContacts = currentContacts.filter(contact =>
        contact.message.toLowerCase().includes(lowercasedQuery) ||
        (contact.userId?.name && contact.userId.name.toLowerCase().includes(lowercasedQuery)) ||
        (contact.userId?.username && contact.userId.username.toLowerCase().includes(lowercasedQuery)) ||
        (contact.userId?.email && contact.userId.email.toLowerCase().includes(lowercasedQuery)) ||
        (contact.college?.name && contact.college.name.toLowerCase().includes(lowercasedQuery))
      );
    }
    return currentContacts;
  }, [contacts, searchQuery, selectedStatusFilter, selectedTypeFilter]);


  // Handler for editing a contact (specifically status)
  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setActiveTab('edit-contact');
  };

  // Handler for deleting a contact
  const handleDeleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact request? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete contact request.');
      }
      showMessage('Contact request deleted successfully!');
      fetchContacts(); // Refresh list after deletion
    } catch (err) {
      console.error('Delete Contact error:', err);
      showMessage(err.message || 'An error occurred during deletion.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Display loading spinner while authenticating or fetching initial data
  if (authLoading || !isAdminAuthenticated || (!isSuperadmin && adminUser?.role !== 'uniadmin')) {
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
        Contact Requests Management
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
        <TabButton active={activeTab === 'view-contacts'} onClick={() => setActiveTab('view-contacts')}>
          <Eye className="w-5 h-5 mr-2" /> View Requests
        </TabButton>
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          <BarChart className="w-5 h-5 mr-2" /> Analytics
        </TabButton>
        {activeTab === 'edit-contact' && ( // Show "Edit Contact" tab only when actively editing
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Edit Request
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
          {activeTab === 'view-contacts' && (
            <ViewContacts
              contacts={filteredContacts} // Pass filtered contacts for display
              colleges={colleges}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              selectedTypeFilter={selectedTypeFilter}
              setSelectedTypeFilter={setSelectedTypeFilter}
              selectedCollegeFilter={selectedCollegeFilter}
              setSelectedCollegeFilter={setSelectedCollegeFilter}
              isSuperadmin={isSuperadmin}
              handleEditContact={handleEditContact}
              handleDeleteContact={handleDeleteContact}
              allContacts={contacts} // Pass all contacts for specific download options (unfiltered)
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              contacts={contacts} // Analytics uses all fetched contacts (unfiltered)
              colleges={colleges}
              isSuperadmin={isSuperadmin}
              adminUser={adminUser}
            />
          )}
          {activeTab === 'edit-contact' && selectedContact && (
            <ContactForm
              contact={selectedContact}
              showMessage={showMessage}
              refreshData={fetchContacts} // Callback to re-fetch contacts after update
              onCancel={() => setActiveTab('view-contacts')} // Callback to go back to view tab
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ContactPage;

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
    // Define CSV headers based on ContactSchema fields and populated fields
    const headers = [
      "Contact ID", "User Name", "User Email", "Message", "Related With",
      "College Name", "College Code", "Status", "Resolved By (Admin ID)",
      "Resolved At", "Created At", "Updated At"
    ];
    // Map contact objects to CSV rows, handling potential nulls/undefineds from population
    const rows = data.map(contact => [
      contact._id,
      contact.userId?.name || 'N/A',
      contact.userId?.email || 'N/A',
      `"${String(contact.message).replace(/"/g, '""')}"`, // Escape quotes in message
      contact.relatedWith,
      contact.college?.name || 'N/A',
      contact.college?.code || 'N/A',
      contact.status,
      contact.resolvedBy || 'N/A', // Just the ID for now
      contact.resolvedAt ? new Date(contact.resolvedAt).toLocaleString() : 'N/A',
      new Date(contact.createdAt).toLocaleDateString(),
      new Date(contact.updatedAt).toLocaleDateString(),
    ]);

    // Combine headers and rows, ensuring proper CSV escaping for fields with commas/quotes
    content = headers.join(",") + "\n";
    rows.forEach(row => {
      content += row.join(",") + "\n"; // Rows are already escaped
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


// --- ViewContacts Component ---
const ViewContacts = ({
  contacts, // This is already the filtered list for display
  colleges,
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedTypeFilter,
  setSelectedTypeFilter,
  selectedCollegeFilter,
  setSelectedCollegeFilter,
  isSuperadmin,
  handleEditContact,
  handleDeleteContact,
  allContacts // All contacts (unfiltered) for specific download options
}) => {

  // Function to download all contacts data (unfiltered)
  const handleDownloadAllContacts = (type) => {
    downloadData(allContacts, `all_contact_requests_data.${type}`, type);
  };

  // Function to download only pending contacts data
  const handleDownloadPendingContacts = (type) => {
    const pendingContacts = allContacts.filter(contact => contact.status === 'pending');
    downloadData(pendingContacts, `pending_contact_requests_data.${type}`, type);
  };

  // Function to download only resolved contacts data
  const handleDownloadResolvedContacts = (type) => {
    const resolvedContacts = allContacts.filter(contact => contact.status === 'resolved');
    downloadData(resolvedContacts, `resolved_contact_requests_data.${type}`, type);
  };

  // Function to download the currently filtered data displayed in the table
  const handleDownloadFilteredData = (type) => {
    downloadData(contacts, `filtered_contact_requests_data.${type}`, type);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <MessageSquare className="w-7 h-7 mr-3 text-purple-600" /> All Contact Requests
      </h2>

      {/* Search and Filter Inputs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by message, user, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          />
        </div>
        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="all">All Types</option>
            <option value="global">Global</option>
            <option value="college">College-Related</option>
          </select>
        </div>
        {isSuperadmin && ( // Only superadmin can filter by college
          <div>
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => (
                <option key={college._id} value={college._id}>{college.name}</option>
              ))}
            </select>
          </div>
        )}
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
        {/* Download all contacts data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadAllContacts('csv')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            title="Download all contact requests as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> All Contacts CSV
          </button>
          <button
            onClick={() => handleDownloadAllContacts('json')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 transition-colors duration-200 flex items-center"
            title="Download all contact requests as JSON"
          >
            <Download className="w-5 h-5 mr-2" /> All Contacts JSON
          </button>
        </div>
        {/* Download pending/resolved contacts data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadPendingContacts('csv')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
            title="Download pending contact requests as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Pending CSV
          </button>
          <button
            onClick={() => handleDownloadResolvedContacts('csv')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
            title="Download resolved contact requests as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Resolved CSV
          </button>
        </div>
      </div>

      {/* Contact Table Display */}
      {contacts.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchQuery || selectedStatusFilter !== 'all' || selectedTypeFilter !== 'all' || selectedCollegeFilter ? `No contact requests found matching your criteria.` : 'No contact requests received yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / College
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map(contact => (
                <tr key={contact._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-500" /> {contact.userId?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-blue-600 hover:underline flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-blue-400" /> <a href={`mailto:${contact.userId?.email}`}>{contact.userId?.email || 'N/A'}</a>
                    </div>
                    <div className="text-xs text-gray-500">@{contact.userId?.username || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-900" title={contact.message}>
                    {contact.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {contact.relatedWith === 'global' ? (
                        <Globe className="w-4 h-4 mr-1 text-indigo-500" />
                      ) : (
                        <University className="w-4 h-4 mr-1 text-green-500" />
                      )}
                      {contact.relatedWith.charAt(0).toUpperCase() + contact.relatedWith.slice(1)}
                    </div>
                    {contact.relatedWith === 'college' && (
                      <div className="text-xs text-gray-500">
                        {contact.college?.name || 'Unknown College'} ({contact.college?.code || 'N/A'})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      contact.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                    <div className="text-xs">{new Date(contact.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="Edit Contact Status"
                    >
                      <Edit className="w-5 h-5 inline-block" />
                    </button>
                    {isSuperadmin && ( // Only superadmin can delete
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-5 h-5 inline-block" />
                      </button>
                    )}
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

// --- ContactForm Component (for editing status) ---
const ContactForm = ({ contact, showMessage, refreshData, onCancel }) => {
  const [formData, setFormData] = useState({
    status: contact.status || 'pending',
  });
  const [formLoading, setFormLoading] = useState(false);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { status: formData.status }; // Only status can be updated via this form

      const response = await fetch(`/api/admin/data/contacts/${contact._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to update contact status.`);
      }

      showMessage(`Contact request ${contact._id} status updated to ${formData.status}!`);
      refreshData(); // Re-fetch all contacts to update the table
      onCancel(); // Go back to the view contacts tab
    } catch (err) {
      console.error('Update Contact Status error:', err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <Edit className="w-7 h-7 mr-3 text-purple-600" /> Edit Contact Request
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Read-Only Contact Details */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">From User:</p>
          <p className="text-md text-gray-900 flex items-center mb-1"><User className="w-4 h-4 mr-1 text-gray-600" /> {contact.userId?.name} (@{contact.userId?.username})</p>
          <p className="text-md text-blue-600 flex items-center"><Mail className="w-4 h-4 mr-1 text-blue-400" /> {contact.userId?.email}</p>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Message:</p>
          <p className="text-gray-800 bg-white p-3 rounded-md border border-gray-300 max-h-40 overflow-y-auto">{contact.message}</p>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Related With:</p>
          <p className="text-gray-800 flex items-center">
            {contact.relatedWith === 'global' ? (
              <Globe className="w-4 h-4 mr-1 text-indigo-500" />
            ) : (
              <University className="w-4 h-4 mr-1 text-green-500" />
            )}
            {contact.relatedWith.charAt(0).toUpperCase() + contact.relatedWith.slice(1)}
            {contact.relatedWith === 'college' && ` (${contact.college?.name || 'Unknown'})`}
          </p>
          <p className="text-xs text-gray-500 mt-3">Received: {new Date(contact.createdAt).toLocaleString()}</p>
          {contact.status === 'resolved' && contact.resolvedAt && (
            <p className="text-xs text-gray-500">Resolved At: {new Date(contact.resolvedAt).toLocaleString()}</p>
          )}
          {contact.status === 'resolved' && contact.resolvedBy && (
            <p className="text-xs text-gray-500">Resolved By Admin ID: {contact.resolvedBy}</p>
          )}
        </div>

        {/* Status Selection */}
        <div>
          <label htmlFor="status" className="block text-lg font-semibold text-gray-700 mb-2">Update Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
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
            {formLoading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- AnalyticsDashboard Component ---
const AnalyticsDashboard = ({ contacts, colleges, isSuperadmin, adminUser }) => {
  // Filter contacts based on admin role for analytics
  const relevantContacts = useMemo(() => {
    if (isSuperadmin) {
      return contacts;
    } else if (adminUser?.role === 'uniadmin' && adminUser?.college) {
      return contacts.filter(c => c.relatedWith === 'college' && c.college?._id === adminUser.college);
    }
    return [];
  }, [contacts, isSuperadmin, adminUser]);

  // Data for "Contact Status Distribution" chart
  const contactStatusData = useMemo(() => {
    const pendingCount = relevantContacts.filter(c => c.status === 'pending').length;
    const resolvedCount = relevantContacts.filter(c => c.status === 'resolved').length;
    return [
      { name: 'Pending', value: pendingCount },
      { name: 'Resolved', value: resolvedCount },
    ].filter(item => item.value > 0);
  }, [relevantContacts]);

  // Data for "Contacts by Type" chart
  const contactsByTypeData = useMemo(() => {
    const globalCount = relevantContacts.filter(c => c.relatedWith === 'global').length;
    const collegeCount = relevantContacts.filter(c => c.relatedWith === 'college').length;
    return [
      { name: 'Global', value: globalCount },
      { name: 'College-Related', value: collegeCount },
    ].filter(item => item.value > 0);
  }, [relevantContacts]);

  // Data for "Contacts by College" chart (only for college-related contacts)
  const contactsByCollegeData = useMemo(() => {
    const counts = {};
    relevantContacts.filter(c => c.relatedWith === 'college' && c.college?.name).forEach(c => {
      const collegeName = c.college.name;
      counts[collegeName] = (counts[collegeName] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({
      name: name,
      contacts: counts[name]
    })).sort((a, b) => b.contacts - a.contacts);
  }, [relevantContacts]);

  // Data for "Contacts Over Time" chart (by creation date)
  const contactsOverTimeData = useMemo(() => {
    const monthlyCounts = {};
    relevantContacts.forEach(contact => {
      const date = new Date(contact.createdAt);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
    });
    const sortedData = Object.keys(monthlyCounts).sort().map(month => ({
      date: month,
      requests: monthlyCounts[month]
    }));
    return sortedData;
  }, [relevantContacts]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A6']; // Colors for pie charts

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <BarChart className="w-7 h-7 mr-3 text-purple-600" /> Contact Analytics Dashboard
      </h2>

      {relevantContacts.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No contact data available for analytics based on your role.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Contact Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={contactStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {contactStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Contacts by Type */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Contacts by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={contactsByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#82ca9d"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {contactsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Contacts by College (only if relevant contacts exist for colleges) */}
          {contactsByCollegeData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Contacts by College</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={contactsByCollegeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="contacts" fill="#ffc658" name="Number of Contacts" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 4: Contacts Over Time */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Requests Over Time (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={contactsOverTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Total Requests" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
