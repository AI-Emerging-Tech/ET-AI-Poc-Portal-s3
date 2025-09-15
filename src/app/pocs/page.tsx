'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from 'components/Card';
import ProtectedRoute from 'components/ProtectedRoute';
import Spinner from 'components/Spinner';

interface PocData {
  path: string;
  metadata: {
    title: string;
    description: string;
    author: string;
    linkDesc: string;
    isExternal: boolean;
  };
  category?: string;
}

export default function PoC() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorizedPocs, setCategorizedPocs] = useState<Record<string, PocData[]>>({});
  const [dataPoints, setDataPoints] = useState<Array<{ top: string; left: string; delay: string }>>([]);

  // Generate data points on client side to avoid hydration mismatch
  useEffect(() => {
    const points = Array.from({ length: 10 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`
    }));
    setDataPoints(points);
  }, []);

  useEffect(() => {
    const fetchPocs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/getPocs');
        const data = await response.json();
        
        // Categorize POCs
        const grouped = data.reduce((acc: Record<string, PocData[]>, poc: PocData) => {
          const segments = poc.path.split('/pocs/');
          const categorySegment = segments[1]?.split('/')[0] || 'other';
          if (!acc[categorySegment]) {
            acc[categorySegment] = [];
          }
          acc[categorySegment].push({ ...poc, category: categorySegment });
          return acc;
        }, {});
        
        setCategorizedPocs(grouped);
        // Keep all categories expanded
        setExpandedCategories(new Set(Object.keys(grouped)));
        setLoading(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to fetch PoC data:", error);
        setLoading(false);
      }
    };

    fetchPocs();
  }, [router]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCardClick = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  const filteredCategories = Object.entries(categorizedPocs).reduce((acc, [category, pocs]) => {
    const filteredPocs = pocs.filter(poc => 
      poc.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) 
      || poc.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())
      // || poc.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredPocs.length > 0) {
      acc[category] = filteredPocs;
    }
    return acc;
  }, {} as Record<string, PocData[]>);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-light-gray relative">
        {loading && <Spinner />}

        {/* Header section with pattern background */}
        <section className="relative bg-white py-12 mb-8">
          <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
          <div className="container max-w-ultra mx-auto px-6 relative z-10">
            <h1 className="text-4xl font-bold mb-4 text-gradient">Proof of Concept Gallery</h1>
            <p className="text-medium-gray max-w-3xl mb-8">
              Explore our collection of innovative solutions developed by the Emerging Technologies team.
            </p>
          
            {/* Enhanced Search Bar */}
            <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search PoCs..."
                className="w-full px-5 py-3 pr-12 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories section */}
        <div className="container max-w-ultra mx-auto px-0 pb-6">
          {/* Data points decoration */}
          <div className="data-points">
            {dataPoints.map((point, i) => (
              <div 
                key={i}
                className="data-point"
                style={{
                  zIndex: 100,
                  top: point.top,
                  left: point.left,
                  animationDelay: point.delay,
                }}
              ></div>
            ))}
          </div>

          {Object.entries(filteredCategories).map(([category, categoryPocs]) => (
            <div key={category} className="mb-10 md:ai-card ai-card-mobile">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary-light/10 p-4 rounded-t-lg hover:from-primary/10 hover:to-primary-light/20 transition-colors duration-normal"
              >
                <h2 className="text-xl font-bold capitalize flex items-center">
                  <span className="inline-block bg-primary/20 text-primary rounded-full p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                  {category.split('_').join(' ').toUpperCase()}
                </h2>
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-sm text-primary transition-transform duration-normal">
                  {expandedCategories.has(category) ? '−' : '+'}
                </span>
              </button>
              
              {expandedCategories.has(category) && (
                <div className="p-6 bg-white rounded-b-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryPocs.map((poc) => (
                    <Card
                      key={poc.path}
                      path={poc.path}
                      metadata={poc.metadata}
                      onClick={handleCardClick}
                    />
                  ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {Object.keys(filteredCategories).length === 0 && (
            <div className="glass-card text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-medium-gray mb-2">
              {searchTerm ? 'No PoCs match your search criteria.' : 'No PoCs available.'}
              </h3>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
