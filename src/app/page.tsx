// page.tsx

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Card from 'components/Card';
import Spinner from 'components/Spinner';

// Define types for our PoC data
interface PocMetadata {
  title: string;
  description: string;
  author: string;
  linkDesc: string;
  isExternal?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  image?: string;
  categoryTags?: string[];
  maturityStage?: string;
  interactivityLevel?: string;
  estimatedExploreTime?: string;
  [key: string]: any; // For any additional fields
}

interface Poc {
  path: string;
  metadata: PocMetadata;
}

export default function Home() {
  const router = useRouter();
  const [pocs, setPocs] = useState<Poc[]>([]);
  const [featuredPocs, setFeaturedPocs] = useState<Poc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [carouselInitialized, setCarouselInitialized] = useState(false);
  const [dataPoints, setDataPoints] = useState<Array<{ top: string; left: string; delay: string }>>([]);

  // Generate data points on client side to avoid hydration mismatch
  useEffect(() => {
    const points = Array.from({ length: 20 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`
    }));
    setDataPoints(points);
  }, []);

  // Fetch data from the API on mount
  useEffect(() => {
    const fetchPocs = async () => {
      try {
        const response = await fetch('/api/getPocs');
        const data = await response.json();
        
        // Filter featured PoCs
        const featured = data.filter((poc: Poc) => poc.metadata.isFeatured);
        setFeaturedPocs(featured);
        
        // Set all PoCs
        setPocs(data);
        setLoading(false);
        
        // Delay carousel initialization to prevent flickering during page load
        setTimeout(() => {
          setCarouselInitialized(true);
        }, 200);
      } catch (error) {
        console.error("Failed to fetch PoC data:", error);
      }
    };

    fetchPocs();
    
    // Remove router.refresh() as it causes unnecessary re-renders
  }, []);

  const handleCardClick = useCallback((path: string) => {
    setLoading(true);
    router.push(path);
  }, [router]);

  // Get class name for carousel item based on its position relative to active item
  const getItemClassName = useCallback((index: number) => {
    if (featuredPocs.length <= 1) return 'parallax-3d-item active';
    
    // Calculate position relative to active index
    const count = featuredPocs.length;
    // Handle circular positioning (items can be before or after in a loop)
    let position = (index - activeIndex + count) % count;
    // Normalize position to -2, -1, 0, 1, 2 range
    if (position > count/2) position -= count;
    
    switch (position) {
      case -2: return 'parallax-3d-item prev-2';
      case -1: return 'parallax-3d-item prev';
      case 0: return 'parallax-3d-item active';
      case 1: return 'parallax-3d-item next';
      case 2: return 'parallax-3d-item next-2';
      default: return 'parallax-3d-item'; // Hidden
    }
  }, [activeIndex, featuredPocs.length]);

  // Go to next or previous slide
  const rotate = useCallback((direction: 'prev' | 'next') => {
    if (featuredPocs.length <= 1) return;
    
    setActiveIndex(current => {
      if (direction === 'next') {
        return (current + 1) % featuredPocs.length;
      } else {
        return (current - 1 + featuredPocs.length) % featuredPocs.length;
      }
    });
  }, [featuredPocs.length]);

  // Go to specific slide by index
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < featuredPocs.length) {
      setActiveIndex(index);
    }
  }, [featuredPocs.length]);

  // Memoize carousel items to prevent unnecessary re-renders
  const carouselItems = useMemo(() => {
    return featuredPocs.map((poc, index) => (
      <div
        key={poc.path}
        className={getItemClassName(index)}
        onClick={() => index === activeIndex ? handleCardClick(poc.path) : goToSlide(index)}
      >
        <Card lessInfo={true} path={poc.path} metadata={poc.metadata} onClick={handleCardClick} />
      </div>
    ));
  }, [featuredPocs, getItemClassName, activeIndex, handleCardClick, goToSlide]);

  // Setup auto-rotation
  useEffect(() => {
    if (featuredPocs.length <= 1 || !carouselInitialized) return;
    
    // Clear any existing timer
    if (autoRotateTimerRef.current) {
      clearInterval(autoRotateTimerRef.current);
    }
    
    // Only auto-rotate if not hovering
    if (!isHovering) {
      autoRotateTimerRef.current = setInterval(() => {
        rotate('next');
      }, 5000); // Rotate every 5 seconds
    }
    
    // Cleanup on unmount
    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, [featuredPocs.length, rotate, isHovering, carouselInitialized]);

  return (
    // <ProtectedRoute>
    <>
      <div className="min-h-screen bg-light-gray relative">
        {loading && <Spinner />}

        {/* Hero Section */}
        <section className="relative bg-white text-dark-gray py-20 overflow-hidden">
          <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary-light/80 flex items-center justify-center animate-[pulse_3s_infinite]">
                  <div className="h-12 w-12 rounded-full bg-primary-light/40 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary-light"></div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary-light/80 animate-[pulse_3s_infinite_0.5s]"></div>
              </div>
            </div> 
            <h1 className="text-4xl md:text-5xl font-bold mb-6 p-2 text-primary-light">Welcome to the <br/>AI & Emerging Tech Studio</h1>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Explore innovative Proofs of Concept<br/> built to showcase the future of technology in P&C Insurance.
            </p>
          </div>
          
          {/* Animated data points */}
          <div className="data-points">
            {dataPoints.map((point, i) => (
              <div 
                key={i}
                className="data-point"
                style={{
                  top: point.top,
                  left: point.left,
                  animationDelay: point.delay,
                }}
              ></div>
            ))}
          </div>
        </section>

        {/* 3D Parallax Featured PoCs Section */}
        {featuredPocs.length > 0 && carouselInitialized && (
          <section className="section bg-white py-12">
            <div className="container max-w-ultra mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 inline-block text-gradient relative">
                  Featured Innovations
                </h2>
                <p className="text-medium-gray mt-3">
                  Discover our most impactful emerging technology solutions
                </p>
              </div>
              
              <div 
                className="parallax-3d-wrapper mx-auto mt-8 mb-4"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                
                {/* Ambient glow effects */}
                <div className="glow-container">
                  <div className="glow-orb"></div>
                  <div className="glow-orb"></div>
                  <div className="glow-orb"></div>
                </div>
                  
                {/* Carousel Stage */}
                <div className="parallax-3d-stage">
                  {carouselItems}
                </div>
                
                
              </div>
              {/* Navigation Buttons */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    rotate('prev');
                  }}
                  className="w-10 h-10 rounded-full backdrop-button shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  aria-label="Previous"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    rotate('next');
                  }}
                  className="w-10 h-10 rounded-full backdrop-button shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  aria-label="Next"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Dot Navigation */}
              <div className="carousel-dots">
                {featuredPocs.map((_, index) => (
                  <button 
                    key={index}
                    className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  ></button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Solutions Section */}
        <section className="section bg-white py-16">
          <div className="container max-w-ultra mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 inline-block text-gradient relative">
                Our Solutions
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary-light via-primary to-accent-green rounded-full"></div>
              </h2>
              <p className="text-medium-gray max-w-2xl mx-auto mt-6">
                Discover the innovative solutions built by our Emerging Technologies team
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pocs.map((poc) => (
                <Card key={poc.path} path={poc.path} metadata={poc.metadata} onClick={handleCardClick} />
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-gradient py-16">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-6 text-primary">Ready to Explore?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Discover how these Proofs of Concept can revolutionize insurance processes.
            </p>
            <a
              href="/pocs"
              className="btn-ai group"
            >
              <span>Explore All Demos</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-normal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </>
    // </ProtectedRoute>
  );
}
