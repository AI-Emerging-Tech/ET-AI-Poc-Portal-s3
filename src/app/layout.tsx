import HeaderWithSession from 'components/HeaderWithSession';
import SessionProviderWrapper from 'components/SessionProviderWrapper'; // Import the client-side wrapper
import BreadcrumbsWrapper from 'components/BreadcrumbsWrapper'; // Import the BreadcrumbsWrapper component
import './globals.css';
import { ToastProvider } from 'components/ToastContainer';

export const metadata = {
  title: 'ValueMomentum Emerging Tech Studio',
  description: 'A portal for demonstrating various PoCs developed by ValueMomentum',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-light-gray overflow-x-hidden">
        {/* AI-themed background elements */}
        <div className="fixed top-0 right-0 w-1/3 h-1/3 -z-10 opacity-50 rounded-full blur-3xl" 
          style={{ background: 'linear-gradient(to bottom, rgba(147, 197, 253, 0.1), transparent)' }}>
        </div>
        <div className="fixed bottom-0 left-0 w-1/2 h-1/2 -z-10 opacity-30 rounded-full blur-3xl" 
          style={{ background: 'linear-gradient(to top, rgba(124, 58, 237, 0.05), transparent)' }}>
        </div>
        
        <SessionProviderWrapper>
          <ToastProvider>
            {/* Header */}
            <HeaderWithSession />
            
            {/* Conditionally show breadcrumbs, but hide on the login page */}
            <BreadcrumbsWrapper />

            {/* Main Content with flex-grow to push the footer down */}
            <main className="flex-grow container-fluid relative pb-20">
              {children}
            </main>
          </ToastProvider>
        </SessionProviderWrapper>

        {/* Enhanced Footer */}
        <footer className="ai-footer">
          {/* Add subtle pattern overlay */}
          <div className="absolute inset-0 pattern-circuit opacity-[0.1]"></div>
          
          <div className="container max-w-ultra mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Column 1: About */}
              <div>
                <h4 className="text-lg font-semibold mb-4 relative inline-block">
                  About ValueMomentum
                  <span className="absolute -bottom-1 left-0 w-1/2 h-0.5" style={{ background: 'linear-gradient(to right, var(--color-primary-light), transparent)' }}></span>
                </h4>
                <p className="text-sm text-gray-300">
                  ValueMomentum is one of the leading software and services companies for P&C Insurance.
                </p>
              </div>
              
              {/* Column 2: Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4 relative inline-block">
                  Quick Links
                  <span className="absolute -bottom-1 left-0 w-1/2 h-0.5" style={{ background: 'linear-gradient(to right, var(--color-primary-light), transparent)' }}></span>
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://www.valuemomentum.com/" className="text-sm text-gray-300 hover:text-white transition-colors duration-normal flex items-center group">
                      <span className="w-0 h-px bg-primary-light group-hover:w-2 mr-0 group-hover:mr-1 transition-all"></span>
                      Corporate Website
                    </a>
                  </li>
                  <li>
                    <a href="https://www.valuemomentum.com/careers" className="text-sm text-gray-300 hover:text-white transition-colors duration-normal flex items-center group">
                      <span className="w-0 h-px bg-primary-light group-hover:w-2 mr-0 group-hover:mr-1 transition-all"></span>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="/about_us" className="text-sm text-gray-300 hover:text-white transition-colors duration-normal flex items-center group">
                      <span className="w-0 h-px bg-primary-light group-hover:w-2 mr-0 group-hover:mr-1 transition-all"></span>
                      About the Lab
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Column 3: Legal */}
              {/* <div>
                <h4 className="text-lg font-semibold mb-4 relative inline-block">
                  Legal
                  <span className="absolute -bottom-1 left-0 w-1/2 h-0.5" style={{ background: 'linear-gradient(to right, var(--color-primary-light), transparent)' }}></span>
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors duration-normal flex items-center group">
                      <span className="w-0 h-px bg-primary-light group-hover:w-2 mr-0 group-hover:mr-1 transition-all"></span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors duration-normal flex items-center group">
                      <span className="w-0 h-px bg-primary-light group-hover:w-2 mr-0 group-hover:mr-1 transition-all"></span>
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div> */}
            </div>
            
            {/* Copyright */}
            <div className="pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
              <div className="flex justify-center items-center space-x-2">
                <div className="data-point" style={{ position: 'static', marginTop: '0.5rem', marginRight: '0.5rem' }}></div>
                &copy; {new Date().getFullYear()} ValueMomentum, Inc. All rights reserved.
                <div className="data-point" style={{ position: 'static', marginTop: '0.5rem', marginLeft: '0.5rem' }}></div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
