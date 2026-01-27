/**
 * Main Layout Component
 * Provides header, footer, and responsive container for the app
 */

"use client";

import { useState, useEffect, ReactNode } from "react";
import { Plane, MapPin, Calendar, Users } from "lucide-react";

interface SearchSummary {
  departure?: string;
  arrival?: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
}

interface MainLayoutProps {
  children: ReactNode;
  searchSummary?: SearchSummary;
  onSearchClick?: () => void;
  showStickySearch?: boolean;
  className?: string;
}

/**
 * Header Component with Logo and Search Summary
 */
function Header({
  searchSummary,
  onSearchClick,
  isStickyVisible,
}: {
  searchSummary?: SearchSummary;
  onSearchClick?: () => void;
  isStickyVisible: boolean;
}) {
  return (
    <>
      {/* Main Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Flight Search
                </h1>
                <p className="text-sm text-blue-100">
                  Find your perfect flight
                </p>
              </div>
            </div>

            {/* Search Summary on Desktop */}
            {searchSummary && !isStickyVisible && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                {searchSummary.departure && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{searchSummary.departure}</span>
                  </div>
                )}
                {searchSummary.arrival && (
                  <div className="flex items-center gap-1">
                    <Plane className="w-4 h-4 rotate-90" />
                    <span>{searchSummary.arrival}</span>
                  </div>
                )}
                {searchSummary.departDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{searchSummary.departDate}</span>
                  </div>
                )}
                {searchSummary.passengers && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{searchSummary.passengers}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Summary on Mobile */}
          {searchSummary && !isStickyVisible && (
            <div className="md:hidden grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded">
                <MapPin className="w-4 h-4" />
                <span>{searchSummary.departure || "-"}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded">
                <Plane className="w-4 h-4 rotate-90" />
                <span>{searchSummary.arrival || "-"}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded">
                <Calendar className="w-4 h-4" />
                <span>{searchSummary.departDate || "-"}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded">
                <Users className="w-4 h-4" />
                <span>
                  {searchSummary.passengers
                    ? `${searchSummary.passengers} pax`
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sticky Search Bar on Mobile (appears on scroll down) */}
      {isStickyVisible && onSearchClick && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-md md:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                {searchSummary?.departure} → {searchSummary?.arrival}
              </span>
            </div>
            <button
              onClick={onSearchClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              aria-label="Modify search"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Footer Component
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">Flight Search</span>
            </div>
            <p className="text-sm text-gray-400">
              Your one-stop destination for finding and comparing flights
              worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Search Flights
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  My Bookings
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Deals
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between text-sm">
          <p className="text-gray-400">
            © {currentYear} Flight Search. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-400 transition">
              Twitter
            </a>
            <a href="#" className="hover:text-blue-400 transition">
              Facebook
            </a>
            <a href="#" className="hover:text-blue-400 transition">
              Instagram
            </a>
            <a href="#" className="hover:text-blue-400 transition">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Main Layout Component
 * Wraps content with header, footer, and responsive container
 */
export function MainLayout({
  children,
  searchSummary,
  onSearchClick,
  showStickySearch = true,
  className = "",
}: MainLayoutProps) {
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  useEffect(() => {
    if (!showStickySearch) return;

    const handleScroll = () => {
      // Show sticky search when scrolled down more than 200px
      const isScrolled = window.scrollY > 200;
      setIsStickyVisible(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showStickySearch]);

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <Header
        searchSummary={searchSummary}
        onSearchClick={onSearchClick}
        isStickyVisible={isStickyVisible && showStickySearch}
      />

      {/* Add padding when sticky search is visible on mobile */}
      <div
        className={`transition-all duration-300 ${
          isStickyVisible && showStickySearch ? "pt-16 md:pt-0" : ""
        }`}
      >
        {/* Main Content - Responsive Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/**
 * Compact Header Component (for minimal header variant)
 */
export function CompactHeader({
  searchSummary,
  onSearchClick,
}: {
  searchSummary?: SearchSummary;
  onSearchClick?: () => void;
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">Flight Search</span>
          </div>

          {/* Search Summary */}
          {searchSummary && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {searchSummary.departure}
              </span>
              <Plane className="w-4 h-4 text-gray-400 rotate-90" />
              <span className="flex items-center gap-1">
                {searchSummary.arrival}
              </span>
              <span className="flex items-center gap-1 text-gray-400 ml-4">
                <Calendar className="w-4 h-4" />
                {searchSummary.departDate}
              </span>
            </div>
          )}

          {/* Search Button */}
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Edit Search
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Layout with Sidebar
 * For pages that need a sidebar + main content layout
 */
interface SidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarClassName?: string;
  className?: string;
}

export function SidebarLayout({
  sidebar,
  children,
  sidebarClassName = "w-64",
  className = "",
}: SidebarLayoutProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside className={`hidden lg:block ${sidebarClassName}`}>
        <div className="sticky top-32">{sidebar}</div>
      </aside>

      {/* Main Content */}
      <section className="lg:col-span-3">{children}</section>
    </div>
  );
}

/**
 * Container Component for consistent max-width
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-7xl mx-auto px-4 lg:px-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section Component for consistent spacing
 */
export function Section({
  children,
  title,
  description,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={`space-y-6 ${className}`}>
      {title && (
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-gray-600 text-sm lg:text-base">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
