// app/sitemap/page.jsx
"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, BookOpen, Briefcase, Globe, User, Settings, FileText, Shield, HelpCircle, Phone, ArrowRight } from 'lucide-react';

const sitemapData = {
  main: [
    { href: '/', label: 'Home', icon: <Home /> },
    { href: '/#announcements', label: 'Announcements', icon: <Globe /> },
    { href: '/notes', label: 'Notes & Resources', icon: <BookOpen /> },
    { href: '/internships', label: 'Internships', icon: <Briefcase /> },
  ],
  account: [
    { href: '/login', label: 'Login', icon: <User /> },
    { href: '/signup', label: 'Sign Up', icon: <User /> },
    { href: '/profile/settings', label: 'Profile Settings', icon: <Settings /> },
  ],
  resources: [
    { href: '/about', label: 'About Us', icon: <HelpCircle /> },
    { href: '/contact', label: 'Contact Support', icon: <Phone /> },
    { href: '/faq', label: 'FAQ', icon: <HelpCircle /> },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy', icon: <Shield /> },
    { href: '/terms', label: 'Terms of Service', icon: <FileText /> },
  ],
};

const SitemapCard = ({ title, links }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-unilight-card dark:bg-unidark-card p-6 rounded-xl shadow-lg border border-unilight-border-gray-200 dark:border-unidark-border-gold-10"
  >
    <h3 className="text-xl font-bold mb-4 text-unilight-accent-amber dark:text-unidark-accent-gold">{title}</h3>
    <ul className="space-y-3">
      {links.map(({ href, label, icon }) => (
        <li key={href}>
          <Link href={href} className="flex items-center text-unilight-text-700 dark:text-unidark-text-200 hover:text-unilight-accent-red dark:hover:text-unidark-accent-red group transition-colors duration-200">
            <span className="mr-3 text-unilight-accent-amber dark:text-unidark-accent-gold">{icon}</span>
            <span>{label}</span>
            <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </li>
      ))}
    </ul>
  </motion.div>
);

const SitemapPage = () => {
  return (
    <div className="mt-20 min-h-screen bg-gradient-to-br from-unilight-bg to-unilight-bg-gradient-to dark:from-unidark-bg dark:to-unidark-bg-gradient-to p-4 sm:p-8 lg:p-12 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-unilight-accent-red to-unilight-accent-amber dark:from-unidark-accent-red dark:to-unidark-accent-gold">
              Website Sitemap
            </span>
          </h1>
          <p className="text-lg text-unilight-text-700 dark:text-unidark-text-200 max-w-2xl mx-auto">
            Navigate through all the pages and resources available on UNIPDATES. Find exactly what you need with this complete overview of our site.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <SitemapCard title="Main Navigation" links={sitemapData.main} />
          <SitemapCard title="User Account" links={sitemapData.account} />
          <SitemapCard title="Resources & Support" links={sitemapData.resources} />
          <SitemapCard title="Legal" links={sitemapData.legal} />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-unilight-text-600 dark:text-unidark-text-300 mb-4">Can't find what you're looking for?</p>
          <Link href="/contact" className="inline-block bg-unilight-accent-amber text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-unilight-accent-amber-400 transition-colors duration-200 dark:bg-unidark-accent-gold dark:hover:bg-unidark-accent-gold-30">
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SitemapPage;
