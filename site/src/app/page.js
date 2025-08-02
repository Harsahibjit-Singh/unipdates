"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Zap, BookOpen, Calendar, Briefcase, LifeBuoy, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// The useTheme import is not used in the provided code, so it will be commented out or removed if not needed elsewhere.
// import { useTheme } from "next-themes";


const HomePage = () => {
  const { user, isAuthenticated, accessToken, login, updateUserContext, loading: authLoading } = useAuth();
  const [allUpdates, setAllUpdates] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [errorAnnouncements, setErrorAnnouncements] = useState(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);
  const [expandedUpdateId, setExpandedUpdateId] = useState(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'university', 'global'

  // State for CompleteProfileModal functionality
  const [passoutYear, setPassoutYear] = useState('');
  const [college, setCollege] = useState('');
  const [collegeList, setCollegeList] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false); // Renamed to avoid conflict with other 'loading' states
  const [profileError, setProfileError] = useState(''); // Renamed to avoid conflict with other 'error' states
  const [collegeLoading, setCollegeLoading] = useState(true);

  // Profile completeness check
useEffect(() => {
    console.log('--- Profile Modal Check ---');
    console.log('authLoading:', authLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);

    // Wait until authentication is settled AND the user object contains the database _id
    if (!authLoading && isAuthenticated && user && user._id !== undefined) {
        // Now that we have the full user profile, check if it's incomplete
        if (!user.passoutYear || String(user.passoutYear).trim() === '' || !user.college || user.college.trim() === '') {
            console.log('Condition met with full profile: Showing complete profile modal.');
            setShowCompleteProfileModal(true);
        } else {
            console.log('Condition NOT met: Hiding complete profile modal.');
            setShowCompleteProfileModal(false);
        }
    } else if (!authLoading && !isAuthenticated) {
        // If auth loading is done and user is not authenticated, ensure modal is hidden
        console.log('User not authenticated, hiding modal.');
        setShowCompleteProfileModal(false);
    } else {
        console.log('Waiting for authentication and/or full user profile...');
    }
}, [user, isAuthenticated, authLoading]); // Dependencies remain the same

  // NEW useEffect to fetch full user profile after initial auth loading
// In page.js, replace the old fetchFullUserProfile useEffect with this one

useEffect(() => {
  const fetchFullUserProfile = async () => {
    // This condition checks if we are logged in but DON'T have the database _id yet.
    // This is the exact state after a Google login.
    if (!authLoading && isAuthenticated && user && !user._id) {
      console.log('Partial user profile detected. Fetching full profile from /api/auth/me');
      try {
        // Use the /api/auth/me endpoint, which finds the user via their token.
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const fullUserData = await response.json();
          console.log('Full user data received:', fullUserData);
          
          // Use the correct, safe function to update the context WITHOUT reloading.
          updateUserContext(fullUserData); 
        } else {
          console.error('Failed to fetch full user profile:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching full user profile:', error);
      }
    }
  };

  fetchFullUserProfile();
}, [authLoading, isAuthenticated, user, accessToken, updateUserContext]);


  // Initialize form fields if user data is present (e.g., if user partially filled)
  useEffect(() => {
    if (user) {
      setPassoutYear(user.passoutYear || '');
      setCollege(user.college || '');
    }
  }, [user]);


  // Fetch college list on mount for CompleteProfileModal
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegeLoading(true);
      setProfileError('');
      try {
        const response = await fetch('/api/colleges');
        if (!response.ok) {
          throw new Error('Failed to load college list.');
        }
        const data = await response.json();
        setCollegeList(data);
      } catch (err) {
        setProfileError(err.message);
      } finally {
        setCollegeLoading(false);
      }
    };

    if (showCompleteProfileModal) {
        fetchColleges();
    }
  }, [showCompleteProfileModal]);

  // Handle profile update submission
  const handleProfileSubmit = async () => {
    if (!passoutYear || !college) {
      setProfileError('Please fill out all fields to continue.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    try {
      console.log('Attempting to update profile for user ID:', user?._id);
      console.log('Sending data:', { passoutYear, college });
      console.log('Using access token:', accessToken);

      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passoutYear, college })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('API response error:', data);
        throw new Error(data.message || 'Profile update failed. Please try again.');
      }

      const data = await response.json();
      console.log('Profile update successful:', data.user);
      updateUserContext(data.user); // Update the user context with the new profile data
      setShowCompleteProfileModal(false); // Close the modal
    } catch (err) {
      setProfileError(err.message);
      console.error('Error during profile update:', err);
    } finally {
      setSavingProfile(false);
    }
  };


  // Fetch Featured Items from API
  const fetchFeaturedItems = useCallback(async () => {
    setLoadingFeatured(true);
    setErrorFeatured(null);
    try {
      const response = await fetch('/api/featured');
      if (!response.ok) throw new Error(`Failed to fetch featured items: ${response.statusText}`);
      const data = await response.json();
      setFeaturedItems(data);
    } catch (err) {
      setErrorFeatured("Failed to load featured content. Please try again later.");
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  // Fetch All Updates (Global and University) from APIs
  const fetchAllUpdates = useCallback(async () => {
    if (!isAuthenticated) {
      setLoadingAnnouncements(false);
      setAllUpdates([]);
      return;
    }
    setLoadingAnnouncements(true);
    setErrorAnnouncements(null);
    try {
      const [globalRes, uniRes] = await Promise.all([
        fetch('/api/global-updates'),
        fetch('/api/uni-updates'),
      ]);
      if (!globalRes.ok) throw new Error(`Global updates fetch failed: ${globalRes.statusText}`);
      if (!uniRes.ok) throw new Error(`University updates fetch failed: ${uniRes.statusText}`);
      const globalData = await globalRes.json();
      const uniData = await uniRes.json();
      // Combine and sort updates by published/created date (newest first)
      const combinedUpdates = [...globalData, ...uniData].sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt);
        const dateB = new Date(b.publishedAt || b.createdAt);
        return dateB - dateA;
      });
      setAllUpdates(combinedUpdates);
    } catch (err) {
      setErrorAnnouncements("Failed to load announcements. Please try again later.");
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [isAuthenticated]);

  // Fetch data on component mount
  useEffect(() => { fetchFeaturedItems(); }, [fetchFeaturedItems]);
  useEffect(() => { fetchAllUpdates(); }, [fetchAllUpdates]);

   // Memoized filtered updates based on filterType
  const filteredUpdates = useMemo(() => {
    if (filterType === 'all') {
      return allUpdates;
    } else if (filterType === 'university') {
      // Assuming 'uniName' exists for university-specific updates
      return allUpdates.filter(update => update.uniName);
    } else if (filterType === 'global') {
      // Assuming global updates do NOT have 'uniName' or have a specific flag
      // For simplicity, assuming global updates are those without uniName
      return allUpdates.filter(update => !update.uniName);
    }
    return allUpdates; // Fallback
  }, [allUpdates, filterType]);




  // Toggle expansion of an update item
  const toggleExpand = (id) => setExpandedUpdateId(expandedUpdateId === id ? null : id);

  // Loading state UI
  if (authLoading || loadingFeatured || (isAuthenticated && loadingAnnouncements)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to flex items-center justify-center transition-colors duration-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-unilight-accent-amber dark:border-unidark-accent-gold border-t-transparent rounded-full mx-auto"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xl font-medium text-unilight-text-700 dark:text-unidark-text-200"
          >
            Loading UNIPDATES...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error state UI for featured items
  if (errorFeatured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to flex items-center justify-center transition-colors duration-500">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-unilight-card dark:bg-unidark-card p-8 rounded-2xl shadow-xl max-w-md border border-unilight-border-gray-200 dark:border-unidark-border-gold-30"
        >
          <h2 className="text-2xl font-bold text-unilight-accent-red dark:text-unidark-accent-red mb-4">Error Loading Content</h2>
          <p className="text-unilight-text-700 dark:text-unidark-text-300 mb-6">{errorFeatured}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchFeaturedItems}
            className="px-6 py-2 bg-unilight-accent-amber dark:bg-unidark-accent-gold hover:bg-unilight-accent-amber-400 dark:hover:bg-unidark-accent-gold-30 rounded-lg text-white font-medium shadow-md"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
{/* Complete Profile Modal */}
      {showCompleteProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-unilight-card dark:bg-unidark-card p-6 rounded-lg w-full max-w-md shadow-lg border border-unilight-border-gray-200 dark:border-unidark-border-gold-10">
            <h2 className="text-xl font-bold mb-4 text-unilight-text-800 dark:text-unidark-text-100">Complete Your Profile</h2>
            {profileError && <p className="text-unilight-accent-red dark:text-unidark-accent-red text-sm mb-2">{profileError}</p>}

            <div className="mb-4">
              <label className="block font-medium mb-1 text-unilight-text-700 dark:text-unidark-text-200">Passout Year</label>
              <input
                type="number"
                value={passoutYear}
                onChange={(e) => setPassoutYear(e.target.value)}
                className="w-full border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 p-2 rounded-md bg-unilight-bg dark:bg-unidark-bg text-unilight-text-700 dark:text-unidark-text-200 placeholder-unilight-text-400 dark:placeholder-unidark-text-500 focus:outline-none focus:ring-2 focus:ring-unilight-accent-amber dark:focus:ring-unidark-accent-gold transition-colors"
                placeholder="e.g. 2025"
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1 text-unilight-text-700 dark:text-unidark-text-200">Select College</label>
              {collegeLoading ? (
                <p className="text-sm text-unilight-text-500 dark:text-unidark-text-400">Loading colleges...</p>
              ) : (
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 p-2 rounded-md bg-unilight-bg dark:bg-unidark-bg text-unilight-text-700 dark:text-unidark-text-200 focus:outline-none focus:ring-2 focus:ring-unilight-accent-amber dark:focus:ring-unidark-accent-gold transition-colors"
                >
                  <option value="" className="bg-unilight-bg dark:bg-unidark-bg">-- Select College --</option>
                  {collegeList.map((col) => (
                    <option key={col._id} value={col.name} className="bg-unilight-bg dark:bg-unidark-bg">
                      {col.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleProfileSubmit}
              className="bg-unilight-accent-amber dark:bg-unidark-accent-gold text-white px-4 py-2 rounded-lg hover:bg-unilight-accent-amber-400 dark:hover:bg-unidark-accent-gold-30 w-full font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Non-logged-in Homepage (Marketing Focus) */}
      {!isAuthenticated && (
        <div className="mt-10 min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to transition-colors duration-500">

          {/* Hero Section */}
          <section className="relative py-20 px-4 sm:px-8 lg:px-16 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none"></div>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-7xl mx-auto text-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg overflow-hidden border-4 border-white/20 backdrop-blur-sm"
              >
                <img src="/logo.jpg" alt="UNIPDATES Logo" className="w-full h-full object-cover" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold">
                  Your Academic
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-unilight-accent-amber to-unilight-accent-red dark:from-unidark-accent-gold dark:to-unidark-accent-red">
                  Superpower Awaits
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg sm:text-xl text-unilight-text-700 dark:text-unidark-text-200 max-w-3xl mx-auto mb-10"
              >
                UNIPDATES transforms your college experience with centralized announcements, 
                exclusive opportunities, and academic resources - all in one place.
              </motion.p>
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.8 }}
  className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4"
>
  <motion.div whileHover={{ y: -3 }} className="w-full sm:w-auto">
    <Link 
      href="/signup" 
      className="w-full sm:w-auto flex justify-center px-6 py-3 bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold rounded-lg text-lg font-bold text-white shadow-lg hover:shadow-xl transition-all"
    >
      Get Started Free
    </Link>
  </motion.div>
  <motion.div whileHover={{ y: -3 }} className="w-full sm:w-auto">
    <Link 
      href="/#features" 
      className="w-full sm:w-auto flex justify-center px-6 py-3 border-2 border-unilight-accent-red dark:border-unidark-accent-red text-unilight-accent-red dark:text-unidark-accent-red rounded-lg text-lg font-bold hover:bg-unilight-accent-amber-10 dark:hover:bg-unidark-accent-gold-10 transition-all"
    >
      Explore Features
    </Link>
  </motion.div>
</motion.div>
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 w-16 h-16 bg-unilight-accent-red-30 dark:bg-unidark-accent-red-30 rounded-full blur-xl"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 right-10 w-24 h-24 bg-unilight-accent-amber-30 dark:bg-unidark-accent-gold-30 rounded-full blur-xl"
            />
          </section>

          {/* Featured Section (only if there are active items) */}
          <FeaturedSection items={featuredItems} />

          {/* Features Grid */}
          <section id="features" className="py-16 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center mb-16 text-unilight-text-800 dark:text-unidark-text-100"
            >
              Why Students <span className="text-unilight-accent-amber dark:text-unidark-accent-gold">Love</span> UNIPDATES
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Instant Updates",
                  desc: "Real-time notifications for all university announcements",
                  icon: <Zap className="w-8 h-8 text-unilight-accent-amber dark:text-unidark-accent-gold" />,
                  color: "bg-unilight-card-amber-100 dark:bg-unidark-accent-gold-10" // Updated class
                },
                {
                  title: "Study Resources",
                  desc: "Curated notes and 80% accurate exam predictions",
                  icon: <BookOpen className="w-8 h-8 text-unilight-accent-red dark:text-unidark-accent-red" />,
                  color: "bg-unilight-card-rose-100 dark:bg-unidark-accent-red-30" // Updated class
                },
                {
                  title: "Event Calendar",
                  desc: "Never miss important deadlines or campus events",
                  icon: <Calendar className="w-8 h-8 text-unilight-accent-amber dark:text-unidark-accent-gold" />,
                  color: "bg-unilight-card-amber-100 dark:bg-unidark-accent-gold-10" // Updated class
                },
                {
                  title: "Internship Portal",
                  desc: "Exclusive access to 160+ opportunities",
                  icon: <Briefcase className="w-8 h-8 text-unilight-accent-red dark:text-unidark-accent-red" />,
                  color: "bg-unilight-card-rose-100 dark:bg-unidark-accent-red-30" // Updated class
                },
                {
                  title: "24/7 Support",
                  desc: "Academic and non-academic assistance anytime",
                  icon: <LifeBuoy className="w-8 h-8 text-unilight-accent-amber dark:text-unidark-accent-gold" />,
                  color: "bg-unilight-card-amber-100 dark:bg-unidark-accent-gold-10" // Updated class
                },
                {
                  title: "University Network",
                  desc: "Connect with peers across multiple institutions",
                  icon: <Globe className="w-8 h-8 text-unilight-accent-red dark:text-unidark-accent-red" />,
                  color: "bg-unilight-card-rose-100 dark:bg-unidark-accent-red-30" // Updated class
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`${feature.color} p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-unilight-border-gray-200 dark:border-unidark-border-gold-10`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-white/80 dark:bg-unidark-card-alt mr-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-unilight-text-800 dark:text-unidark-text-100">{feature.title}</h3>
                  </div>
                  <p className="text-unilight-text-600 dark:text-unidark-text-300">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center mb-12 text-unilight-text-800 dark:text-unidark-text-100"
            >
              Trusted by <span className="text-unilight-accent-amber dark:text-unidark-accent-gold">Students</span> Across India
            </motion.h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  quote: "UNIPDATES saved me countless hours by centralizing all announcements. No more checking multiple platforms!",
                  name: "Rahul K., IIT ISM Dhanbad",
                  delay: 0.1
                },
                {
                  quote: "The internship I got through UNIPDATES was a game-changer for my career. The platform is a must for every student.",
                  name: "Priya M., LPU",
                  delay: 0.2
                },
                {
                  quote: "The exam predictions are scarily accurate. I improved my grades by a full point using their resources.",
                  name: "Amit S., Delhi University",
                  delay: 0.3
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: testimonial.delay }}
                  className="bg-unilight-card dark:bg-unidark-card p-6 rounded-2xl shadow-md border border-unilight-border-rose-200 dark:border-unidark-border-rose-30"
                >
                  <div className="text-unilight-accent-amber dark:text-unidark-accent-gold text-3xl mb-4">&quot;</div>
                  <p className="text-lg italic text-unilight-text-700 dark:text-unidark-text-200 mb-6">{testimonial.quote}</p>
                  <p className="text-unilight-accent-red dark:text-unidark-accent-red font-medium">— {testimonial.name}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Transform Your College Life?</h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
                  Join thousands of students who are already acing their academics with UNIPDATES.
                </p>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Link 
                    href="/signup" 
                    className="inline-block px-10 py-4 bg-unilight-card dark:bg-unidark-card text-unilight-accent-red dark:text-unidark-accent-red rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started Now
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </section>
        </div>
      )}

      {/* Logged-in Homepage (Dashboard Style) */}
            {/* Logged-in Homepage (Dashboard Style) */}
      {isAuthenticated && (
        <div className="mt-20 min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to transition-colors duration-500">

          {/* Main Content */}
          <main className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold rounded-2xl p-6 mb-8 shadow-lg text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user?.name || user?.username}!</h1>
                <p className="opacity-90">
                  {filteredUpdates.length > 0 // Use filteredUpdates here for accurate count
                    ? `You may have new updates to review.`
                    : "Everything is up to date. Check back later for new announcements."}
                </p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { title: "Announcements", value: allUpdates.length, icon: <Zap className="w-5 h-5" />, color: "bg-unilight-card-amber-50 dark:bg-unidark-accent-gold-10 text-unilight-text-700 dark:text-unidark-text-200" }, // Updated class
                { title: "Events", value: "3", icon: <Calendar className="w-5 h-5" />, color: "bg-unilight-card-rose-50 dark:bg-unidark-accent-red-30 text-unilight-text-700 dark:text-unidark-text-200" }, // Updated class
                { title: "Internships", value: "12", icon: <Briefcase className="w-5 h-5" />, color: "bg-unilight-card-amber-50 dark:bg-unidark-accent-gold-10 text-unilight-text-700 dark:text-unidark-text-200" }, // Updated class
                { title: "Resources", value: "24", icon: <BookOpen className="w-5 h-5" />, color: "bg-unilight-card-rose-50 dark:bg-unidark-accent-red-30 text-unilight-text-700 dark:text-unidark-text-200" } // Updated class
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3 }}
                  className={`${stat.color} p-4 rounded-xl shadow-sm flex items-center border border-unilight-border-gray-200 dark:border-unidark-border-gold-10`} // Updated border
                >
                  <div className="p-2 rounded-lg bg-white/10 dark:bg-black/20 mr-3">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div> */}

            {/* Featured Section (only if active items exist) */}
            <FeaturedSection items={featuredItems} />

            {/* Announcements Section */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              id="announcements"
              className="mt-12"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-unilight-text-800 dark:text-unidark-text-200">Latest Announcements</h2> {/* Updated text color */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg text-sm shadow transition-colors ${
                      filterType === 'all' 
                        ? 'bg-unilight-accent-amber dark:bg-unidark-accent-gold text-white' 
                        : 'bg-unilight-card dark:bg-unidark-card hover:bg-unilight-card-amber-50 dark:hover:bg-unidark-card-alt border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 text-unilight-text-700 dark:text-unidark-text-200'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('university')}
                    className={`px-3 py-1 rounded-lg text-sm shadow transition-colors ${
                      filterType === 'university' 
                        ? 'bg-unilight-accent-amber dark:bg-unidark-accent-gold text-white' 
                        : 'bg-unilight-card dark:bg-unidark-card hover:bg-unilight-card-amber-50 dark:hover:bg-unidark-card-alt border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 text-unilight-text-700 dark:text-unidark-text-200'
                    }`}
                  >
                    University
                  </button>
                  <button 
                    onClick={() => setFilterType('global')}
                    className={`px-3 py-1 rounded-lg text-sm shadow transition-colors ${
                      filterType === 'global' 
                        ? 'bg-unilight-accent-amber dark:bg-unidark-accent-gold text-white' 
                        : 'bg-unilight-card dark:bg-unidark-card hover:bg-unilight-card-amber-50 dark:hover:bg-unidark-card-alt border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 text-unilight-text-700 dark:text-unidark-text-200'
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>

              {errorAnnouncements && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-unilight-card-rose-100 dark:bg-unidark-accent-red-30 border border-unilight-border-rose-200 dark:border-unidark-border-red-30 rounded-xl p-6 text-center mb-8"
                >
                  <p className="text-unilight-text-700 dark:text-unidark-text-200 mb-3">{errorAnnouncements}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchAllUpdates}
                    className="px-4 py-2 bg-unilight-accent-amber dark:bg-unidark-accent-gold hover:bg-unilight-accent-amber-400 dark:hover:bg-unidark-accent-gold-30 rounded-lg text-white text-sm shadow"
                  >
                    Retry
                  </motion.button>
                </motion.div>
              )}

              {filteredUpdates.length > 0 ? (
                <div className="space-y-6">
                  {filteredUpdates.map((update) => (
                    <motion.div
                      key={update._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.005 }}
                      className="bg-unilight-card dark:bg-unidark-card rounded-xl shadow-md hover:shadow-lg transition-all border border-unilight-border-gray-200 dark:border-unidark-border-gold-10 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              {update.uniName && (
                                <span className="px-2 py-1 bg-unilight-card-amber-100 text-unilight-accent-amber dark:bg-unidark-accent-gold-10 dark:text-unidark-accent-gold text-xs rounded-full">
                                  {update.uniName}
                                </span>
                              )}
                              <span className="text-xs text-unilight-text-500 dark:text-unidark-text-400">
                                {new Date(update.publishedAt || update.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-unilight-text-800 dark:text-unidark-text-200">{update.mainHeading}</h3>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleExpand(update._id)}
                            className="p-2 rounded-full bg-unilight-border-gray-100 hover:bg-unilight-border-gray-200 text-unilight-text-500 dark:bg-unidark-card-alt dark:hover:bg-unidark-accent-gold-10 dark:text-unidark-text-300 transition-colors"
                          >
                            {expandedUpdateId === update._id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </motion.button>
                        </div>

                        <p className="text-unilight-text-600 dark:text-unidark-text-300 mb-4">{update.shortDescription}</p>

                        <AnimatePresence>
                          {expandedUpdateId === update._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-unilight-border-gray-200 dark:border-unidark-border-gold-10">
                                <p className="text-unilight-text-700 dark:text-unidark-text-200 mb-6 whitespace-pre-line">{update.content}</p>

                                {update.mainImg && (
                                  <motion.img
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    src={update.mainImg}
                                    alt="Main Update Image"
                                    className="w-full max-h-96 object-contain rounded-lg mb-6 bg-unilight-placeholder-bg dark:bg-unidark-card-deep"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/800x400/FFF8F0/D32F2F?text=No+Image";
                                    }}
                                  />
                                )}

                                {update.otherImgs && update.otherImgs.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
                                  >
                                    {update.otherImgs.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt={`Other image ${idx + 1}`}
                                        className="w-full h-48 object-cover rounded-lg bg-unilight-placeholder-bg dark:bg-unidark-card-deep"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "https://placehold.co/400x200/FFF8F0/D32F2F?text=No+Image";
                                        }}
                                      />
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-unilight-card dark:bg-unidark-card rounded-xl shadow-sm p-8 text-center border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                >
                  <p className="text-unilight-text-500 dark:text-unidark-text-400">No announcements available at the moment. Check back soon!</p>
                </motion.div>
              )}
            </motion.section>
          </main>
        </div>
      )}
    </>
  );
};

// Featured Section Component (reusable for both logged-in and non-logged-in)
const FeaturedSection = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Filter out expired items and sort by expiryDate (soonest first)
  const activeItems = useMemo(() => {
    const now = new Date();
    if (!Array.isArray(items)) return [];
    return items
      .filter(item => new Date(item.expiryDate) > now)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [items]);

  // Automatic carousel rotation
  useEffect(() => {
    if (activeItems.length > 1) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % activeItems.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [activeItems]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeItems.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + activeItems.length) % activeItems.length);
  };

  if (activeItems.length === 0) return null;

  const currentItem = activeItems[currentIndex];

  return (
    <section className="mb-12">
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-unilight-border-gray-200 dark:border-unidark-border-gold-10">
        <div className="relative w-full h-64 md:h-80 lg:h-96">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              {currentItem.img ? (
                <img
                  src={currentItem.img}
                  alt={currentItem.tagLine}
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src="https://placehold.co/1200x384/FFF8F0/D32F2F?text=Featured+Image";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-unilight-card-amber-100 to-unilight-card-rose-100 dark:from-unidark-accent-gold-10 dark:to-unidark-accent-red-30 flex items-center justify-center text-unilight-text-500 dark:text-unidark-text-400">
                  <ImageIcon className="w-16 h-16" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white"
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-2">{currentItem.tagLine}</h3>
              <p className="text-gray-200">{currentItem.shortDescription}</p>
              {/* {currentItem.expiryDate && (
                <p className="text-sm text-unilight-accent-amber dark:text-unidark-accent-gold mt-2">
                  Expires: {new Date(currentItem.expiryDate).toLocaleDateString()}
                </p>
              )} */}
            </motion.div>
          </div>

          {/* Navigation Arrows */}
          {activeItems.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                aria-label="Previous featured item"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                aria-label="Next featured item"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </>
          )}

          {/* Indicators */}
          {activeItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {activeItems.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  whileHover={{ scale: 1.2 }}
                  className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex ? 'bg-unilight-accent-amber dark:bg-unidark-accent-gold w-6' : 'bg-white/50'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomePage;
