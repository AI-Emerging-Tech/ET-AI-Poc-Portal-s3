'use client';

import { useState, useEffect, useRef } from 'react';
import PocPageWrapper from 'components/PocPageWrapper';
import metadata from './metadata.json';
import { useSession } from 'next-auth/react';

interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

type ProcessingState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'generating_audio' | 'playing';

export default function FNOLVoiceAssistant() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [policyNumber, setPolicyNumber] = useState<string>('9733503856');
  const [selectedVoice, setSelectedVoice] = useState<string>('am_michael');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  // Audio recording and playback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  
  // Refs for scrolling
  const conversationContainerRef = useRef<HTMLDivElement>(null);
    
  const { data: session } = useSession();

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    if (conversationContainerRef.current) {
      const container = conversationContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when current response is being generated
  useEffect(() => {
    if (currentResponse) {
      scrollToBottom();
    }
  }, [currentResponse]);

  useEffect(() => {
    // Generate session ID on component mount
    setSessionId(`fnol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Initialize audio context
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Audio context initialized');
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setError('Audio not supported in this browser');
      }
    };
    
    // Initialize on user interaction
    const handleUserInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Interrupt any currently playing audio when user starts recording
      clearAudioQueue();
      
      setProcessingState('recording');
      setIsRecording(true);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processAudioRecording();
      };

      mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
      setProcessingState('idle');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setProcessingState('transcribing');
    }
  };

  const processAudioRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      setProcessingState('idle');
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    await sendVoiceMessage(audioBlob);
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      setProcessingState('processing');
      setCurrentResponse('');
      
      // Clear any existing audio queue when starting new voice message
      clearAudioQueue();

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId);
      formData.append('voice', selectedVoice);
      if (policyNumber) {
        formData.append('policy_number', policyNumber);
      }

      const response = await fetch('https://www.valuemomentum.studio/fnol/api/voice-stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Keep the last incomplete chunk in buffer
        buffer = lines.pop() || '';

        for (const chunk of lines) {
          if (chunk.trim()) {
            const lines = chunk.split('\n');
            let event = '';
            let data = '';
            
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                event = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                data = line.slice(6).trim();
              }
            }
            
            if (event && data) {
              try {
                const eventData = JSON.parse(data);
                await handleStreamEvent(event, eventData);
              } catch (parseError) {
                console.warn('Failed to parse event data:', parseError, 'Event:', event, 'Data:', data);
              }
            }
          }
        }
      }

      setProcessingState('idle');
    } catch (error) {
      console.error('Error sending voice message:', error);
      setError('Failed to process voice message. Please try again.');
      setProcessingState('idle');
    }
  };

  const handleStreamEvent = async (event: string, data: any) => {
    console.log('Received event:', event, 'Data:', data);
    
    switch (event) {
      case 'transcript':
        const transcript = data.transcript;
        const newUserMessage: VoiceMessage = {
          role: 'user',
          content: transcript,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, newUserMessage]);
        break;

      case 'text_chunk':
        const chunk = data.content;
        setCurrentResponse(prev => prev + chunk);
        // Update the assistant message in real-time
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk }
            ];
          } else {
            const newAssistantMessage: VoiceMessage = {
              role: 'assistant',
              content: chunk,
              timestamp: new Date().toLocaleTimeString()
            };
            return [...prev, newAssistantMessage];
          }
        });
        break;

      case 'audio_start':
        setProcessingState('generating_audio');
        // Clear any existing audio queue when new audio starts
        clearAudioQueue();
        break;

      case 'audio_chunk':
        const audioData = data.audio;
        setProcessingState('playing');
        addAudioToQueue(audioData);
        break;

      case 'audio_end':
        console.log('Audio generation complete - all chunks received');
        // Don't set to idle immediately - let the queue finish playing
        break;

      case 'tool_call':
        const toolMsg = data.content;
        setCurrentResponse(prev => prev + toolMsg);
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + toolMsg }];
          } else {
            const newAssistantMessage: VoiceMessage = {
              role: 'assistant',
              content: toolMsg,
              timestamp: new Date().toLocaleTimeString()
            };
            return [...prev, newAssistantMessage];
          }
        });
        break;

      case 'complete':
        setProcessingState('idle');
        setCurrentResponse('');
        console.log('Voice interaction complete');
        break;

      case 'error':
        console.error('Stream error:', data);
        // setError(data.message || 'An error occurred during processing');
        setProcessingState('idle');
        break;
        
      default:
        console.warn('Unknown event type:', event, data);
    }
  };

  const addAudioToQueue = (base64Audio: string) => {
    audioQueueRef.current.push(base64Audio);
    console.log('Added audio to queue, queue length:', audioQueueRef.current.length);
    
    // Start playing if not already playing
    if (!isPlayingAudioRef.current) {
      playNextAudioChunk();
    }
  };

  const playNextAudioChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      console.log('Audio queue empty, stopping playback');
      // Set to idle only when queue is completely empty
      setProcessingState('idle');
      return;
    }

    if (isPlayingAudioRef.current) {
      console.log('Already playing audio, waiting...');
      return;
    }

    const base64Audio = audioQueueRef.current.shift();
    if (!base64Audio) return;

    try {
      isPlayingAudioRef.current = true;
      console.log('Playing next audio chunk, remaining in queue:', audioQueueRef.current.length);

      if (!audioContextRef.current) {
        console.warn('Audio context not available');
        isPlayingAudioRef.current = false;
        return;
      }

      // Ensure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('Decoded audio bytes:', bytes.length);

      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      console.log('Audio buffer created, duration:', audioBuffer.duration);
      
      // Create and play audio source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      currentAudioSourceRef.current = source;
      
      // When this chunk finishes, play the next one
      source.onended = () => {
        console.log('Audio chunk finished playing');
        currentAudioSourceRef.current = null;
        isPlayingAudioRef.current = false;
        
        // Play next chunk in queue
        setTimeout(() => playNextAudioChunk(), 50); // Small delay to prevent conflicts
      };
      
      source.start();
      console.log('Audio chunk started playing');
      
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      isPlayingAudioRef.current = false;
    //   setError(`Audio playback error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try to continue with next chunk
      setTimeout(() => playNextAudioChunk(), 100);
    }
  };

  const clearAudioQueue = () => {
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    
    // Stop any currently playing audio
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping already finished audio
      }
      currentAudioSourceRef.current = null;
    }
    console.log('Audio queue cleared');
  };

  const getProcessingStateText = () => {
    switch (processingState) {
      case 'recording': return 'Listening...';
      case 'transcribing': return 'Processing speech...';
      case 'processing': return 'Thinking...';
      case 'generating_audio': return 'Generating response...';
      case 'playing': return 'Speaking...';
      default: return 'Ready to listen';
    }
  };

  const getProcessingStateColor = () => {
    switch (processingState) {
      case 'recording': return 'text-red-500';
      case 'transcribing': return 'text-blue-500';
      case 'processing': return 'text-yellow-500';
      case 'generating_audio': return 'text-purple-500';
      case 'playing': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Content for the Details panel (Business Context)
  const detailsPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Business Context</h3>
      <p className="text-gray-700 leading-relaxed">
        First Notice of Loss (FNOL) is the critical first step in the claims process. Traditional FNOL 
        processes require customers to navigate complex phone trees or fill out lengthy forms, creating 
        friction during an already stressful time. Voice-first interfaces provide a natural, accessible 
        way for customers to report claims immediately after an incident.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Problem Statement</h3>
      <p className="text-gray-700 leading-relaxed">
        Customers need immediate, intuitive ways to report claims 24/7 without waiting for call center 
        agents or struggling with complex forms. Insurance companies need efficient, accurate data 
        collection that reduces processing time and improves customer satisfaction.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-4">Impact and Importance</h3>
      <p className="text-gray-700 leading-relaxed">
        Voice-powered FNOL reduces customer effort, enables 24/7 availability, improves data accuracy 
        through guided conversations, and frees up human agents for complex cases. This leads to faster 
        claim resolution and significantly improved customer experience.
      </p>
    </>
  );

  // Content for the Developer Setup panel
  const setupPanelContent = (
    <>
      <h3 className="text-xl font-semibold mb-4">Developer Setup</h3>
      <p className="text-gray-700 leading-relaxed">To set up and run this PoC locally, follow these steps:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Ensure the voice streaming API is running at http://127.0.0.1:11080</li>
        <li>
          The endpoint <code>/api/fnol/voice-stream</code> should be available with the following features:
          <ul className="list-disc ml-6 mt-2">
            <li>STT → Chat Agent → TTS pipeline</li>
            <li>Server-Sent Events streaming</li>
            <li>Session continuity</li>
            <li>Base64 audio streaming</li>
          </ul>
        </li>
        <li>Grant microphone permissions when prompted by the browser</li>
        <li>Use Chrome or Firefox for best audio codec support</li>
      </ol>
      <h3 className="text-xl font-semibold mt-6 mb-4">How to Use This PoC</h3>
      <p className="text-gray-700 leading-relaxed">Follow these steps to explore the voice assistant:</p>
      <ol className="list-decimal ml-6 text-gray-700 leading-relaxed">
        <li>Optionally enter a policy number for personalized experience</li>
        <li>Select your preferred voice for the assistant responses</li>
        <li>Click and hold the microphone button to record your message</li>
        <li>Speak naturally about your claim or ask questions</li>
        <li>Release the button and watch the real-time processing</li>
        <li>Listen to the AI assistant's spoken response</li>
        <li>Continue the conversation to complete your claim report</li>
      </ol>
    </>
  );

  const demoContent = (
    <div className="section bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto max-w-6xl">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-error p-4 rounded-lg mb-8">
            <p className="text-error">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-error underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Controls Panel */}
          <div className="lg:col-span-1">
            <div className="ai-card mb-6">
              <h3 className="text-xl font-semibold mb-6 text-dark-gray">Voice Assistant Controls</h3>
              
              {/* Session Info */}
              <div className="mb-6 p-4 bg-light-gray rounded-lg">
                <div className="text-sm text-medium-gray mb-2">Session ID:</div>
                <div className="text-xs font-mono bg-white p-2 rounded border">
                  {sessionId}
                </div>
              </div>

              {/* Policy Number Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="Enter policy number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  disabled={processingState !== 'idle'}
                />
              </div>

              {/* Voice Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  Assistant Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  disabled={processingState !== 'idle'}
                >
                  <option value="af_heart">Heart (Female, Premium)</option>
                  <option value="af_sarah">Sarah (Female, Professional)</option>
                  <option value="af_bella">Bella (Female, Warm)</option>
                  <option value="am_michael">Michael (Male, Warm)</option>
                  <option value="am_echo">Echo (Male, Clear)</option>
                </select>
              </div>

              {/* Voice Recording Button */}
              <div className="text-center">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  disabled={processingState !== 'idle' && processingState !== 'recording'}
                  className={`w-32 h-32 rounded-full border-4 transition-all duration-300 ${
                    isRecording
                      ? 'bg-red-500 border-red-300 shadow-lg scale-110'
                      : processingState === 'idle'
                      ? 'bg-primary border-primary-light hover:bg-primary-dark hover:scale-105'
                      : 'bg-gray-400 border-gray-300 cursor-not-allowed'
                  }`}
                  title={isRecording ? "Release to stop recording" : "Hold to record"}
                >
                  <div className="text-white text-4xl">
                    {isRecording ? '🔴' : '🎤'}
                  </div>
                </button>
                
                <div className={`mt-4 text-sm font-medium ${getProcessingStateColor()}`}>
                  {getProcessingStateText()}
                </div>
                
                {processingState !== 'idle' && processingState !== 'recording' && (
                  <div className="mt-2">
                    <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Conversation History */}
          <div className="lg:col-span-2">
            <div className="ai-card">
              <h3 className="text-xl font-semibold mb-6 text-dark-gray">Conversation Transcript</h3>
              
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🗣️</div>
                  <h4 className="text-xl font-semibold text-dark-gray mb-2">Start Your Conversation</h4>
                  <p className="text-medium-gray">
                    Hold the microphone button and describe your claim or ask any questions.
                    The AI assistant will guide you through the process.
                  </p>
                </div>
              ) : (
                <div 
                  ref={conversationContainerRef}
                  className="max-h-[500px] overflow-y-auto space-y-4"
                >
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white text-dark-gray border border-gray-200 rounded-bl-none'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-primary-light' : 'text-medium-gray'
                        }`}>
                          {message.role === 'user' ? 'You' : 'Assistant'} • {message.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  

                </div>
              )}
            </div>
          </div>
        </div>
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
