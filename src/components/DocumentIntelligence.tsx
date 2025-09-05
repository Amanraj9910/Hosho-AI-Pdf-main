
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocumentIntelligenceProps {
  file: File;
  onExtractedData: (data: any) => void;
  onProcessingState: (processing: boolean) => void;
  onProcessingStep: (step: string) => void;
  onProgress: (progress: number) => void;
}

const DocumentIntelligence: React.FC<DocumentIntelligenceProps> = ({
  file,
  onExtractedData,
  onProcessingState,
  onProcessingStep,
  onProgress,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const extractDataFromPDF = async () => {
    if (!file) return;

    setIsExtracting(true);
    onProcessingState(true);
    setExtractionStatus('idle');
    
    try {
      // Step 1: Prepare document
      onProcessingStep('Preparing document for analysis...');
      onProgress(10);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Upload to Azure Document Intelligence
      onProcessingStep('Uploading to Azure Document Intelligence...');
      onProgress(30);
      
      const formData = new FormData();
      formData.append('file', file);

      // Use environment variables for endpoint and key to avoid leaking secrets
     const formRecognizerEndpoint = import.meta.env.VITE_AZURE_FORM_RECOGNIZER_ENDPOINT as string;
     const formRecognizerKey = import.meta.env.VITE_AZURE_FORM_RECOGNIZER_KEY as string;

     const analyzeResponse = await fetch(`${formRecognizerEndpoint}/formrecognizer/documentModels/prebuilt-document:analyze?api-version=2023-07-31`, {
       method: 'POST',
       headers: {
         'Ocp-Apim-Subscription-Key': formRecognizerKey || '',
       },
       body: formData,
     });
      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
      }

      const operationLocation = analyzeResponse.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No operation location returned from analysis');
      }

      // Step 3: Poll for results
      onProcessingStep('Processing document content...');
      onProgress(50);

      let result;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        onProgress(50 + (attempts / maxAttempts) * 40);
        onProcessingStep(`Analyzing document... (${attempts}/${maxAttempts})`);

      // Polling for results with configured key
      const resultResponse = await fetch(operationLocation, {
        headers: {
                  'Ocp-Apim-Subscription-Key': formRecognizerKey || '',
        },
      });
        if (!resultResponse.ok) {
          throw new Error(`Failed to get results: ${resultResponse.status}`);
        }

        result = await resultResponse.json();
        
        if (result.status === 'succeeded') {
          break;
        } else if (result.status === 'failed') {
          throw new Error('Document analysis failed');
        }
      }

      if (!result || result.status !== 'succeeded') {
        throw new Error('Document analysis timed out');
      }

      // Step 4: Process and structure the data
      onProcessingStep('Structuring extracted data...');
      onProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Transform the Azure response into a cleaner format
      const structuredData = {
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          extractedAt: new Date().toISOString(),
          pageCount: result.analyzeResult?.pages?.length || 0,
        },
        content: {
          text: result.analyzeResult?.content || '',
          pages: result.analyzeResult?.pages || [],
          tables: result.analyzeResult?.tables || [],
          keyValuePairs: result.analyzeResult?.keyValuePairs || [],
          paragraphs: result.analyzeResult?.paragraphs || [],
        },
        rawResponse: result.analyzeResult,
      };

      onProgress(100);
      onProcessingStep('Extraction complete!');
      
      onExtractedData(structuredData);
      setExtractionStatus('success');
      
      toast({
        title: "Document processed successfully",
        description: `Extracted ${structuredData.metadata.pageCount} pages with structured content.`,
      });

    } catch (error) {
      console.error('Error extracting data:', error);
      setExtractionStatus('error');
      
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      onProcessingState(false);
      onProcessingStep('');
      onProgress(0);
    }
  };

  const getStatusIcon = () => {
    if (isExtracting) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (extractionStatus === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (extractionStatus === 'error') return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <FileText className="h-5 w-5" />;
  };

  const getButtonText = () => {
    if (isExtracting) return 'Extracting Data...';
    if (extractionStatus === 'success') return 'Re-extract Data';
    return 'Extract Data with AI';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2">HOSHO's Document Analyser</span>
        </CardTitle>
        <CardDescription>
          Extract structured data from your PDF using HOSHO's AI-powered document analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={extractDataFromPDF}
          disabled={isExtracting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {getButtonText()}
        </Button>
        
        {extractionStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Data extracted successfully! You can now ask questions about your document.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentIntelligence;
