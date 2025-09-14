import React, { useState, useEffect } from 'react';
import type { FeedLog, UserProfile } from '../types';
import TimerDisplay from './TimerDisplay';
import { HourglassIcon, BurpIcon, VomitIcon, ChevronLeftIcon, ChevronRightIcon, MilkDropIcon, BabyBottleIcon } from './Icons';

interface ReportModalProps {
  reportContent: string;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ reportContent, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(reportContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy report.');
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold mb-2 text-text-main">Doctor's Report</h3>
                <textarea
                    readOnly
                    value={reportContent}
                    className="w-full h-64 p-3 border rounded bg-gray-50 font-mono text-sm whitespace-pre-wrap resize-none focus:outline-none"
                />
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleCopy}
                        className="w-full bg-soft-green text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

interface LogTableProps {
  logs: FeedLog[];
  onClear: () => void;
  userProfile: UserProfile | null;
}

const formatTime12Hour = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const groupLogsByDate = (logs: FeedLog[]) => {
  return logs.reduce((acc, log) => {
    const date = new Date(log.startTime);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const displayDate = date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    if (!acc[dateKey]) {
      acc[dateKey] = {
        displayDate: displayDate,
        logs: []
      };
    }
    acc[dateKey].logs.push(log);
    return acc;
  }, {} as Record<string, { displayDate: string; logs: FeedLog[] }>);
};

const LogTable: React.FC<LogTableProps> = ({ logs, onClear, userProfile }) => {
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<string>('');
  
  const groupedLogs = groupLogsByDate(logs);
  const dateKeys = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  useEffect(() => {
    setCurrentDateIndex(0);
  }, [logs.length]);

  const handlePrevDay = () => {
    setCurrentDateIndex(prev => Math.min(prev + 1, dateKeys.length - 1));
  };

  const handleNextDay = () => {
    setCurrentDateIndex(prev => Math.max(prev - 1, 0));
  };

  const currentDateKey = dateKeys[currentDateIndex];
  const logsForCurrentDate = currentDateKey ? groupedLogs[currentDateKey].logs : [];

  const generateAndShowReport = () => {
    let totalGapSeconds = 0;
    let gapCount = 0;
    let vomitCount = 0;
    let missedBurpCount = 0;
    let breastFeedCount = 0;
    let formulaFeedCount = 0;

    const sortedLogs = [...logs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    for (let i = 1; i < sortedLogs.length; i++) {
        const currentLog = sortedLogs[i];
        const previousLog = sortedLogs[i - 1];
        const gap = new Date(currentLog.startTime).getTime() - new Date(previousLog.endTime).getTime();
        if (gap >= 0) {
            totalGapSeconds += Math.floor(gap / 1000);
            gapCount++;
        }
    }
    
    logs.forEach(log => {
        if (log.vomit) vomitCount++;
        if (!log.burp) missedBurpCount++;
        if (log.feedType === 'breast') breastFeedCount++;
        if (log.feedType === 'formula') formulaFeedCount++;
    });

    const avgGapSeconds = gapCount > 0 ? Math.floor(totalGapSeconds / gapCount) : 0;
    const formatDuration = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };
    
    const reportHeader = `
Feeding Report for: ${userProfile?.childName || 'Child'}
Mother: ${userProfile?.motherName || 'N/A'}
Age: ${userProfile?.childAge || 'N/A'} months
--------------------------
    `.trim().replace(/^ +/gm, '');

    const reportBody = `
Summary
- Total Sessions: ${logs.length}
- Breast Milk Feeds: ${breastFeedCount}
- Formula Feeds: ${formulaFeedCount}

Analytics
- Average Gap Between Feeds: ${formatDuration(avgGapSeconds)}
- Total Vomits: ${vomitCount} time(s)
- Sessions without Burp: ${missedBurpCount} time(s)

${missedBurpCount > 0 ? `Note: Baby did not burp after ${missedBurpCount} feeding session(s).` : ''}
    `.trim().replace(/^ +/gm, '');

    setReportContent(`${reportHeader}\n\n${reportBody}`);
    setShowReport(true);
  };

  return (
    <div className="w-full">
      {showReport && <ReportModal reportContent={reportContent} onClose={() => setShowReport(false)} />}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text-main">Feeding History</h3>
        <div className="flex items-center gap-2">
            {logs.length > 0 && (
                <button 
                    onClick={generateAndShowReport} 
                    className="text-sm bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Export Report
                </button>
            )}
             {logs.length > 0 && (
                <button 
                    onClick={onClear} 
                    className="text-sm bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                    Clear All
                </button>
            )}
        </div>
      </div>
       
      {logs.length === 0 ? (
          <div className="bg-bg-dark rounded-lg">
            <p className="text-center text-text-muted p-8">No feeding sessions logged yet.</p>
          </div>
        ) : (
        <div className="bg-bg-dark rounded-lg">
            <div className="flex justify-between items-center p-2 border-b border-gray-300">
                <button onClick={handlePrevDay} disabled={currentDateIndex >= dateKeys.length - 1} className="p-1 disabled:opacity-30" aria-label="Previous day">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h4 className="font-bold text-text-muted text-center">
                    {groupedLogs[currentDateKey]?.displayDate}
                </h4>
                <button onClick={handleNextDay} disabled={currentDateIndex === 0} className="p-1 disabled:opacity-30" aria-label="Next day">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                {logsForCurrentDate.map((log) => {
                    const overallIndex = logs.findIndex(l => l.id === log.id);
                    const previousLog = logs[overallIndex + 1];
                    let gapDuration: number | null = null;
                    if (previousLog) {
                        const gap = new Date(log.startTime).getTime() - new Date(previousLog.endTime).getTime();
                        gapDuration = Math.floor(gap / 1000);
                    }

                    return (
                        <div key={log.id} className="bg-white p-3 rounded-lg shadow-sm flex flex-col space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2 items-center border-b pb-2">
                                <div className="text-center flex flex-col items-center">
                                    <p className="font-mono text-text-main">{formatTime12Hour(log.startTime)}</p>
                                    <p className="text-xs text-text-muted">Start</p>
                                </div>
                                <div className="text-center flex flex-col items-center">
                                    <TimerDisplay seconds={log.duration} />
                                    <p className="text-xs text-text-muted">Duration</p>
                                </div>
                                <div className="text-center flex flex-col items-center">
                                    <p className="font-mono text-text-main">{formatTime12Hour(log.endTime)}</p>
                                    <p className="text-xs text-text-muted">End</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4 pt-1">
                                <div className={`flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full ${log.feedType === 'breast' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'}`}>
                                    {log.feedType === 'breast' ? <MilkDropIcon className="w-4 h-4" /> : <BabyBottleIcon className="w-4 h-4" />}
                                    <span>{log.feedType === 'breast' ? 'Breast Milk' : 'Formula'}</span>
                                </div>
                                {log.burp && (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <BurpIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium">Burp</span>
                                    </div>
                                )}
                                {log.vomit && (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                        <VomitIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium">Vomit</span>
                                    </div>
                                )}
                            </div>
                            {gapDuration !== null && gapDuration >= 0 && (
                                <div className="flex items-center justify-center gap-2 border-t pt-2 text-text-muted">
                                    <HourglassIcon className="w-4 h-4"/>
                                    <span className="font-semibold">Gap Since Last:</span>
                                    <TimerDisplay seconds={gapDuration} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default LogTable;