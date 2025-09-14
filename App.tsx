import React, { useState, useEffect, useCallback } from 'react';
import type { FeedLog } from './types';
import ControlSwitch from './components/ControlSwitch';
import TimerDisplay from './components/TimerDisplay';
import LogTable from './components/LogTable';
import { BabyBottleIcon, ClockIcon, BurpIcon, VomitIcon, MilkDropIcon } from './components/Icons';

const App: React.FC = () => {
  const [isFeeding, setIsFeeding] = useState<boolean>(false);
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [timeSinceLastFeed, setTimeSinceLastFeed] = useState<number>(0);
  
  // State for post-feed logging
  const [pendingLog, setPendingLog] = useState<Omit<FeedLog, 'feedType' | 'burp' | 'vomit'> | null>(null);
  const [feedType, setFeedType] = useState<'breast' | 'formula' | null>(null);
  const [burpDone, setBurpDone] = useState<boolean>(false);
  const [vomitDone, setVomitDone] = useState<boolean>(false);


  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('feedLogs');
      if (storedLogs) {
        const parsedLogs: FeedLog[] = JSON.parse(storedLogs);
        setFeedLogs(parsedLogs);
        if (parsedLogs.length > 0) {
          const lastLog = parsedLogs[0];
          setTimeSinceLastFeed(Math.floor((Date.now() - new Date(lastLog.endTime).getTime()) / 1000));
        }
      }
    } catch (error) {
      console.error("Failed to parse feed logs from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('feedLogs', JSON.stringify(feedLogs));
    } catch (error) {
      console.error("Failed to save feed logs to localStorage", error);
    }
  }, [feedLogs]);

  useEffect(() => {
    let timer: number | undefined;
    if (isFeeding && startTime) {
      timer = setInterval(() => {
        setCurrentDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFeeding, startTime]);

  useEffect(() => {
    let timer: number | undefined;
    if (!isFeeding && feedLogs.length > 0 && !pendingLog) {
      timer = setInterval(() => {
        const lastLog = feedLogs[0];
        setTimeSinceLastFeed(Math.floor((Date.now() - new Date(lastLog.endTime).getTime()) / 1000));
      }, 1000);
    } else if (!isFeeding && feedLogs.length === 0) {
      setTimeSinceLastFeed(0);
    }
    return () => clearInterval(timer);
  }, [isFeeding, feedLogs, pendingLog]);


  const handleToggle = useCallback(() => {
    const now = Date.now();
    setIsFeeding(prev => {
      const isStarting = !prev;
      if (isStarting) {
        setStartTime(now);
        setCurrentDuration(0);
      } else {
        if (startTime) {
          const newLog: Omit<FeedLog, 'feedType' | 'burp' | 'vomit'> = {
            id: now,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(now).toISOString(),
            duration: Math.floor((now - startTime) / 1000),
          };
          setPendingLog(newLog); // Create a pending log instead of saving directly
          setStartTime(null);
        }
      }
      return isStarting;
    });
  }, [startTime]);

  const handleSaveLog = useCallback(() => {
    if (pendingLog && feedType) {
      const finalLog: FeedLog = {
        ...pendingLog,
        feedType: feedType,
        burp: burpDone,
        vomit: vomitDone,
      };
      setFeedLogs(prevLogs => [finalLog, ...prevLogs]);
      setPendingLog(null);
      setFeedType(null);
      setBurpDone(false);
      setVomitDone(false);
    }
  }, [pendingLog, feedType, burpDone, vomitDone]);
  
  const clearLogs = () => {
    if(window.confirm("Are you sure you want to clear all feeding history? This cannot be undone.")) {
        setFeedLogs([]);
        setTimeSinceLastFeed(0);
    }
  }

  const PostFeedLogger = () => (
    <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-semibold">Session Complete</h2>
        <TimerDisplay seconds={pendingLog?.duration ?? 0} size="large" />
        <div className="w-full space-y-3 pt-4">
            <h3 className="text-center font-semibold text-lg mb-2">Feed Type <span className="text-red-500">*</span></h3>
             <div className="flex justify-around gap-4">
                <button 
                    onClick={() => setFeedType('breast')}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 transition-all w-1/2 justify-center ${feedType === 'breast' ? 'bg-pink-100 border-pink-500 text-pink-700' : 'bg-white/50 border-white text-white'}`}
                >
                    <MilkDropIcon className="w-6 h-6" />
                    <span className="font-semibold">Breast Milk</span>
                </button>
                 <button 
                    onClick={() => setFeedType('formula')}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 transition-all w-1/2 justify-center ${feedType === 'formula' ? 'bg-sky-100 border-sky-500 text-sky-700' : 'bg-white/50 border-white text-white'}`}
                >
                    <BabyBottleIcon className="w-6 h-6" />
                    <span className="font-semibold">Formula</span>
                </button>
            </div>
            <h3 className="text-center font-semibold pt-4">Optional Details:</h3>
            <div className="flex justify-around gap-4">
                <button 
                    onClick={() => setBurpDone(p => !p)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 transition-all w-1/2 justify-center ${burpDone ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white/50 border-white text-white'}`}
                >
                    <BurpIcon className="w-6 h-6" />
                    <span className="font-semibold">Burp</span>
                </button>
                <button
                    onClick={() => setVomitDone(p => !p)}
                    className={`flex items-center gap-2 py-2 px-4 rounded-lg border-2 transition-all w-1/2 justify-center ${vomitDone ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-white/50 border-white text-white'}`}
                >
                    <VomitIcon className="w-6 h-6" />
                    <span className="font-semibold">Vomit</span>
                </button>
            </div>
        </div>
        <button 
            onClick={handleSaveLog}
            disabled={!feedType}
            className="mt-4 w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-transform transform hover:scale-105 disabled:bg-gray-300 disabled:text-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
        >
            Save Session
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-light text-text-main flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">BabyFeed Tracker</h1>
        <p className="text-text-muted mt-2">Simple tracking for your little one's feeding schedule.</p>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-8">
        <div className={`transition-all duration-500 rounded-xl p-6 text-white ${isFeeding ? 'bg-soft-green' : 'bg-soft-blue'}`}>
          {isFeeding ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                 <BabyBottleIcon className="w-8 h-8"/>
                 <h2 className="text-2xl font-semibold">Feeding Time</h2>
              </div>
              <TimerDisplay seconds={currentDuration} size="large" />
            </div>
          ) : pendingLog ? (
              <PostFeedLogger />
          ) : (
             <div className="flex flex-col items-center space-y-4">
               <div className="flex items-center space-x-3">
                 <ClockIcon className="w-8 h-8"/>
                 <h2 className="text-2xl font-semibold">Time Since Last Feed</h2>
               </div>
               <TimerDisplay seconds={timeSinceLastFeed} size="large" />
            </div>
          )}
        </div>

        {!pendingLog && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <span className="text-lg text-text-muted">{isFeeding ? 'Slide to Stop Feeding' : 'Slide to Start Feeding'}</span>
            <ControlSwitch isToggled={isFeeding} onToggle={handleToggle} />
          </div>
        )}

        <LogTable logs={feedLogs} onClear={clearLogs} />
      </main>
      
      <footer className="mt-8 text-center text-text-muted">
        <p>Made with ❤️ for happy babies and parents.</p>
      </footer>
    </div>
  );
};

export default App;
