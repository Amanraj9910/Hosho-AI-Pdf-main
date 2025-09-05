
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Code, FileText, Table } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface JSONPreviewProps {
  data: any;
}

const JSONPreview: React.FC<JSONPreviewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.metadata?.fileName?.replace('.pdf', '') || 'extracted-data'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your extracted data is being downloaded as JSON.",
    });
  };

  const formatText = (text: string, maxLength: number = 200) => {
    if (!text) return 'No text available';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Extracted Data Preview
            </CardTitle>
            <CardDescription>
              Review the structured data extracted from your PDF
            </CardDescription>
          </div>
          <Button 
            onClick={downloadJSON}
            variant="outline" 
            size="sm"
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Document Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>File:</strong> {data.metadata?.fileName || 'Unknown'}</p>
                  <p><strong>Size:</strong> {data.metadata?.fileSize ? (data.metadata.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
                  <p><strong>Pages:</strong> {data.metadata?.pageCount || 0}</p>
                  <p><strong>Extracted:</strong> {data.metadata?.extractedAt ? new Date(data.metadata.extractedAt).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Content Summary</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">{data.content?.tables?.length || 0} Tables</Badge>
                  <Badge variant="secondary">{data.content?.paragraphs?.length || 0} Paragraphs</Badge>
                  <Badge variant="secondary">{data.content?.keyValuePairs?.length || 0} Key-Value Pairs</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <ScrollArea className="h-96 w-full">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Extracted Text
                  </h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {formatText(data.content?.text, 1000)}
                  </div>
                </div>
                
                {data.content?.keyValuePairs && data.content.keyValuePairs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key-Value Pairs</h4>
                    <div className="space-y-2">
                      {data.content.keyValuePairs.slice(0, 5).map((pair: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <strong>{pair.key?.content || 'Unknown Key'}:</strong> {pair.value?.content || 'No value'}
                        </div>
                      ))}
                      {data.content.keyValuePairs.length > 5 && (
                        <p className="text-sm text-gray-500">
                          ... and {data.content.keyValuePairs.length - 5} more pairs
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="tables">
            <ScrollArea className="h-96 w-full">
              {data.content?.tables && data.content.tables.length > 0 ? (
                <div className="space-y-4">
                  {data.content.tables.map((table: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Table className="mr-2 h-4 w-4" />
                        Table {index + 1} ({table.rowCount || 0} rows, {table.columnCount || 0} columns)
                      </h4>
                      <div className="text-sm text-gray-600">
                        {table.cells && table.cells.length > 0 ? (
                          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${table.columnCount || 1}, 1fr)` }}>
                            {table.cells.slice(0, 12).map((cell: any, cellIndex: number) => (
                              <div key={cellIndex} className="bg-gray-50 p-2 rounded text-xs">
                                {cell.content || 'Empty'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No table data available</p>
                        )}
                        {table.cells && table.cells.length > 12 && (
                          <p className="mt-2 text-xs text-gray-500">
                            ... and {table.cells.length - 12} more cells
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Table className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No tables found in this document</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="raw">
            <ScrollArea className="h-96 w-full">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JSONPreview;
