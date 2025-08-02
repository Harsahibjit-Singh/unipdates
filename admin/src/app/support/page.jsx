// app/support/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext'; // Assuming you have an AdminAuthContext

import {
  LifeBuoy, // Main icon for support
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
  ClipboardCheck, // For in-progress
  XCircle, // For closed
  Clock, // For open
  Globe, // For global type
  University, // For college type
  User, // For user info
  Mail, // For email
  Tag, // For subject
  MessageSquare, // For message
  UserCheck, // For assigned to
} from 'lucide-react';

// Recharts imports for data visualization
import {
  Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const SupportPage = () => {
  const router = useRouter();
  const { isAdminAuthenticated, loading: authLoading, isSuperadmin, adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('view-tickets'); // 'view-tickets', 'analytics', 'edit-ticket'
  const [supportTickets, setSupportTickets] = useState([]); // All support tickets fetched from API
  const [colleges, setColleges] = useState([]); // List of colleges for filtering/dropdowns (for Superadmin)
  const [adminUsers, setAdminUsers] = useState([]); // List of admin users for assigning tickets (for Superadmin)
  const [selectedTicket, setSelectedTicket] = useState(null); // For edit form

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all', 'open', 'in-progress', 'closed'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all'); // 'all', 'global', 'college'
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState(''); // For superadmin to filter by college
  const [selectedAssignedToFilter, setSelectedAssignedToFilter] = useState('all'); // For superadmin to filter by assigned admin

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
    if (!accessToken || !isSuperadmin) return;
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

  // Fetch admin users for Superadmin assignment dropdown
  const fetchAdminUsers = useCallback(async () => {
    if (!accessToken || !isSuperadmin) return; // Only superadmin needs to see all admins
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      const response = await fetch('/api/admin/data/admin-users', { headers }); // Assuming this API exists
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch admin users.');
      }
      const data = await response.json();
      setAdminUsers(data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      showMessage('Failed to load admin users for assignment.', 'error');
    }
  }, [accessToken, isSuperadmin, showMessage]);

  // Fetch support tickets
  const fetchSupportTickets = useCallback(async () => {
    if (!accessToken || !adminUser) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      let apiUrl = '/api/admin/data/support';

      // Superadmin can filter by college or assignedTo via query params.
      // Uniadmin's college filter is handled by backend middleware.
      const queryParams = new URLSearchParams();
      if (isSuperadmin) {
        if (selectedCollegeFilter) {
          queryParams.append('collegeId', selectedCollegeFilter);
        }
        if (selectedAssignedToFilter !== 'all') {
          queryParams.append('assignedToId', selectedAssignedToFilter);
        }
      }
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch support tickets.');
      }
      const data = await response.json();
      setSupportTickets(data);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err.message || 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, adminUser, isSuperadmin, selectedCollegeFilter, selectedAssignedToFilter]);

  // Initial data fetch on component mount
  useEffect(() => {
    if (isAdminAuthenticated && adminUser) {
      fetchSupportTickets();
      if (isSuperadmin) {
        fetchColleges();
        fetchAdminUsers();
      }
    }
  }, [isAdminAuthenticated, adminUser, isSuperadmin, fetchSupportTickets, fetchColleges, fetchAdminUsers]);

  // Memoized filtered list of tickets based on current filters (client-side filtering for status/type/search)
  const filteredSupportTickets = useMemo(() => {
    let currentTickets = supportTickets;

    if (selectedStatusFilter !== 'all') {
      currentTickets = currentTickets.filter(ticket => ticket.status === selectedStatusFilter);
    }

    if (selectedTypeFilter !== 'all') {
      currentTickets = currentTickets.filter(ticket => ticket.relatedWith === selectedTypeFilter);
    }

    // College and AssignedTo filters are primarily handled by the backend for Superadmin
    // For Uniadmin, their college is already filtered by the backend.

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      currentTickets = currentTickets.filter(ticket =>
        ticket.subject.toLowerCase().includes(lowercasedQuery) ||
        ticket.message.toLowerCase().includes(lowercasedQuery) ||
        (ticket.userId?.name && ticket.userId.name.toLowerCase().includes(lowercasedQuery)) ||
        (ticket.userId?.username && ticket.userId.username.toLowerCase().includes(lowercasedQuery)) ||
        (ticket.userId?.email && ticket.userId.email.toLowerCase().includes(lowercasedQuery)) ||
        (ticket.college?.name && ticket.college.name.toLowerCase().includes(lowercasedQuery)) ||
        (ticket.assignedTo?.name && ticket.assignedTo.name.toLowerCase().includes(lowercasedQuery))
      );
    }
    return currentTickets;
  }, [supportTickets, searchQuery, selectedStatusFilter, selectedTypeFilter]);


  // Handler for editing a ticket
  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('edit-ticket');
  };

  // Handler for deleting a ticket
  const handleDeleteTicket = async (id) => {
    if (!confirm('Are you sure you want to delete this support ticket? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/support/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete support ticket.');
      }
      showMessage('Support ticket deleted successfully!');
      fetchSupportTickets(); // Refresh list after deletion
    } catch (err) {
      console.error('Delete Support Ticket error:', err);
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
        Support Tickets Management
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
        <TabButton active={activeTab === 'view-tickets'} onClick={() => setActiveTab('view-tickets')}>
          <Eye className="w-5 h-5 mr-2" /> View Tickets
        </TabButton>
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          <BarChart className="w-5 h-5 mr-2" /> Analytics
        </TabButton>
        {activeTab === 'edit-ticket' && ( // Show "Edit Ticket" tab only when actively editing
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Edit Ticket
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
          {activeTab === 'view-tickets' && (
            <ViewSupportTickets
              supportTickets={filteredSupportTickets} // Pass filtered tickets for display
              colleges={colleges}
              adminUsers={adminUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              selectedTypeFilter={selectedTypeFilter}
              setSelectedTypeFilter={setSelectedTypeFilter}
              selectedCollegeFilter={selectedCollegeFilter}
              setSelectedCollegeFilter={setSelectedCollegeFilter}
              selectedAssignedToFilter={selectedAssignedToFilter}
              setSelectedAssignedToFilter={setSelectedAssignedToFilter}
              isSuperadmin={isSuperadmin}
              handleEditTicket={handleEditTicket}
              handleDeleteTicket={handleDeleteTicket}
              allSupportTickets={supportTickets} // Pass all tickets for specific download options (unfiltered)
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              supportTickets={supportTickets} // Analytics uses all fetched tickets (unfiltered)
              colleges={colleges}
              adminUsers={adminUsers}
              isSuperadmin={isSuperadmin}
              adminUser={adminUser}
            />
          )}
          {activeTab === 'edit-ticket' && selectedTicket && (
            <SupportTicketForm
              ticket={selectedTicket}
              showMessage={showMessage}
              refreshData={fetchSupportTickets} // Callback to re-fetch tickets after update
              onCancel={() => setActiveTab('view-tickets')} // Callback to go back to view tab
              adminUsers={adminUsers} // Pass for assignment dropdown
              currentAdminUser={adminUser} // Pass current admin for role-based assignment
              isSuperadmin={isSuperadmin}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SupportPage;

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
    // Define CSV headers based on SupportSchema fields and populated fields
    const headers = [
      "Ticket ID", "User Name", "User Email", "Subject", "Message", "Related With",
      "College Name", "College Code", "Status", "Assigned To (Admin Name)",
      "Last Admin Reply", "Last Admin Reply At", "Created At", "Updated At"
    ];
    // Map ticket objects to CSV rows, handling potential nulls/undefineds from population
    const rows = data.map(ticket => [
      ticket._id,
      ticket.userId?.name || 'N/A',
      ticket.userId?.email || 'N/A',
      `"${String(ticket.subject).replace(/"/g, '""')}"`, // Escape quotes in subject
      `"${String(ticket.message).replace(/"/g, '""')}"`, // Escape quotes in message
      ticket.relatedWith,
      ticket.college?.name || 'N/A',
      ticket.college?.code || 'N/A',
      ticket.status,
      ticket.assignedTo?.name || 'N/A',
      `"${String(ticket.lastAdminReply || 'N/A').replace(/"/g, '""')}"`,
      ticket.lastAdminReplyAt ? new Date(ticket.lastAdminReplyAt).toLocaleString() : 'N/A',
      new Date(ticket.createdAt).toLocaleDateString(),
      new Date(ticket.updatedAt).toLocaleDateString(),
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


// --- ViewSupportTickets Component ---
const ViewSupportTickets = ({
  supportTickets, // This is already the filtered list for display
  colleges,
  adminUsers,
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedTypeFilter,
  setSelectedTypeFilter,
  selectedCollegeFilter,
  setSelectedCollegeFilter,
  selectedAssignedToFilter,
  setSelectedAssignedToFilter,
  isSuperadmin,
  handleEditTicket,
  handleDeleteTicket,
  allSupportTickets // All tickets (unfiltered) for specific download options
}) => {

  // Function to download all tickets data (unfiltered)
  const handleDownloadAllTickets = (type) => {
    downloadData(allSupportTickets, `all_support_tickets_data.${type}`, type);
  };

  // Function to download only open tickets data
  const handleDownloadOpenTickets = (type) => {
    const openTickets = allSupportTickets.filter(ticket => ticket.status === 'open');
    downloadData(openTickets, `open_support_tickets_data.${type}`, type);
  };

  // Function to download only in-progress tickets data
  const handleDownloadInProgressTickets = (type) => {
    const inProgressTickets = allSupportTickets.filter(ticket => ticket.status === 'in-progress');
    downloadData(inProgressTickets, `in_progress_support_tickets_data.${type}`, type);
  };

  // Function to download only closed tickets data
  const handleDownloadClosedTickets = (type) => {
    const closedTickets = allSupportTickets.filter(ticket => ticket.status === 'closed');
    downloadData(closedTickets, `closed_support_tickets_data.${type}`, type);
  };

  // Function to download the currently filtered data displayed in the table
  const handleDownloadFilteredData = (type) => {
    downloadData(supportTickets, `filtered_support_tickets_data.${type}`, type);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <LifeBuoy className="w-7 h-7 mr-3 text-purple-600" /> All Support Tickets
      </h2>

      {/* Search and Filter Inputs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject, message, user, college, or admin..."
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
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
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
        {isSuperadmin && ( // Only superadmin can filter by assigned admin
          <div>
            <select
              value={selectedAssignedToFilter}
              onChange={(e) => setSelectedAssignedToFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
            >
              <option value="all">All Assigned To</option>
              <option value="unassigned">Unassigned</option>
              {adminUsers.map(admin => (
                <option key={admin._id} value={admin._id}>{admin.name}</option>
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
        {/* Download all tickets data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadAllTickets('csv')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            title="Download all support tickets as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> All Tickets CSV
          </button>
          <button
            onClick={() => handleDownloadAllTickets('json')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 transition-colors duration-200 flex items-center"
            title="Download all support tickets as JSON"
          >
            <Download className="w-5 h-5 mr-2" /> All Tickets JSON
          </button>
        </div>
        {/* Download specific status tickets data */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadOpenTickets('csv')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
            title="Download open support tickets as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Open CSV
          </button>
          <button
            onClick={() => handleDownloadInProgressTickets('csv')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
            title="Download in-progress support tickets as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> In Progress CSV
          </button>
          <button
            onClick={() => handleDownloadClosedTickets('csv')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center"
            title="Download closed support tickets as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Closed CSV
          </button>
        </div>
      </div>

      {/* Support Ticket Table Display */}
      {supportTickets.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchQuery || selectedStatusFilter !== 'all' || selectedTypeFilter !== 'all' || selectedCollegeFilter || selectedAssignedToFilter !== 'all' ? `No support tickets found matching your criteria.` : 'No support tickets received yet.'}
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
                  Subject / Message
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / College
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status / Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supportTickets.map(ticket => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-500" /> {ticket.userId?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-blue-600 hover:underline flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-blue-400" /> <a href={`mailto:${ticket.userId?.email}`}>{ticket.userId?.email || 'N/A'}</a>
                    </div>
                    <div className="text-xs text-gray-500">@{ticket.userId?.username || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs text-sm">
                    <div className="font-medium text-gray-900 flex items-center mb-1">
                      <Tag className="w-4 h-4 mr-1 text-purple-500" /> {ticket.subject}
                    </div>
                    <div className="text-gray-700 text-xs truncate" title={ticket.message}>
                      <MessageSquare className="w-4 h-4 mr-1 inline-block text-gray-400" /> {ticket.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {ticket.relatedWith === 'global' ? (
                        <Globe className="w-4 h-4 mr-1 text-indigo-500" />
                      ) : (
                        <University className="w-4 h-4 mr-1 text-green-500" />
                      )}
                      {ticket.relatedWith.charAt(0).toUpperCase() + ticket.relatedWith.slice(1)}
                    </div>
                    {ticket.relatedWith === 'college' && (
                      <div className="text-xs text-gray-500">
                        {ticket.college?.name || 'Unknown College'} ({ticket.college?.code || 'N/A'})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <div className="text-xs text-gray-600 mt-1 flex items-center">
                      <UserCheck className="w-4 h-4 mr-1 text-gray-500" />
                      Assigned to: {ticket.assignedTo?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    <div className="text-xs">({new Date(ticket.createdAt).toLocaleTimeString()})</div>
                    {ticket.lastAdminReplyAt && (
                      <>
                        <div className="text-xs text-gray-600 mt-1">Last Reply: {new Date(ticket.lastAdminReplyAt).toLocaleDateString()}</div>
                        <div className="text-xs">({new Date(ticket.lastAdminReplyAt).toLocaleTimeString()})</div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="Edit Support Ticket"
                    >
                      <Edit className="w-5 h-5 inline-block" />
                    </button>
                    {isSuperadmin && ( // Only superadmin can delete
                      <button
                        onClick={() => handleDeleteTicket(ticket._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Support Ticket"
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

// --- SupportTicketForm Component (for editing status, assignment, reply) ---
const SupportTicketForm = ({ ticket, showMessage, refreshData, onCancel, adminUsers, currentAdminUser, isSuperadmin }) => {
  const [formData, setFormData] = useState({
    status: ticket.status || 'open',
    assignedTo: ticket.assignedTo?._id || '', // Store ID for dropdown
    lastAdminReply: ticket.lastAdminReply || '',
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
      const payload = { ...formData };

      // If assignedTo is empty string, set to null for Mongoose
      if (payload.assignedTo === '') {
        payload.assignedTo = null;
      }

      // If lastAdminReply is empty string, set to null for Mongoose
      if (payload.lastAdminReply === '') {
        payload.lastAdminReply = null;
      }

      const response = await fetch(`/api/admin/data/support/${ticket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to update support ticket.`);
      }

      showMessage(`Support ticket ${ticket._id} updated successfully!`);
      refreshData(); // Re-fetch all tickets to update the table
      onCancel(); // Go back to the view tickets tab
    } catch (err) {
      console.error('Update Support Ticket error:', err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter admin users for the dropdown based on role
  const assignableAdmins = useMemo(() => {
    if (isSuperadmin) {
      return adminUsers; // Superadmin can assign to any admin
    } else if (currentAdminUser?.role === 'uniadmin') {
      // Uniadmin can only assign to themselves
      return adminUsers.filter(admin => admin._id === currentAdminUser._id);
    }
    return [];
  }, [adminUsers, isSuperadmin, currentAdminUser]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <Edit className="w-7 h-7 mr-3 text-purple-600" /> Edit Ticket: {ticket.subject}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Read-Only Ticket Details */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">From User:</p>
          <p className="text-md text-gray-900 flex items-center mb-1"><User className="w-4 h-4 mr-1 text-gray-600" /> {ticket.userId?.name} (@{ticket.userId?.username})</p>
          <p className="text-md text-blue-600 flex items-center"><Mail className="w-4 h-4 mr-1 text-blue-400" /> {ticket.userId?.email}</p>

          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Subject:</p>
          <p className="text-gray-800 bg-white p-3 rounded-md border border-gray-300">{ticket.subject}</p>

          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Message:</p>
          <p className="text-gray-800 bg-white p-3 rounded-md border border-gray-300 max-h-40 overflow-y-auto">{ticket.message}</p>

          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Related With:</p>
          <p className="text-gray-800 flex items-center">
            {ticket.relatedWith === 'global' ? (
              <Globe className="w-4 h-4 mr-1 text-indigo-500" />
            ) : (
              <University className="w-4 h-4 mr-1 text-green-500" />
            )}
            {ticket.relatedWith.charAt(0).toUpperCase() + ticket.relatedWith.slice(1)}
            {ticket.relatedWith === 'college' && ` (${ticket.college?.name || 'Unknown'})`}
          </p>
          <p className="text-xs text-gray-500 mt-3">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
          {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
            <p className="text-xs text-gray-500">Last Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
          )}
          {ticket.lastAdminReplyAt && (
            <p className="text-xs text-gray-500">Last Admin Reply At: {new Date(ticket.lastAdminReplyAt).toLocaleString()}</p>
          )}
        </div>

        {/* Editable Fields */}
        <div>
          <label htmlFor="status" className="block text-lg font-semibold text-gray-700 mb-2">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-lg font-semibold text-gray-700 mb-2">Assign To</label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={!isSuperadmin && currentAdminUser?._id !== formData.assignedTo} // Uniadmin can only assign to self
          >
            <option value="">Unassigned</option>
            {assignableAdmins.map(admin => (
              <option key={admin._id} value={admin._id}>{admin.name} ({admin.username})</option>
            ))}
          </select>
          {!isSuperadmin && currentAdminUser?.role === 'uniadmin' && (
            <p className="text-sm text-gray-500 mt-1">As a Uniadmin, you can only assign tickets to yourself.</p>
          )}
        </div>

        <div>
          <label htmlFor="lastAdminReply" className="block text-lg font-semibold text-gray-700 mb-2">Last Admin Reply</label>
          <textarea
            id="lastAdminReply"
            name="lastAdminReply"
            value={formData.lastAdminReply}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Add your reply here..."
            maxLength="1000"
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">This will update the "Last Admin Reply" field and timestamp.</p>
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
            {formLoading ? 'Updating...' : 'Update Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- AnalyticsDashboard Component ---
const AnalyticsDashboard = ({ supportTickets, colleges, adminUsers, isSuperadmin, adminUser }) => {
  // Filter tickets based on admin role for analytics
  const relevantTickets = useMemo(() => {
    if (isSuperadmin) {
      return supportTickets;
    } else if (adminUser?.role === 'uniadmin' && adminUser?.college) {
      return supportTickets.filter(t => t.relatedWith === 'college' && t.college?._id === adminUser.college);
    }
    return [];
  }, [supportTickets, isSuperadmin, adminUser]);

  // Data for "Support Ticket Status Distribution" chart
  const ticketStatusData = useMemo(() => {
    const openCount = relevantTickets.filter(t => t.status === 'open').length;
    const inProgressCount = relevantTickets.filter(t => t.status === 'in-progress').length;
    const closedCount = relevantTickets.filter(t => t.status === 'closed').length;
    return [
      { name: 'Open', value: openCount },
      { name: 'In Progress', value: inProgressCount },
      { name: 'Closed', value: closedCount },
    ].filter(item => item.value > 0);
  }, [relevantTickets]);

  // Data for "Support Tickets by Type" chart
  const ticketsByTypeData = useMemo(() => {
    const globalCount = relevantTickets.filter(t => t.relatedWith === 'global').length;
    const collegeCount = relevantTickets.filter(t => t.relatedWith === 'college').length;
    return [
      { name: 'Global', value: globalCount },
      { name: 'College-Related', value: collegeCount },
    ].filter(item => item.value > 0);
  }, [relevantTickets]);

  // Data for "Support Tickets by College" chart (only for college-related tickets)
  const contactsByCollegeData = useMemo(() => {
    const counts = {};
    relevantTickets.filter(t => t.relatedWith === 'college' && t.college?.name).forEach(t => {
      const collegeName = t.college.name;
      counts[collegeName] = (counts[collegeName] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({
      name: name,
      tickets: counts[name]
    })).sort((a, b) => b.tickets - a.tickets);
  }, [relevantTickets]);

  // Data for "Support Tickets Over Time" chart (by creation date)
  const ticketsOverTimeData = useMemo(() => {
    const monthlyCounts = {};
    relevantTickets.forEach(ticket => {
      const date = new Date(ticket.createdAt);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
    });
    const sortedData = Object.keys(monthlyCounts).sort().map(month => ({
      date: month,
      requests: monthlyCounts[month]
    }));
    return sortedData;
  }, [relevantTickets]);

  // Data for "Tickets Assigned To Admins" chart
  const ticketsAssignedToAdminsData = useMemo(() => {
    const counts = {};
    relevantTickets.forEach(ticket => {
      const adminName = ticket.assignedTo?.name || 'Unassigned';
      counts[adminName] = (counts[adminName] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({
      name: name,
      tickets: counts[name]
    })).sort((a, b) => b.tickets - a.tickets);
  }, [relevantTickets]);


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A6', '#8A2BE2', '#DC143C']; // Colors for pie charts

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <BarChart className="w-7 h-7 mr-3 text-purple-600" /> Support Analytics Dashboard
      </h2>

      {relevantTickets.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No support ticket data available for analytics based on your role.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Support Ticket Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Support Ticket Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Support Tickets by Type */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Support Tickets by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={ticketsByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#82ca9d"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {ticketsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Support Tickets by College (only if relevant tickets exist for colleges) */}
          {contactsByCollegeData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Support Tickets by College</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={contactsByCollegeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#ffc658" name="Number of Tickets" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 4: Support Tickets Over Time */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Support Ticket Requests Over Time (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={ticketsOverTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Total Requests" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5: Tickets Assigned To Admins */}
          {ticketsAssignedToAdminsData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Tickets Assigned To Admins</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={ticketsAssignedToAdminsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#4CAF50" name="Number of Tickets" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
