'use client';

import { useState } from 'react';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For uploaded image preview
  const [resultUrl, setResultUrl] = useState<string | null>(null); // For processed result image
  const [isDeblurLoading, setIsDeblurLoading] = useState(false);
  const [isLRToSRLoading, setIsLRToSRLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Generate a URL for the uploaded image
      setResultUrl(null); // Clear any previous result
    }
  };

  const processImage = async (
    endpoint: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResultUrl(imageUrl); // Set the processed result image URL
    } catch (error) {
      console.error('Error during file upload:', error);
      setError(`There was an error processing the file: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeblur = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    processImage('https://www.valuemomentum.studio/imageresolution/deblur/process', setIsDeblurLoading);
  };

  const handleLRToSR = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    processImage('https://www.valuemomentum.studio/imageresolution/esrgan/enhance', setIsLRToSRLoading);
  };

  const handleDownload = () => {
    if (resultUrl && file) {
      // Extract the original file extension (e.g., jpg, jpeg, png)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';

      // Ensure it's a valid image format
      const validExtensions = ['jpg', 'jpeg', 'png'];
      const finalExt = validExtensions.includes(fileExt) ? fileExt : 'png';

      // Set correct filename with original extension
      const downloadFileName = `${file.name.split('.').slice(0, -1).join('.')}_processed.${finalExt}`;

      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
      Adjusters in the insurance industry face challenges with low-quality or blurred images, 
      leading to delays and inaccuracies in claims processing. Enhancing image quality using super-resolution 
      and deblurring techniques can streamline assessments, improve accuracy, and boost customer satisfaction.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
      Low-quality or motion-blurred images from customers complicate insurance claim assessments. 
      This PoC seeks to enhance image super resolution and clarity, facilitating more accurate and 
      efficient claims processing while reducing delays and disputes. 
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
      Enhancing image super resolution and clarity enables insurance companies to convert low-quality 
      images into high-definition visuals, allowing adjusters to make faster, accurate assessments. 
      This streamlines claims handling, reduces follow-ups, improves customer experience, lowers operational costs, 
      and increases market competitiveness.
      </p>
    </>
  );

  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Ensure you have Python 3.9+ and Flask installed on your system.</li>
        <li>
          Clone the repository containing the PoC code. Navigate to the folder and install the dependencies:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>pip install -r requirements.txt</code>
          </pre>
        </li>
        <li>
          Navigate to the ClaimsImageResolution/ and make sure fast api service is running by executing:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>python main.py</code>
          </pre>
        </li>
        <li>Upload an Image via the PoC front end for super resolution.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to use the PoC:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Click on the dotted box to select a document (.jpg, .jpeg, .png).</li>
        <li>Click on "Deblur" or "LR to SR" button to send the file to flask service. </li>
        <li>Wait for the response, which will display "Uploaded Image" and " Processed Image" .</li>
        <li>The Processed Image will show Super Resolution or Deblurring Image.</li>
      </ol>
    </>
  );

  const videoContent = {
    videoTitle: "Image Super Resolution Demo",
    uri: "https://vmivsp.sharepoint.com/sites/VM.ALL.EmergingTechnologies/_layouts/15/embed.aspx?UniqueId=f304bbee-de44-4e88-be74-2259e736d3ae&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create",
  };

  const demoContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Image Super Resolution
        </h2>

        <form className="bg-white shadow-xl rounded-xl p-8 mb-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Upload an Image</h3>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <p className="text-gray-600 mb-2">Drag and drop your file here, or click to select</p>
                {file && (
                  <p className="text-sm text-gray-900">
                    File selected: <span className="font-semibold">{file.name}</span>
                  </p>
                )}
                <p className="text-sm text-gray-900 underline">
                  Supported formats: <span className="text-blue-600">jpeg, jpg, png</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
                onClick={handleDeblur}
                disabled={isDeblurLoading || !file}
              >
                {isDeblurLoading ? 'Processing...' : 'Deblur'}
              </button>

              <button
                type="button"
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700"
                onClick={handleLRToSR}
                disabled={isLRToSRLoading || !file}
              >
                {isLRToSRLoading ? 'Processing...' : 'LR to SR'}
              </button>
            </div>
          </div>
        </form>

        {previewUrl && resultUrl && (
          <div className="flex gap-8 mt-8 justify-center items-start">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Before (Uploaded Image)</h4>
              <img
                src={previewUrl}
                alt="Uploaded"
                className="w-[800px] max-w-none h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">After (Processed Image)</h4>
              <img
                src={resultUrl}
                alt="Processed"
                className="w-[800px] max-w-none h-auto rounded-lg shadow-lg"
              />
              <div className="text-left mt-5">
                <button
                  onClick={handleDownload}
                  className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Download Processed Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return <PocPageWrapper
    metadata={metadata}
    demoContent={demoContent}
    infoContent={detailsPanelContent}
    setupContent={setupPanelContent}
    videoContent={videoContent}
  />
}








