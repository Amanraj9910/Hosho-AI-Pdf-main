import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FloatingNavbar from '@/components/FloatingNavbar';
import JSONPreview from '@/components/JSONPreview';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AnalysisPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { extractedData, uploadedFile } = location.state || {};

    useEffect(() => {
        if (!extractedData) {
            navigate('/');
        }
    }, [extractedData, navigate]);

    if (!extractedData) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
            <FloatingNavbar />

            <div className="container mx-auto px-4 py-6 pt-28">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="mb-6 hover:bg-red-50 text-gray-600 hover:text-red-600"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Upload
                </Button>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 h-[calc(100vh-12rem)]">
                    {/* Left Column - JSON Preview */}
                    <div className="h-full overflow-hidden">
                        <JSONPreview data={extractedData} />
                    </div>

                    {/* Right Column - Chat Interface */}
                    <div className="h-full overflow-hidden">
                        <ChatInterface extractedData={extractedData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
