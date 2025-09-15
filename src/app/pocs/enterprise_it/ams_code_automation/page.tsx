'use client';
import './styles.css';
import type { StaticImageData } from 'next/image';
import Link from 'next/link';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

// Import one representative image from each POC
import testReportSummary from 'assets/test_cases_generated_v2.png';
import readmeForApplication from 'assets/readmep2.png';
import automatedReviewPage1 from 'assets/Automated_Review_1.png';
import architectureAnalysis from 'assets/architecture_analysis_1.jpg';

const PocCard = ({
  title,
  description,
  imageSrc,
  link,
}: {
  title: string;
  description: string;
  imageSrc: StaticImageData;
  link: string;
}) => (
  <Link href={link}>
    <div className="ams-poc-card">
      <h3>{title}</h3>
      <img src={imageSrc.src} alt={title} className="ams-poc-preview-image" />
      <p>{description}</p>
      <span className="ams-view-details">View Details →</span>
    </div>
  </Link>
);

export default function AmsCodeAutomation() {
  const pocs = [
    {
      title: "Unit Test Generation & Validation",
      description: "Automate the creation of comprehensive unit tests for TypeScript and Python codebases, ensuring better code coverage and reliability.",
      imageSrc: testReportSummary,
      link: "/pocs/enterprise_it/ams_code_automation/unit_test_generation"
    },
    {
      title: "Code Documentation Generation",
      description: "Generate detailed documentation including inline comments, README files, and architecture diagrams automatically.",
      imageSrc: readmeForApplication,
      link: "/pocs/enterprise_it/ams_code_automation/code_documention_generation"
    },
    {
      title: "Code Review & Analysis",
      description: "Automate code reviews with AI-powered analysis for style, security, and performance optimization.",
      imageSrc: automatedReviewPage1,
      link: "/pocs/enterprise_it/ams_code_automation/code_review_analysis"
    },
    {
      title: "Architecture Diagram Analysis",
      description: "Automate the generation of the architecture analysis for the given diagram.",
      imageSrc: architectureAnalysis,
      link: "/pocs/enterprise_it/ams_code_automation/architecture_diagram_analysis"
    }
  ];

  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
      The AMS Code Automation initiative combines four powerful POCs to revolutionize software development workflows.
      By automating unit testing, documentation, architecture diagram analysis and code review processes, we significantly reduce manual effort
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Development teams face challenges with time-consuming manual processes in testing, documentation, and code review.
        These tasks often lead to inconsistencies, delayed deliveries, and technical debt. Our automated solution
        addresses these pain points through integrated AI-powered tools.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        This comprehensive automation suite delivers:
      </p>
      <ul className="list-disc ml-6 text-gray-700 leading-relaxed">
        <li>50% reduction in testing time</li>
        <li>70% faster documentation generation</li>
        <li>40% more efficient code reviews</li>
        <li>Improved code quality and consistency</li>
        <li>Reduced technical debt</li>
        <li>Enhanced developer productivity</li>
      </ul>
    </>
  );

  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Overview</h3>
      <p className="text-gray-700 leading-relaxed">
        The AMS Code Automation suite consists of four integrated POCs:
      </p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>Unit Test Generation & Validation</li>
        <li>Code Documentation Generation</li>
        <li>Code Review & Analysis</li>
        <li>Architecture Diagram Analysis</li>
      </ol>
      <p className="mt-4">
        Please visit each individual POC page for specific setup instructions and detailed documentation.
      </p>
    </>
    
  );
  

  const demoContent = (
    <div className='ams-container'>
      <div className='ams-header-section'>
        <h1 className='ams-header-title'>AMS Code Automation Suite</h1>
      </div>
      <div className='ams-header-section'>
        <p>
          A comprehensive solution combining four powerful POCs to automate and streamline
          software development workflows through AI-powered tooling.
        </p>
      </div>

      <div className='ams-pocs-grid'>
        {pocs.map((poc, index) => (
          <PocCard key={index} {...poc} />
        ))}
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