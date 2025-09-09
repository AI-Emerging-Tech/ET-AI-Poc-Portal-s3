'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import manualReview from 'assets/Manual_Review_GitHub.png';
import automatedReviewPage1 from 'assets/Automated_Review_1.png';
import automatedReviewPage2 from 'assets/Automated_Review_2.png';
import automatedReviewPage3 from 'assets/Automated_Review_3.png';
import automatedReviewPage4 from 'assets/Automated_Review_4.png';
import codeMarkdown from 'assets/Code_Analysis-Style_Formatting_Feedback.png';
import codeMarkdown2 from 'assets/Code_Analysis-Security_Vulnerabilities.png';
import codeMarkdown3 from 'assets/Code_Analysis-Performance_Optimization_Suggestions.png';
import codeMarkdown4 from 'assets/Code_Analysis-Complexity_Analysis.png';
 
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
      In software development, senior engineers spend a significant portion of their time on repetitive tasks during code reviews, such as checking for style, 
      formatting, adherence to coding standards, and detecting common vulnerabilities. These tasks, while critical, take time away from higher-value activities, 
      such as designing complex systems or mentoring junior developers. Automating these code review tasks using AI models can increase efficiency and allow senior 
      engineers to focus on more complex issues.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      Manual code reviews are resource-intensive and repetitive. Engineers spend 6-20% of their time on tasks that could be automated. This PoC aims to leverage 
      foundational models (like GPT-3.5 or Codex) to automate style checks, performance analysis, and vulnerability detection, reducing review time by 50%.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      By automating code reviews - Senior engineers can recover 20-40 hours weekly for more complex tasks, Efficiency improves, as repetitive tasks are handled by AI, 
      Code quality is enhanced through consistent checks, reducing the likelihood of human error, Faster development cycles lead to better time-to-market outcomes 
      for our customers.

      </p>
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
        <li>Open the terminal and navigate to the repository folder in the terminal</li>
        <li>When in the folder, run the python file called "flow_manager.py" by running the command along with the 
          arguments depending on which mode to run. :  </li>
        <li>To run the pull request code review flow, you would have to run the following command:</li>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 text-wrap">
          <code>python src/flow_manager.py --repo ENTER GIT REPOSITORY --pr ENTER PULL REQUEST NUMBER --mode review </code>
        </pre>
        <li>To run the code analysis flow, you would have to run the following command:</li>
        <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2 text-wrap">
          <code>python src/flow_manager.py --source_directory ENTER SOURCE DIRECTORY OF CODE --target_directory 
            ENTER TARGET DIRECTORY LOCATION OF MARKDOWN FILE --mode analysis </code>
        </pre>
      </ol>
    </>
  );
 
  const videoContent = {
    videoTitle: "Pull Request Diff Review Demo",
    uri: "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=6f255e9b-c806-467e-adcc-cfb57ee745d8&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
      
  };
 
  
  return (
    <div className='ut-container'>
      <div className='header-section'>
        <h1 className='header-title'>Pull Request Diff Review</h1>
      </div>
      <div className='header-section'>
        <p>The PoC utilized a combination of AI models, platforms, and development tools to implement and test the code review & analysis automation.
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the differences between manual GitHub pull request code review by developers & automated by LLMs </h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={manualReview}
          description="GitHub Pull Request Diff Analysis by Developers Example"
          onClick={() => openImageModal(manualReview)}
        />
        <Screenshot
          imageSrc={automatedReviewPage1}
          description="Github Pull Request LLM Diff Analysis 1/2"
          onClick={() => openImageModal(automatedReviewPage1)}
        />
        <Screenshot
          imageSrc={automatedReviewPage2}
          description="Github Pull Request LLM Diff Analysis 2/2"
          onClick={() => openImageModal(automatedReviewPage2)}
        />
      </div>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={automatedReviewPage3}
          description="Automated Github Pull Request LLM Code Review 1"
          onClick={() => openImageModal(automatedReviewPage3)}
        />
        <Screenshot
          imageSrc={automatedReviewPage4}
          description="Automated Github Pull Request LLM Code Review 2"
          onClick={() => openImageModal(automatedReviewPage4)}
        />
      </div>
      <div className='header-section'>
        <h1 className='header-title'><br/><br/>Code Analysis Automation</h1>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the differences between manual code analysis by developers & automated code analysis by LLMs </h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={codeMarkdown}
          description="Code Analysis - Style and Formatting Feedback"
          onClick={() => openImageModal(codeMarkdown)}
        />
        <Screenshot
          imageSrc={codeMarkdown2}
          description="Code Analysis - Security Vulnerabilities"
          onClick={() => openImageModal(codeMarkdown2)}
        />
        <Screenshot
          imageSrc={codeMarkdown3}
          description="Code Analysis - Performance Optimization Suggestions"
          onClick={() => openImageModal(codeMarkdown3)}
        />
        <Screenshot
          imageSrc={codeMarkdown4}
          description="Code Analysis - Complexity Analysis"
          onClick={() => openImageModal(codeMarkdown4)}
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