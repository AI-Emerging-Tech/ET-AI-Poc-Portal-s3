import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import avatar from 'assets/chatbot_avatar.png';

export interface Message {
  role: string;
  content: string;
  sender?: string;
  documents?: string[];
  timestamp?: string;
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
  showAvatarForAssistant?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  title = 'Chatbot',
  messages,
  inputMessage,
  loading,
  onInputChange,
  onSendMessage,
  onDocumentDownload,
  disabled = false,
  showAvatarForAssistant = false,
}) => {

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLAnchorElement;
    if (target.tagName === "A") {
      const href = target.getAttribute("href");
      if (href?.startsWith("download://")) {
        e.preventDefault();
        const filename = href.replace("download://", "");
        onDocumentDownload?.(filename);
      }
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    if(messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSendMessage();
    }
  };

  const formatMessageContent = (content: string): string => {
    let formattedContent = content
      .replace(/&/g, '&amp;')
      .replace(/\</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n/g, '<br />');

    if (/^- .+/m.test(formattedContent)) {
      formattedContent = formattedContent.replace(/^-\s(.+)$/gm, '<li>$1</li>');
      formattedContent = `<ul>${formattedContent}</ul>`;
    }

    return formattedContent;
  };

  return (
    <>
      <div className="flex w-[100vw] h-[70vh] m-[10px] mt-0">
        <div className="bg-white w-full rounded-lg shadow-lg p-4 flex flex-col">
          {/* Chat window */}
          <div 
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto p-4 chat-messages bg-gray-50"
          > 
            {messages.map((msg, index) => {
              return (
                msg.content && (
                  <div
                    key={index}
                    onClick={handleLinkClick} 
                    className={`mb-4 flex items-center ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-messageIn`}
                  >
                    {/* Conditionally show avatar beside assistant message */}
                    {msg.sender === 'Max' && showAvatarForAssistant && (
                      <Image
                        src={avatar}
                        alt="Assistant Avatar"
                        width={40}
                        height={40}
                        className="mr-2 rounded-full"
                      />
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                          : msg.role === 'tool'
                          ? 'bg-gray-200 text-gray-800 rounded-md'
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      {msg.role === 'tool' ? (
                        <div
                          className="whitespace-pre-wrap break-words text-xs italic font-medium text-gray-700"
                          dangerouslySetInnerHTML={{ __html: msg.content }}
                        />
                      ) : (
                        <>
                          <div className="whitespace-pre-wrap break-words text-sm">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: msg.content
                                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                  .replace(/\n/g, "<br>")
                                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank">$1</a>')
                              }}
                            />
                          </div>
                          <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {msg.sender}
                          </div>
                          {/* ✅ Timestamp shown BELOW the chat */}
                          {msg.timestamp && (
                            <div className="text-xs text-gray-400 mt-1">
                              {msg.timestamp}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              );
            })}
            {loading && (
              <div className="flex items-center space-x-1 p-2 bg-gray-200 rounded-xl w-fit">
                <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0s]"></span>
                <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input field */}
          <div className="flex mt-4 gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="border rounded-lg px-4 py-2 w-full"
              disabled={loading || disabled}
            />
            <button
              onClick={onSendMessage}
              className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${
                loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading || disabled}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;