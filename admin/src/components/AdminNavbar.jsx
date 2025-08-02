// components/AdminNavbar.jsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext'; // Assuming this context exists and provides adminUser, isAdminAuthenticated, logout

import {
  Home, // Dashboard
  Megaphone, // Global Updates
  University, // Uni Updates
  Users, // Public Users
  MessageSquare, // Contact Requests
  LifeBuoy, // Support Tickets
  LogOut, // Logout
  Menu, // Mobile menu icon
  X, // Close mobile menu icon
  UserCircle, // User profile icon
  ChevronRight, // For active link indicator
} from 'lucide-react';

const AdminNavbar = () => {
  const { isAdminAuthenticated, adminUser, isSuperadmin, adminLogout } = useAdminAuth();
  const pathname = usePathname(); // Get current path for active link highlighting
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation links with their properties, including required roles
  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['superadmin', 'uniadmin'] },
    { name: 'Global Updates', href: '/globalupdates', icon: Megaphone, roles: ['superadmin'] },
    { name: 'Uni Updates', href: '/uniupdates', icon: University, roles: ['superadmin', 'uniadmin'] },
    { name: 'Public Users', href: '/publicusers', icon: Users, roles: ['superadmin'] },
    { name: 'Contact Requests', href: '/contacts', icon: MessageSquare, roles: ['superadmin', 'uniadmin'] },
    { name: 'Support Tickets', href: '/support', icon: LifeBuoy, roles: ['superadmin', 'uniadmin'] },
  ];

  // Filter links based on the current user's role
  const filteredNavLinks = navLinks.filter(link =>
    link.roles.includes(adminUser?.role)
  );

  // Handle logout
  const handleLogout = () => {
    adminLogout();
    router.push('/'); // Redirect to admin login page after logout
  };

  // Only render the navbar if the user is authenticated
  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg py-4 px-6 md:px-8 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight hover:text-blue-200 transition-colors duration-200">
          <span className="text-blue-300">Admin</span>Panel
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-2 rounded-md font-medium text-lg transition-all duration-300
                ${pathname === link.href
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                }`}
            >
              <link.icon className="w-5 h-5 mr-2" />
              {link.name}
              {pathname === link.href && <ChevronRight className="w-4 h-4 ml-2" />}
            </Link>
          ))}
        </div>

        {/* User Info and Logout */}
        <div className="hidden md:flex items-center space-x-4">
          {adminUser && (
            <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold shadow-inner">
              <UserCircle className="w-5 h-5 text-blue-200" />
              <span>{adminUser.name || adminUser.username}</span>
              <span className="text-blue-200 text-xs ml-1">({adminUser.role})</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 rounded-md font-semibold text-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white focus:outline-none">
            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-gradient-to-b from-blue-800 to-indigo-900 shadow-xl transform transition-transform duration-300 ease-in-out z-40 md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white focus:outline-none">
            <X className="w-8 h-8" />
          </button>
        </div>
        <div className="flex flex-col items-start px-6 py-4 space-y-4">
          {adminUser && (
            <div className="flex items-center space-x-2 bg-blue-700 px-4 py-2 rounded-full text-sm font-semibold shadow-inner w-full">
              <UserCircle className="w-5 h-5 text-blue-200" />
              <span>{adminUser.name || adminUser.username}</span>
              <span className="text-blue-200 text-xs ml-1">({adminUser.role})</span>
            </div>
          )}
          {filteredNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)} // Close menu on link click
              className={`flex items-center w-full px-4 py-3 rounded-md font-medium text-lg transition-all duration-300
                ${pathname === link.href
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                }`}
            >
              <link.icon className="w-6 h-6 mr-3" />
              {link.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 bg-red-600 rounded-md font-semibold text-lg hover:bg-red-700 transition-colors duration-200 shadow-md mt-4"
          >
            <LogOut className="w-6 h-6 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
