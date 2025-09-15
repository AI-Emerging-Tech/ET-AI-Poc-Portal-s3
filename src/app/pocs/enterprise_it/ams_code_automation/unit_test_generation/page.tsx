'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import Screenshot from 'components/Screenshot';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import testReportSummary from 'assets/test_report.png';
import testCasesSaved from 'assets/test_cases_saved.png';
import folderwithouttestsV2 from 'assets/folder_structure_without_tests_v2.png'
import folderwithtestsV2 from 'assets/folder_structure_with_tests_v2.png'
import testcasesgeneratedV2 from 'assets/test_cases_generated_v2.png'
import testcasesgenerated1V2 from 'assets/test_cases_generated1_v2.png'
import folderwithouttestsV1 from 'assets/folder_structure_without_tests_v1.png'
import folderwithtestsV1 from 'assets/folder_structure_with_tests_v1.png'
import coboltestcases from 'assets/cobol_test_case_generation.png'
 
export default function UnitTests() {
  const router = useRouter();
 
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<StaticImageData | null>(null);
  const [isV2, setIsV2] = useState(true);
 
  const openImageModal = (imageSrc: StaticImageData) => {
    setCurrentImage(imageSrc);
    setIsImageOpen(true);
  };
 
  const closeImageModal = () => {
    setIsImageOpen(false);
    setCurrentImage(null);
  };

  const BusinessContext = `Legacy applications often lack unit tests, making updates and refactoring risky and time-intensive. 
                            Manual test creation is laborious and inconsistent, especially for unsupported codebases. 
                            Automating unit test generation improves code coverage, reliability, and modernization efficiency, enabling organizations to enhance software quality, 
                            reduce technical debt, and save time while minimizing risks during legacy system updates.`;

  const ProblemStatement = `This PoC focuses on automating unit test generation for legacy systems, eliminating inefficiencies and inconsistencies in manual processes. 
                            It enhances test creation speed, ensures better coverage and stability, and supports reliable code updates, ultimately streamlining modernization 
                            efforts and improving the quality and reliability of legacy applications.`

  const ImpactandImportance = `Automating unit test generation for legacy applications saves time, ensures consistent and comprehensive code coverage, 
                              and improves code quality by catching regressions during updates. It accelerates modernization efforts by reducing technical 
                              debt and enabling confident refactoring. Additionally, automated tests minimize the risk of undetected bugs, leading to more stable,  
                              reliable, and efficiently managed legacy systems.`
                
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
              Ensure you have Jest Configuration set up for running TypeScript files and Pytest configuration set up for
              running Python files.
            </li>
        {isV2 ? (
          <li>
            Navigate to <code>src/flow_manager</code>, to run the file:
            <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 whitespace-pre-wrap break-words">
              <code>
                python flow_manager.py --source_directory {'<dir>'} --target_directory {'<dir>'} --mode {'<mode>'} --ignore {'<patterns>'}
              </code>
            </pre>
          </li>
        ) : (
          <>
            <li>Navigate to working/unit_tests/src/main, to run the file.
            <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
                <code>python main.py</code>
              </pre>
            </li>

          </>
        )}
      </ol>
    </>
  );
  
 
  const videoContent = {
    videoTitle: isV2 ? "V2 Unit Tests Generator Demo" : "V1 Unit Tests Generator Demo",
    uri: isV2
      ? "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=5a556c0d-36e2-4a21-b32b-6c2664ebfce7&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create"
      : "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=1be406d4-87aa-4f29-9eea-7804aea9d95d&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
  };
 
  return (
    <div className='ut-container'>
      <div className='header-section'>
        <h1 className='header-title'>Iterative Unit Tests Generation & Validation {isV2 ? 'V2' : 'V1'}</h1>
      </div>
      <div className="flex items-center justify-end ">
          <span className="mr-3 text-sm font-medium text-gray-700">V1</span>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isV2}
            onChange={(e) => setIsV2(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>

        <span className="ml-3 text-sm font-medium text-gray-700">V2</span>
      </div>
      <div className='header-section'>
        <p>
          {isV2 
            ? "This showcases our approach to generating unit tests for TypeScript, Cobol and Python files. V2 provides improved test case generation"
            : "This showcases our approach to generating unit tests for TypeScript and Python files"
          }
        </p>
      </div>
 
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the Implementation of Generated Unit Test Cases using LLM's</h2>
     
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={isV2 ? folderwithouttestsV2 : folderwithouttestsV1} 
          description={isV2 ? "Directory structure before test cases were generated" : "Directory structure before test cases were generated"}
          onClick={() => openImageModal(isV2 ? folderwithouttestsV2 : folderwithouttestsV1)}
        />
 
        <Screenshot
          imageSrc={isV2 ? folderwithtestsV2 : folderwithtestsV1}
          description={isV2 ? "Directory structure after test cases were generated" : "Directory structure after test cases were generated"}
          onClick={() => openImageModal(isV2 ? folderwithtestsV2 : folderwithtestsV1)}
        />
 
        <Screenshot
          imageSrc={isV2 ? testcasesgeneratedV2 : testCasesSaved}
          description={isV2 ? "Sample unit tests generated" : "Sample unit tests generated"}
          onClick={() => openImageModal(isV2 ? testcasesgeneratedV2 : testCasesSaved)}
        />

        <Screenshot
          imageSrc={isV2 ? testcasesgenerated1V2 : testReportSummary}
          description={isV2 ? "Sample unit tests generated" : "Report for test cases passed and failed"}
          onClick={() => openImageModal(isV2 ? testcasesgenerated1V2 : testReportSummary)}
        />

        {isV2 && (
          <Screenshot
            imageSrc={coboltestcases}
            description="Cobol test cases generated"
            onClick={() => openImageModal(coboltestcases)}
          />
        )}
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