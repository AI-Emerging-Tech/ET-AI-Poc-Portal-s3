'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import analysis1 from 'assets/architecture_analysis_1.jpg'
import analysis2 from 'assets/architecture_analysis_2.jpg'
import analysis3 from 'assets/architecture_analysis_3.png'
import archimage from 'assets/architecture_analysis_image.jpg'

 
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
      Modern software architectures use diagrams to represent system design, dependencies, and infrastructure, but extracting structured insights remains manual and time-consuming. 
      The Architecture Analyzer PoC leverages LLMs to automate diagram analysis, identifying relationships and generating structured descriptions. By processing architectural images, 
      it maps system components and stores insights in Markdown for easy access. This automation enhances efficiency, reducing reliance on manual interpretation and documentation.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      Organizations struggle with analyzing and documenting architectural diagrams efficiently, leading to manual efforts, inconsistencies, and outdated documentation. 
      As systems evolve, the lack of automation causes missed relationships, delayed decisions, and increased risks. The Architecture Analyzer PoC leverages LLMs and 
      computer vision to extract insights from architectural diagrams and generate structured Markdown descriptions. This automation enhances efficiency, consistency, and 
      scalability in architectural analysis with minimal manual effort. By streamlining documentation, the PoC ensures accurate, version-controlled insights for better decision-making.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      Automating architectural diagram analysis with LLMs and computer vision enhances efficiency, accuracy, and accessibility in system documentation. 
      Traditional manual interpretation leads to inconsistencies, missed dependencies, and outdated records. The Architecture Analyzer PoC streamlines insights, 
      ensuring standardized, precise documentation for enterprises managing complex IT infrastructures. By reducing manual effort, it enables teams to focus on higher-value 
      tasks while maintaining up-to-date, AI-driven architecture workflows.
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
          Clone the repository containing the PoC code. Navigate to the ET-AI-AMS-Automation/ and install the dependencies:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>Navigate to <code>src/flows/architecture_analyzer/</code></li>
        <li>
          Run <code>python master_analyzer.py</code> 
        </li>
      </ol>
    </>
  );
  const videoContent = {
    videoTitle: "Architecture Diagram Analysis Demo",
    uri: "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=b154eb26-4186-488a-89cf-bf7cf0dac682&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
  };
 

 
  return (
    <div className='ut-container'>
      <div className='header-section'>
        <h1 className='header-title'>Architecture Diagram Analysis PoC</h1>
      </div>
      <div className='header-section'>
        <p>Analyzing sotfware architecture using image processing and multi-modal language models
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the analysis of an architecture diagram</h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={archimage}
          description="Example input architecture"
          onClick={() => openImageModal(archimage)}
        />
        <Screenshot
          imageSrc={analysis1}
          description="Analysis report, pt.1"
          onClick={() => openImageModal(analysis1)}
        />
        <Screenshot
          imageSrc={analysis3}
          description="Analysis report, pt.2"
          onClick={() => openImageModal(analysis2)}
        />
         <Screenshot
          imageSrc={analysis2}
          description="Analysis report, pt.3"
          onClick={() => openImageModal(analysis2)}
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