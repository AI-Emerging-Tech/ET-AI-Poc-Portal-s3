'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Tooltip from 'components/Tooltip';  // Add this import
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

export default function IncidentSummary() {
  const [file, setFile] = useState<File | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isV2, setIsV2] = useState(true);  // Changed default to true for V2

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

    // proxy "http://127.0.0.1/document_summary"
    // regular "https://www.valuemomentum.studio:5000"
    const siteUrl = "https://www.valuemomentum.studio/document_summary"
    const endpoint = isV2 ? '/incidents/v2' : '/incidents';  // Updated endpoint based on version

    try {
      // Call the Flask service  https://www.valuemomentum.studio:5000/summarize
      const response = await fetch(siteUrl + endpoint, {
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
        Insurance companies deal with a high volume of IT incidents across multiple systems that support critical business functions like Claims, Policy Management, and Billing. Currently, incident patterns and trends are analyzed manually, which is time-consuming and may miss important insights. This leads to:
      </p>
      <ul className="text-gray-700 leading-relaxed list-disc ml-6">
        <li>Delayed identification of systemic issues</li>
        <li>Inefficient resource allocation</li>
        <li>Missed opportunities for proactive problem management</li>
        <li>Extended Mean Time to Resolution (MTTR)</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        The IT Operations team needs an automated way to analyze incident patterns and identify trends across critical insurance applications. Without automated analysis, recurring issues go unnoticed, leading to increased downtime and operational costs. The team specifically needs to:
      </p>
      <ul className="text-gray-700 leading-relaxed list-disc ml-6">
        <li>Identify common incident patterns</li>
        <li>Group similar incidents across applications</li>
        <li>Generate actionable insights for problem management</li>
        <li>Highlight opportunities for automation and self-service</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Successfully implementing automated incident analysis will deliver:
      </p>
      <ul className="text-gray-700 leading-relaxed list-disc ml-6">
        <li>
          <strong>Cost Reduction:</strong>
          <ul className="list-disc ml-6">
            <li>20-30% reduction in MTTR through faster pattern recognition</li>
            <li>Decreased operational costs from automated analysis vs manual review</li>
          </ul>
        </li>
        <li>
          <strong>Operational Efficiency:</strong>
          <ul className="list-disc ml-6">
            <li>Early detection of emerging issues before they become critical</li>
            <li>More effective resource allocation based on incident patterns</li>
            <li>Improved problem management through data-driven insights</li>
          </ul>
        </li>
        <li>
          <strong>Service Quality:</strong>
          <ul className="list-disc ml-6">
            <li>Reduced system downtime through proactive issue resolution</li>
            <li>Enhanced user experience through faster incident resolution</li>
            <li>Better alignment of IT operations with business priorities</li>
          </ul>
        </li>
      </ul>
      <p className="text-gray-700 leading-relaxed">
        This PoC demonstrates how AI-powered analysis can transform raw incident data into actionable insights, enabling a more proactive approach to IT service management.
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
          Ensure the Flask service is running on <code>https://www.valuemomentum.studio:5000</code> by executing:
          <pre className="bg-gray-100 p-2 rounded-lg my-2">
            <code>flask run</code>
          </pre>
        </li>
        <li>Upload documents via the PoC front end for summarization.</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to use the PoC:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Click the "Choose File" button and select a document (.csv).</li>
        <li>Use toggle to switch versions if needed.</li>
        <li>Click "Upload and Summarize" to send the file to the Flask service.</li>
        <li>Wait for the response, which will return a summary of the document.</li>
        <li>The summarized text will be displayed in Markdown format on the page.</li>
      </ol>
    </>
  );

  const demoContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Incident Summarization
        </h2>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl">
          {/* Version Toggle Switch */}
          <div className="flex items-center justify-end mb-6">
            <Tooltip 
              content="Full LLM-based summarization (~30 mins for 1k rows)
Some context might be lost for long documents"
              position="top"
            >
              <span className="mr-3 text-sm font-medium text-gray-700">V1</span>
            </Tooltip>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isV2}
                onChange={(e) => setIsV2(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>

            <Tooltip 
              content="Hybrid analytics + LLM approach (~2-3 mins for 10k rows)
Full context retention up to 100k rows"
              position="top"
            >
              <span className="ml-3 text-sm font-medium text-gray-700">V2</span>
            </Tooltip>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {`Upload a CSV Document (Recommended size: less than ${isV2 ? '50k' : '1k'} rows)`}
            </h3>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 transition-all duration-300 hover:border-blue-500 group">
              <input
                type="file"
                accept=".csv"
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
                <p className="text-sm text-gray-900 underline">{file ? file.name : 'CSV files only'}</p>
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
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-4">Incident Summary</h3>
            <div className="overflow-x-auto">
              <div className="prose max-w-none min-w-full
                            [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6
                            [&>p]:mb-4 [&>p]:leading-relaxed
                            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 
                            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4
                            [&>ul>li]:mb-2 [&>ol>li]:mb-2
                            [&>ul>li>ul]:mt-2 [&>ul>li>ol]:mt-2 
                            [&>ol>li>ul]:mt-2 [&>ol>li>ol]:mt-2
                            [&>ul>li>ul]:pl-6 [&>ul>li>ol]:pl-6
                            [&>ol>li>ul]:pl-6 [&>ol>li>ol]:pl-6
                            [&>*>strong]:font-bold [&>*>strong]:text-gray-800
                            [&>table]:w-full [&>table]:border-collapse [&>table]:my-4
                            [&>table]:table-auto [&>table]:whitespace-normal [&>table]:break-words
                            [&>table>thead>tr]:bg-gray-100
                            [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-gray-300 [&>table>thead>tr>th]:p-3 [&>table>thead>tr>th]:text-left
                            [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-gray-300 [&>table>tbody>tr>td]:p-3
                            [&>table>tbody>tr:nth-child(even)]:bg-gray-50">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    // Override default list rendering
                    ol: ({node, ...props}) => <ol className="list-decimal" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc" {...props} />
                  }}
                >{responseText}</ReactMarkdown>
              </div>
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
