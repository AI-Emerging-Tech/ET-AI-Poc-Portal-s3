import React, { useRef, useEffect } from 'react';

export interface Message {
  role: string;
  content: string;
  sender: string;
  documents?: string[];
}

interface ChatBoxProps {
  title?: string;
  messages: Message[];
  inputMessage: string;
  loading: boolean;
  onInputChange: (message: string) => void;
  onSendMessage: () => void;
  onDocumentDownload?: (path: string) => void;
  disabled?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  title = 'Chatbot',
  messages,
  inputMessage,
  loading,
  onInputChange,
  onSendMessage,
  onDocumentDownload,
  disabled = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSendMessage();
    }
  };

  const formatMessageContent = (content: string): string => {
    // Sanitize the content to prevent XSS attacks
    let formattedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply formatting
    formattedContent = formattedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold (**text**)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic (*text*)
      .replace(/__(.*?)__/g, '<u>$1</u>')               // Underline (__text__)
      .replace(/~~(.*?)~~/g, '<del>$1</del>')           // Strikethrough (~~text~~)
      .replace(/\n/g, '<br />');                        // Line breaks

    // Handle bullet points
    if (/^- .+/m.test(formattedContent)) {
      formattedContent = formattedContent.replace(
        /^- (.+)$/gm,
        '<li>$1</li>'
      );
      formattedContent = `<ul>${formattedContent}</ul>`;
    }

    return formattedContent;
  };

  return (
    <div className="flex w-full h-[70vh] m-2 overflow-x-hidden">
      <div className="bg-white w-full rounded-lg shadow-lg p-4 flex flex-col">
        {/* Chat window */}
        <div className="flex-grow overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-[75%]">
                <span className={`text-xs text-gray-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.sender}
                </span>
                <span
                  className={`inline-block px-3 py-2 rounded-lg break-words ${
                  msg.role === 'user' ? 'bg-blue-500 text-white text-right' : 'bg-gray-200 text-left'
                  }`}
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content ? formatMessageContent(msg.content) : '' 
                  }}
                  
                />
                {/* Only show documents section if documents exist and they're not 'N/A' */}
                {msg.documents && msg.documents[0] !== 'N/A' && (
                  <ul className="mt-2">
                    {msg.documents.map((path, idx) => (
                      <li key={idx}>
                        {onDocumentDownload ? (
                          <button
                            onClick={() => onDocumentDownload(path)}
                            className="text-blue-500 underline cursor-pointer"
                          >
                            Download {path.split('/').pop()}
                          </button>
                        ) : (
                          <span className="text-gray-500">
                            Download {path.split('/').pop()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center">
              <div className="loader mr-2"></div>
              <span>Typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input field */}
        <div className="flex mt-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="border rounded-l-lg px-4 py-2 w-full"
            disabled={loading || disabled}
          />
          <button
            onClick={onSendMessage}
            className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || disabled}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;