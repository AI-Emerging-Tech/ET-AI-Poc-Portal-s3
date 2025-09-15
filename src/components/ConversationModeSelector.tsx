// components/ConversationModeSelector.tsx
import React from 'react';
import { FaKeyboard, FaMicrophone } from 'react-icons/fa';

interface ConversationModeSelectorProps {
  onModeSelected: (mode: 'text' | 'voice') => void;
}

export const ConversationModeSelector: React.FC<ConversationModeSelectorProps> = ({ onModeSelected }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">Choose Your Conversation Mode</h2>
        <p className="text-gray-600 text-center mb-8">
          How would you like to interact with the FNOL assistant?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onModeSelected('text')}
            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <FaKeyboard className="text-4xl text-blue-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Text Only</h3>
            <p className="text-sm text-gray-600 text-center">
              Type your messages and read responses
            </p>
          </button>
          
          <button
            onClick={() => onModeSelected('voice')}
            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <FaMicrophone className="text-4xl text-green-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Voice Conversation</h3>
            <p className="text-sm text-gray-600 text-center">
              Speak and listen to responses
            </p>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-6">
          You can change this setting anytime during the conversation
        </p>
      </div>
    </div>
  );
};