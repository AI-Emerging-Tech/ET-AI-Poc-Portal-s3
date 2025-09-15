'use client';
import { useState, useEffect, useRef } from 'react';
import * as shiki from 'shiki';
import { ReactSVG } from 'react-svg';

interface CodeComparisonViewProps {
  sourceFiles: string[];
  generatedFiles: any[];
  refactoredFiles: any[];
  sourceInfo?: Record<string, any>;
  jobId?: string;
}

interface FileTreeItem {
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

interface FileTreeObject {
  source: FileTreeItem[];
  output: FileTreeItem[];
}

interface FileDiff {
  source: string;
  output: string;
  diff: string;
}

export default function CodeComparisonView({ 
  sourceFiles, 
  generatedFiles, 
  refactoredFiles,
  sourceInfo = {},
  jobId = ''
}: CodeComparisonViewProps) {
  const [selectedSourceFile, setSelectedSourceFile] = useState<string>('');
  const [selectedGeneratedFile, setSelectedGeneratedFile] = useState<string>('');
  const [sourceContent, setSourceContent] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileTreeObject>({ source: [], output: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<FileDiff | null>(null);
  const [sourceDirectory, setSourceDirectory] = useState<string>('');
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  const [sourceFileType, setSourceFileType] = useState<string>('code'); // 'code', 'image', 'markdown'
  const [generatedFileType, setGeneratedFileType] = useState<string>('code'); // 'code', 'image', 'markdown'
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [fullScreenContent, setFullScreenContent] = useState<{content: string, path: string, type: string}>({
    content: '',
    path: '',
    type: 'code'
  });
  const [highlighter, setHighlighter] = useState<shiki.Highlighter | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState<boolean>(false);
  const [sourceHighlightedCode, setSourceHighlightedCode] = useState<string>('');
  const [generatedHighlightedCode, setGeneratedHighlightedCode] = useState<string>('');
  const [diffHighlightedCode, setDiffHighlightedCode] = useState<string>('');
  const [fullScreenHighlightedCode, setFullScreenHighlightedCode] = useState<string>('');
  
  const baseUrl = 'https://www.valuemomentum.studio/sdlc/api/migration/jobs';

  // Check if dark mode is active
  useEffect(() => {
    // Check body for dark-mode-ams class
    const checkDarkMode = () => {
      if (document.body) {
        setIsDarkMode(document.body.classList.contains('dark-mode-ams'));
      }
    };

    // Initial check
    checkDarkMode();
    
    // Set up an observer to detect changes to body classes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    if (document.body) {
      observer.observe(document.body, { attributes: true });
    }
    
    return () => observer.disconnect();
  }, []);

  // Initialize Shiki highlighter
  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const shikiHighlighter = await shiki.createHighlighter({
          themes: ['github-light', 'github-dark'],
          langs: [
            'javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 
            'java', 'python', 'csharp', 'go', 'cpp', 'c', 'php', 
            'ruby', 'rust', 'shell', 'sql', 'json', 'markdown', 'yaml',
            'cobol', 'xml', 'properties', 'diff'
          ],
        });
        setHighlighter(shikiHighlighter);
      } catch (error) {
        console.error('Failed to initialize syntax highlighter:', error);
      }
    };

