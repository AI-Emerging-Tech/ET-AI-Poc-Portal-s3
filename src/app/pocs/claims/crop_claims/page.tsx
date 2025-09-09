'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ResultsModal from './components/ResultsModal';
import './styles.css';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

interface SampleInput {
  crop: string;
  label: string;
  damage_type: string;
  date_of_incident: string;
  images: string[];
  land_size: number;
  location: {
    city: string;
    country: string;
    postalcode: string;
    state: string;
    street: string;
  };
  policy_holder_id: string;
}

export default function MainPage() {
  const router = useRouter();
  const [sampleInputs, setSampleInputs] = useState<SampleInput[]>([]);
  const [selectedInputIndex, setSelectedInputIndex] = useState<number | null>(null);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch sample inputs from the backend
    fetch('https://www.valuemomentum.studio/crop_claims/get_sample_inputs')
      .then((response) => response.json())
      .then((data) => setSampleInputs(data['data']))
      .then(() => setIsLoading(false))
      .catch((error) => {
        console.error('Error fetching sample inputs:', error);
        setIsLoading(false); // Ensure loading state is updated even if there's an error
      });
  }, []);

  const handleSampleClick = (index: number) => {
    if (selectedInputIndex === index) {
      setSelectedInputIndex(null);
    } else {
      setSelectedInputIndex(index);
    }
  };

  const handleRunClick = () => {
    if (selectedInputIndex !== null) {
      selectedInput = sampleInputs[selectedInputIndex];
      setShowResultsModal(true);
    } else {
      alert('Please select a sample input.');
    }
  };

  const closeRunModal = () => {
    setShowResultsModal(false);
  };

  const handleImageClick = (imgSrc: string) => {
    setModalImageSrc(imgSrc);
  };

  const closeModal = () => {
    setModalImageSrc(null);
  };

  let selectedInput = selectedInputIndex !== null ? sampleInputs[selectedInputIndex] : null;

  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        Crop insurance is essential to protecting farmers against unforeseen events such as 
        weather damage, diseases, pests and accidents. In today's landscape, with an ever-increasing 
        number of fraudulent claims, it has become a challenge for insurance providers to process the 
        high volume of claims efficiently. It is extremely time-consuming and labor-intensive to 
        validate a claim, therefore increasing operational costs. Moreover, the human error rate, 
        due to negligence and lack of motivation for several reasons such as delayed compensation 
        and monotonous work, is high. 
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        There is a dire need for efficient, fast and reliable solutions to assist adjusters 
        in crop insurance claims processing. Leveraging AI and advanced analytics using weather 
        statistics and geospatial imagery, we aim to develop a solution that can accelerate 
        claims assessment, reduce manual errors and detect fraudulent activities. 
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        An automated system as such could significantly reduce the time required to process 
        crop damage claims, with real-time damage assessments generated in under 5 minutes.  
        This represents a substantial improvement over traditional manual assessment methods, 
        which can take days or even weeks, enhancing the quality of work and time management 
        for adjusters and faster resolution for the insurer and the insuree. 
      </p>
    </>
  );

  // Content for the Developer Setup panel
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
        <li>Navigate to /src, and using .envsample file, set up .env file to store all required API keys and secrets.</li>
        <li>
          Ensure that at least 16GB of GPU resources are available on your system. You can check 
          this by running the following command on terminal:
          <pre className="bg-gray-100 p-2 rounded-lg text-sm my-2 whitespace-pre-wrap">
            <code>
              {"nvidia-smi --query-gpu=memory.used,memory.total \n--format=csv,nounits"}
            </code>
          </pre>
        </li>
        <li>
          Start Quart service by executing:
          <pre className="bg-gray-100 text-sm p-2 rounded-lg my-2">
            <code>python main.py</code>
          </pre>
        </li>
        <li>Update api calls in nextJS code to use the locally hosted Quart service endpoint.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Pick any sample input you want and hit 'Run'.</p>
    </>
  );

  const dataPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">What happens behind the scenes?</h3>
      <p className="text-gray-700 leading-relaxed font-bold">GeoSpatial Imagery:</p>
      <p>We use location and date of incident to process the following using Sentinel-2 Satellite</p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>
          <b>NDVI: </b> Normalized Difference Vegetation Index, measures vegetation health by comparing red and near-infrared light absorption.
        </li>
        <li>
          <b>EVI: </b> Enhanced Vegetation Index, similar to NDVI but reduces atmospheric interference using blue light data.
        </li>
        <li>
          <b>OSAVI: </b> Optimized Soil-Adjusted Vegetation Index, an improved NDVI that accounts for soil brightness.
        </li>
        <li>
          <b>NDMI: </b> Normalized Difference Moisture Index, measures vegetation water content using near-infrared and shortwave-infrared bands.
        </li>
        <li>
          <b>NBR: </b> Normalized Burn Ratio, identifies burned areas using near-infrared and shortwave-infrared bands.
        </li>
      </ol>
  
      <p className="text-gray-700 leading-relaxed font-bold mt-4">Image Classification:</p>
      <p>We apply advanced machine learning techniques to classify crop damage based on images uploaded by farmers</p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>
          <b>CNN-based Binary Classification: </b> Convolutional Neural Networks (CNN) are used to classify crops as either healthy or damaged.
        </li>
        <li>
          <b>Vision Transformer (Llama): </b> A transformer-based model is used for image understanding and to assess the likeliness of crop damage.
        </li>
        <li>
          <b>Image Segmentation with YOLOv8: </b> Ultralytics YOLOv8 is used for image segmentation, assisting the CNN model by segmenting crop leaves and aggregating predictions for multiple leaves to improve accuracy.
        </li>
      </ol>
  
      <p className="text-gray-700 leading-relaxed font-bold mt-4">Weather Analytics:</p>
      <p>We calculate several risk indices based on weather data based on location and date of incident</p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>
          <b>Fire Risk Index (FRI): </b> Assesses fire risk by evaluating temperature, precipitation, humidity, wind speed, and soil moisture.
        </li>
        <li>
          <b>Drought Stress Index (DSI): </b> Evaluates drought conditions by considering precipitation, evapotranspiration, soil moisture, and temperature.
        </li>
        <li>
          <b>Pest Risk Index (PRI): </b> Quantifies pest risk using temperature and humidity data relevant to pathogen-friendly conditions.
        </li>
        <li>
          <b>Disease Risk Index (DRI): </b> Assesses the likelihood of disease based on temperature, humidity, and soil moisture.
        </li>
        <li>
          <b>Flood Risk Index (FLRI): </b> Measures flood risk using cumulative precipitation and soil moisture data.
        </li>
        <li>
          <b>Wind Damage Index (WDI): </b> Determines wind damage risk using wind gust speed and frequency of high wind days.
        </li>
        <li>
          <b>Storm Risk Index (SRI): </b> Evaluates storm risk by considering factors like dew point spread, relative humidity, wind speed, cloud coverage, and precipitation.
        </li>
      </ol>
    </>
  );
  
  const videoContent = {
    videoTitle: "Crop Insurance Claims Automation Demo",
    uri: `https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=87127f98-dbb0-4a4d-a4ae-f9ef1b4c2644&embed=%7B%22af%22%3Atrue%2C%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create" width="640" height="360" frameborder="0" scrolling="no" allowfullscreen title="PoCDemo.mp4" style="border:none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; height: 100%; max-width: 100%;`,
  };
  

  const demoContent = (
    <div className="crop-container mx-auto py-16 px-1 max-w-4xl">
      <h1 className="crop-header">Automating Crop Insurance Claims</h1>
      <p className="crop-text">
        This application automates the processing of crop insurance claims using predefined sample
        inputs.
      </p>


      {isLoading ? (
        // Loading indicator
        <div className="loading">
          <div className="mainspinner"></div>
          <p>Loading sample inputs...</p>
        </div>
      ) : (
        // Main content
        <>
        <h2 className="crop-subheader">Select a Sample Input</h2>
          <div className="crop-grid">
            {sampleInputs.map((input, index) => (
              <div
                key={index}
                className={`card ${selectedInputIndex === index ? 'selected' : ''}`}
                onClick={() => handleSampleClick(index)}
              >
                <div className="card-content">
                  <h3>{input.crop} | {input.label}</h3>
                  <p className="crop-text" style={{ textAlign: 'left' }}>
                    Damage Type: {input.damage_type}
                  </p>
                  <p className="crop-text" style={{ textAlign: 'left' }}>
                    Date of Incident: {input.date_of_incident}
                  </p>
                  <p className="crop-text" style={{ textAlign: 'left' }}>
                    Policy Holder: {input.policy_holder_id}
                  </p>
                  <p className="crop-text" style={{ textAlign: 'left' }}>
                    Address: {input.location.city}, {input.location.state}
                  </p>
                  <div className="images">
                    {input.images.map((imgSrc, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={imgSrc}
                        alt={`Sample ${index} Image ${imgIndex}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          handleImageClick(imgSrc);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleRunClick} className="run-button">
            Run
          </button>
        </>
      )}

      {/* Image Modal */}
      {modalImageSrc && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <img src={modalImageSrc} alt="Expanded" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );

  return <PocPageWrapper
    metadata={metadata}
    demoContent={demoContent}
    infoContent={detailsPanelContent}
    setupContent={setupPanelContent}
    dataContent={dataPanelContent}
    videoContent={videoContent}
    modalContent={showResultsModal && selectedInput && (
      <ResultsModal selectedInput={selectedInput} onClose={closeRunModal} />
    )}
  />
}
