'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import ThemeToggler from '@/components/ThemeToggler';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/notes', label: 'Notes', icon: '📚' },
  { href: '/internships', label: 'Internships', icon: '💼' },
  { href: '/#announcements', label: 'Global Updates', icon: '🌍' },
];

const isActiveTab = (pathname, href) => {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`
        fixed top-0 left-0 w-full z-50
        ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700' : 'bg-transparent border-b border-transparent'}
        backdrop-blur-lg
        transition-all duration-300
        font-sans
        shadow-sm
      `}
    >
      <div className="container mx-auto flex justify-between items-center py-3 px-4 md:px-8">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              shadow-md rounded-xl p-1
              transition-all duration-300
            "
          >
            <img
              src="/logo.png"
              alt="UNIPDATES Logo"
              className="w-10 h-10 rounded-lg object-contain"
            />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="
              text-2xl md:text-3xl font-extrabold tracking-wide select-none
              bg-gradient-to-r from-[#FFD301] via-[#FF3B3B] to-[#FFB300]
              dark:from-[#FFD301] dark:via-[#FF3B3B] dark:to-[#FFD301]
              bg-clip-text text-transparent
              drop-shadow-[0_4px_16px_rgba(255,63,59,0.30)]
              transition-all duration-300
              group-hover:brightness-125
            "
          >
            UNIPDATES
          </motion.span>
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggler />
          {isAuthenticated && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMenu}
            className="text-gray-700 dark:text-gray-200 focus:outline-none rounded-md p-1"
            aria-label="Menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </motion.button>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated && navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="relative px-3 py-2 group"
            >
              <span className={`flex items-center text-lg font-medium transition-colors ${isActiveTab(pathname, href) ? 'text-amber-500 dark:text-amber-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}>
                <span className="mr-2">{icon}</span>
                {label}
              </span>
              
              {isActiveTab(pathname, href) && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}

          {/* Auth Section */}
          <div className="flex items-center space-x-6 ml-4"> {/* Increased space-x for more separation */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile/settings"
                  className="flex items-center space-x-2 group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border-2 border-amber-400 dark:border-amber-300 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/36x36/cccccc/333333?text=P";
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-gray-700 border-2 border-amber-400 dark:border-amber-300 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                    )}
                    {isActiveTab(pathname, '/profile/settings') && (
                      <motion.span
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </motion.div>
                  <span className="hidden lg:inline-block font-medium text-gray-700 dark:text-gray-200">
                    {user?.name?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="
                    bg-gradient-to-r from-[#FF3B3B] to-[#FFB300]
                    text-white font-semibold py-2 px-5 rounded-full
                    shadow-md hover:shadow-lg transition-all
                  "
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    href="/login"
                    className="
                      px-5 py-2 rounded-full font-semibold
                      text-amber-600 dark:text-amber-400
                      hover:bg-amber-50 dark:hover:bg-gray-800
                      transition-colors
                    "
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link
                    href="/signup"
                    className="
                      bg-gradient-to-r from-[#FFB300] to-[#FF3B3B]
                      text-white font-semibold py-2 px-5 rounded-full
                      shadow-md hover:shadow-lg transition-all
                    "
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
            <ThemeToggler />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col space-y-2 px-4 pb-4 pt-2">
              {isAuthenticated && navLinks.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={toggleMenu}
                  className={`
                    flex items-center py-3 px-4 rounded-lg text-lg
                    ${isActiveTab(pathname, href)
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    transition-colors
                  `}
                >
                  <span className="mr-3 text-xl">{icon}</span>
                  {label}
                  {isActiveTab(pathname, href) && (
                    <motion.span
                      className="ml-auto w-2 h-2 bg-amber-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile/settings"
                    onClick={toggleMenu}
                    className={`
                      flex items-center py-3 px-4 rounded-lg
                      ${isActiveTab(pathname, '/profile/settings')
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                      transition-colors
                    `}
                  >
                    <span className="mr-3 text-xl">👤</span>
                    Profile
                    {isActiveTab(pathname, '/profile/settings') && (
                      <motion.span
                        className="ml-auto w-2 h-2 bg-amber-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </Link>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { logout(); toggleMenu(); }}
                    className="
                      w-full text-left py-3 px-4 rounded-lg
                      bg-gradient-to-r from-[#FF3B3B] to-[#FFB300]
                      text-white font-semibold
                      mt-4 {/* Changed from mt-2 for more separation */}
                    "
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/login"
                      onClick={toggleMenu}
                      className="
                        w-full text-left py-3 px-4 rounded-lg
                        bg-gradient-to-r from-[#FFB300] to-[#FF3B3B]
                        text-white font-semibold
                      "
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/signup"
                      onClick={toggleMenu}
                      className="
                        w-full text-left py-3 px-4 rounded-lg
                        bg-gradient-to-r from-[#FF3B3B] to-[#FFB300]
                        text-white font-semibold
                      "
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;