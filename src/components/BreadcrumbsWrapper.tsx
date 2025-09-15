'use client';

import { usePathname } from 'next/navigation';
import Breadcrumbs from './Breadcrumbs';

const BreadcrumbsWrapper = () => {
  const pathname = usePathname(); // Get the current path

  // Conditionally render the Breadcrumbs only if the page is not the login page
  if (pathname.includes('/auth') || pathname.includes('pending-approval')) {
    return null; // Do not show breadcrumbs on the login page
  }

  return <Breadcrumbs />; // Show breadcrumbs on all other pages
};

export default BreadcrumbsWrapper;
