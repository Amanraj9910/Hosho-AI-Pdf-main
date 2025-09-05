
import React, { useState, useRef } from 'react';
import { Upload, FileText, MessageSquare, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import DocumentIntelligence from '@/components/DocumentIntelligence';
import ChatInterface from '@/components/ChatInterface';
import JSONPreview from '@/components/JSONPreview';
import FloatingNavbar from '@/components/FloatingNavbar';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedJSON, setExtractedJSON] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      toast({
        title: "PDF uploaded successfully",
        description: `${file.name} is ready for processing.`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      toast({
        title: "PDF uploaded successfully", 
        description: `${file.name} is ready for processing.`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const resetProcess = () => {
    setUploadedFile(null);
    setExtractedJSON(null);
    setIsProcessing(false);
    setProcessingStep('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 py-6 pt-28">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Transform Documents into Intelligence
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Upload your PDFs and unlock powerful AI-driven insights with our advanced document processing technology
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Upload and Processing */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-gray-900 text-lg">
                  <Upload className="mr-2 h-5 w-5 text-red-600" />
                  Upload PDF Document
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Upload a PDF file to extract structured data and enable AI-powered queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 lg:p-12 text-center hover:border-red-300 hover:bg-red-50/30 transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col justify-center"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 group-hover:text-red-500 transition-colors mb-4" />
                  <p className="text-lg lg:text-xl font-medium text-gray-700 mb-2">
                    Drop your PDF here or click to browse
                  </p>
                  <p className="text-sm lg:text-base text-gray-500">
                    Supports PDF files up to 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                {uploadedFile && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800 truncate">{uploadedFile.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0 ml-2">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Intelligence Component */}
            {uploadedFile && (
              <DocumentIntelligence
                file={uploadedFile}
                onExtractedData={setExtractedJSON}
                onProcessingState={setIsProcessing}
                onProcessingStep={setProcessingStep}
                onProgress={setProgress}
              />
            )}

            {/* Processing Status */}
            {isProcessing && (
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-red-600" />
                    Processing Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-600">{processingStep}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            {(uploadedFile || extractedJSON) && (
              <Button 
                onClick={resetProcess} 
                variant="outline" 
                className="w-full border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300"
              >
                Process New Document
              </Button>
            )}
          </div>

          {/* Right Column - Results and Chat */}
          <div className="space-y-6">
            {/* JSON Preview */}
            {extractedJSON && (
              <JSONPreview data={extractedJSON} />
            )}

            {/* Chat Interface */}
            {extractedJSON && (
              <ChatInterface extractedData={extractedJSON} />
            )}
          </div>
        </div>

        {/* Features Section */}
        {!uploadedFile && (
          <div className="mt-16 lg:mt-20">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12 text-gray-900">Powerful Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="text-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="pt-6 lg:pt-8">
                  <div className="bg-red-50 rounded-full p-3 lg:p-4 w-fit mx-auto mb-4 lg:mb-6 group-hover:bg-red-100 transition-colors">
                    <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3 text-gray-900">Smart PDF Parsing</h3>
                  <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                    Extract structured data from PDFs using Azure Document Intelligence
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="pt-6 lg:pt-8">
                  <div className="bg-red-50 rounded-full p-3 lg:p-4 w-fit mx-auto mb-4 lg:mb-6 group-hover:bg-red-100 transition-colors">
                    <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3 text-gray-900">AI-Powered Q&A</h3>
                  <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                    Ask questions about your documents and get intelligent answers
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="pt-6 lg:pt-8">
                  <div className="bg-red-50 rounded-full p-3 lg:p-4 w-fit mx-auto mb-4 lg:mb-6 group-hover:bg-red-100 transition-colors">
                    <Download className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3 text-gray-900">Export Results</h3>
                  <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                    Download extracted data in JSON format for further processing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
