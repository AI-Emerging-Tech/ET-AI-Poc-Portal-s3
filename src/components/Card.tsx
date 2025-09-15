'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { imageRegistry } from 'common/images';

interface CardProps {
  path: string;
  lessInfo?: boolean;
  metadata: {
    title: string;
    description: string;
    linkDesc: string;
    isNew?: boolean;
    isFeatured?: boolean;
    image?: string;
    maturityStage?: string;
    estimatedExploreTime?: string;
    categoryTags?: string[];
    interactivityLevel?: string;
  };
  onClick: (path: string) => void; // Accept onClick prop for loading state
}

const Card: React.FC<CardProps> = ({ path, metadata, onClick, lessInfo = false }) => {
  // Random positions for data points
  const [dataPoints, setDataPoints] = useState<{x: number, y: number, delay: number}[]>([]);
  const [imageError, setImageError] = useState(false);
  const mounted = useRef(true);
  
  useEffect(() => {
    // Create 3-5 random data points
    const numPoints = Math.floor(Math.random() * 3) + 3;
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      });
    }
    
    setDataPoints(points);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted.current = false;
    };
  }, []);

  // Format image path correctly - improved path handling
  const formatImagePath = () => {
    if (!metadata.image) return '/assets/default-poc.png';
    
    // Handle absolute URLs (unlikely in this case, but good practice)
    if (metadata.image.startsWith('http')) return metadata.image;
    
    // If path starts with assets, ensure it has a leading /
    if (metadata.image.startsWith('assets/')) return `/${metadata.image}`;
    
    // If path already has a leading slash
    if (metadata.image.startsWith('/')) return metadata.image;
    
    // Default case - add leading slash
    return `/${metadata.image}`;
  };

  const imagePath = metadata.image ? Object.keys(imageRegistry).includes(metadata.image) ? imageRegistry[metadata.image as keyof typeof imageRegistry] : null : null;

  // Remove debugging code that causes re-renders
  const handleImageError = () => {
    if (mounted.current) {
      setImageError(true);
    }
  };

  // Generate placeholder colors based on title (consistent for same title)
  const generatePlaceholderColors = (title: string) => {
    // Simple hash function to generate consistent colors for the same title
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate colors based on hash
    const hue1 = hash % 360;
    const hue2 = (hash * 2) % 360;
    
    return {
      from: `hsl(${hue1}, 70%, 80%)`,
      to: `hsl(${hue2}, 70%, 60%)`
    };
  };
  
  const placeholderColors = generatePlaceholderColors(metadata.title);

  return (
    <div onClick={() => onClick(path)} className="cursor-pointer group">
      <Link href={path}>
        <div className="ai-card group h-full relative">
          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex space-x-2 z-10">
            {metadata.isNew && !lessInfo && (
              <span className="badge-new">
                New
                <span className="animate-pulse absolute inset-0 rounded-full bg-white opacity-30"></span>
              </span>
            )}
            {metadata.isFeatured && !lessInfo && (
              <span className="badge-featured">
                Featured
              </span>
            )}
          </div>

          {/* Data points decoration */}
          <div className="absolute inset-0 overflow-hidden">
            {dataPoints.map((point, i) => (
              <div 
                key={i}
                className="data-point"
                style={{
                  top: `${point.y}%`,
                  left: `${point.x}%`,
                  animationDelay: `${point.delay}s`
                }}
              ></div>
            ))}
          </div>
          
          {/* Image or Placeholder */}
          {lessInfo && (
            <div className="relative w-full h-32 mb-1 overflow-hidden rounded">
            {metadata.image && !imageError ? (
              // Display actual image if available and not errored
              <div className="relative w-full h-full">
                <Image
                  src={imagePath}
                  width={800}
                  height={600}
                  alt={metadata.title}
                  className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-105"
                  onError={handleImageError}
                  priority={lessInfo} // Prioritize loading carousel images
                />
              </div>
            ) : (
              // Display gradient placeholder with title initials
              <div className="relative w-full h-full">
                <Image
                  src={imageRegistry.chatbot}
                  width={800}
                  height={600}
                  alt={metadata.title}
                  className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-105"
                  priority={lessInfo} // Prioritize loading carousel images
                />
              </div>
            )}
          </div>
          )}
          
          {/* Header Section with gradient border */}
          <div className="mb-4 text-center relative">
            <h3 className="text-xl font-bold text-dark-gray group-hover:text-gradient transition-all duration-300">
              {metadata.title}
            </h3>
          </div>

          {/* Category Tags (if available) */}
          {metadata.categoryTags && metadata.categoryTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mb-3">
              {metadata.categoryTags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag-badge">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Text Section */}
          <div className="flex-grow text-center">
            <p className="text-medium-gray max-sm:text-sm leading-relaxed">
              {metadata.description}
            </p>
          </div>

          {/* Additional Info */}
          {(metadata.maturityStage || metadata.estimatedExploreTime || metadata.interactivityLevel) && (
            <div className="flex justify-center items-center gap-3 mt-3 mb-4 text-xs text-medium-gray">
              {metadata.maturityStage && (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {metadata.maturityStage}
                </span>
              )}
              {metadata.estimatedExploreTime && (
                <span className="flex items-center max-sm:text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {metadata.estimatedExploreTime}
                </span>
              )}
              {metadata.interactivityLevel && (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  {metadata.interactivityLevel}
                </span>
              )}
            </div>
          )}

          {/* Footer Section with animated accent */}
          {!lessInfo && (
            <div className="mt-6 text-center relative">
              <span className="text-primary font-bold relative inline-block">
                {metadata.linkDesc}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent-green))' }}></span>
            </span>
            
            {/* Arrow icon that moves on hover */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 inline-block ml-1 text-primary transform group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default Card;
