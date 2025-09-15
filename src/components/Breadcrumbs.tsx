'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  active: boolean;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  const breadcrumbs = useMemo(() => {
    // Always start with home
    const items: BreadcrumbItem[] = [
      {
        label: 'Home',
        href: '/',
        active: pathname === '/'
      }
    ];
    
    // Skip if we're on the home page
    if (pathname === '/') {
      return items;
    }
    
    // Split the pathname into segments
    const segments = pathname.split('/').filter(Boolean);
    
    // Build up the breadcrumb items
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Format the label (capitalize, replace dashes with spaces)
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase()).replaceAll('_', ' ');
      
      items.push({
        label,
        href: currentPath,
        active: currentPath === pathname
      });
    });
    
    return items;
  }, [pathname]);
  
  // Don't show breadcrumbs on the home page
  if (pathname === '/') {
    return null;
  }
  
  return (
    <nav aria-label="Breadcrumb" className="max-w-8xl px-4 py-2">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-medium-gray mx-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            
            {breadcrumb.active ? (
              <span className="font-medium text-primary">{breadcrumb.label.toUpperCase()}</span>
            ) : (
              <Link 
                href={breadcrumb.href}
                className="text-medium-gray hover:text-primary transition-colors duration-fast"
              >
                {breadcrumb.label.toUpperCase()}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
