'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import Screenshot from 'components/Screenshot';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';

// V2 assets only
import testcasesgeneratedV2 from 'assets/test_cases_generated_v2.png';
import testcasesgenerated1V2 from 'assets/test_cases_generated1_v2.png';
import folderwithouttestsV2 from 'assets/folder_structure_without_tests_v2.png';
import folderwithtestsV2 from 'assets/folder_structure_with_tests_v2.png';
import coboltestcases from 'assets/cobol_test_case_generation.png';

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

  const BusinessContext = `Transforming user stories into executable BDD scenarios and test case recommendations enables QA teams to streamline processes, reduce manual effort, and accelerate delivery. 
                           This approach drives consistent test coverage, improves quality, and ensures alignment with business requirements.`;

  const ProblemStatement = `QA teams often struggle with the manual effort of converting user stories into BDD scenarios and test cases, leading to delays, inconsistent coverage, and higher defect risk. 
                            This PoC focuses on addressing that challenge by automating scenario generation and test recommendations, reducing overhead while improving speed, consistency, and alignment with business requirements.`;

  const ImpactandImportance = `Automating the generation of BDD scenarios and test case recommendations significantly reduces QA cycle time and manual effort. 
                               It improves test coverage consistency, lowers the risk of defects slipping into production, and accelerates release velocity. 
                               By aligning tests directly with user stories, this approach ensures tighter collaboration between business and engineering, ultimately driving higher quality, cost efficiency, and faster time-to-market.`;

  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">{BusinessContext}</p>

      <h3 className="text-xl font-semibold mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">{ProblemStatement}</p>

      <h3 className="text-xl font-semibold mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">{ImpactandImportance}</p>
    </>
  );

  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>Ensure you have Python 3.9+ on your system.</li>
        <li>
          Clone the repository containing the PoC code. Navigate to the folder and install the dependencies:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>
          Navigate to <code>working/BDD-TestCaseGeneration</code> and run:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 whitespace-pre-wrap break-words">
            <code>
              python bdd_agent.py
            </code>
          </pre>
        </li>
      </ol>
    </>
  );

  const videoContent = {
    videoTitle: 'Unit Tests Generator Demo',
    uri: 'https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=5a556c0d-36e2-4a21-b32b-6c2664ebfce7&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create',
  };

  return (
    <div className="ut-container">
      <div className="header-section">
        <h1 className="header-title">Automated Test Case Generation</h1>
      </div>

      <div className="header-section">
        <p>
          This showcases our approach to generating BDD Scenarios and Recommended Test Cases from a user story using Agentic Workflow.
        </p>
      </div>

      <h2 className="ut-screenshot">
        Example Screenshots Demonstrating the Implementation of Generated BDD Scenarios and Test Cases using Agents
      </h2>

      <div className="screenshots-grid">
        <Screenshot
          imageSrc={folderwithouttestsV2}
          description="Directory structure before test cases were generated"
          onClick={() => openImageModal(folderwithouttestsV2)}
        />

        <Screenshot
          imageSrc={folderwithtestsV2}
          description="Directory structure after test cases were generated"
          onClick={() => openImageModal(folderwithtestsV2)}
        />

        <Screenshot
          imageSrc={testcasesgeneratedV2}
          description="Sample unit tests generated"
          onClick={() => openImageModal(testcasesgeneratedV2)}
        />

        <Screenshot
          imageSrc={testcasesgenerated1V2}
          description="Additional sample unit tests"
          onClick={() => openImageModal(testcasesgenerated1V2)}
        />

        <Screenshot
          imageSrc={coboltestcases}
          description="Cobol test cases generated"
          onClick={() => openImageModal(coboltestcases)}
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

      <br />
      <br />

      <SideMenu infoContent={detailsPanelContent} setupContent={setupPanelContent} videoContent={videoContent} />
    </div>
  );
}
