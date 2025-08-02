// app/contact/page.jsx
"use client"; // This is a Client Component

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext'; // Import the useAuth hook
import { motion, AnimatePresence } from 'framer-motion'; // Import motion for animations
import { useTheme } from "next-themes"; // Import useTheme for theme toggling
import { Sun, Moon, Mail, MessageSquare, BookOpen, AlertCircle, Loader } from 'lucide-react'; // Import Lucide icons



export default function ContactPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth(); // Get user, loading, isAuthenticated from AuthContext

  const [message, setMessage] = useState('');
  const [relatedWith, setRelatedWith] = useState('global'); // Default to 'global'
  const [collegeDisplayName, setCollegeDisplayName] = useState(''); // To display user's college name
  const [collegeIdForContact, setCollegeIdForContact] = useState(null); // Stores the actual ObjectId for the Contact model
  const [fetchingCollegeId, setFetchingCollegeId] = useState(false); // Loading state for college ID lookup
  const [collegeIdError, setCollegeIdError] = useState(''); // Error state for college ID lookup

  const [loading, setLoading] = useState(false); // For form submission loading
  const [responseMessage, setResponseMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Function to fetch college ID from backend based on college name
  const fetchCollegeId = useCallback(async (collegeName) => {
    if (!collegeName) {
      setCollegeIdForContact(null);
      setCollegeIdError('');
      return;
    }

    setFetchingCollegeId(true);
    setCollegeIdError('');
    try {
      const res = await fetch(`/api/colleges/lookup?name=${encodeURIComponent(collegeName)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCollegeIdForContact(data.data._id);
        setCollegeDisplayName(data.data.name); // Ensure display name is accurate from DB
      } else {
        setCollegeIdForContact(null);
        setCollegeIdError(data.message || 'Could not find college ID for your college. Please ensure your college name is correctly registered.');
        console.error('College lookup failed:', data.message);
      }
    } catch (error) {
      setCollegeIdForContact(null);
      setCollegeIdError('Failed to connect to college lookup service. Please try again.');
      console.error('Error fetching college ID:', error);
    } finally {
      setFetchingCollegeId(false);
    }
  }, []);

  // Effect to handle college display name and ID fetching when user or relatedWith changes
  useEffect(() => {
    if (relatedWith === 'college' && user && user.college) {
      // User has a college name in their profile, now fetch its ID
      fetchCollegeId(user.college);
    } else {
      setCollegeDisplayName('');
      setCollegeIdForContact(null);
      setCollegeIdError('');
    }
  }, [relatedWith, user, fetchCollegeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage('');

    if (!isAuthenticated) {
      setResponseMessage('You must be logged in to submit a contact request.');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    // Validate college ID if relatedWith is 'college'
    if (relatedWith === 'college' && (!collegeIdForContact || fetchingCollegeId || collegeIdError)) {
      setResponseMessage('Please wait for college information to load or select a different option. If the issue persists, your college might not be registered in our system.');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    // Prepare data for API call
    const payload = {
      userId: user._id, // Use the actual user ID from AuthContext
      message,
      relatedWith,
      collegeId: relatedWith === 'college' ? collegeIdForContact : undefined, // Use the fetched college ID
    };

    try {
      const res = await fetch('/api/contact/', { // New API endpoint for contact
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setResponseMessage('Your contact request has been successfully submitted! A confirmation email has been sent.');
        // Clear form
        setMessage('');
        setRelatedWith('global');
        setCollegeDisplayName('');
        setCollegeIdForContact(null);
      } else {
        setIsSuccess(false);
        setResponseMessage(data.message || 'Failed to submit contact request. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setIsSuccess(false);
      setResponseMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if the form or specific elements should be disabled
  const isFormDisabled = authLoading || !isAuthenticated || loading;
  // College option disabled if auth is loading, not authenticated, no college in user profile, or currently fetching college ID
  const isCollegeOptionDisabled = isFormDisabled || !user?.college || fetchingCollegeId;

  return (
    <div className="mt-20 min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500 relative">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-unilight-card dark:bg-unidark-card shadow-xl rounded-2xl overflow-hidden border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold text-white p-8 sm:p-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Contact UNIPDATES
          </h1>
          <p className="text-lg sm:text-xl font-light max-w-2xl mx-auto opacity-90">
            Have a question, suggestion, or just want to say hello? Reach out to us!
          </p>
        </div>

        {/* Introduction Text */}
        <div className="p-8 sm:p-10 text-unilight-text-700 dark:text-unidark-text-200 leading-relaxed text-lg">
          <p className="mb-4">
            We value your feedback and are here to help. Whether it's a general inquiry, a partnership proposal, or anything else, feel free to send us a message.
          </p>
          <p className="mb-6">
            Our team is dedicated to supporting the UNIPDATES community. We'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form Section */}
        <div className="p-8 sm:p-10 border-t border-unilight-border-gray-200 dark:border-unidark-border-gold-10">
          <h2 className="text-3xl font-bold text-unilight-text-800 dark:text-unidark-text-100 mb-6 text-center">Send Us a Message</h2>
          
          {authLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-md bg-unilight-card-amber-50 dark:bg-unidark-accent-gold-10 text-unilight-accent-amber dark:text-unidark-accent-gold mb-4 text-center flex items-center justify-center space-x-2"
            >
              <Loader className="w-5 h-5 animate-spin" />
              <p className="font-medium">Loading user authentication data...</p>
            </motion.div>
          )}

          {!isAuthenticated && !authLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-md bg-unilight-card-rose-50 dark:bg-unidark-accent-red-30 text-unilight-accent-red dark:text-unidark-accent-red mb-4 text-center flex items-center justify-center space-x-2"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Please log in to submit a contact request.</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-unilight-text-700 dark:text-unidark-text-300 mb-1">
                <MessageSquare className="inline-block w-4 h-4 mr-1 text-unilight-accent-amber dark:text-unidark-accent-gold" />
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={1000} // Max length from ContactSchema
                disabled={isFormDisabled}
                className={`mt-1 block w-full px-4 py-2 border border-unilight-border-gray-200 rounded-md shadow-sm focus:ring-unilight-accent-amber focus:border-unilight-accent-amber transition duration-150 ease-in-out bg-unilight-card dark:bg-unidark-card dark:border-unidark-border-gold-10 dark:text-unidark-text-200 ${isFormDisabled ? 'bg-unilight-border-gray-100 dark:bg-unidark-card-alt cursor-not-allowed' : ''}`}
                placeholder="Type your message here..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-unilight-text-700 dark:text-unidark-text-300 mb-2">
                <BookOpen className="inline-block w-4 h-4 mr-1 text-unilight-accent-amber dark:text-unidark-accent-gold" />
                Related With
              </label>
              <div className="mt-1 flex flex-wrap gap-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-unilight-accent-amber border-unilight-border-gray-200 rounded-full focus:ring-unilight-accent-amber dark:text-unidark-accent-gold dark:border-unidark-border-gold-10 dark:focus:ring-unidark-accent-gold"
                    name="relatedWith"
                    value="global"
                    checked={relatedWith === 'global'}
                    onChange={() => setRelatedWith('global')}
                    disabled={isFormDisabled}
                  />
                  <span className={`ml-2 ${isFormDisabled ? 'text-unilight-text-500 dark:text-unidark-text-400' : 'text-unilight-text-800 dark:text-unidark-text-100'}`}>General Inquiry / Global</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-unilight-accent-amber border-unilight-border-gray-200 rounded-full focus:ring-unilight-accent-amber dark:text-unidark-accent-gold dark:border-unidark-border-gold-10 dark:focus:ring-unidark-accent-gold"
                    name="relatedWith"
                    value="college"
                    checked={relatedWith === 'college'}
                    onChange={() => setRelatedWith('college')}
                    disabled={isCollegeOptionDisabled}
                  />
                  <span className={`ml-2 ${isCollegeOptionDisabled ? 'text-unilight-text-500 dark:text-unidark-text-400' : 'text-unilight-text-800 dark:text-unidark-text-100'}`}>My College Specific</span>
                </label>
              </div>
            </div>

            {relatedWith === 'college' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-unilight-card-amber-50 dark:bg-unidark-accent-gold-10 border-l-4 border-unilight-accent-amber dark:border-unidark-accent-gold text-unilight-text-700 dark:text-unidark-text-200 p-4 rounded-md overflow-hidden" role="alert"
              >
                <p className="font-bold flex items-center">
                  {/* <Briefcase className="w-5 h-5 mr-2 text-unilight-accent-amber dark:text-unidark-accent-gold" /> */}
                  Your College:
                </p>
                {fetchingCollegeId ? (
                  <p className="flex items-center mt-1">
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-unilight-accent-amber dark:text-unidark-accent-gold" />
                    Fetching college information...
                  </p>
                ) : collegeIdError ? (
                  <p className="text-unilight-accent-red dark:text-unidark-accent-red mt-1">{collegeIdError}</p>
                ) : collegeDisplayName ? (
                  <p className="mt-1">{collegeDisplayName}</p>
                ) : (
                  <p className="text-unilight-text-500 dark:text-unidark-text-400 mt-1">No college information found for your profile. Please update your profile or select 'General Inquiry'.</p>
                )}
                <p className="text-sm mt-2 text-unilight-text-600 dark:text-unidark-text-300">
                  (This information is automatically linked to your account.)
                </p>
              </motion.div>
            )}

            {responseMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-md flex items-center space-x-3 ${isSuccess ? 'bg-unilight-card-amber-100 text-unilight-accent-amber dark:bg-unidark-accent-gold-10 dark:text-unidark-accent-gold' : 'bg-unilight-card-rose-100 text-unilight-accent-red dark:bg-unidark-accent-red-30 dark:text-unidark-accent-red'}`}
              >
                {isSuccess ? <Mail className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="font-medium">{responseMessage}</p>
              </motion.div>
            )}

            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isFormDisabled || (relatedWith === 'college' && (!collegeIdForContact || fetchingCollegeId || collegeIdError))}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-unilight-accent-amber hover:bg-unilight-accent-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-unilight-accent-amber transition duration-300 ease-in-out dark:bg-unidark-accent-gold dark:hover:bg-unidark-accent-gold-30 dark:focus:ring-unidark-accent-gold
                  ${isFormDisabled || (relatedWith === 'college' && (!collegeIdForContact || fetchingCollegeId || collegeIdError)) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                ) : (
                  'Send Message'
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
