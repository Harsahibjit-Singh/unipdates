// app/notes/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  BookText, // Main icon for notes
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Search,
  FileText, // For PDF notes in ViewNotes
  Link as LinkIcon, // For important questions in ViewNotes (icon remains, but functionality changes)
  Image as ImageIcon, // For general images (not used directly in ViewNotes but good to keep)
  Youtube, // For playlists in ViewNotes
  Plus, // For add buttons in NoteForm
  MinusCircle, // For remove buttons in NoteForm
} from 'lucide-react';

const NotesPage = () => {
  const router = useRouter();
  const { isAdminAuthenticated, loading: authLoading, isSuperadmin } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('view-notes'); // 'view-notes', 'add-note', 'update-note'
  const [notes, setNotes] = useState([]); // All notes fetched from API
  const [subjects, setSubjects] = useState([]); // Unique subjects for filtering
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState(''); // State for subject filter
  const [selectedNote, setSelectedNote] = useState(null); // For update form

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  // Redirect if not authenticated or not superadmin
  useEffect(() => {
    if (!authLoading && (!isAdminAuthenticated || !isSuperadmin)) {
      router.push('/login');
    }
  }, [isAdminAuthenticated, authLoading, isSuperadmin, router]);

  const fetchNotesAndSubjects = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${accessToken}` };

      // Fetch all notes
      const notesRes = await fetch('/api/admin/data/notes', { headers });
      if (!notesRes.ok) throw new Error('Failed to fetch notes.');
      const notesData = await notesRes.json();
      setNotes(notesData);

      // Fetch unique subjects
      const subjectsRes = await fetch('/api/admin/data/notes/subjects', { headers });
      if (!subjectsRes.ok) console.warn('Failed to fetch subjects.'); // Warn but don't block
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData);

    } catch (err) {
      console.error('Error fetching data for notes page:', err);
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAdminAuthenticated && isSuperadmin) {
      fetchNotesAndSubjects();
    }
  }, [isAdminAuthenticated, isSuperadmin, fetchNotesAndSubjects]);

  // Filter notes based on search query and selected subject
  const filteredNotes = useMemo(() => {
    let currentNotes = notes;

    if (selectedSubjectFilter) {
      currentNotes = currentNotes.filter(note => note.subject === selectedSubjectFilter);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      currentNotes = currentNotes.filter(note =>
        note.subject.toLowerCase().includes(lowercasedQuery) ||
        note.topic.toLowerCase().includes(lowercasedQuery) ||
        note.pdfNotes.some(pdf => pdf.title.toLowerCase().includes(lowercasedQuery)) ||
        // MODIFIED: Check questionsText
        note.importantQuestions.some(q => q.title.toLowerCase().includes(lowercasedQuery) || (q.questionsText && q.questionsText.toLowerCase().includes(lowercasedQuery))) ||
        note.playlists.some(p => p.title.toLowerCase().includes(lowercasedQuery))
      );
    }
    return currentNotes;
  }, [notes, searchQuery, selectedSubjectFilter]);


  const showMessage = (msg, type = 'success') => {
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
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setActiveTab('update-note');
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note entry? This will remove all associated PDFs, questions, and playlists.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete note.');
      }
      showMessage('Note entry deleted successfully!');
      fetchNotesAndSubjects(); // Refresh list
    } catch (err) {
      console.error('Delete Note error:', err);
      showMessage(err.message || 'An error occurred during deletion.', 'error');
    } finally {
      setLoading(false);
    }
  };


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
        Notes Management
      </h1>

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

      <div className="flex justify-center mb-8 space-x-4">
        <TabButton active={activeTab === 'view-notes'} onClick={() => setActiveTab('view-notes')}>
          <Eye className="w-5 h-5 mr-2" /> View Notes
        </TabButton>
        <TabButton active={activeTab === 'add-note'} onClick={() => { setActiveTab('add-note'); setSelectedNote(null); }}>
          <PlusCircle className="w-5 h-5 mr-2" /> Add New Note
        </TabButton>
        {activeTab === 'update-note' && (
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Update Note
          </TabButton>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {activeTab === 'view-notes' && (
            <ViewNotes
              notes={filteredNotes}
              subjects={subjects}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSubjectFilter={selectedSubjectFilter}
              setSelectedSubjectFilter={setSelectedSubjectFilter}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
            />
          )}
          {activeTab === 'add-note' && (
            <NoteForm
              type="add"
              showMessage={showMessage}
              refreshData={fetchNotesAndSubjects}
              subjects={subjects} // Pass subjects for dropdown
            />
          )}
          {activeTab === 'update-note' && selectedNote && (
            <NoteForm
              type="update"
              note={selectedNote}
              showMessage={showMessage}
              refreshData={fetchNotesAndSubjects}
              subjects={subjects} // Pass subjects for dropdown
              onCancel={() => setActiveTab('view-notes')}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPage;

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

// --- ViewNotes Component ---
// Note: Imports for ViewNotes are now at the top of the file
const ViewNotes = ({
  notes,
  subjects,
  searchQuery,
  setSearchQuery,
  selectedSubjectFilter,
  setSelectedSubjectFilter,
  handleEditNote,
  handleDeleteNote
}) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        <BookText className="w-7 h-7 mr-3 text-purple-600" /> All Notes
      </h2>

      {/* Search and Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject, topic, or content titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          />
        </div>
        <div>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchQuery || selectedSubjectFilter ? `No notes found matching your criteria.` : 'No notes added yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div key={note._id} className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-1">{note.subject}</h3>
                <p className="text-lg font-semibold text-gray-700 mb-3">{note.topic}</p>

                {note.pdfNotes && note.pdfNotes.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-700 flex items-center mb-1"><FileText className="w-4 h-4 mr-2" /> PDF Notes:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {note.pdfNotes.map((pdf, idx) => (
                        <li key={idx} className="flex items-center">
                          <a
                            href={pdf.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`${pdf.title}.pdf`} // Suggests filename for download
                            className="text-blue-600 hover:underline truncate"
                          >
                            {pdf.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {note.importantQuestions && note.importantQuestions.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-700 flex items-center mb-1"><LinkIcon className="w-4 h-4 mr-2" /> Important Questions:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {note.importantQuestions.map((qa, idx) => (
                        <li key={idx} className="flex items-start"> {/* Changed to items-start for multi-line text */}
                          <div className="flex-shrink-0 mt-1 mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{qa.title}</p>
                            {qa.questionsText && ( // Display questionsText if it exists
                              <pre className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md mt-1 overflow-auto whitespace-pre-wrap">
                                {qa.questionsText}
                              </pre>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {note.playlists && note.playlists.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-700 flex items-center mb-1"><Youtube className="w-4 h-4 mr-2" /> Playlists:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {note.playlists.map((playlist, idx) => (
                        <a key={idx} href={playlist.playlistLink} target="_blank" rel="noopener noreferrer" className="block group">
                          <img
                            src={playlist.thumbnailImg}
                            alt={playlist.title}
                            className="w-full h-24 object-cover rounded-md border border-gray-200 group-hover:shadow-lg transition-shadow"
                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x60/cccccc/333333?text=No+Thumb"; }}
                          />
                          <p className="text-xs text-gray-600 mt-1 font-medium group-hover:text-blue-700 truncate">{playlist.title}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Last Updated: {new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleEditNote(note)}
                  className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors duration-200 shadow-md"
                  title="Edit Note"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note._id)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 shadow-md"
                  title="Delete Note"
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

// --- NoteForm Component (for Add/Update) ---
// Note: Imports for NoteForm are now at the top of the file
const NoteForm = ({ type, note, showMessage, refreshData, subjects, onCancel }) => {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    pdfNotes: [],
    importantQuestions: [],
    playlists: [],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [newSubject, setNewSubject] = useState(''); // For adding a new subject

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  useEffect(() => {
    if (type === 'update' && note) {
      setFormData({
        subject: note.subject || '',
        topic: note.topic || '',
        pdfNotes: note.pdfNotes || [],
        importantQuestions: note.importantQuestions || [], // Ensure this is initialized
        playlists: note.playlists || [],
      });
    } else if (type === 'add') {
      setFormData({
        subject: '',
        topic: '',
        pdfNotes: [],
        importantQuestions: [],
        playlists: [],
      });
      setNewSubject('');
    }
  }, [type, note]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index, arrayName, subField, value, file = null) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [subField]: value };
      if (file) {
        newArray[index].file = file; // Store the file object for upload
      }
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleAddArrayItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem],
    }));
  };

  const handleRemoveArrayItem = (index, arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

// Inside the NoteForm component in app/notes/page.jsx

const uploadFileToCloudinary = async (file, folder) => {
  // 1. Get the signature from your NEW backend route
  const signatureResponse = await fetch('/api/admin/generate-upload-signature', { // <-- CHANGE THIS LINE
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ folder }),
  });

  if (!signatureResponse.ok) {
    throw new Error('Failed to get upload signature.');
  }

  const { signature, timestamp } = await signatureResponse.json();

  // 2. Prepare the form data to send to Cloudinary's API
  const uploadFormData = new FormData();
  uploadFormData.append('file', file);
  uploadFormData.append('folder', folder);
  uploadFormData.append('signature', signature);
  uploadFormData.append('timestamp', timestamp);
  uploadFormData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);

  // 3. Upload the file directly to Cloudinary
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`;

  const cloudinaryResponse = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: uploadFormData,
  });

  const cloudinaryData = await cloudinaryResponse.json();

  if (!cloudinaryResponse.ok) {
    throw new Error(cloudinaryData.error.message || `Failed to upload ${file.name}.`);
  }

  // 4. Return the secure URL of the uploaded file
  return cloudinaryData.secure_url;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData };

      // Subject validation for new subject
      if (formData.subject === 'new-subject' && !newSubject.trim()) {
        throw new Error('Please enter a new subject name.');
      } else if (formData.subject === 'new-subject') {
        payload.subject = newSubject.trim();
      }

      // Process PDF Notes uploads
      const processedPdfNotes = [];
      for (const pdf of formData.pdfNotes) {
        if (pdf.file) { // If it's a new file object
          // Use 'raw' resourceType for PDFs
          const pdfUrl = await uploadFileToCloudinary(pdf.file, 'notes-pdfs', 'raw');
          processedPdfNotes.push({ title: pdf.title, pdfUrl: pdfUrl });
        } else if (pdf.pdfUrl && pdf.title) { // Keep existing valid entries
          processedPdfNotes.push(pdf);
        }
      }
      payload.pdfNotes = processedPdfNotes;

      // Process Playlist Thumbnail uploads
      const processedPlaylists = [];
      for (const playlist of formData.playlists) {
        if (playlist.file) { // If a new file is selected for this entry
          // Use 'image' resourceType for thumbnails
          const thumbnailUrl = await uploadFileToCloudinary(playlist.file, 'notes-thumbnails', 'image');
          processedPlaylists.push({ title: playlist.title, thumbnailImg: thumbnailUrl, playlistLink: playlist.playlistLink });
        } else if (playlist.thumbnailImg && playlist.playlistLink && playlist.title) { // Keep existing valid entries
          processedPlaylists.push(playlist);
        }
      }
      payload.playlists = processedPlaylists;

      // Process Important Questions (no file uploads, but ensure data integrity)
      const processedImportantQuestions = [];
      for (const qa of formData.importantQuestions) {
        // MODIFIED: Check for questionsText instead of questionsUrl
        if (qa.title && qa.questionsText) { // Only include if both title and text exist
          processedImportantQuestions.push(qa);
        }
      }
      payload.importantQuestions = processedImportantQuestions;


      let response;
      if (type === 'add') {
        response = await fetch('/api/admin/data/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else { // type === 'update'
        response = await fetch(`/api/admin/data/notes/${note._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${type} note.`);
      }

      showMessage(`Note ${type === 'add' ? 'added' : 'updated'} successfully!`);
      refreshData(); // Refresh list of notes and subjects
      if (type === 'add') {
        setFormData({ subject: '', topic: '', pdfNotes: [], importantQuestions: [], playlists: [] });
        setNewSubject('');
      } else {
        onCancel(); // Go back to view page after update
      }
    } catch (err) {
      console.error(`${type === 'add' ? 'Add' : 'Update'} Note error:`, err);
      showMessage(err.message || 'An error occurred.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center">
        {type === 'add' ? <PlusCircle className="w-7 h-7 mr-3 text-purple-600" /> : <Edit className="w-7 h-7 mr-3 text-purple-600" />}
        {type === 'add' ? 'Add New Note Entry' : `Update Note: ${note?.subject} - ${note?.topic}`}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject and Topic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject" className="block text-lg font-semibold text-gray-700 mb-2">Subject</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="new-subject">-- Add New Subject --</option>
            </select>
          </div>
          {formData.subject === 'new-subject' && (
            <div>
              <label htmlFor="newSubject" className="block text-lg font-semibold text-gray-700 mb-2">New Subject Name</label>
              <input
                type="text"
                id="newSubject"
                name="newSubject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Artificial Intelligence"
                required={formData.subject === 'new-subject'}
              />
            </div>
          )}
          <div>
            <label htmlFor="topic" className="block text-lg font-semibold text-gray-700 mb-2">Topic</label>
            <input type="text" id="topic" name="topic" value={formData.topic} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>

        {/* PDF Notes */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2" /> PDF Notes</h3>
          {formData.pdfNotes.map((pdf, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 relative">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Title</label>
                <input
                  type="text"
                  value={pdf.title}
                  onChange={(e) => handleArrayChange(index, 'pdfNotes', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Chapter 1 - Introduction"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF / Current URL</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleArrayChange(index, 'pdfNotes', 'file', e.target.files[0], e.target.files[0])} // Pass the file object
                  className="w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {pdf.pdfUrl && !pdf.file && ( // Show current URL if no new file is selected
                  <p className="text-xs text-gray-500 mt-1 truncate">Current: <a href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{pdf.pdfUrl.split('/').pop()}</a></p>
                )}
                {pdf.file && ( // Show file name if new file is selected
                   <p className="text-xs text-gray-500 mt-1">New file: {pdf.file.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveArrayItem(index, 'pdfNotes')}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                title="Remove PDF"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem('pdfNotes', { title: '', pdfUrl: '', file: null })}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add PDF Note
          </button>
        </div>

        {/* Important Questions */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><LinkIcon className="w-5 h-5 mr-2" /> Important Questions</h3>
          {formData.importantQuestions.map((qa, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 relative">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Set Title</label>
                <input
                  type="text"
                  value={qa.title}
                  onChange={(e) => handleArrayChange(index, 'importantQuestions', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Unit 1 - Short Qs"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Questions Text</label>
                <textarea // MODIFIED: Changed to textarea
                  value={qa.questionsText}
                  onChange={(e) => handleArrayChange(index, 'importantQuestions', 'questionsText', e.target.value)} // MODIFIED: questionsText
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-y" // Added h-24 and resize-y
                  placeholder="Enter important questions here, separated by new lines or bullet points."
                  required
                ></textarea>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveArrayItem(index, 'importantQuestions')}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                title="Remove Questions"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem('importantQuestions', { title: '', questionsText: '' })} // MODIFIED: questionsText
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Questions
          </button>
        </div>

        {/* Playlists */}
        <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Youtube className="w-5 h-5 mr-2" /> Playlists</h3>
          {formData.playlists.map((playlist, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 relative">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playlist Title</label>
                <input
                  type="text"
                  value={playlist.title}
                  onChange={(e) => handleArrayChange(index, 'playlists', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., DSA Full Course"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playlist Link (URL)</label>
                <input
                  type="url"
                  value={playlist.playlistLink}
                  onChange={(e) => handleArrayChange(index, 'playlists', 'playlistLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://youtube.com/playlist?list=..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Thumbnail / Current</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleArrayChange(index, 'playlists', 'file', e.target.files[0], e.target.files[0])} // Pass the file object
                  className="w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {playlist.thumbnailImg && !playlist.file && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 mb-1">Current Thumbnail:</p>
                    <img
                      src={playlist.thumbnailImg}
                      alt="Thumbnail Preview"
                      className="w-20 h-12 object-cover rounded-md border border-gray-200"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/80x48/cccccc/333333?text=Error"; }}
                    />
                  </div>
                )}
                 {playlist.file && ( // Show file name if new file is selected
                   <p className="text-xs text-gray-500 mt-1">New file: {playlist.file.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveArrayItem(index, 'playlists')}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                title="Remove Playlist"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem('playlists', { title: '', thumbnailImg: '', playlistLink: '', file: null })}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg flex items-center hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Playlist
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          {type === 'update' && (
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
            {formLoading ? (type === 'add' ? 'Saving...' : 'Updating...') : (type === 'add' ? 'Add Note' : 'Update Note')}
          </button>
        </div>
      </form>
    </div>
  );
};