'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import manualReview from 'assets/Manual_Review_GitHub.png';
import automatedReviewPage1 from 'assets/pr_review_1.png';
import automatedReviewPage2 from 'assets/pr_review_2.png';
import automatedReviewPage3 from 'assets/pr_review_3.png';


 
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
      Pull request (PR) reviews are a critical part of maintaining software quality, yet they are often inconsistent and time-consuming. 
      Overloaded developers and uneven review practices slow down velocity, increase the risk of regressions, and allow issues to accumulate. 
      As applications grow in size and complexity, the inefficiency of manual PR reviews amplifies operational costs, making it harder for teams to balance speed with quality.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      Engineering teams often struggle with the manual effort of reviewing pull requests, which leads to delays, inconsistent feedback, and higher defect risk. 
      This PoC focuses on addressing that challenge by automating PR review assistance with AI, providing code improvement suggestions to reduce overhead while improving speed, consistency, and overall code quality.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      Automating pull request reviews with AI improves development velocity by reducing manual review effort and accelerating code merges. 
      It ensures consistent, high-quality feedback across all PRs, minimizing defects that slip into production. 
      By reducing the burden on developers, it allows teams to focus more on feature delivery and innovation, ultimately lowering maintenance costs, improving software reliability, and fostering a more scalable engineering process.
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
        <h1 className='header-title'>Pull Request Review</h1>
      </div>
      <div className='header-section'>
        <p>This PoC showcases the use of AI to improve Pull Request reviews by providing automated suggestions on code changes, making the review process more efficient and effective.
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots demonstrates the automated pull request reviews </h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={automatedReviewPage1}
          description="Review Bot Suggestion when made a pull request or commit 1/2"
          onClick={() => openImageModal(automatedReviewPage1)}
        />
        <Screenshot
          imageSrc={automatedReviewPage2}
          description="Review Bot Suggestion when made a pull request or commit 2/2"
          onClick={() => openImageModal(automatedReviewPage2)}
        />
      </div>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={automatedReviewPage3}
          description=" Code change suggested by the bot"
          onClick={() => openImageModal(automatedReviewPage3)}
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