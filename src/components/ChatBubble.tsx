import React, { useState, useEffect } from 'react';
import ChatBox, { Message } from './ChatBox';

interface ChatBubbleProps {
  messages: Message[];
  inputMessage: string;
  loading: boolean;
  onInputChange: (message: string) => void;
  onSendMessage: (messages: Message[]) => Promise<void>;
  title?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  messages,
  inputMessage,
  loading,
  onInputChange,
  onSendMessage,
  title = 'Assistant'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close chat when clicking outside (except the chat bubble itself)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && 
          !target.closest('.chat-bubble') && 
          !target.closest('.chat-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-open chat when there are new messages
  useEffect(() => {
    if (messages.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [messages]);

  // Auto-scroll effect when new messages arrive or during streaming
  useEffect(() => {
    if (isOpen) {
      const chatMessageContainer = document.querySelector('.chat-messages');
      if (chatMessageContainer) {
        chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
      }
    }
  }, [messages, isOpen, loading]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Chat container */}
      {isOpen && (
        <div 
          className="chat-container absolute bottom-16 right-0 mb-4 w-96 md:w-[450px] 
                     bg-white rounded-xl shadow-2xl overflow-hidden transition-all 
                     duration-300 ease-in-out transform origin-bottom-right animate-fadeIn"
          style={{ maxHeight: '80vh', height: '600px' }}
        >
          <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center shadow-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 mr-2 mb-2 bg-green-400 rounded-full"></div>
                <h4 className="font-medium">{title}</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 focus:outline-none transition-colors duration-200"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Messages area */}
            <div className="flex-grow overflow-y-auto p-4 chat-messages bg-gray-50">
              {messages.map((message, index) => (
                message.content && (
                  <div 
                    key={index}
                    className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-messageIn`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' 
                          : message.role === 'tool'
                            ? 'bg-gray-200 text-gray-800 rounded-md'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      {message.role === 'tool' ? (
                        <div className="whitespace-pre-wrap break-words flex items-center text-xs italic font-medium text-gray-700">
                          <span>{message.content}</span>
                        </div>
                      ) : (
                        <>
                            <div className="whitespace-pre-wrap break-words">
                            {message.content.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i}>{part.slice(2, -2)}</strong>;
                              } else if (part.startsWith('*') && part.endsWith('*')) {
                              return <em key={i}>{part.slice(1, -1)}</em>;
                              }
                              return part;
                            })}
                            </div>
                          <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.sender}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              ))}
              {/* Show typing indicator as a separate message when streaming */}
              {loading && (
                <div className="mb-4 flex justify-start animate-fadeIn">
                  <div className="typing-indicator px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="border-t p-3 bg-white shadow-inner">
              <div className="flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow p-3 rounded-l-lg bg-gray-50 mr-1 focus:outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_#3B82F6] transition-all duration-100"
                  onKeyDown={async (e) => e.key === 'Enter' && !loading && inputMessage.trim() && await onSendMessage(messages)}
                  disabled={loading}
                />
                <button
                  onClick={async () => await onSendMessage(messages)}
                  disabled={loading || !inputMessage.trim()}
                  className={`p-3 ${
                    loading || !inputMessage.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-r-lg focus:outline-none transition-colors duration-200`}
                  aria-label="Send message"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* CSS for typing indicator */}
            <style>{`
              .typing-indicator {
                display: flex;
                align-items: center;
                column-gap: 4px;
                padding: 4px 8px;
              }
              
              .typing-indicator span {
                height: 8px;
                width: 8px;
                background-color: #888;
                border-radius: 50%;
                display: block;
                opacity: 0.4;
              }
              
              @keyframes pulse {
                0% { transform: scale(1); opacity: 0.4; }
                50% { transform: scale(1.2); opacity: 0.8; }
                100% { transform: scale(1); opacity: 0.4; }
              }
              
              .typing-indicator span:nth-child(1) {
                animation: pulse 1s infinite ease-in-out;
              }
              
              .typing-indicator span:nth-child(2) {
                animation: pulse 1s infinite ease-in-out 0.3s;
              }
              
              .typing-indicator span:nth-child(3) {
                animation: pulse 1s infinite ease-in-out 0.6s;
              }
              
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              
              @keyframes messageIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
              }
              
              .animate-fadeIn {
                animation: fadeIn 0.3s ease-out forwards;
              }
              
              .animate-messageIn {
                animation: messageIn 0.2s ease-out forwards;
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Chat bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-bubble w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                 rounded-full flex items-center justify-center shadow-lg 
                 transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          // X icon for close
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        ) : (
          // Chat icon
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default ChatBubble;