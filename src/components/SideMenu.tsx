'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faQuestionCircle, faCog, faAreaChart, faVideo, faHeadset } from '@fortawesome/free-solid-svg-icons';

interface SideMenuProps {
  infoContent: JSX.Element; // Content to render inside the "info" panel (question mark)
  setupContent: JSX.Element; // Content to render inside the "setup" panel (cog)
  dataContent?: JSX.Element | null; // Optional data content, can be JSX or null, or omitted entirely
  videoContent?: {videoTitle: string, videoTitle2?: string, uri: string, uri2?: string} | null; // Optional video content, can be JSX or null, or omitted entirely
  chatContent?: JSX.Element | null; // Optional chat content, can be JSX or null, or omitted entirely
}

export default function SideMenu({ infoContent, setupContent, dataContent = null, videoContent = null, chatContent = null }: SideMenuProps) {
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isSetupPanelOpen, setIsSetupPanelOpen] = useState(false);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  
  // Toggle the info panel (question mark)
  const toggleInfoPanel = () => {
    setIsInfoPanelOpen(!isInfoPanelOpen);
    if (isSetupPanelOpen) setIsSetupPanelOpen(false); // Close setup panel if open
    if (isDataPanelOpen) setIsDataPanelOpen(false);
    if (isVideoPanelOpen) setIsVideoPanelOpen(false);
    if (isChatPanelOpen) setIsChatPanelOpen(false);
  };

  // Toggle the setup panel (cog)
  const toggleSetupPanel = () => {
    setIsSetupPanelOpen(!isSetupPanelOpen);
    if (isInfoPanelOpen) setIsInfoPanelOpen(false); // Close info panel if open
    if (isDataPanelOpen) setIsDataPanelOpen(false);
    if (isVideoPanelOpen) setIsVideoPanelOpen(false);
    if (isChatPanelOpen) setIsChatPanelOpen(false);
  };

  const toggleDataPanel = () => {
    setIsDataPanelOpen(!isDataPanelOpen);
    if (isInfoPanelOpen) setIsInfoPanelOpen(false); // Close info panel if open
    if (isSetupPanelOpen) setIsSetupPanelOpen(false); // Close setup panel if open
    if (isVideoPanelOpen) setIsVideoPanelOpen(false);
    if (isChatPanelOpen) setIsChatPanelOpen(false);
  };
  
  const toggleVideoPanel = () => {
    setIsVideoPanelOpen(!isVideoPanelOpen);
    if (isInfoPanelOpen) setIsInfoPanelOpen(false); // Close info panel if open
    if (isSetupPanelOpen) setIsSetupPanelOpen(false); // Close setup panel if open
    if (isDataPanelOpen) setIsDataPanelOpen(false);
    if (isChatPanelOpen) setIsChatPanelOpen(false);
  };
  
  const toggleChatPanel = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
    if (isInfoPanelOpen) setIsInfoPanelOpen(false); // Close info panel if open
    if (isSetupPanelOpen) setIsSetupPanelOpen(false); // Close setup panel if open
    if (isDataPanelOpen) setIsDataPanelOpen(false);
    if (isVideoPanelOpen) setIsVideoPanelOpen(false);
  };
  return (
    <>
      {/* Info Panel */}
      <div
        className={`fixed overflow-scroll text-black top-0 right-0 h-full w-[450px] bg-white shadow-lg transition-transform duration-300 ${
          isInfoPanelOpen ? 'translate-x-0 z-[100]' : 'translate-x-[470px] z-[40]'
        }`}
      >
        <div className="p-4">
          <button onClick={toggleInfoPanel} className="text-xl">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {infoContent}
        </div>
      </div>

      {/* Setup Panel */}
      <div
        className={`fixed text-black overflow-scroll top-0 right-0 h-full w-[450px] bg-white shadow-lg transition-transform duration-300 ${
          isSetupPanelOpen ? 'translate-x-0 z-[100]' : 'translate-x-[470px] z-[40]'
        }`}
      >
        <div className="p-4">
          <button onClick={toggleSetupPanel} className="text-xl">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {setupContent}
        </div>
      </div>

      {/* Data Panel */}
      { dataContent ? (
      <div
        className={`fixed text-black overflow-scroll top-0 right-0 h-full w-[450px] bg-white shadow-lg transition-transform duration-300 ${
          isDataPanelOpen ? 'translate-x-0 z-[100]' : 'translate-x-[470px] z-[40]'
        }`}
      >
        <div className="p-4">
          <button onClick={toggleDataPanel} className="text-xl">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {dataContent}
        </div>
      </div> ) : null}

      {/* Chat Panel */}
      { chatContent ? (
      <div
        className={`fixed text-black overflow-scroll top-0 right-0 h-full w-[450px] bg-white shadow-lg transition-transform duration-300 ${
          isChatPanelOpen ? 'translate-x-0 z-[100]' : 'translate-x-[470px] z-[40]'
        }`}
      >
        <div className="p-4">
          <button onClick={toggleChatPanel} className="text-xl">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {chatContent}
        </div>
      </div> ) : null}

      {/* Video Panel */}
      {videoContent && (
        <div
          className={`fixed text-black overflow-scroll top-0 right-0 h-full w-[500px] bg-white shadow-lg transition-transform duration-300 ${
            isVideoPanelOpen ? 'translate-x-0 z-[100]' : 'translate-x-[520px] z-[40]'
          }`}
        >
          <div className="p-4">
            <button onClick={toggleVideoPanel} className="text-xl">
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3 className="text-xl font-semibold mb-4">{videoContent.videoTitle}</h3>
            <div className="flex flex-col gap-8 justify-center items-center p-4">
              <iframe
                src={videoContent.uri}
                width="100%"
                height="300"
                style={{ maxWidth: "100%" }}
                title={videoContent.videoTitle}
              ></iframe>
            </div>
              {videoContent.uri2 && (
                <>
                  {videoContent.videoTitle2 && (
                    <h3 className="text-xl font-semibold mb-4">{videoContent.videoTitle2}</h3>
                  )}
                  <div className="flex flex-col gap-8 justify-center items-center p-4">
                    <iframe
                      src={videoContent.uri2}
                      width="100%"
                      height="300"
                      style={{ maxWidth: "100%" }}
                      title={videoContent.videoTitle2}
                    ></iframe>
                  </div>
                </>
              )}
            </div>
          </div>
      )}


      {/* Info Button (Question Mark) */}
      <button
        onClick={toggleInfoPanel}
        className={`bg-blue-600 text-white p-2 rounded-l-lg z-[50] fixed right-0 top-[300px] flex items-center justify-center transition-transform duration-300 ${
          isInfoPanelOpen ? 'translate-x-[-450px]' : 'translate-x-0'
        }`}
      >
        <FontAwesomeIcon icon={faQuestionCircle} className="text-xl" />
      </button>

      <button
        onClick={toggleSetupPanel}
        className={`bg-green-600 text-white p-2 rounded-l-lg z-[50] fixed right-0 top-[342px] flex items-center justify-center transition-transform duration-300 ${
          isSetupPanelOpen ? 'translate-x-[-450px]' : 'translate-x-0'
        }`}
      >
        <FontAwesomeIcon icon={faCog} className="text-xl" />
      </button>
      { dataContent ? (
      <button
        onClick={toggleDataPanel}
        className={`bg-red-600 text-white p-2 rounded-l-lg z-[50] fixed right-0 top-[384px] flex items-center justify-center transition-transform duration-300 ${
          isDataPanelOpen ? 'translate-x-[-450px]' : 'translate-x-0'
        }`}
      >
        <FontAwesomeIcon icon={faAreaChart} className="text-xl" />
      </button> ) : null }

      { chatContent ? (
      <button
        onClick={toggleChatPanel}
        className={`bg-purple-600 text-white p-2 rounded-l-lg z-[50] fixed right-0 ${
          dataContent ? 'top-[426px]' : 'top-[384px]'  // Position based on whether data panel exists
        } flex items-center justify-center transition-transform duration-300 ${
          isChatPanelOpen ? 'translate-x-[-450px]' : 'translate-x-0'
        }`}
      >
        <FontAwesomeIcon icon={faHeadset} className="text-xl" />
      </button> ) : null }

      { videoContent ? (
      <button
        onClick={toggleVideoPanel}
        className={`bg-yellow-600 text-white p-2 rounded-l-lg z-[50] fixed right-0 ${
          dataContent && !chatContent ? 'top-[426px]' : chatContent ? 'top-[468px]' : 'top-[384px]'
        } flex items-center justify-center transition-transform duration-300 ${
          isVideoPanelOpen ? 'translate-x-[-500px]' : 'translate-x-0'
        }`}
      >
        <FontAwesomeIcon icon={faVideo} className="text-xl" />
      </button> ) : null }
    </>
  );
}