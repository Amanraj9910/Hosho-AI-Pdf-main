import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FloatingNavbar from '@/components/FloatingNavbar';
import JSONPreview from '@/components/JSONPreview';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

const AnalysisPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { extractedData, uploadedFile } = location.state || {};
    const [chatFullScreen, setChatFullScreen] = useState(false);

    useEffect(() => {
        if (!extractedData) {
            navigate('/');
        }
    }, [extractedData, navigate]);

    if (!extractedData) return null;

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex flex-col overflow-hidden">
            <FloatingNavbar />

            <div className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6 pt-20 sm:pt-28 flex flex-col overflow-hidden">
                {/* Header with buttons */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 flex-shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs sm:text-sm"
                    >
                        <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                        Back to Upload
                    </Button>
                    {chatFullScreen && (
                        <Button
                            variant="outline"
                            onClick={() => setChatFullScreen(false)}
                            className="text-xs sm:text-sm gap-1 sm:gap-2"
                        >
                            <Minimize2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Exit Fullscreen</span>
                            <span className="sm:hidden">Exit</span>
                        </Button>
                    )}
                </div>

                {/* Content Area - Split or Fullscreen */}
                {!chatFullScreen ? (
                    // Split view
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full overflow-hidden">
                        {/* Left Column - JSON Preview */}
                        <div className="hidden lg:flex flex-col w-full h-full overflow-hidden">
                            <JSONPreview data={extractedData} />
                        </div>

                        {/* Right Column - Chat Interface */}
                        <div className="flex flex-col w-full h-full overflow-hidden relative group">
                            <ChatInterface extractedData={extractedData} />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setChatFullScreen(true)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-8 z-10"
                                title="Expand chat to fullscreen"
                            >
                                <Maximize2 className="h-3.5 w-3.5" />
                                <span className="ml-1 hidden sm:inline">Fullscreen</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Fullscreen view
                    <div className="flex-1 w-full h-full overflow-hidden">
                        <ChatInterface extractedData={extractedData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPage;
