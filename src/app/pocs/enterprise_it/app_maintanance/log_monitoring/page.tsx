'use client';
import { useRouter } from 'next/navigation';
import SideMenu from 'components/SideMenu';
import './styles.css';
import { useState } from 'react';
import type { StaticImageData } from 'next/image';
import Screenshot from 'components/Screenshot';
import analysis1 from 'assets/log_monitoring_1.png'
import analysis2 from 'assets/log_monitoring_2.png'
import analysis3 from 'assets/log_monitoring_3.png'
import archimage from 'assets/log_monitoring_4.png'

 
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
      As applications scale, log management becomes increasingly complex. 
      Teams face noisy, unstructured, and overwhelming log data, making it difficult to detect issues, trace regressions, or respond quickly to incidents. 
      The constant flood of irrelevant or redundant logs drains engineering time, increases operational costs, and reduces focus on innovation, ultimately slowing down the ability to maintain application reliability and performance.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      Engineering teams often struggle with the manual effort of sifting through noisy and unstructured logs, which leads to delays in detecting issues, inconsistent incident response, and higher operational risk. 
      This PoC focuses on addressing that challenge by leveraging AI to automatically analyze and surface meaningful insights from logs, reducing overhead while improving speed, accuracy, and reliability in application maintenance.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      Automating log analysis with AI reduces the time and effort spent on manual log reviews, enabling faster detection and resolution of issues. 
      It improves system reliability by filtering noise and highlighting critical signals, ensuring teams can focus on meaningful insights rather than chasing irrelevant data. 
      This not only lowers operational costs but also enhances application stability, accelerates incident response, and frees engineering capacity for innovation and value-driven work.
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
          Clone the repository containing the PoC code. Navigate to the ET-SDLC-App-Maintenance/ and install the dependencies:
          <pre className="bg-gray-100 p-2 text-sm rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>Navigate to <code>/working/logmonitoring</code></li>
        <li>
          Run <code>python agent.py</code> 
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
        <h1 className='header-title'>Log Monitoring</h1>
      </div>
      <div className='header-section'>
        <p>
          This PoC focuses on monitoring application performance and health using AI-driven insights.
        </p>
      </div>
      <h2 className="ut-screenshot">Example Screenshots Demonstrating the insights of Log Monitoring</h2>
      <div className='screenshots-grid'>
        <Screenshot
          imageSrc={analysis1}
          description="Log Monitoring analysis 1/2"
          onClick={() => openImageModal(analysis1)}
        />
         <Screenshot
          imageSrc={analysis2}
          description="Log Monitoring analysis 2/2"
          onClick={() => openImageModal(analysis2)}
        />
        <Screenshot
          imageSrc={analysis3}
          description="Log Monitoring: Suggested Next Steps"
          onClick={() => openImageModal(analysis3)}
        />

          <Screenshot
          imageSrc={archimage}
          description="Log Monitoring: Recommendations"
          onClick={() => openImageModal(archimage)}
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