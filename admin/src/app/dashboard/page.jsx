// app/dashboard/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react'; // Added useMemo here
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Link from 'next/link';
import {
  Bell,
  PlusCircle,
  Users,
  Building2,
  BookText,
  Briefcase,
  Globe,
  University,
  Mail,
  LifeBuoy,
  Loader2,
  AlertCircle,
  CheckCircle,
  CircleDot,
  ArrowRight,
  ClipboardList,
  MessageSquare, // New icon for orders
  RefreshCw, // New icon for refresh
  Image as ImageIcon, // Icon for Featured
  ChevronLeft, // For carousel navigation
  ChevronRight, // For carousel navigation
} from 'lucide-react';

const DashboardPage = () => {
  const router = useRouter();
  const { adminUser, isAdminAuthenticated, loading: authLoading, isSuperadmin, isUniadmin } = useAdminAuth();

  const [notifications, setNotifications] = useState({
    globalSupport: 0,
    uniSupport: 0,
    globalContact: 0,
    uniContact: 0,
    uniName: '',
  });

  const [updates, setUpdates] = useState({
    globalUpdates: [],
    uniUpdates: [],
    internships: [],
    uniadminOrders: [],
  });

  // NEW STATE for Featured Items
  const [featuredItems, setFeaturedItems] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdminAuthenticated) {
      router.push('/'); // Corrected redirect path for admin login
    }
  }, [isAdminAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!isAdminAuthenticated || !adminUser) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`,
      };

      // --- Fetch Notifications ---
      const [contactsRes, supportRes, featuredRes] = await Promise.all([ // Added featuredRes
        fetch('/api/admin/data/contacts', { headers }),
        fetch('/api/admin/data/support', { headers }),
        fetch('/api/admin/data/featured', { headers }), // Fetch featured items
      ]);

      if (!contactsRes.ok || !supportRes.ok || !featuredRes.ok) { // Check featuredRes too
        throw new Error('Failed to fetch dashboard data (notifications or featured items).');
      }

      const contactsData = await contactsRes.json();
      const supportData = await supportRes.json();
      const featuredData = await featuredRes.json(); // Parse featured data

      let globalSupportCount = 0;
      let uniSupportCount = 0;
      let globalContactCount = 0;
      let uniContactCount = 0;
      let currentUniName = '';
      let currentUniadminOrders = [];

      if (isSuperadmin) {
        globalSupportCount = supportData.filter(s => s.relatedWith === 'global' && s.status === 'open').length;
        uniSupportCount = supportData.filter(s => s.relatedWith === 'college' && s.status === 'open').length;
        globalContactCount = contactsData.filter(c => c.relatedWith === 'global' && c.status === 'pending').length;
        uniContactCount = contactsData.filter(c => c.relatedWith === 'college' && c.status === 'pending').length;
      } else if (isUniadmin) {
        uniSupportCount = supportData.filter(s => s.status === 'open').length;
        uniContactCount = contactsData.filter(c => c.status === 'pending').length;

        if (adminUser.college) {
          const collegeRes = await fetch(`/api/admin/data/colleges/${adminUser.college}`, { headers });
          if (collegeRes.ok) {
            const collegeData = await collegeRes.json();
            currentUniName = collegeData.name;
          } else {
            console.warn("Failed to fetch uniadmin's college name.");
          }
        }
        const selfAdminRes = await fetch(`/api/admin/auth/me`, { headers });
        if (selfAdminRes.ok) {
          const selfAdminData = await selfAdminRes.json();
          currentUniadminOrders = selfAdminData.ordersfromsuperadmin || [];
        } else {
          console.warn("Failed to fetch uniadmin's own orders.");
        }
      }

      setNotifications({
        globalSupport: globalSupportCount,
        uniSupport: uniSupportCount,
        globalContact: globalContactCount,
        uniContact: uniContactCount,
        uniName: currentUniName,
      });

      setFeaturedItems(featuredData); // Set the fetched featured items

      // --- Fetch Content Data (Updates & Internships) ---
      const [uniUpdatesRes, globalUpdatesRes, internshipsRes] = await Promise.all([
        fetch('/api/admin/data/uni-updates', { headers }),
        isSuperadmin ? fetch('/api/admin/data/global-updates', { headers }) : Promise.resolve({ ok: true, json: async () => [] }),
        isSuperadmin ? fetch('/api/admin/data/internships', { headers }) : Promise.resolve({ ok: true, json: async () => [] }),
      ]);

      if (!uniUpdatesRes.ok || !globalUpdatesRes.ok || !internshipsRes.ok) {
        throw new Error('Failed to fetch content data.');
      }

      const uniUpdatesData = await uniUpdatesRes.json();
      const globalUpdatesData = await globalUpdatesRes.json();
      const internshipsData = await internshipsRes.json();

      setUpdates({
        globalUpdates: globalUpdatesData,
        uniUpdates: uniUpdatesData,
        internships: internshipsData,
        uniadminOrders: currentUniadminOrders,
      });

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setDataError(err.message || 'Failed to load dashboard data.');
    } finally {
      setDataLoading(false);
    }
  }, [isAdminAuthenticated, adminUser, isSuperadmin, isUniadmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="ml-4 text-xl text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  // Superadmin Dashboard
  if (isSuperadmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8 text-gray-800">
        <h1 className="text-5xl font-extrabold text-blue-800 mb-10 text-center drop-shadow-lg">
          Superadmin Dashboard
        </h1>

        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-3 text-lg text-gray-600">Fetching latest data...</p>
          </div>
        )}
        {dataError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 text-center shadow-md">
            <AlertCircle className="inline-block w-6 h-6 mr-2" />
            <span className="font-semibold">Error:</span> {dataError}
            <button onClick={fetchData} className="ml-4 text-blue-700 hover:underline">Retry</button>
          </div>
        )}

        {/* NEW: Featured Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
            <ImageIcon className="w-8 h-8 mr-3 text-purple-600" /> Featured Highlights
          </h2>
          <FeaturedDisplay items={featuredItems} />
        </section>

        {/* Notifications Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-purple-600" /> Notifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NotificationCard title="Global Support Tickets" count={notifications.globalSupport} icon={<LifeBuoy className="text-red-500" />} />
            <NotificationCard title="University Support Tickets" count={notifications.uniSupport} icon={<LifeBuoy className="text-orange-500" />} />
            <NotificationCard title="Global Contact Messages" count={notifications.globalContact} icon={<Mail className="text-green-500" />} />
            <NotificationCard title="University Contact Messages" count={notifications.uniContact} icon={<Mail className="text-teal-500" />} />
          </div>
        </section>

        {/* Interactive Options Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
            <PlusCircle className="w-8 h-8 mr-3 text-purple-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <DashboardLink href="/colleges?tab=add-college" icon={<Building2 />} text="Add New College" />
            <DashboardLink href="/colleges?tab=message-uniadmin" icon={<Users />} text="Message Admins" />
            <DashboardLink href="/notes" icon={<BookText />} text="Manage Notes" />
            <DashboardLink href="/internships" icon={<Briefcase />} text="Manage Internships" />
            <DashboardLink href="/uniupdates" icon={<University />} text="Manage University Updates" />
            <DashboardLink href="/publicusers" icon={<Users />} text="Manage Public Users" />
            <DashboardLink href="/contacts" icon={<Mail />} text="Manage Contacts" />
            <DashboardLink href="/support" icon={<LifeBuoy />} text="Manage Support" />
            <DashboardLink href="/featured" icon={<ImageIcon />} text="Manage Featured" /> {/* Link to Featured Page */}
          </div>
        </section>

        {/* Content Overview Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
            <ClipboardList className="w-8 h-8 mr-3 text-purple-600" /> Content Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ContentContainer
              title="All University Updates"
              icon={<University className="text-blue-600" />}
              data={updates.uniUpdates}
              renderItem={(item) => (
                <div key={item._id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-semibold text-lg text-gray-900">{item.mainHeading}</h3>
                  <p className="text-sm text-gray-600">College ID: {item.uniId}</p>
                  <p className="text-xs text-gray-500">Published: {new Date(item.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
              emptyMessage="No university updates found."
            />

            <ContentContainer
              title="All Global Updates"
              icon={<Globe className="text-green-600" />}
              data={updates.globalUpdates}
              renderItem={(item) => (
                <div key={item._id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-semibold text-lg text-gray-900">{item.mainHeading}</h3>
                  <p className="text-xs text-gray-500">Published: {new Date(item.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
              emptyMessage="No global updates found."
            />

            <ContentContainer
              title="All Internships"
              icon={<Briefcase className="text-orange-600" />}
              data={updates.internships}
              renderItem={(item) => (
                <div key={item._id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-semibold text-lg text-gray-900">{item.mainHeading}</h3>
                  <p className="text-sm text-gray-600">{item.shortDescription}</p>
                  <p className="text-xs text-gray-500">Posted: {new Date(item.postedAt).toLocaleDateString()}</p>
                </div>
              )}
              emptyMessage="No internships found."
            />
          </div>
        </section>
      </div>
    );
  }

  // Uniadmin Dashboard
  if (isUniadmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 p-8 text-gray-800">
        <h1 className="text-5xl font-extrabold text-green-800 mb-10 text-center drop-shadow-lg">
          Uniadmin Dashboard {notifications.uniName ? `(${notifications.uniName})` : ''}
        </h1>

        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="ml-3 text-lg text-gray-600">Fetching latest data...</p>
          </div>
        )}
        {dataError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 text-center shadow-md">
            <AlertCircle className="inline-block w-6 h-6 mr-2" />
            <span className="font-semibold">Error:</span> {dataError}
            <button onClick={fetchData} className="ml-4 text-green-700 hover:underline">Retry</button>
          </div>
        )}

        {/* NEW: Featured Section for Uniadmin */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
            <ImageIcon className="w-8 h-8 mr-3 text-green-600" /> Featured Highlights
          </h2>
          <FeaturedDisplay items={featuredItems} />
        </section>

        {/* Refresh Button for Uniadmin */}
        <div className="flex justify-end mb-6">
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
            disabled={dataLoading}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            {dataLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Notifications Section for Uniadmin */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-green-600" /> Notifications for {notifications.uniName || 'Your College'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NotificationCard title="Support Tickets" count={notifications.uniSupport} icon={<LifeBuoy className="text-orange-500" />} />
            <NotificationCard title="Contact Messages" count={notifications.uniContact} icon={<Mail className="text-teal-500" />} />
          </div>
        </section>

        {/* Uniadmin Orders Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-green-600" /> Orders from Superadmin
          </h2>
          <ContentContainer
            title="" // Title is in h2 above
            icon={null}
            data={updates.uniadminOrders}
            renderItem={(item, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-lg text-gray-900 font-semibold">{item.message}</p>
                <p className="text-xs text-gray-500 mt-1">Sent: {new Date(item.sentAt).toLocaleString()}</p>
              </div>
            )}
            emptyMessage="No new orders from Superadmin."
          />
        </section>


        {/* Interactive Options for Uniadmin */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
            <PlusCircle className="w-8 h-8 mr-3 text-green-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardLink href="/uni-updates" icon={<University />} text="Manage University Updates" />
            <DashboardLink href="/contacts" icon={<Mail />} text="Manage Contacts" />
            <DashboardLink href="/support" icon={<LifeBuoy />} text="Manage Support" />
          </div>
        </section>

        {/* Uni Updates Container for Uniadmin */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
            <ClipboardList className="w-8 h-8 mr-3 text-green-600" /> University Updates Overview
          </h2>
          <ContentContainer
            title={`Updates for ${notifications.uniName || 'Your College'}`}
            icon={<University className="text-blue-600" />}
            data={updates.uniUpdates}
            renderItem={(item) => (
              <div key={item._id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="font-semibold text-lg text-gray-900">{item.mainHeading}</h3>
                <p className="text-xs text-gray-500">Published: {new Date(item.publishedAt).toLocaleDateString()}</p>
              </div>
            )}
            emptyMessage={`No updates found for ${notifications.uniName || 'your college'}.`}
          />
        </section>
      </div>
    );
  }

  return null;
};

export default DashboardPage;

// --- Helper Components ---

const NotificationCard = ({ title, count, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-100">
    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
      {icon || <Bell className="w-6 h-6" />}
    </div>
    <div>
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 mt-1">{count}</p>
    </div>
  </div>
);

const DashboardLink = ({ href, icon, text }) => (
  <Link
    href={href}
    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg text-center transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-100 group"
  >
    <div className="p-3 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
      {icon && React.cloneElement(icon, { className: "w-8 h-8" })}
    </div>
    <span className="mt-4 text-lg font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
      {text}
    </span>
    <ArrowRight className="w-5 h-5 mt-2 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
  </Link>
);

const ContentContainer = ({ title, icon, data, renderItem, emptyMessage }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
      {icon && React.cloneElement(icon, { className: "w-7 h-7 mr-2" })}
      {title}
    </h3>
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
      {data && data.length > 0 ? (
        data.map(renderItem)
      ) : (
        <p className="text-gray-500 italic text-center py-8">{emptyMessage}</p>
      )}
    </div>
    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `}</style>
  </div>
);

