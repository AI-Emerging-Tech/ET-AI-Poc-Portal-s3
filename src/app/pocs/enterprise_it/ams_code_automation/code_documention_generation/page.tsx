'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import originalCodeSample from 'assets/codesample.png';
import readmeForApplication from 'assets/readmep1.png';
import codeWithInlineComment from 'assets/codeafter.png';
import architecturediagram from 'assets/arch_graph.png';
import codeWithDocstrings from 'assets/docstrings.png';
 
export default function UnitTests() {
  const router = useRouter();
 
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<StaticImageData | null>(null);
 
  const openImageModal = (imageSrc: StaticImageData) => {
    setCurrentImage(imageSrc);
    setIsImageOpen(true);
  };
 
  const closeImageModal = () => {
    setIsImageOpen(false);
    setCurrentImage(null);
  };
 
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        In software development, maintaining current and comprehensive documentation is crucial yet challenging. At ValueMomentum, our diverse portfolio of applications and client systems across multiple programming languages requires significant resources to keep documentation aligned with rapidly evolving codebases.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Traditional documentation practices face three main challenges: developers prioritize code delivery over documentation updates, projects require various documentation types, and supporting multiple programming languages increases complexity. This often results in outdated or inconsistent documentation.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Our automated documentation solution addresses these challenges by continuously generating accurate, context-aware documentation that evolves with the code. This leads to faster onboarding, improved team collaboration, and more maintainable codebases - ultimately reducing development costs and improving project delivery timelines.
      </p>
    </>
  );
 
  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>Ensure you have <strong>Python 3.9+</strong> installed on your system.</li>
        <li>
          Clone the repository containing the PoC code. Navigate to the folder and install the dependencies:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>Navigate to <code>src/flow_manager.py</code></li>
        <li>
          Run <code>flow_manager.py</code> with the following parameters:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 text-wrap">
            <code>
              --mode document
              --source_directory "your base code directory"
              --target_directory "an empty folder to copy your application with documentation"
              --ignore "test,init"
              --extensions ".py"
            </code>
          </pre>
        </li>
        <li>
          <strong>Important Note:</strong> If you omit the <code>--target_directory</code> parameter, 
          the documentation will be generated in the original source directory.
        </li>
      </ol>
    </>
  );
 
  const videoContent = {
    videoTitle: "Code Documentation Generator Demo",
    uri: "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=714acdb7-01ba-4d95-94e9-847eccf34d82&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
  };
 
  return (
    <div className='ut-container'>
      <div className='header-section'>
        <h1 className='header-title'>Code Documention Generation</h1>
      </div>
      <div className='header-section'>
        <p>Experience automated README creation, inline comments, and architecture diagrams for enhanced code clarity.
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the Implementation of code documentaion generation</h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={originalCodeSample}
          description=" Source Code Sample"
          onClick={() => openImageModal(originalCodeSample)}
        />
         <Screenshot
          imageSrc={codeWithInlineComment}
          description="Modified Code with Inline Comments"
          onClick={() => openImageModal(codeWithInlineComment)}
        />
        <Screenshot
          imageSrc={codeWithInlineComment}
          description="Modified Code with docstrings"
          onClick={() => openImageModal(codeWithDocstrings)}
        />
      </div>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={readmeForApplication}
          description="Generated README file"
          onClick={() => openImageModal(readmeForApplication)}
        />
        
       
        <Screenshot
          imageSrc={architecturediagram}
          description="Generated Architecture Diagram "
          onClick={() => openImageModal(architecturediagram)}
        />
      </div>
 
      {isImageOpen && currentImage && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeImageModal}>
              &times;
            </button>
            <img src={currentImage.src} alt="Expanded" className="modal-image" />
          </div>
        </div>
      )}
 
      <br /> <br />
 
      <SideMenu
        infoContent={detailsPanelContent}
        setupContent={setupPanelContent}
        videoContent={videoContent}
      />
    </div>
  );
}