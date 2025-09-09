'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const isAdmin = session?.user?.role === 'ADMINISTRATOR';
  
  const adminNavLinks = [
    {
      name: 'User Access',
      href: '/admin/user-access',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      name: 'Review Registrations',
      href: '/admin/review-registrations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      {isAdmin && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-8xl mx-auto px-4">
            <div className="flex items-center space-x-1">
              {adminNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-normal border-b-2 ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-gray-300'
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
} 