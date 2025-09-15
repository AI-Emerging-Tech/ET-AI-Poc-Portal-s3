'use client';
import './style.css';
import type { StaticImageData } from 'next/image';
import Link from 'next/link';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';

// Import one representative image from each POC
import testReportSummary from 'assets/test_cases_generated_v2.png';
import readmeForApplication from 'assets/pr_review_1.png';
import automatedReviewPage1 from 'assets/Automated_Review_1.png';
import issuetriage from 'assets/issuetriage.png';

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

export default function AppMaintenance() {
  const pocs = [
    // {
    //   title: "Test Cases Generation",
    //   description: "Automate the creation of BDD scenarios from a user story then generate corresponding test cases.",
    //   imageSrc: testReportSummary,
    //   link: "/pocs/enterprise_it/app_maintanance/test_case_generation"
    // },
    {
      title: "PR Review",
      description: "Streamline Pull Request reviews with automated checks and suggestions.",
      imageSrc: readmeForApplication,
      link: "/pocs/enterprise_it/app_maintanance/pr_review"
    },
    {
      title: "Log Monitoring",
      description: "Automate Log Monitoring with real-time insights and alerts.",
      imageSrc: automatedReviewPage1,
      link: "/pocs/enterprise_it/app_maintanance/log_monitoring"
    },
    {
      title: "Issue Triage",
      description: "Automate the triage process for incoming issues, categorizing and prioritizing them effectively.",
      imageSrc: issuetriage,
      link: "/pocs/enterprise_it/app_maintanance/issue_triage"
    }
  ];

  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
      Software applications demand ongoing maintenance well beyond their initial release. 
      While feature development often receives priority, maintenance is sidelined to already stretched developers or DevOps teams. 
      Tasks like bug fixing, regression checks, dependency updates, log monitoring, and PR reviews consume significant engineering time and shift focus away from innovation. 
      As applications scale, maintenance costs can reach 15–20% of the budget annually—and up to 50% during critical phases. 
      Inconsistent reviews, growing issue backlogs, and noisy logs further strain teams, slowing velocity and impacting quality.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Application owners are overburdened with corrective, adaptive, and preventive maintenance tasks. 
        Manual triage and quality assurance can consume up to 60% of a developer’s time. 
        Delayed response to bugs and vulnerabilities leads to user churn, decreased product value, and increased long-term maintenance costs.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Annual maintenance costs can consume 15–50% of the original development budget. 
        Slow triage affects customer satisfaction and developer productivity. 
        Apps with a crash-free rate above 99% retain 42% more active users compared to those below 97%. 
        Efficient maintenance is directly tied to business continuity and growth.
      </p>

    </>
  );

  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Overview</h3>
      <p className="text-gray-700 leading-relaxed">
        The Automated App Maintenance suite consists of four integrated POCs:
      </p>
      <ol className="list-decimal ml-4 text-gray-700 leading-relaxed">
        <li>Test Cases Generation</li>
        <li>PR Review</li>
        <li>App Monitoring</li>
        <li>Issue Triage</li>
      </ol>
      <p className="mt-4">
        Please visit each individual POC page for specific setup instructions and detailed documentation.
      </p>
    </>
    
  );
  

  const demoContent = (
    <div className='ams-container'>
      <div className='ams-header-section'>
        <h1 className='ams-header-title'>Automated App Maintenance Suite</h1>
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