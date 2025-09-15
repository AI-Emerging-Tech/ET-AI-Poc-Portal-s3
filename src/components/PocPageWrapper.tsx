'use client';

import { useState, ReactNode, useEffect } from 'react';
import { FaInfoCircle, FaTools, FaChartBar, FaUserTie, FaIndustry, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import SideMenu from './SideMenu';
import { imageRegistry } from 'common/images';
import '../styles/PocPageWrapper.css';

// Interface for the metadata required by the component
export interface PocMetadata {
  title: string;
  description: string;
  keyMetrics?: {
    [key: string]: string;
  };
  targetPersonas?: string[];
  industryVerticals?: string[];
  maturityStage?: string;
  interactivityLevel?: string;
  estimatedExploreTime?: string;
  businessImpact?: {
    operational?: string[];
    financial?: string[];
    customer?: string[];
  };
  technicalHighlights?: string[];
  implementationTimeline?: {
    [key: string]: string;
  };
  content?: string;
  categoryTags?: string[];
  image?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface PocPageWrapperProps {
  metadata: PocMetadata;
  demoContent: ReactNode;
  infoContent?: JSX.Element; // Content for the info panel in side menu
  setupContent?: JSX.Element; // Content for the setup panel in side menu
  dataContent?: JSX.Element | null; // Content for the data panel in side menu
  videoContent?: {
    videoTitle: string;
    videoTitle2?: string;
    uri: string;
    uri2?: string;
  } | null;
  chatContent?: JSX.Element | null;
  defaultActiveTab?: 'overview' | 'solution';
  modalContent?: ReactNode | null;
  fixedContent?: ReactNode | null;
}


export default function PocPageWrapper({
  metadata,
  demoContent,
  infoContent,
  setupContent,
  dataContent=null,
  videoContent = null,
  chatContent = null,
  defaultActiveTab = 'overview',
  modalContent = null,
  fixedContent = null
}: PocPageWrapperProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'solution'>(defaultActiveTab);
  const [imageError, setImageError] = useState(false);
  // ReferenceError: window is not defined
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Create default info content if none provided
  const defaultInfoContent = (
    <div>
      <h3 className="text-xl font-semibold mb-4">Information</h3>
      <p className="text-gray-700 leading-relaxed">No additional information available.</p>
    </div>
  );

  // Create default setup content if none provided
  const defaultSetupContent = (
    <div>
      <h3 className="text-xl font-semibold mb-4">Setup</h3>
      <p className="text-gray-700 leading-relaxed">No setup information available.</p>
    </div>
  );

  // Handle image display similar to Card.tsx
  const getImage = () => {
    if (!metadata.image) return null;
    
    // Check if the image is in the registry
    const registryImage = metadata.image && Object.keys(imageRegistry).includes(metadata.image) 
      ? imageRegistry[metadata.image as keyof typeof imageRegistry] 
      : null;
      
    if (registryImage && !imageError) {
      return (
        <div className="poc-header-image">
          <Image
            src={registryImage}
            alt={metadata.title}
            width={100}
            height={200}
            className="rounded-lg w-full h-full object-cover"
            onError={() => setImageError(true)}
            priority
          />
        </div>
      );
    }
    
    // Fallback to a placeholder if image not found or error
    return null;
  };

  // Random positions for data points (similar to Card.tsx)
  const generateDataPoints = () => {
    const numPoints = 5;
    return Array.from({ length: numPoints }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
  };

  const dataPoints = generateDataPoints();

  // Handle modal portaling - move any modal elements to body level
  useEffect(() => {
    // Instead of moving modals, ensure they have proper styles and z-index
    const modalStyleHandler = () => {
      const demoModalOverlays = document.querySelectorAll('.modal-overlay');
      
      if (demoModalOverlays.length > 0) {
        demoModalOverlays.forEach(modal => {
          // Make sure modals have proper position and z-index
          if (modal instanceof HTMLElement) {
            modal.style.position = 'fixed';
            modal.style.zIndex = '1000';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.right = '0';
            modal.style.bottom = '0';
          }
        });
      }
    };

    // Run when tab changes to solution or when solution tab is active
    if (activeTab === 'solution') {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        modalStyleHandler();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <div className='poc-page-container'>
      <div className='header-section'>
        <h1 className='header-title text-primary-light'>{metadata.title}</h1>
      </div>
      <div className='header-section'>
        <p className="header-description">{metadata.description}</p>
      </div>

      {/* Status Badges (if featured or new) */}
      {/* {(metadata.isNew || metadata.isFeatured) && (
        <div className="flex justify-center gap-2 mb-4">
          {metadata.isNew && <span className="badge-new">New</span>}
          {metadata.isFeatured && <span className="badge-featured">Featured</span>}
        </div>
      )} */}

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
          >
            <FaInfoCircle /> Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'solution' ? 'active' : ''}`} 
            onClick={() => setActiveTab('solution')}
          >
            <FaTools /> Solution Demo
          </button>
        </div>
      </div>

      {/* Overview Tab Content */}
      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        <div className='solution-overview-section'>
          <div className='solution-overview-container'>
            {/* Add ambient glow effects from globals.css */}
            <div className="glow-container">
              {dataPoints.map((point, i) => (
                <div 
                  key={i}
                  className="glow-orb"
                  style={{
                    top: `${point.y}%`,
                    left: `${point.x}%`,
                    animationDelay: `${point.delay}s`
                  }}
                ></div>
              ))}
              </div>
              <div className='solution-details-grid'>
              {metadata.keyMetrics && Object.keys(metadata.keyMetrics).length > 0 && (
                <div className='solution-detail-card ai-card'>
                  <div className='solution-detail-icon'><FaChartBar /></div>
                  <h3>Key Metrics</h3>
                  {Object.entries(metadata.keyMetrics).map(([key, value]) => (
                    <div className='metric-item' key={key}>
                      <span className='metric-label'>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      <span className='metric-value'>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {metadata.targetPersonas && metadata.targetPersonas.length > 0 && (
                <div className='solution-detail-card ai-card'>
                  <div className='solution-detail-icon'><FaUserTie /></div>
                  <h3>Target Users</h3>
                  <ul className='detail-list'>
                    {metadata.targetPersonas.map((persona, index) => (
                      <li key={index}>{persona}</li>
                    ))}
                  </ul>
                </div>
              )}

              {metadata.industryVerticals && metadata.industryVerticals.length > 0 && (
                <div className='solution-detail-card ai-card'>
                  <div className='solution-detail-icon'><FaIndustry /></div>
                  <h3>Industry Verticals</h3>
                  <ul className='detail-list'>
                    {metadata.industryVerticals.map((industry, index) => (
                      <li key={index}>{industry}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='solution-detail-card ai-card'>
                <div className='solution-detail-icon'><FaCheckCircle /></div>
                <h3>Business Benefits</h3>
                <ul className='detail-list'>
                  <li>Enhanced operational efficiency</li>
                  <li>Reduced processing time</li>
                  <li>Improved accuracy and consistency</li>
                  <li>Better resource allocation</li>
                </ul>
              </div>
            </div>

            
            {metadata.content && (
                
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Display image if available */}
                {/* {metadata.image && (
                <div className="solution-workflow ai-card"> 
                    {getImage()}
                </div>
                )} */}
                <div className='solution-workflow ai-card'>
                    <h3>How It Works</h3>
                    <div className='workflow-content'>
                    <div dangerouslySetInnerHTML={{ __html: metadata.content.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
            </div>
            )}
            
            {metadata.businessImpact && (
              <div className='business-impact-section'>
                {metadata.businessImpact.operational && (
                  <div className='impact-card ai-card'>
                    <h3>Operational Impact</h3>
                    <ul className='impact-list'>
                      {metadata.businessImpact.operational.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {metadata.businessImpact.financial && (
                  <div className='impact-card ai-card'>
                    <h3>Financial Impact</h3>
                    <ul className='impact-list'>
                      {metadata.businessImpact.financial.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {metadata.businessImpact.customer && (
                  <div className='impact-card ai-card'>
                    <h3>Customer Impact</h3>
                    <ul className='impact-list'>
                      {metadata.businessImpact.customer.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {metadata.technicalHighlights && metadata.technicalHighlights.length > 0 && (
              <div className='technical-highlights ai-card'>
                <h3>Technical Highlights</h3>
                <div className='tech-highlights-grid'>
                  {metadata.technicalHighlights.map((highlight, index) => (
                    <div className='tech-highlight' key={index}>{highlight}</div>
                  ))}
                </div>
              </div>
            )}

            {metadata.implementationTimeline && Object.keys(metadata.implementationTimeline).length > 0 && (
              <div className='implementation-timeline ai-card'>
                <h3>Implementation Timeline</h3>
                <div className='timeline-stages'>
                  {Object.entries(metadata.implementationTimeline).map(([stage, duration], index) => (
                    <div className='timeline-stage' key={index}>
                      <div className='stage-name'>{stage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                      <div className='stage-duration'>{duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Solution Tab Content */}
      {/* Check if mobile or desktop */}
      {isMobile ? (
        <div className={`tab-content ${activeTab === 'solution' ? 'active' : ''} glass-card`}>
          {/* Display "View on desktop" */}
          <div className='view-on-desktop'>
            <div className='view-on-desktop-content'>
              <h4>View on Desktop or Laptop</h4>
              <p>The demo is not available on mobile devices.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`tab-content ${activeTab === 'solution' ? 'active' : ''} glass-card`}>
          {demoContent}
        </div>
      )}
      

      {modalContent && (
            <>
                {modalContent}
            </>
        )}
      {/* SideMenu for additional info */}
      <SideMenu
        infoContent={infoContent || defaultInfoContent}
        setupContent={setupContent || defaultSetupContent}
        dataContent={dataContent}
        videoContent={videoContent}
        chatContent={chatContent}
      />
      {fixedContent && (
        <div className="max-sm:hidden" style={{zIndex: 1000, position: 'fixed'}}>
          {fixedContent}
        </div>
      )}
    </div>
  );
} 