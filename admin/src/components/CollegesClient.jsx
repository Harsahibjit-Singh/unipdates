// app/colleges/page.jsx
'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  PlusCircle, Users, Building2, Edit, Send, Loader2, AlertCircle, CheckCircle, Eye
} from "lucide-react";
// Import the new CollegeForm component
import CollegeForm from "@/components/manage/CollegeForm"; // This will replace AddCollegeForm
import AddUniAdminForm from "@/components/manage/AddUniAdminForm"; // Ensure this import is correct
import UpdateUniAdminForm from "@/components/manage/UpdateUniAdminForm";
import GiveOrderForm from "@/components/manage/GiveOrderForm";
import UniAdminsModal from "@/components/manage/UniAdminsModal";
import ViewColleges from "@/components/manage/ViewColleges"; // Ensure this import is correct
import crypto from "crypto";

const CollegesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read query parameters

  const { isAdminAuthenticated, loading: authLoading, isSuperadmin } = useAdminAuth();

   const initialTab = searchParams.get('tab') || "view-colleges";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [colleges, setColleges] = useState([]);
  const [uniAdmins, setUniAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal and edit state
  const [viewAdminsCollege, setViewAdminsCollege] = useState(null);
  const [editUniAdmin, setEditUniAdmin] = useState(null);
  const [terminateUniAdmin, setTerminateUniAdmin] = useState(null);

  // New state for editing a college
  const [selectedCollegeForEdit, setSelectedCollegeForEdit] = useState(null);


  const accessToken = typeof window !== "undefined" ? localStorage.getItem("adminAccessToken") : null;

  useEffect(() => {
    if (!authLoading && (!isAdminAuthenticated || !isSuperadmin)) {
      router.push("/login");
    }
  }, [isAdminAuthenticated, authLoading, isSuperadmin, router]);

  const fetchCollegesAndAdmins = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [collegesRes, adminsRes] = await Promise.all([
        fetch("/api/admin/data/colleges", { headers }),
        fetch("/api/admin/data/admin-users", { headers }),
      ]);
      if (!collegesRes.ok) throw new Error("Failed to fetch colleges.");
      if (!adminsRes.ok) throw new Error("Failed to fetch admin users.");
      const collegesData = await collegesRes.json();
      const adminsData = await adminsRes.json();
      setColleges(collegesData);
      setUniAdmins(adminsData.filter((admin) => admin.role === "uniadmin"));
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAdminAuthenticated && isSuperadmin) {
      fetchCollegesAndAdmins();
    }
  }, [isAdminAuthenticated, isSuperadmin, fetchCollegesAndAdmins]);

  const showMessage = (msg, type = "success") => {
    if (type === "success") {
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
  };

  // --- College Edit/Delete Handlers ---
  const handleEditCollege = (college) => {
    setSelectedCollegeForEdit(college);
    setActiveTab("update-college");
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!confirm("Are you sure you want to delete this college? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data/colleges/${collegeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete college.");
      }
      showMessage("College deleted successfully!");
      fetchCollegesAndAdmins(); // Refresh data after deletion
    } catch (err) {
      console.error("Delete college error:", err);
      showMessage(err.message || "An error occurred during college deletion.", "error");
    } finally {
      setLoading(false);
    }
  };


  // --- UniAdmin Edit/Terminate Handlers ---
  const handleEditUniAdmin = (admin) => setEditUniAdmin(admin);
  const handleTerminateUniAdmin = (admin) => setTerminateUniAdmin(admin);

  // Actually perform termination after reason is submitted
  const confirmTerminateUniAdmin = async (admin, reason) => {
    try {
      // Step 1: Send termination email
      const emailRes = await fetch("/api/admin/utils/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          to: admin.email,
          subject: "Your UniUpdates Admin Account Termination Notice",
          html: `<p>Dear ${admin.name},<br>Your UniUpdates admin account has been terminated.<br>Reason: ${reason}<br>Effective immediately, UniUpdates has no further association with you.</p>`,
        }),
      });
      if (!emailRes.ok) console.error("Failed to send termination email:", await emailRes.json());


      // Step 2: Update admin user to mark as terminated (optional, but good for audit)
      // Note: The schema for AdminUser should have 'terminate: {type: Boolean, default: false}' and 'terminationreason: {type: String}'
      await fetch(`/api/admin/data/admin-users/${admin._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ terminate: true, terminationreason: reason }),
      });

      // Step 3: Decrement uniAdminCount in College model
      if (admin.college) {
        const decrementRes = await fetch(`/api/admin/data/colleges/${admin.college}/decrement-admin`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!decrementRes.ok) console.error("Failed to decrement college admin count:", await decrementRes.json());
      }

      // Step 4: Delete the admin user (this should be the last step to ensure count is decremented first)
      const deleteRes = await fetch(`/api/admin/data/admin-users/${admin._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!deleteRes.ok) throw new Error((await deleteRes.json()).message || "Failed to delete uniadmin from DB.");

      showMessage("UniAdmin terminated and deleted successfully.");
      setTerminateUniAdmin(null);
      fetchCollegesAndAdmins();
    } catch (err) {
      console.error("Terminate UniAdmin error:", err);
      showMessage(err.message || "An error occurred during termination.", "error");
    }
  };

  // --- UniAdmin Add/Edit Modal Handler (used by AddUniAdminForm and UpdateUniAdminForm) ---
  const handleUniAdminFormSubmit = async (formData, isEdit = false) => {
    try {
      let randomPassword;
      if (!isEdit) randomPassword = crypto.randomBytes(5).toString("hex").slice(0, 10);
      const payload = { ...formData, role: "uniadmin" };
      if (!isEdit) payload.password = randomPassword; // Only add password for new users

      const url = isEdit
        ? `/api/admin/data/admin-users/${formData._id}`
        : "/api/admin/data/admin-users";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save uniadmin.");

      if (!isEdit) {
        // Only send email with password for new users
        const emailRes = await fetch("/api/admin/utils/send-custom-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            to: formData.email,
            subject: "Your New UniUpdates Admin Account Details",
            html: `
              <p>Dear ${formData.name},</p>
              <p>Your UniUpdates Admin account has been created. Here are your login details:</p>
              <p><strong>Username:</strong> ${formData.username}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Temporary Password:</strong> <code>${randomPassword}</code></p>
              <p>For security reasons, please log in and immediately change your password using the "Forgot Password" link on the login page.</p>
              <p>Login Page: <a href="${window.location.origin}/login">${window.location.origin}/login</a></p>
              <p>If you did not request this, please contact support immediately.</p>
              <p>Regards,<br>UniUpdates Admin Team</p>
            `,
          }),
        });
        if (!emailRes.ok) console.error("Failed to send welcome email:", await emailRes.json());
      }
      showMessage(isEdit ? "UniAdmin updated successfully!" : "UniAdmin added successfully! Temporary password sent.");
      setEditUniAdmin(null); // Close modal if open
      fetchCollegesAndAdmins(); // Refresh data
    } catch (err) {
      console.error("UniAdmin form submit error:", err);
      showMessage(err.message || "An error occurred while saving uniadmin.", "error");
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
        College & Admin Management
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
        <TabButton active={activeTab === "view-colleges"} onClick={() => { setActiveTab("view-colleges"); setSelectedCollegeForEdit(null); }}>
          <Eye className="w-5 h-5 mr-2" /> View Colleges
        </TabButton>
        <TabButton active={activeTab === "add-college"} onClick={() => { setActiveTab("add-college"); setSelectedCollegeForEdit(null); }}>
          <PlusCircle className="w-5 h-5 mr-2" /> Add New College
        </TabButton>
        {activeTab === "update-college" && selectedCollegeForEdit && (
          <TabButton active={true} onClick={() => {}}>
            <Edit className="w-5 h-5 mr-2" /> Update College
          </TabButton>
        )}
        <TabButton active={activeTab === "add-uniadmin"} onClick={() => { setActiveTab("add-uniadmin"); setSelectedCollegeForEdit(null); }}>
          <PlusCircle className="w-5 h-5 mr-2" /> Add Uniadmin
        </TabButton>
        <TabButton active={activeTab === "update-uniadmin"} onClick={() => { setActiveTab("update-uniadmin"); setSelectedCollegeForEdit(null); }}>
          <Edit className="w-5 h-5 mr-2" /> Update/Terminate Uniadmin
        </TabButton>
        <TabButton active={activeTab === "message-uniadmin"} onClick={() => { setActiveTab("message-uniadmin"); setSelectedCollegeForEdit(null); }}>
          <Send className="w-5 h-5 mr-2" /> Message Uniadmin
        </TabButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {activeTab === "view-colleges" && (
            <ViewColleges
              colleges={colleges}
              uniAdmins={uniAdmins} // Pass uniAdmins for modal filtering
              onViewAdmins={setViewAdminsCollege}
              onEditCollege={handleEditCollege} // Pass edit handler
              onDeleteCollege={handleDeleteCollege} // Pass delete handler
            />
          )}
          {activeTab === "add-college" && (
            <CollegeForm
              type="add"
              showMessage={showMessage}
              refreshData={fetchCollegesAndAdmins}
            />
          )}
          {activeTab === "update-college" && selectedCollegeForEdit && (
            <CollegeForm
              type="update"
              college={selectedCollegeForEdit}
              showMessage={showMessage}
              refreshData={fetchCollegesAndAdmins}
              onCancel={() => setActiveTab("view-colleges")} // Go back to view
            />
          )}
          {activeTab === "add-uniadmin" && (
            <AddUniAdminForm colleges={colleges} showMessage={showMessage} refreshData={fetchCollegesAndAdmins} />
          )}
          {activeTab === "update-uniadmin" && (
            <UpdateUniAdminForm uniAdmins={uniAdmins} colleges={colleges} showMessage={showMessage} refreshData={fetchCollegesAndAdmins} />
          )}
          {activeTab === "message-uniadmin" && (
            <GiveOrderForm colleges={colleges} uniAdmins={uniAdmins} showMessage={showMessage} />
          )}
        </div>
      )}

      {viewAdminsCollege && (
        <UniAdminsModal
          college={viewAdminsCollege}
          uniAdmins={uniAdmins.filter((a) => (a.college?._id || a.college) === viewAdminsCollege._id)}
          onClose={() => {
            setViewAdminsCollege(null);
            setEditUniAdmin(null);
            setTerminateUniAdmin(null);
          }}
          onEdit={setEditUniAdmin}
          onTerminate={setTerminateUniAdmin}
          editUniAdmin={editUniAdmin}
          onSubmitEdit={handleUniAdminFormSubmit}
          terminateUniAdmin={terminateUniAdmin}
          onSubmitTerminate={confirmTerminateUniAdmin}
          colleges={colleges}
        />
      )}
    </div>
  );
};

export default CollegesPage;

const TabButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-md
      ${active ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800"}`}
  >
    {children}
  </button>
);