// app/notes/page.js
'use client'; // This is a client component
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'; // Assuming this component exists
import { XCircle, FileText, HelpCircle, PlayCircle, Sun, Moon, ChevronLeft } from 'lucide-react'; // Import Lucide icons, added ChevronLeft
import { motion, AnimatePresence } from 'framer-motion'; // Import motion for animations
import { useTheme } from "next-themes"; // Import useTheme for theme toggling


// --- Public Site Notes Component (Full Page) ---
const PublicNotesPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for PDF viewer modal
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfToViewUrl, setPdfToViewUrl] = useState('');

  // Fetch unique subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/notes/subjects');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSubjects(data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics for a selected subject
  useEffect(() => {
    if (selectedSubject) {
      const fetchTopics = async () => {
        setLoading(true);
        setError(null);
        try {
          // Encode subject name for URL
          const encodedSubject = encodeURIComponent(selectedSubject);
          const response = await fetch(`/api/notes/subjects/${encodedSubject}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTopics(data); // Data will be an array of Note documents for the subject
          setSelectedTopic(null); // Reset selected topic when subject changes
        } catch (err) {
          console.error(`Error fetching topics for ${selectedSubject}:`, err);
          setError(`Failed to load topics for ${selectedSubject}.`);
        } finally {
          setLoading(false);
        }
      };
      fetchTopics();
    } else {
      setTopics([]);
      setSelectedTopic(null);
    }
  }, [selectedSubject]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
  };

  const handleTopicClick = (topicId) => {
    // Find the full topic object from the fetched topics array
    const topicData = topics.find(t => t._id === topicId);
    setSelectedTopic(topicData);
  };

  // Function to handle PDF link clicks and open the viewer
  const handlePdfClick = (e, pdfUrl) => {
    e.preventDefault(); // Prevent default link behavior (download/new tab)
    setPdfToViewUrl(pdfUrl);
    setShowPdfViewer(true);
  };

  // Function to close the PDF viewer
  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setPdfToViewUrl('');
  };

  // Loading state UI
  if (loading) {
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
            Loading notes...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to flex items-center justify-center transition-colors duration-500">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-unilight-card dark:bg-unidark-card p-8 rounded-2xl shadow-xl max-w-md border border-unilight-border-gray-200 dark:border-unidark-border-gold-30"
        >
          <h2 className="text-2xl font-bold text-unilight-accent-red dark:text-unidark-accent-red mb-4">Error Loading Content</h2>
          <p className="text-unilight-text-700 dark:text-unidark-text-300 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { /* Add retry logic if applicable, or just refresh */ window.location.reload(); }}
            className="px-6 py-2 bg-unilight-accent-amber dark:bg-unidark-accent-gold hover:bg-unilight-accent-amber-400 dark:hover:bg-unidark-accent-gold-30 rounded-lg text-white font-medium shadow-md"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mt-20 min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to font-sans transition-colors duration-500 p-4 sm:p-6 lg:p-8 relative">


        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold mb-4 rounded-lg p-2">
            UniUpdates Notes
          </h1>
        </header>

        <main className="max-w-7xl mx-auto bg-unilight-card dark:bg-unidark-card shadow-xl rounded-lg p-6 sm:p-8 lg:p-10 border border-unilight-border-gray-200 dark:border-unidark-border-gold-10">
          <h2 className="text-3xl font-bold text-unilight-text-800 dark:text-unidark-text-100 mb-6 text-center">Browse Notes</h2>

          {/* Subject List */}
          {!selectedSubject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <motion.button
                    key={subject}
                    onClick={() => handleSubjectClick(subject)}
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(255, 179, 0, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-unilight-card-amber-100 hover:bg-unilight-card-amber-50 text-unilight-accent-amber dark:bg-unidark-accent-gold-10 dark:hover:bg-unidark-accent-gold-20 dark:text-unidark-accent-gold font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-200 text-lg border border-unilight-border-gray-100 dark:border-unidark-border-gold-10"
                  >
                    {subject}
                  </motion.button>
                ))
              ) : (
                <p className="col-span-full text-center text-unilight-text-500 dark:text-unidark-text-400">No subjects available.</p>
              )}
            </motion.div>
          )}

          {/* Topic List for Selected Subject */}
          {selectedSubject && !selectedTopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <motion.button
                onClick={() => setSelectedSubject(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="mb-4 px-4 py-2 bg-unilight-border-gray-100 text-unilight-text-700 rounded-md hover:bg-unilight-border-gray-200 transition-colors duration-200 flex items-center dark:bg-unidark-card-alt dark:text-unidark-text-200 dark:hover:bg-unidark-card-deep border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Subjects
              </motion.button>
              <h3 className="text-2xl font-semibold text-unilight-accent-amber dark:text-unidark-accent-gold mb-4">Topics for: {selectedSubject}</h3>
              {topics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {topics.map((topic, index) => (
                    <motion.button
                      key={topic._id}
                      onClick={() => handleTopicClick(topic._id)}
                      whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(255, 59, 59, 0.25)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-unilight-card-rose-100 hover:bg-unilight-card-rose-50 text-unilight-accent-red dark:bg-unidark-accent-red-30 dark:hover:bg-unidark-accent-red-30 dark:text-unidark-accent-red font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-200 text-lg border border-unilight-border-gray-100 dark:border-unidark-border-rose-30"
                    >
                      {topic.topic}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-unilight-text-500 dark:text-unidark-text-400">No topics found for this subject.</p>
              )}
            </motion.div>
          )}

          {/* Content for Selected Topic */}
          {selectedTopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-unilight-card-amber-50 dark:bg-unidark-card-deep p-6 rounded-lg shadow-inner border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
            >
              <motion.button
                onClick={() => setSelectedTopic(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="mb-4 px-4 py-2 bg-unilight-border-gray-100 text-unilight-text-700 rounded-md hover:bg-unilight-border-gray-200 transition-colors duration-200 flex items-center dark:bg-unidark-card-alt dark:text-unidark-text-200 dark:hover:bg-unidark-card-deep border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Topics
              </motion.button>
              <h3 className="text-2xl font-bold text-unilight-accent-amber dark:text-unidark-accent-gold mb-4">Topic: {selectedTopic.topic}</h3>

              {/* PDF Notes */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-unilight-text-700 dark:text-unidark-text-200 mb-2">PDF Notes</h4>
                {selectedTopic.pdfNotes && selectedTopic.pdfNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTopic.pdfNotes.map((pdf, index) => (
                      <motion.a
                        key={index}
                        href={pdf.pdfUrl}
                        onClick={(e) => handlePdfClick(e, pdf.pdfUrl)}
                        whileHover={{ y: -3, boxShadow: '0 4px 16px rgba(255, 179, 0, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        className="block bg-unilight-card dark:bg-unidark-card p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 flex items-center space-x-3 cursor-pointer border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                      >
                        <FileText className="h-6 w-6 text-unilight-accent-red dark:text-unidark-accent-red" />
                        <span className="text-unilight-text-700 dark:text-unidark-text-200 hover:underline">{pdf.title}</span>
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <p className="text-unilight-text-500 dark:text-unidark-text-400">No PDF notes available for this topic.</p>
                )}
              </div>

              {/* Most Important Questions */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-unilight-text-700 dark:text-unidark-text-200 mb-2">Most Important Questions</h4>
                {selectedTopic.importantQuestions && selectedTopic.importantQuestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTopic.importantQuestions.map((iq, index) => (
                      <motion.div // Changed from motion.a to motion.div
                        key={index}
                        // Removed href, target, and rel attributes
                        whileHover={{ y: -3, boxShadow: '0 4px 16px rgba(255, 59, 59, 0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        className="block bg-unilight-card dark:bg-unidark-card p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 flex items-center space-x-3 border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                      >
                        <HelpCircle className="h-6 w-6 text-unilight-accent-amber dark:text-unidark-accent-gold" />
                        <span className="text-unilight-text-700 dark:text-unidark-text-200">{iq.questionsText}</span> {/* Displaying questionsText as plain text */}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-unilight-text-500 dark:text-unidark-text-400">No important questions available for this topic.</p>
                )}
              </div>

              {/* Playlists */}
              <div>
                <h4 className="text-xl font-semibold text-unilight-text-700 dark:text-unidark-text-200 mb-2">Playlists</h4>
                {selectedTopic.playlists && selectedTopic.playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTopic.playlists.map((playlist, index) => (
                      <motion.a
                        key={index}
                        href={playlist.playlistLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -3, boxShadow: '0 4px 16px rgba(255, 179, 0, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        className="block bg-unilight-card dark:bg-unidark-card p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
                      >
                        <img
                          src={playlist.thumbnailImg}
                          alt={playlist.title}
                          className="w-full h-32 object-cover rounded-md mb-2"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/FFF8F0/D32F2F?text=No+Image"; }} // Updated placeholder colors
                        />
                        <h5 className="font-medium text-unilight-text-700 dark:text-unidark-text-200 hover:underline flex items-center">
                          <PlayCircle className="h-5 w-5 mr-2 text-unilight-accent-red dark:text-unidark-accent-red" />
                          {playlist.title}
                        </h5>
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <p className="text-unilight-text-500 dark:text-unidark-text-400">No playlists available for this topic.</p>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {showPdfViewer && (
          <PdfViewerModal pdfUrl={pdfToViewUrl} onClose={closePdfViewer} />
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
};

export default PublicNotesPage;

// --- PDF Viewer Modal Component ---
const PdfViewerModal = ({ pdfUrl, onClose }) => {
  useEffect(() => {
    // Disable scrolling on the body when the modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable scrolling when the component unmounts
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-full max-w-5xl max-h-[90vh] bg-unilight-card dark:bg-unidark-card rounded-lg shadow-xl overflow-hidden flex flex-col border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-unilight-accent-red text-white hover:bg-unilight-accent-red-bright transition-colors duration-200 shadow-lg dark:bg-unidark-accent-red dark:hover:bg-unidark-accent-red-bright"
          title="Close PDF Viewer"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* PDF Iframe */}
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          className="w-full h-full border-0 bg-unilight-card dark:bg-unidark-card" // Ensure iframe background matches theme
          // Consider adding sandbox for security if content is not fully trusted
          // sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        >
          Your browser does not support PDFs. Please download the PDF to view it: <a href={pdfUrl} download className="text-unilight-accent-amber dark:text-unidark-accent-gold underline">Download PDF</a>
        </iframe>
      </motion.div>
    </motion.div>
  );
};
