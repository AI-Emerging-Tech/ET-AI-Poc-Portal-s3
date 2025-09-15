'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import '../styles.css'

interface EventData {
  description: string;
  response: string | null;
}

interface ResultsModalProps {
  selectedInput: object;
  onClose: () => void;
}

export default function ResultsModal({ selectedInput, onClose }: ResultsModalProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!selectedInput) return;
  
    const controller = new AbortController();
    const signal = controller.signal;
    let isCancelled = false;
    let eventsCount = 0; // Track the number of events received
  
    fetch('https://www.valuemomentum.studio/crop_claims/process_claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(selectedInput),
      signal: signal,
    })
      .then((response) => {
        setStarted(true)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
  
        const readChunk = () => {
          reader
            ?.read()
            .then(({ done, value }) => {
              if (done || isCancelled) {
                setProgress(100)
                console.log('Stream closed or cancelled');
                return;
              }
  
              buffer += decoder.decode(value, { stream: true });
              let parts = buffer.split('\n\n');
              buffer = parts.pop() || '';
  
              parts.forEach((line) => {
                if (line.startsWith('data:')) {
                  const dataStr = line.substring(5).trim();
                  if (dataStr) {
                    try {
                      const data: EventData = JSON.parse(dataStr);
                      setEvents((prev) => [...prev, data]);
                      eventsCount += 1;
                      // Update progress based on the number of events received
                      const totalSteps = 20;
                      setProgress((eventsCount / totalSteps) * 100);
                    } catch (e) {
                      console.error('Error parsing JSON:', e);
                    }
                  }
                }
              });
              readChunk();
            })
            .catch((error) => {
              if (error.name === 'AbortError') {
                setProgress(100)
                console.log('Fetch aborted');
              } else {
                setProgress(100)
                console.error('Error reading chunk:', error);
                alert("Something went wrong.")
              }
            });
        };
  
        readChunk();
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Error processing claim:', error);
          setEvents((prev) => [
            ...prev,
            { description: 'An error occurred during processing', response: error.message },
          ]);
        }
      })
      .finally(() => setProgress(100));
  
    return () => {
      console.log('useEffect cleanup');
      isCancelled = true;
      controller.abort();
    };
  }, [selectedInput]);
  

  return (
    <div className="modal results-modal" onClick={onClose}>
      <div className="modal-content results-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>
        &times;
        </span>
        <h2>Results</h2>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="events-timeline">
        {events.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-icon">
              <FaCheckCircle color="#27ae60" />
            </div>
            <div className="event-content">
              <h3>{event.description}</h3>
              {event.response !== null && (
                <>
                  {typeof event.response === 'number' && (
                    <p><strong>{(event.response*100).toPrecision(4  )}%</strong></p>
                  )}
                  {typeof event.response === 'string' && (
                    <p><strong>{event.response}</strong></p>
                  )}
                  {Array.isArray(event.response) && (
                    <ul>
                      {event.response.map((item: string, idx: number) => (
                        <li key={idx}><strong>{item}</strong></li>
                      ))}
                    </ul>
                  )}
                  {typeof event.response === 'object' && !Array.isArray(event.response) && (
                    <ul>
                      {Object.entries(event.response).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
          {/* Show a spinner if processing is ongoing */}
          {progress < 100 && (
            <div className="event-item">
              <div className="event-icon">
                <FaSpinner className="spinner" />
              </div>
              <div className="event-content">
                <h3>Processing...</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