// NEW: FeaturedDisplay Component
const FeaturedDisplay = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out expired items and sort by expiryDate (soonest first)
  const activeItems = useMemo(() => {
    const now = new Date();
    // Ensure items is an array before filtering
    if (!Array.isArray(items)) {
      console.warn("FeaturedDisplay received non-array items:", items);
      return [];
    }
    return items
      .filter(item => new Date(item.expiryDate) > now)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [items]); // Dependency array includes items

  // Automatic carousel rotation
  useEffect(() => {
    if (activeItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % activeItems.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeItems]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + activeItems.length) % activeItems.length);
  };

  if (activeItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500 italic border border-gray-100">
        No active featured items to display.
      </div>
    );
  }

  const currentItem = activeItems[currentIndex];

  return (
    <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="relative w-full h-96"> {/* Fixed height for the carousel */}
        <img
          src={currentItem.img}
          alt={currentItem.tagLine}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/1200x384/cccccc/333333?text=Image+Error"; }}
        />
        <div className="absolute inset-0 bg-opacity-40 flex items-end p-8">
          <div className="text-white">
            <h3 className="text-4xl font-extrabold drop-shadow-lg">{currentItem.tagLine}</h3>
            <p className="text-lg mt-2 text-blue-100">
              Expires: {new Date(currentItem.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        {activeItems.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75 transition-colors duration-200 focus:outline-none"
              aria-label="Previous featured item"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75 transition-colors duration-200 focus:outline-none"
              aria-label="Next featured item"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
