import React, { useState } from 'react';
import { useJobs } from '../contexts/JobsContext';
import JobsList from './JobsList';

export default function JobsIndicator() {
  const { runningJobs } = useJobs();
  const [showJobs, setShowJobs] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowJobs(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors duration-200 group"
      >
        <div className="text-center">
          <div className="text-xl font-bold">{runningJobs.length}</div>
          <div className="text-xs">Jobs</div>
        </div>
        {runningJobs.length > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {showJobs && (
        <JobsList
          isOpen={showJobs}
          onClose={() => setShowJobs(false)}
        />
      )}
    </>
  );
}