'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Handle form submission and file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError(null); // Clear error if file exists
    setIsLoading(true); // Start loading

    const formData = new FormData();
    formData.append('file', file);

    // const siteUrl = "http://127.0.0.1:5000"
    const siteUrl = "https://www.valuemomentum.studio/document_summary"

    try {
      const response = await fetch(siteUrl + '/summarize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to summarize document. Error: ${errorMessage}`);
      }

      const result = await response.json();
      setResponseText(result.summary); // Assuming the response contains a "summary" field
    } catch (error) {
      console.error('Error during file upload:', error);
      setError(`There was an error processing the file: ${error}`);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // Content for the Details panel (Business Context)
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        Claims adjusters process various documents, from Loss Reports to Legal Opinions. 
        On average, it takes 30 minutes to several hours to review these documents due to 
        their volume and complexity. This manual process slows decision-making, increases 
        the likelihood of errors, and adds to the claims cycle time.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Adjusters need an automated solution that can quickly and accurately summarize key 
        documents (Loss Reports, Policy Documents, Medical Reports, Repair Estimates, and Legal 
        Documents) to streamline the review process.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Reducing document review time will increase operational efficiency, shorten claims 
        cycle times, and improve customer satisfaction. By automating the summarization of key 
        documents, adjusters can focus on high-level decision-making, reducing repetitive tasks and delays.
      </p>
    </>
  );

  // Content for the Developer Setup panel
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
          Ensure the Flask service is running on <code>localhost:5000</code> by executing:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>flask run</code>
          </pre>
        </li>
        <li>Upload documents via the PoC front end for summarization.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to use the PoC:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Click the &quote;Choose File&quote; button and select a document (.txt, .pdf, .docx).</li>
        <li>Click &quote;Upload and Summarize&quote; to send the file to the Flask service.</li>
        <li>Wait for the response, which will return a summary of the document.</li>
        <li>The summarized text will be displayed in Markdown format on the page.</li>
      </ol>
    </>
  );

  const demoContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Upload a Document
            </h3>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 transition-all duration-300 hover:border-blue-500 group">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.tif,.tiff,.jpg,.png,.jpeg,.gif"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">Drag and drop your file here, or click to select</p>
                <p className="text-sm text-gray-900 underline">{file ? file.name : 'Supported formats: PDF, DOCX, TXT, Images'}</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                'Upload and Summarize'
              )}
            </button>
          </div>
        </form>

        {/* Enhanced Markdown Display Section */}
        {responseText && (
          <div className="mt-8 bg-white rounded-xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-4">Summary Results</h3>
            <div className="[&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6
                          [&>p]:mb-4 [&>p]:leading-relaxed
                          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-2
                          [&>*>strong]:font-bold [&>*>strong]:text-gray-800">
              <ReactMarkdown>{responseText}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
    />
  ); 
}
