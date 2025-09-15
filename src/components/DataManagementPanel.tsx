'use client';
import React, { useState, useEffect } from "react";
import Image from 'next/image';
import avatar from 'assets/chatbot_avatar.png';

interface DataManagementPanelProps {
  files: string[];
  uploadStatus: string;
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (filename: string) => void;
  showAvatar?: boolean;
  userInteracted?: boolean;
}

const DataManagementPanel: React.FC<DataManagementPanelProps> = ({
  files,
  uploadStatus,
  isUploading,
  onFileUpload,
  onDeleteFile,
  showAvatar = false,
  userInteracted = false,
}) => {
  const [greeting, setGreeting] = useState("Hi, I’m Max 👋");

  useEffect(() => {
    if (userInteracted) {
      setGreeting("Nice to meet you!");
      const timeout = setTimeout(() => setGreeting(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [userInteracted]);

  return (
    <>
      {showAvatar && (
        <div className="flex flex-col items-center mt-4 relative">
          <Image
            src={avatar}
            alt="Chatbot Avatar"
            width={80}
            height={80}
            className="rounded-full shadow-md animate-pulse"
          />
          {greeting && (
            <div className="absolute -top-8 bg-white border px-3 py-1 rounded-lg text-sm shadow-md animate-fadeIn text-gray-800">
              {greeting}
            </div>
          )}
        </div>
      )}

      <h3 className="text-lg font-semibold mt-4 text-center">Knowledge Base Management</h3>

      {/* Upload Section */}
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium mb-3">Upload Documents</h4>
        <div className="flex flex-col gap-3">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.zip"
            className="border p-2 rounded"
            onChange={onFileUpload}
            disabled={isUploading}
          />
          {uploadStatus && (
            <p className={`text-sm ${uploadStatus.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </div>

      {/* Document List Section */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium mb-3">Current Documents</h4>
        <div className="max-h-[300px] overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
          ) : (
            files.map((filename, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <span className="truncate flex-1 mr-2">{filename}</span>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onDeleteFile(filename)}
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default DataManagementPanel;