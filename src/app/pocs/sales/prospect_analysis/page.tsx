'use client';

import { useState, useEffect } from 'react';
import { FaInfoCircle, FaArrowUp, FaArrowDown, FaTrash } from 'react-icons/fa';
import { createJob, FileState, JobResponse } from 'services/prospectAnalysisService';
import JobsIndicator from 'components/JobsIndicator';
import { useJobs, JobsProvider } from 'contexts/JobsContext';
import Tooltip from 'components/Tooltip';
import { useToast } from 'components/ToastContainer';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

interface FormData {
  task: string;
  lineOfBusiness: string;
  companyName: string;
  companyDomain: string;
  planOfAction: string[];
}

function ProspectAnalysisContent() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    task: '',
    lineOfBusiness: '',
    companyName: '',
    companyDomain: '',
    planOfAction: ['']
  });
  
  // Update task description and plan of action when company name changes
  useEffect(() => {
    if (formData.companyName) {
      const companyName = formData.companyName;
      
      // Update task description
      const updatedTask = `Write a report on account strategy for a potential partnership with ${companyName} for AI driven solutions. Look for financial information like revenue, profit, combined ratio, loss ratio, etc. Identify and map out the leadership team and their roles, influence, and decision-making process. Finally, analyze ${companyName}'s involvement in AI driven solutions and how they can be leveraged to drive business value.`;
      
      // Create prefilled plan of action
      const prefillPlanOfAction = [
        `Gather general information about the ${companyName}, including its history, geography, and lines of business. Focus on important details like rankings and market position. Consider AM Best ratings and other relevant metrics.`,
        `Collect financial information about the company, including revenue, profit, growth rates, combined ratio, loss ratio, and other insurance metrics. Look for recent financial reports or news articles that provide this data.`,
        `Identify and map out the leadership team. Gather information about their roles, influence, and decision-making processes. Look for organizational charts or profiles of key executives.`,
        `Research the business priorities of the company. Look for strategic initiatives, investments, and any recent news that indicates their focus areas. This could include press releases or industry reports.`,
        `Investigate the IT overview of the company. Gather information about their technology landscape, IT leaders, decision-making processes, and spending patterns. Look for insights into their technology stack and any recent IT initiatives.`,
        `Analyze the current relationship between ValueMomentum (VM) and the company. Gather information about existing products, services, and revenue trends. Understand the current state of VM in the account.`,
        `Develop an account strategy for ValueMomentum (VM). Identify goals, objectives, challenges, and opportunities from VM's perspective. Consider how VM can align with the company's business priorities.`,
        `Assess customer stickiness and retention. Gather information about customer satisfaction, retention rates, and any key activities that contribute to a strong relationship with VM. Identify strategies to enhance customer loyalty.`,
        `Define key performance indicators (KPIs) for the account strategy. Establish metrics that align with the goals set for the account. Consider how these KPIs can be measured and tracked over time.`,
        `Compile all the gathered information into a comprehensive report (FINISH). Ensure that the report is well-structured and covers all the key areas outlined in the plan.`
      ];
      
      setFormData(prev => ({
        ...prev,
        task: updatedTask,
        planOfAction: prefillPlanOfAction
      }));
    }
  }, [formData.companyName]);

  // File state - using an object to store multiple files
  const [files, setFiles] = useState<FileState>({
    naicReport: null,
    ambestReport: null,
    annualReport: null,
    otherReports: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({
    task: '',
    lineOfBusiness: '',
    companyName: '',
    companyDomain: '',
    files: '',
    submit: ''
  });

  const { addJob } = useJobs();
  const { showToast } = useToast();

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof FileState) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      if (type === 'otherReports') {
        setFiles(prev => ({
          ...prev,
          [type]: Array.from(files)
        }));
      } else {
        setFiles(prev => ({
          ...prev,
          [type]: files[0]
        }));
      }
    }
  };

  // Handle plan of action changes
  const handlePlanStep = (index: number, value: string) => {
    const newSteps = [...formData.planOfAction];
    newSteps[index] = value;
    if (index === newSteps.length - 1 && value !== '') {
      newSteps.push(''); // Add new empty step
    }
    setFormData(prev => ({
      ...prev,
      planOfAction: newSteps
    }));
  };

  // Handle moving a step up
  const handleMoveStepUp = (index: number) => {
    if (index <= 0) return; // Can't move the first item up
    
    const newSteps = [...formData.planOfAction];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index - 1];
    newSteps[index - 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      planOfAction: newSteps
    }));
  };
  
  // Handle moving a step down
  const handleMoveStepDown = (index: number) => {
    if (index >= formData.planOfAction.length - 1) return; // Can't move the last item down
    
    const newSteps = [...formData.planOfAction];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + 1];
    newSteps[index + 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      planOfAction: newSteps
    }));
  };

  // Handle removing a plan step
  const handleRemoveStep = (index: number) => {
    const newSteps = formData.planOfAction.filter((_, i) => i !== index);
    if (newSteps.length === 0) {
      newSteps.push(''); // Ensure there's always at least one empty step
    }
    setFormData(prev => ({
      ...prev,
      planOfAction: newSteps
    }));
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!formData.task.trim()) {
      newErrors.task = 'Task is required';
      isValid = false;
    }
    if (!formData.lineOfBusiness.trim() && files.naicReport) {
      newErrors.lineOfBusiness = 'Line of Business is required';
      isValid = false;
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company Name is required';
      isValid = false;
    }
    if (!formData.companyDomain.trim()) {
      newErrors.companyDomain = 'Company Domain is required';
      isValid = false;
    }
    if (!files.naicReport && !files.ambestReport && !files.annualReport) {
      newErrors.files = 'At least one report is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting.', 'error');
      return;
    }

    setIsLoading(true);
    const formDataToSend = new FormData();
    
    // Append text data
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'planOfAction') {
        formDataToSend.append(key, JSON.stringify((value as string[]).filter((step: string) => step.trim() !== '')));
      } else {
        formDataToSend.append(key, value as string);
      }
    });

    // Append files
    Object.entries(files).forEach(([key, value]) => {
      if (key === 'otherReports' && Array.isArray(value)) {
        value.forEach((file: File) => {
          formDataToSend.append('otherReports', file);
        });
      } else if (value instanceof File) {
        formDataToSend.append(key, value);
      }
    });

    try {
      const response = await createJob(formDataToSend);
      
      // Show success toast
      showToast(`Analysis job for ${formData.companyName} started successfully!`, 'success');
      
      // Add job to context
      addJob({
        jobId: response.jobId,
        status: response.status as JobResponse['status'],
        progress: 0,
        currentTask: 'Initializing analysis...',
        activeAgents: [],
        completedSteps: [],
        startTime: response.createdAt,
        lastUpdate: response.createdAt
      });

      // Reset form
      setFormData({
        task: '',
        lineOfBusiness: '',
        companyName: '',
        companyDomain: '',
        planOfAction: ['']
      });
      setFiles({
        naicReport: null,
        ambestReport: null,
        annualReport: null,
        otherReports: []
      });
      setErrors({
        task: '',
        lineOfBusiness: '',
        companyName: '',
        companyDomain: '',
        files: '',
        submit: ''
      });

    } catch (error) {
      console.error('Error:', error);
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to start analysis'}`, 'error');
      setErrors(prev => ({
        ...prev,
        submit: `Error processing request: ${error}`
      }));
    } finally {
      setIsLoading(false);
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
        {/* Description Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <FaInfoCircle className="w-6 h-6 text-blue-600 mt-0 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">About This PoC</h3>
              <div className="prose max-w-none text-gray-600">
                <p>
                  The Prospect Analysis Demo is a sophisticated deep research system that helps analyze potential business prospects using AI-powered agents and specialized tools. It processes multiple data sources to generate a comprehensive analysis report with factual citations and truth grounding.
                </p>
                
                <p className="mt-4 text-sm text-gray-500">
                  Note: Analysis typically takes 15-30 minutes. Browser window can be closed once kicked-off, the research is executed in the background.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl space-y-6">
          {/* Company Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <span>Company Name</span>
                <Tooltip 
                  icon 
                  content="Enter the legal name of the company for analysis. This will be used for all research queries."
                  className="ml-1 mt-1"
                />
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={(e) => {
                  handleInputChange(e);
                }}
                onFocus={() => formData.companyName}
                className="w-full p-3 border rounded-lg"
                placeholder="Full legal company name"
              />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
              
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <span>Line of Business</span>
                <Tooltip 
                  icon 
                  content="Specify the industry sector or specific business area the company operates in. This helps focus the analysis on relevant metrics and competitors. This is also used to narrow down NAIC reports."
                  className="ml-1 mt-1"
                />
              </label>
              <input
                type="text"
                name="lineOfBusiness"
                value={formData.lineOfBusiness}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g., Property & Casualty, Life Insurance"
              />
              {errors.lineOfBusiness && <p className="text-red-500 text-sm mt-1">{errors.lineOfBusiness}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <span>Company Domain</span>
                <Tooltip 
                  icon 
                  content="Enter the company's website domain for more targeted research."
                  className="ml-1 mt-1"
                />
              </label>
              <input
                type="text"
                name="companyDomain"
                value={formData.companyDomain}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g., company.com"
              />
              {errors.companyDomain && <p className="text-red-500 text-sm mt-1">{errors.companyDomain}</p>}
            </div>
          </div>

          {/* File Upload Section with Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Document Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['naicReport', 'ambestReport', 'annualReport', 'otherReports'].map((reportType) => (
                <div key={reportType} className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-300 hover:border-blue-500">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple={reportType === 'otherReports'}
                    onChange={(e) => handleFileChange(e, reportType as keyof FileState)}
                    disabled={reportType === 'otherReports'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      {reportType === 'otherReports' ? 'OTHER FILES [WIP]' : reportType.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                    {files[reportType as keyof FileState] && (
                      <p className="text-xs text-green-600 mt-2">
                        {reportType === 'otherReports' 
                          ? Array.from(files[reportType as keyof FileState] as File[]).map(file => file.name).join(', ')
                          : (files[reportType as keyof FileState] as File).name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.files && <p className="text-red-500 text-sm mt-1">{errors.files}</p>}
          </div>
          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Description
              <span className="ml-2 text-sm text-gray-500">(Be as detailed as possible)</span>
            </label>
            <textarea
              name="task"
              value={formData.task}
              onChange={handleInputChange}
              key={`task-${formData.companyName}`} // Add key to force re-render when company name changes
              className="w-full p-4 border rounded-lg min-h-[150px] font-mono text-sm"
              placeholder="Describe your analysis requirements in detail. For example:
- Specific areas of focus
- Key concerns to address
- Particular aspects of the business to analyze
- Any specific metrics or comparisons needed"
            />
            {errors.task && <p className="text-red-500 text-sm mt-1">{errors.task}</p>}
          </div>

          {/* Plan of Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan of Action
            </label>
            <div className="space-y-2">
              {formData.planOfAction.map((step, index) => (
                <div key={index} className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                  <span className="text-sm font-medium text-gray-500 w-3 ml-1">{index + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handlePlanStep(index, e.target.value)}
                    className="flex-1 p-3 rounded-lg focus:outline-none"
                    placeholder="Enter action step"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveStepUp(index)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <FaArrowUp size={14} />
                    </button>
                  )}
                  {index < formData.planOfAction.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveStepDown(index)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <FaArrowDown size={14} />
                    </button>
                  )}
                  {index > 0 && step !== '' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing Analysis...</span>
              </>
            ) : (
              'Start Analysis'
            )}
          </button>

        </form>
      </div>
    </div>
  );

  return (
    <PocPageWrapper
      metadata={metadata}
      demoContent={demoContent}
      infoContent={detailsPanelContent}
      setupContent={setupPanelContent}
      fixedContent={(
        <JobsIndicator />
      )}
    />
  );
}

export default function ProspectAnalysis() {
  return (
    <JobsProvider>
        <ProspectAnalysisContent />
    </JobsProvider>
  );
}
