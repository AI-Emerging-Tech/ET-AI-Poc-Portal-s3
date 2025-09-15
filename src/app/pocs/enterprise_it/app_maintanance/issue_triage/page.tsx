'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import originalCodeSample from 'assets/issuetriage.png';
import githubTicket   from 'assets/github_ticket.png';

 
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
        As applications scale, teams often face an overwhelming backlog of unresolved issues in platforms like GitHub. 
        These accumulating issues create bottlenecks, slow down delivery, and obscure critical bugs or feature requests. 
        Without consistent triage and prioritization, engineering teams struggle to maintain velocity, leading to reduced productivity, delayed releases, and increased risk of defects reaching production.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Engineering teams often struggle with the manual effort of triaging and managing large volumes of issues in GitHub, which leads to delays in resolution, inconsistent prioritization, and a growing backlog. 
        This PoC focuses on addressing that challenge by automating issue analysis and classification with AI, enabling faster triage, better prioritization, and improved visibility into critical tasks.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Automating issue analysis and management reduces backlog accumulation, accelerates resolution times, and ensures consistent prioritization of critical tasks. 
        This improves overall engineering productivity, minimizes the risk of unresolved defects impacting delivery, and enables teams to maintain project velocity.
        By streamlining issue triage, organizations can focus more on innovation while ensuring product stability and customer satisfaction.
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
        <li>Navigate to <code>working/GithubIssueRetrieval</code></li>
        <li>
          Run <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>doublegent.py</code>
          </pre>
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
        <h1 className='header-title'>Issue Triage</h1>
      </div>
      <div className='header-section'>
        <p>Experience enhanced issue triage with automated insights and recommendations for an issue.
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the Issue Triage</h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={githubTicket}
          description=" GitHub Ticket"
          onClick={() => openImageModal(githubTicket)}
        />
        <Screenshot
          imageSrc={originalCodeSample}
          description=" Issue Summary for the ticket"
          onClick={() => openImageModal(originalCodeSample)}
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
        // videoContent={videoContent}
      />
    </div>
  );
}