    initHighlighter();
  }, []);

  // Update source and output directories based on sourceInfo
  useEffect(() => {
    if (sourceInfo) {
      setSourceDirectory(sourceInfo.source_directory || '');
      setOutputDirectory(sourceInfo.output_directory || '');
    }
  }, [sourceInfo]);

  // Load file tree when jobId changes and initialize collapsedDirs only then
  useEffect(() => {
    if (jobId) {
      // Only initialize collapsedDirs when jobId changes
      setCollapsedDirs(new Set()); // Reset collapsed state
      fetchFileTree(true); // Pass true to indicate this is an initial load
    }
  }, [jobId]);

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    if (!jobId) return;
    
    const refreshFiles = () => {
      console.log('Auto-refreshing files...');
      fetchFileTree(false); // Pass false to indicate this is a refresh, not initial load
      // if (selectedSourceFile) {
      //   fetchFileContent(selectedSourceFile, 'source');
      // }
      // if (selectedGeneratedFile) {
      //   fetchFileContent(selectedGeneratedFile, 'output');
      // }
    };
    
    const refreshInterval = setInterval(refreshFiles, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [jobId, selectedSourceFile, selectedGeneratedFile]);

  // Fetch file content when a file is selected
  useEffect(() => {
    if (jobId && selectedSourceFile) {
      fetchFileContent(selectedSourceFile, 'source');
      setSourceFileType(getFileType(selectedSourceFile));
    }
  }, [selectedSourceFile]);

  useEffect(() => {
    if (jobId && selectedGeneratedFile) {
      fetchFileContent(selectedGeneratedFile, 'output');
      setGeneratedFileType(getFileType(selectedGeneratedFile));
    }
  }, [selectedGeneratedFile]);

  // Fetch file tree from API
  const fetchFileTree = async (isInitialLoad: boolean = false) => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/${jobId}/files/list?type=both`);
      if (!response.ok) {
        throw new Error('Failed to fetch file tree');
      }
      const data = await response.json();
      setFileTree(data.files);
      
      // Only set collapsed directories on initial load (when jobId changes)
      if (isInitialLoad) {
        // Automatically collapse all directories by default
        const newCollapsedDirs = new Set<string>();
        
        // Recursively find all directories in source tree and collapse them
        const collapseDirs = (items: FileTreeItem[], fileType: 'source' | 'output') => {
          for (const item of items) {
            if (item.type === 'directory' && item.children) {
              // Add directory to collapsed set with fileType prefix
              newCollapsedDirs.add(`${fileType}:${item.path}`);
              // Recursively process children
              collapseDirs(item.children, fileType);
            }
          }
        };
        
        // Process both source and output trees
        if (data.files.source) collapseDirs(data.files.source, 'source');
        if (data.files.output) collapseDirs(data.files.output, 'output');
        
        // Update the collapsed dirs state
        setCollapsedDirs(newCollapsedDirs);
      }
      
      // Select first files by default
      if (!selectedSourceFile){
        if (data.files.source && data.files.source.length > 0) {
          findFirstFile(data.files.source, 'source');
        }
      }
      if (!selectedGeneratedFile) {
        if (data.files.output && data.files.output.length > 0) {
          findFirstFile(data.files.output, 'output');
        }
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Find the first file in the tree recursively
  const findFirstFile = (items: FileTreeItem[], fileType: 'source' | 'output') => {
    for (const item of items) {
      if (item.type === 'file') {
        if (fileType === 'source' && !selectedSourceFile) {
          setSelectedSourceFile(item.path);
        } 
        if (fileType === 'output' && !selectedGeneratedFile) {
          setSelectedGeneratedFile(item.path);
        }
        return true;
      } else if (item.children && item.children.length > 0) {
        if (findFirstFile(item.children, fileType)) {
          return true;
        }
      }
    }
    return false;
  };

  // Toggle directory collapse state
  const toggleDirectoryCollapse = (dirPath: string, fileType: 'source' | 'output') => {
    // Create a unique key that combines path and fileType
    const collapseKey = `${fileType}:${dirPath}`;
    setCollapsedDirs(prevCollapsed => {
      const newCollapsed = new Set(prevCollapsed);
      if (newCollapsed.has(collapseKey)) {
        newCollapsed.delete(collapseKey);
      } else {
        newCollapsed.add(collapseKey);
      }
      return newCollapsed;
    });
  };

  // Get file type based on extension
  const getFileType = (filePath: string): string => {
    if (!filePath) return 'code';
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(extension)) {
      return 'image';
    }
    
    // Markdown files
    if (['md', 'markdown'].includes(extension)) {
      return 'markdown';
    }
    
    // Default to code
    return 'code';
  };

  // Format markdown content
  const formatMarkdown = (content: string): string => {
    if (!content) return '';
    
    // Simple formatting for headings - fix for # headers
    let formatted = content
      .replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
      .replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
      .replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
      .replace(/^####\s+(.*?)$/gm, '<h4>$1</h4>')
      .replace(/^#####\s+(.*?)$/gm, '<h5>$1</h5>')
      .replace(/^######\s+(.*?)$/gm, '<h6>$1</h6>');
    
    // Bold and italic
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code blocks
    formatted = formatted
      .replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Lists
    formatted = formatted
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
    
    // Links
    formatted = formatted
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Paragraphs (simplistic approach)
    formatted = formatted
      .replace(/^\s*$/gm, '</p><p>')
      .replace(/^(?!<h|<li|<p|<\/p)(.+)$/gm, '$1<br>');
    
    // Wrap in paragraph
    formatted = '<p>' + formatted + '</p>';
    
    // Clean up any double tags
    formatted = formatted
      .replace(/<\/p><p><\/p><p>/g, '</p><p>')
      .replace(/<p><\/p>/g, '');
    
    return formatted;
  };

  // Fetch file content from API
  const fetchFileContent = async (path: string, type: 'source' | 'output') => {
    if (!jobId || !path) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/${jobId}/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, type } )
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} file content`);
      }
      const data = await response.json();
      
      if (type === 'source') {
        setSourceContent(data.content);
      } else {
        setGeneratedContent(data.content);
      }
    } catch (error) {
      console.error(`Error fetching ${type} file content:`, error);
      if (type === 'source') {
        setSourceContent(`// Error loading file: ${error}`);
      } else {
        setGeneratedContent(`// Error loading file: ${error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Compare source and output files
  const compareFiles = async () => {
    if (!jobId || !selectedSourceFile) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/${jobId}/files/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source_file: selectedSourceFile, output_file: selectedGeneratedFile })
      });
      if (!response.ok) {
        throw new Error('Failed to compare files');
      }
      const data = await response.json();
      setDiffResult(data);
      setCompareMode(true);
    } catch (error) {
      console.error('Error comparing files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract file paths for fallback
  const getFilePaths = () => {
    const sourcePaths = sourceFiles.length > 0 ? sourceFiles : ['No source files available'];
    const generatedPaths = generatedFiles.length > 0 
      ? generatedFiles.map(file => file.name || file) 
      : ['No generated files yet'];
    
    return { sourcePaths, generatedPaths };
  };

  const { sourcePaths, generatedPaths } = getFilePaths();

  const toggleFileTree = () => {
    setIsFileTreeCollapsed(!isFileTreeCollapsed);
  };

  // Modify the file tree icon rendering based on file extension
  const getFileIcon = (filename: string): string => {
    if (!filename) return '📄';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return '𝕁𝕊';
      case 'ts':
      case 'tsx':
        return '𝕋𝕊';
      case 'jsx':
        return '𝕁𝕏';
      case 'json':
        return '{ }';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'java':
        return '☕';
      case 'py':
        return '🐍';
      case 'md':
      case 'markdown':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return '🖼️';
      case 'pdf':
        return '📑';
      case 'zip':
      case 'rar':
      case 'gz':
        return '🗜️';
      case 'jcl':
        return '💻';
      default:
        return '📄';
    }
  };

  // Update the renderFileTree function to support collapsed mode
  const renderFileTree = (items: FileTreeItem[], fileType: 'source' | 'output') => {
    if (!items || items.length === 0) {
      return <li className="text-gray-500">No files available</li>;
    }

    return items.map((item, index) => {
      if (item.type === 'file') {
        const isSelected = fileType === 'source' 
          ? selectedSourceFile === item.path
          : selectedGeneratedFile === item.path;
        
        const fileName = item.path.split('/').pop() || '';
        const fileIcon = getFileIcon(fileName);

        return (
          <li 
            key={`${fileType}-${index}`}
            className={`file-item ${isSelected ? 'active' : ''}`}
            onClick={() => {
              if (fileType === 'source') {
                setSelectedSourceFile(item.path);
              } else {
                setSelectedGeneratedFile(item.path);
              }
            }}
            title={fileName}
          >
            <span className="file-icon">{fileIcon}</span>
            {!isFileTreeCollapsed && <span className="file-name">{fileName}</span>}
          </li>
        );
      } else if (item.type === 'directory' && item.children) {
        // Create a unique key for this directory that includes the fileType
        const collapseKey = `${fileType}:${item.path}`;
        const isCollapsed = collapsedDirs.has(collapseKey);
        const dirName = item.path.split('/').pop() || '';
        
        return (
          <li key={`${fileType}-dir-${index}`} className="directory">
            <span 
              className="directory-name" 
              onClick={() => toggleDirectoryCollapse(item.path, fileType)}
              title={dirName}
            >
              <span className="collapse-indicator">{isCollapsed ? '▶' : '▼'}</span>
              <span className="dir-icon">📁</span>
              {!isFileTreeCollapsed && <span>{dirName}/</span>}
            </span>
            {!isCollapsed && (
              <ul className="file-tree nested">
                {renderFileTree(item.children, fileType)}
              </ul>
            )}
          </li>
        );
      }
      return null;
    });
  };

  // Helper function to get the language based on file extension
  const getLanguageFromFilename = (filename: string): string => {
    if (!filename || typeof filename !== 'string') return 'plaintext';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'jsx';
      case 'tsx':
        return 'tsx';
      case 'java':
        return 'java';
      case 'py':
        return 'python';
      case 'cs':
        return 'csharp';
      case 'go':
        return 'go';
      case 'cpp':
      case 'cc':
      case 'c':
        return 'cpp';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'rs':
        return 'rust';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'sql':
        return 'sql';
      case 'json':
        return 'json';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'cbl':
      case 'cob':
      case 'cobol':
        return 'cobol';
      case 'properties':
      case 'conf':
        return 'properties';
      default:
        return 'plaintext';
    }
  };

  // Syntax highlight code content
  const highlightCode = async (code: string, lang: string) => {
    if (!highlighter) {
      // If highlighter is not initialized, return basic pre-formatted code
      return `<pre class="shiki"><code>${code}</code></pre>`;
    }

    try {
      let html = '';

      if (lang === 'diff') {
        const lines = code.split('\n');
        html = '<div class="diff-code-highlighted">';
        
        for (const line of lines) {
          if (line.startsWith('+')) {
            html += `<div class="line line-addition">${line}</div>`;
          } else if (line.startsWith('-')) {
            html += `<div class="line line-deletion">${line}</div>`;
          } else {
            html += `<div class="line">${line}</div>`;
          }
        }
        
        html += '</div>';
      } else {
        const theme = isDarkMode ? 'github-dark' : 'github-light';
        html = highlighter.codeToHtml(code, {
          lang,
          theme,
        });
      }

      return html;
    } catch (e) {
      console.error(`Failed to highlight code: ${e}`);
      return `<pre class="shiki"><code>${code}</code></pre>`;
    }
  };

  // Update source highlighted code when source content changes
  useEffect(() => {
    if (sourceContent && selectedSourceFile) {
      const language = getLanguageFromFilename(selectedSourceFile);
      highlightCode(sourceContent, language).then(html => {
        setSourceHighlightedCode(html);
      });
    }
  }, [sourceContent, selectedSourceFile, isDarkMode, highlighter]);

  // Update generated highlighted code when generated content changes
  useEffect(() => {
    if (generatedContent && selectedGeneratedFile) {
      const language = getLanguageFromFilename(selectedGeneratedFile);
      highlightCode(generatedContent, language).then(html => {
        setGeneratedHighlightedCode(html);
      });
    }
  }, [generatedContent, selectedGeneratedFile, isDarkMode, highlighter]);

  // Update diff highlighted code when compare mode is active
  useEffect(() => {
    if (compareMode && diffResult?.diff) {
      highlightCode(diffResult.diff, 'diff').then(html => {
        setDiffHighlightedCode(html);
      });
    }
  }, [compareMode, diffResult, isDarkMode, highlighter]);

  // Update fullscreen highlighted code when fullscreen mode is active
  useEffect(() => {
    if (fullScreenMode && fullScreenContent.content) {
      const language = getLanguageFromFilename(fullScreenContent.path);
      highlightCode(fullScreenContent.content, language).then(html => {
        setFullScreenHighlightedCode(html);
      });
    }
  }, [fullScreenMode, fullScreenContent, isDarkMode, highlighter]);

  // Open file in full screen
  const openFullScreen = (content: string, path: string, type: string) => {
    setFullScreenContent({content, path, type});
    setFullScreenMode(true);
  };

  // Render file content based on file type
  const renderFileContent = (content: string, filePath: string, fileType: string, highlightedCode: string) => {
    if (!filePath) {
      return <div className="text-gray-500">Select a file to view content</div>;
    }
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <span>Loading...</span>
        </div>
      );
    }
    
    switch (fileType) {
      case 'image':
        console.log('Rendering image content', content);
        const extension = filePath.split('.').pop()?.toLowerCase();
        // Handle SVG files differently
        if (extension === 'svg') {
          // For SVG files, render the content directly as SVG XML
          return (
            <div className="relative image-viewer svg-container">
              <button 
                className="expand-button"
                onClick={() => openFullScreen(content, filePath, fileType)}
                title="View full screen"
              >
                <span>⛶</span>
              </button>
              <div
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          );
        }
        
        // For other image types
        return (
          <div className="image-viewer">
            <img 
              src={`data:image/${extension};base64,${content}`} 
              alt={filePath.split('/').pop()} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );
        
      case 'markdown':
        return (
          <div className="relative">
            <button 
              className="expand-button"
              onClick={() => openFullScreen(content, filePath, fileType)}
              title="View full screen"
            >
              <span>⛶</span>
            </button>
            <div 
              className="markdown-content p-4"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          </div>
        );
        
      default:
        return (
          <div className="relative">
            <button 
              className="expand-button"
              onClick={() => openFullScreen(content, filePath, fileType)}
              title="View full screen"
            >
              <span>⛶</span>
            </button>
            {highlighter ? (
              <div 
                className="code-container p-4 overflow-auto"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <pre className={`code language-${getLanguageFromFilename(filePath)} p-4`}>
                {content || 'No content available'}
              </pre>
            )}
          </div>
        );
    }
  };

  return (
    <div className="code-comparison">
      <div className={`file-browser ${isFileTreeCollapsed ? 'collapsed' : ''}`}>
        <div className="file-browser-header">
          <button 
            className="collapse-file-tree"
            onClick={toggleFileTree}
            title={isFileTreeCollapsed ? "Expand file tree" : "Collapse file tree"}
          >
            {isFileTreeCollapsed ? '▶' : '◀'}
          </button>
          {!isFileTreeCollapsed && <h3>Migration Files</h3>}
        </div>
        
        {sourceDirectory && !isFileTreeCollapsed && (
          <div className="directory-info mb-2 p-2 bg-blue-50 rounded">
            <span className="text-xs text-gray-500">Source Directory:</span>
            <div className="font-mono text-xs truncate">{sourceDirectory}</div>
          </div>
        )}
        
        {!isFileTreeCollapsed && <h3>Source Code</h3>}
        <ul className="file-tree">
          {fileTree.source.length > 0 
            ? renderFileTree(fileTree.source, 'source')
            : sourcePaths.map((path, index) => (
                <li 
                  key={`source-${index}`}
                  className={`file-item ${selectedSourceFile === path ? 'active' : ''}`}
                  onClick={() => setSelectedSourceFile(path)}
                  title={typeof path === 'string' ? path.split('/').pop() : path}
                >
                  <span className="file-icon">{getFileIcon(typeof path === 'string' ? path : '')}</span>
                  {!isFileTreeCollapsed && <span className="file-name">{typeof path === 'string' ? path.split('/').pop() : path}</span>}
                </li>
              ))
          }
        </ul>

        {outputDirectory && !isFileTreeCollapsed && (
          <div className="directory-info mt-4 mb-2 p-2 bg-green-50 rounded">
            <span className="text-xs text-gray-500">Output Directory:</span>
            <div className="font-mono text-xs truncate">{outputDirectory}</div>
          </div>
        )}
        
        {!isFileTreeCollapsed && <h3 className="mt-4">Generated Code</h3>}
        <ul className="file-tree">
          {fileTree.output.length > 0 
            ? renderFileTree(fileTree.output, 'output')
            : generatedPaths.map((path, index) => (
                <li 
                  key={`generated-${index}`}
                  className={`file-item ${selectedGeneratedFile === path ? 'active' : ''}`}
                  onClick={() => setSelectedGeneratedFile(path)}
                  title={typeof path === 'string' ? path.split('/').pop() : path}
                >
                  <span className="file-icon">{getFileIcon(typeof path === 'string' ? path : '')}</span>
                  {!isFileTreeCollapsed && <span className="file-name">{typeof path === 'string' ? path.split('/').pop() : path}</span>}
                </li>
              ))
          }
        </ul>

        {selectedSourceFile && selectedGeneratedFile && !isFileTreeCollapsed && (
          <div className="mt-4">
            <button 
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              onClick={compareFiles}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Compare Files'}
            </button>
          </div>
        )}
      </div>

      <div className="code-editors">
        <div className="code-editor">
          <div className="editor-header">
            <span>Source Code</span>
            {selectedSourceFile && (
                <span className="text-sm text-gray-500">{selectedSourceFile.split('/').pop()}</span>
            )}
          </div>
          <div className="editor-content">
            {renderFileContent(sourceContent, selectedSourceFile, sourceFileType, sourceHighlightedCode)}
          </div>
        </div>

        <div className="code-editor">
          <div className="editor-header">
            <span>Generated Code</span>
            {selectedGeneratedFile && (
              <span className="text-sm text-gray-500">{selectedGeneratedFile.split('/').pop()}</span>
            )}
          </div>
          <div className="editor-content">
            {renderFileContent(generatedContent, selectedGeneratedFile, generatedFileType, generatedHighlightedCode)}
          </div>
        </div>
      </div>

      {/* Full screen mode modal */}
      {fullScreenMode && (
        <div className="full-screen-overlay">
          <div className="full-screen-container">
            <div className="full-screen-header">
              <h3>{fullScreenContent.path}</h3>
              <button 
                className="close-full-screen"
                onClick={() => setFullScreenMode(false)}
              >
                &times;
              </button>
            </div>
            <div className="full-screen-content">
              {fullScreenContent.type === 'markdown' ? (
                <div 
                  className="markdown-content p-4"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(fullScreenContent.content) }}
                />
              ) : fullScreenContent.type === 'image' ? (
                <div className="image-viewer">
                  {fullScreenContent.path.split('.').pop()?.toLowerCase() === 'svg' ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: fullScreenContent.content }}
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  ) : (
                    <img 
                      src={`data:image/${fullScreenContent.path.split('.').pop()};base64,${fullScreenContent.content}`} 
                      alt={fullScreenContent.path.split('/').pop()} 
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              ) : highlighter ? (
                <div 
                  className="code-container p-4 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: fullScreenHighlightedCode }}
                />
              ) : (
                <pre className={`code language-${getLanguageFromFilename(fullScreenContent.path)}`}>
                  {fullScreenContent.content || 'No content available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {compareMode && diffResult && (
        <div className="diff-overlay">
          <div className="diff-container">
            <div className="diff-header">
              <h3>File Diff: {selectedSourceFile}</h3>
              <button 
                className="close-diff"
                onClick={() => setCompareMode(false)}
              >
                &times;
              </button>
            </div>
            <div className="diff-content">
              {highlighter ? (
                <div 
                  className="diff-code-highlighted p-4"
                  dangerouslySetInnerHTML={{ __html: diffHighlightedCode }}
                />
              ) : (
                <pre className="diff-code">{diffResult.diff}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
