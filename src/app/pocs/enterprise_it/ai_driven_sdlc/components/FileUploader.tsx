'use client';
import { useState, useRef, useEffect } from 'react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onLanguageSelect: (source: string, target: string) => void;
  onStartMigration: () => void;
  sourceLanguage: string;
  targetLanguage: string;
  isProcessing: boolean;
}

const languageOptions = [
  { value: 'java', label: 'Java' },
  { value: 'cobol', label: 'COBOL' },
  { value: 'rpg', label: 'RPG' },
  { value: 'basic', label: 'BASIC' },
  { value: 'c#', label: 'C#' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'ssis', label: 'SSIS'},
  { value: 'dbt', label: 'DBT'},
  { value: 'classic asp', label: 'Classic ASP'},
  { value: 'natural', label: 'Natural'},
  { value: 'jcl', label: 'JCL'},
];

export default function FileUploader({
  onFileSelected,
  onLanguageSelect,
  onStartMigration,
  sourceLanguage,
  targetLanguage,
  isProcessing
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };
  
  const handleSourceLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageSelect(e.target.value, targetLanguage);
  };
  
  const handleTargetLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageSelect(sourceLanguage, e.target.value);
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };
  
  // Get shortened filename for collapsed view
  const getShortenedFilename = () => {
    if (!selectedFileName) return '';
    
    const nameParts = selectedFileName.split('.');
    const extension = nameParts.pop();
    const name = nameParts.join('.');
    
    if (name.length <= 10) return selectedFileName;
    return `${name.substring(0, 7)}...${extension ? `.${extension}` : ''}`;
  };
  
  return (
    <div>
      <div className={`file-uploader`}>
        <div 
          className={`upload-zone ${dragActive ? 'border-blue-500 bg-blue-50' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zip"
            className="hidden"
          />
          
          {selectedFileName ? (
            <div>
              <p className="text-lg font-medium text-gray-700">Selected file:</p>
              <p className="text-md text-blue-500 mt-2">{selectedFileName}</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">Drag & Drop your ZIP file here</p>
              <p className="text-md text-gray-500 mt-2">or click to select a file</p>
            </div>
          )}
        </div>
        
        <div className="language-selector">
          <div className="language-group">
            <label htmlFor="sourceLanguage">Source Language:</label>
            <select
              id="sourceLanguage"
              value={sourceLanguage}
              onChange={handleSourceLanguageChange}
              disabled={isProcessing}
            >
              <option value="">Select Source Language</option>
              {languageOptions.map((lang) => (
                <option key={`source-${lang.value}`} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="language-group">
            <label htmlFor="targetLanguage">Target Language:</label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={handleTargetLanguageChange}
              disabled={isProcessing}
            >
              <option value="">Select Target Language</option>
              {languageOptions.map((lang) => (
                <option key={`target-${lang.value}`} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          className="start-button btn-ai"
          onClick={onStartMigration}
          disabled={!selectedFileName || !sourceLanguage || !targetLanguage || isProcessing}
        >
          {isProcessing ? 'Migration in Progress...' : 'Start Migration'}
        </button>
      </div>
    </div>
  );
}
