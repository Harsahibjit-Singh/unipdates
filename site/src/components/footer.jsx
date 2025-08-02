// components/Footer.jsx
"use client"; // This is a client component

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion'; // For subtle animations
import { useTheme } from 'next-themes'; // To ensure theme consistency, though footer is dark-only
import { Facebook, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'; // Lucide icons for social media and contact info
// import { IconHandshake } from "tabler-icons-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme(); // Get current theme, though this footer is designed for dark mode

  return (
    <footer className="bg-unidark-card-deep text-unidark-text-300 py-12 px-4 sm:px-8 lg:px-16 font-sans border-t border-unidark-border-gold-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Column 1: Company Info */}
        <div className="flex flex-col items-start md:col-span-1">
          <Link href="/" className="text-3xl font-extrabold tracking-wider mb-4 bg-clip-text text-transparent bg-gradient-to-r from-unidark-accent-red to-unidark-accent-gold">
            UNIPDATES
          </Link>
          <p className="text-unidark-text-400 text-sm leading-relaxed mb-4">
            Empowering students with timely and relevant information, fostering academic excellence and career opportunities. Your trusted partner in university life.
          </p>
          <div className="flex space-x-4">
            {/* Social Media Icons using Lucide */}
            <motion.a
              href="#"
              whileHover={{ scale: 1.2, color: '#FFD301' }} // Gold accent on hover
              transition={{ duration: 0.2 }}
              className="text-unidark-text-400"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6" />
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.2, color: '#FFD301' }}
              transition={{ duration: 0.2 }}
              className="text-unidark-text-400"
              aria-label="Twitter"
            >
              <Twitter className="w-6 h-6" />
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.2, color: '#FFD301' }}
              transition={{ duration: 0.2 }}
              className="text-unidark-text-400"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.2, color: '#FFD301' }}
              transition={{ duration: 0.2 }}
              className="text-unidark-text-400"
              aria-label="YouTube"
            >
              <Youtube className="w-6 h-6" />
            </motion.a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-unidark-text-100 mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Home</Link></li>
            <li><Link href="/notes" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Notes & Resources</Link></li>
            <li><Link href="/internships" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Internship Opportunities</Link></li>
            <li><Link href="/about" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">About Us</Link></li>
            <li><Link href="/support" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Support</Link></li>
          </ul>
        </div>

        {/* Column 3: Resources & Support */}
        <div>
          <h3 className="text-lg font-semibold text-unidark-text-100 mb-4">Resources & Support</h3>
          <ul className="space-y-2">
            <li><Link href="/faq" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">FAQ</Link></li>
            <li><Link href="/privacy" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Terms of Service</Link></li>
            <li><Link href="/sitemap" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Sitemap</Link></li>
            <li><Link href="/admin" className="text-unidark-text-400 hover:text-unidark-accent-gold transition-colors duration-200">Admin Panel</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-unidark-text-100 mb-4">Contact Us</h3>


          <p className="text-unidark-text-400 text-sm mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2 text-unidark-accent-gold"
              viewBox="0 -8 72 72"
              fill="currentColor"
            >
              <path d="M64 12.78v17s-3.63.71-4.38.81-3.08.85-4.78-.78C52.22 27.25 42.93 18 42.93 18a3.54 3.54 0 0 0-4.18-.21c-2.36 1.24-5.87 3.07-7.33 3.78a3.37 3.37 0 0 1-5.06-2.64 3.44 3.44 0 0 1 2.1-3c3.33-2 10.36-6 13.29-7.52 1.78-1 3.06-1 5.51 1C50.27 12 53 14.27 53 14.27a2.75 2.75 0 0 0 2.26.43C58.63 14 64 12.78 64 12.78M27 41.5a3 3 0 0 0-3.55-4.09 3.07 3.07 0 0 0-.64-3 3.13 3.13 0 0 0-3-.75 3.07 3.07 0 0 0-.65-3 3.38 3.38 0 0 0-4.72.13c-1.38 1.32-2.27 3.72-1 5.14s2.64.55 3.72.3c-.3 1.07-1.2 2.07-.09 3.47s2.64.55 3.72.3c-.3 1.07-1.16 2.16-.1 3.46s2.84.61 4 .25c-.45 1.15-1.41 2.39-.18 3.79s4.08.75 5.47-.58a3.32 3.32 0 0 0 .3-4.68A3.18 3.18 0 0 0 27 41.5m25.35-8.82L41.62 22a3.53 3.53 0 0 0-3.77-.68c-1.5.66-3.43 1.56-4.89 2.24a8.15 8.15 0 0 1-3.29 1.1 5.59 5.59 0 0 1-3-10.34C29 12.73 34.09 10 34.09 10a6.46 6.46 0 0 0-5-2c-3.42 0-10.58 4.7-10.58 4.7a5.61 5.61 0 0 1-4.93.13L8 10.89v19.4s1.59.46 3 1a6.3 6.3 0 0 1 1.56-2.47 6.17 6.17 0 0 1 8.48-.06 5.4 5.4 0 0 1 1.34 2.37 5.5 5.5 0 0 1 2.29 1.4A5.4 5.4 0 0 1 26 34.94a5.47 5.47 0 0 1 3.71 4 5.4 5.4 0 0 1 2.39 1.43 5.65 5.65 0 0 1 1.48 4.89s.8.9 1.29 1.39a2.46 2.46 0 0 0 3.48-3.48s2 2.48 4.28 1c2-1.4 1.69-3.06.74-4a3.19 3.19 0 0 0 4.77.13 2.45 2.45 0 0 0 .13-3.3s1.33 1.81 4 .12c1.89-1.6 1-3.43 0-4.39Z" />
            </svg>

            <a href="/contact" className="hover:text-unidark-accent-gold transition-colors duration-200">Contact Unipdates</a>
          </p>
          <p className="text-unidark-text-400 text-sm mb-2 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-unidark-accent-gold" />
            Email: <a href="unipdates@gmail.com" className="hover:text-unidark-accent-gold transition-colors duration-200 ml-1">unipdates@gmail.com</a>
          </p>
          <p className="text-unidark-text-400 text-sm mb-2 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-unidark-accent-gold" />
            Phone: <a href="tel:+1234567890" className="hover:text-unidark-accent-gold transition-colors duration-200 ml-1">+91 9801777514</a>
          </p>
          <p className="text-unidark-text-400 text-sm flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-unidark-accent-gold" />
            Address: Gharuan Mohali, Punjab, India 140413
          </p>
          <p className="text-unidark-text-400 text-sm mt-4">
            Follow us for the latest updates!
          </p>
        </div>

      </div>

      {/* Bottom Bar: Copyright */}
      <div className="border-t border-unidark-border-gold-10 mt-10 pt-6 text-center text-unidark-text-400 text-sm">
        &copy; {currentYear} UNIPDATES. All rights reserved. Designed and developed with passion for student success.
      </div>
    </footer>
  );
};

export default Footer;
