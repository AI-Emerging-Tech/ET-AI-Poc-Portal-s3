'use client'; // Ensure this is a client-side component

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Logo from 'assets/ValueMomentum-Logo.png';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessControl } from '../hooks/useAccessControl';

export default function HeaderWithSession() {
  const { data: session, status } = useSession(); // Retrieve session data
  const pathname = usePathname(); // Get the current path
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const router = useRouter();
  const isRedirectingRef = useRef(false);
  const { accessLevel, pageAccess, accessAllowed } = useAccessControl();

  // Check if this is a PoC page
  const isPoCPage = pathname?.startsWith('/pocs/');
  const hasPageAccess = pageAccess && pageAccess[pathname] && pageAccess[pathname] === "full"
  const isViewOnly = (accessLevel === "view-only" || (accessLevel === "partial" && !hasPageAccess)|| !accessAllowed) && isPoCPage;
  
  // Conditionally hide links if the current page is an auth page
  const isLoginPage = pathname === '/auth' || pathname === '/auth/processing';
  const isPendingApprovalPage = pathname === '/pending-approval';
  const isHomePage = pathname === '/';
  const isAboutUsPage = pathname === '/about_us';
  const isAuthPage = isLoginPage || isPendingApprovalPage;

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Load user data from session or localStorage as fallback
  useEffect(() => {
    let currentRole = session?.user?.role;
    let currentStatus = session?.user?.status;
    
    if ((!currentRole || !currentStatus) && status === 'authenticated') {
      // Fallback to localStorage data
      try {
        const userDataStr = localStorage.getItem('vm_user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          currentRole = currentRole || (userData.roles && userData.roles[0]);
          currentStatus = currentStatus || userData.status;
        }
      } catch (error) {
        console.error('Error reading user data from localStorage:', error);
      }
    }
    
    setUserRole(currentRole || null);
    setUserStatus(currentStatus || null);
  }, [session, status]);

  // Handle session expiration - but NOT on auth pages or pending page
  useEffect(() => {
    // Skip if already redirecting
    if (isRedirectingRef.current || status === 'loading') return;
    
    // Don't redirect on auth pages
    if (!isAuthPage && !isHomePage && !isAboutUsPage) {
      // Check for unauthenticated status
      if (status === 'unauthenticated') {
        console.log('Session unauthenticated, redirecting to auth');
        isRedirectingRef.current = true;
        signOut({ callbackUrl: '/auth', redirect: false });
        router.push('/auth');
        return;
      }
      
      // Check for JWT expiry
      if (session?.expires) {
        const now = new Date();
        const expiryTime = new Date(session.expires);
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        
        console.log('Session expiry check:', {
          now: now.toISOString(),
          expires: session.expires,
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + 's'
        });
        
        if (expiryTime <= now) {
          console.log('JWT token has expired, redirecting to auth');
          isRedirectingRef.current = true;
          signOut({ callbackUrl: '/auth', redirect: false });
          router.push('/auth');
          return;
        }
        
        // Set a timeout to redirect when the token expires
        if (timeUntilExpiry > 0 && timeUntilExpiry < 60000) { // If expiring within 1 minute
          const timeoutId = setTimeout(() => {
            if (!isRedirectingRef.current) {
              console.log('JWT token expired via timeout, redirecting to auth');
              isRedirectingRef.current = true;
              signOut({ callbackUrl: '/auth', redirect: false });
              router.push('/auth');
            }
          }, timeUntilExpiry);
          
          return () => clearTimeout(timeoutId);
        }
      }
    }
    
    return () => {
      // Reset flag when component unmounts or dependencies change
      isRedirectingRef.current = false;
    };
  }, [session, status, isAuthPage, isHomePage, isAboutUsPage, router]);

  // Handle user status for pending users
  useEffect(() => {
    // Skip if already redirecting or loading
    if (isRedirectingRef.current || status === 'loading') return;
    
    // If user is authenticated and has PENDING status, redirect to pending page
    // unless they're already there
    if (status === 'authenticated' && 
        userStatus === 'PENDING' && 
        !isPendingApprovalPage &&
        !isLoginPage) {
      isRedirectingRef.current = true;
      router.push('/pending-approval');
    }
    
    return () => {
      // Reset flag when component unmounts or dependencies change
      isRedirectingRef.current = false;
    };
  }, [session, status, router, isPendingApprovalPage, isLoginPage, userStatus]);

  const navLinkStyle = "text-medium-gray hover:text-primary font-medium px-3 py-2 rounded transition-all duration-normal nav-link-hover relative z-10";
  const mobileNavLinkStyle = "block w-full text-center py-3 text-medium-gray hover:text-primary font-medium transition-colors duration-300";

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;
    
    // Sign out but don't rely on the built-in redirect which may be causing issues
    await signOut({ redirect: false });
    localStorage.removeItem('vm_access_token');
    localStorage.removeItem('vm_user_data');
    router.push('/auth');
  };

  return (
    <header className={`ai-header transition-all duration-300 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      {/* Add subtle pattern overlay */}
      <div className="absolute inset-0 pattern-circuit opacity-[0.1]"></div>
      
      <div className="container max-w-ultra mx-auto px-4 py-3 flex justify-between items-center relative z-10">
        {/* Logo section */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-full">
            <Image
              src={Logo}
              alt="ValueMomentum Logo"
              height={44}
              className="h-11 w-auto transition-all duration-normal"
            />
          </div>
          <div className="flex flex-col ml-1">
            {/* <span className="text-dark-gray font-bold tracking-tight hidden md:block text-sm">
              ValueMomentum
            </span> */}
            <span className="text-gradient font-semibold tracking-tight md:block text-lg">
              AI & Emerging Technologies
            </span>
          </div>
        </Link>
        
        {/* View Only badge - Positioned centrally */}
        {isViewOnly && (
          <div className="absolute left-1/2 transform -translate-x-1/2 z-50">
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold md:animate-pulse">
              View Only
            </span>
          </div>
        )}
        
        {/* Conditionally show the navigation only if it's not an auth page */}
        {!isLoginPage && (
          <>
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 focus:outline-none" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop navigation */}
            <nav className="md:flex items-center gap-3 md:gap-6 md:relative max-sm:hidden">
              {/* Add subtle animated dot in background */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-10 pointer-events-none">
                <div className="data-point absolute top-1/2 left-1/3"></div>
                <div className="data-point absolute top-1/3 right-1/4" style={{ animationDelay: '1s' }}></div>
                <div className="data-point absolute bottom-1/4 right-1/3" style={{ animationDelay: '0.5s' }}></div>
              </div>
              
              {(userRole == "ADMINISTRATOR" || userRole == "DEVELOPER") && (
                <div className="relative px-1">
                  <Link 
                    href="/andromeda" 
                    className={navLinkStyle}
                  >
                    Andromeda Docs
                  </Link>
                </div>
              )}
              {(userRole == "ADMINISTRATOR" || userRole === "DEVELOPER") && (
                <div className="relative px-1">
                  <Link 
                    href="/agentops" 
                    className={navLinkStyle}
                  >
                    AgentOps
                  </Link>
                </div>
              )}
              <div className="relative px-1">
                <Link 
                  href="https://valuemomentum.com/insights/blogs/" 
                  className={navLinkStyle}
                >
                  Blogs
                </Link>
              </div>
              
              <div className="relative px-1">
                <Link 
                  href="/about_us" 
                  className={navLinkStyle}
                >
                  About Us
                </Link>
              </div>
              
              {/* Show Users nav only for ADMINISTRATOR */}
              {userRole === "ADMINISTRATOR" && (
                <div className="relative px-1">
                  <Link 
                    href="/admin/user-access" 
                    className={navLinkStyle}
                  >
                    Users
                  </Link>
                </div>
              )}
              
              {/* Show Logout button if the user is logged in */}
              {session ? (
                <div className="relative px-1">
                  <button
                    onClick={handleLogout}
                    disabled={isRedirectingRef.current}
                    className="btn-logout ml-2 relative z-10"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="relative px-1">
                  <Link href="/auth" className="btn-logout group relative z-10">
                    <span>Login</span>
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" style={{ transform: 'translateX(-50%)' }}></span>
                  </Link>
                </div>
              )}
            </nav>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {!isLoginPage && mobileMenuOpen && (
        <div className="md:hidden absolute z-50 w-full bg-white shadow-lg animate-fadeIn" 
          style={{
            animation: 'fadeIn 0.3s ease-out',
            transformOrigin: 'top',
            boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.15)'
          }}>
          <nav className="flex flex-col py-3">
            <Link 
              href="https://valuemomentum.com/insights/blogs/"
              className={mobileNavLinkStyle}
            >
              Blogs
            </Link>
            
            <Link 
              href="/about_us"
              className={mobileNavLinkStyle}
            >
              About Us
            </Link>
            
            {userRole === "ADMINISTRATOR" && (
              <Link 
                href="/admin/user-access"
                className={mobileNavLinkStyle}
              >
                Users
              </Link>
            )}
            
            {session ? (
              <button
                onClick={handleLogout}
                disabled={isRedirectingRef.current}
                className="w-full py-3 text-center text-primary font-medium hover:bg-gray-50 transition-colors duration-300"
              >
                Logout
              </button>
            ) : (
              <Link 
                href="/auth"
                className="w-full py-3 text-center text-primary font-medium hover:bg-gray-50 transition-colors duration-300"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}