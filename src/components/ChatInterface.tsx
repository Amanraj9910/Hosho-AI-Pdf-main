import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PromptSettings from '@/components/PromptSettings';
import { usePromptTemplate } from '@/lib/usePromptTemplate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  extractedData: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ extractedData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentTemplate, setCurrentTemplate, generateSystemPrompt } = usePromptTemplate();

  // Response formatting functions
  const formatResponse = (content: string): string => {
    // Remove markdown characters
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/#{1,6}\s+(.*)/g, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>') // Headers
      .replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4">$1</li>') // List items
      .replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="ml-4">$1</li>'); // Numbered lists

    // Wrap consecutive list items in ul/ol tags
    formatted = formatted
      .replace(/(<li class="ml-4">.*<\/li>\s*)+/gs, '<ul class="list-disc pl-4 mb-2">$&</ul>')
      .replace(/\n\n/g, '</p><p class="mb-2">');

    // Detect and format tables
    formatted = formatTables(formatted);

    return `<p class="mb-2">${formatted}</p>`;
  };

  const formatTables = (content: string): string => {
    const lines = content.split('\n');
    let result: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines and pure separator lines
      if (!line || /^[\|\s\-]+$/.test(line)) {
        if (line && !(/^[\|\s\-]+$/.test(line))) {
          result.push(line);
        }
        i++;
        continue;
      }

      // Check if this is a table line (contains |)
      if (line.includes('|') && line.split('|').length > 1) {
        const tableRows: string[] = [];
        
        // Collect all consecutive table rows
        while (i < lines.length) {
          const currentLine = lines[i].trim();
          
          // Skip separator lines
          if (/^[\|\s\-]+$/.test(currentLine)) {
            i++;
            continue;
          }
          
          // Stop if not a table line
          if (!currentLine.includes('|')) {
            break;
          }
          
          tableRows.push(currentLine);
          i++;
        }

        if (tableRows.length > 0) {
          result.push(createTable(tableRows));
        }
      } else {
        result.push(line);
        i++;
      }
    }

    return result.join('\n');
  };

  const createTable = (rows: string[]): string => {
    if (rows.length === 0) return '';

    // Parse and filter rows
    const parsedRows = rows
      .map(row => {
        // Split by pipe and clean cells
        const cells = row
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell); // Remove empty cells

        // Skip separator rows (rows with only dashes)
        if (cells.every(cell => /^-+$/.test(cell))) {
          return null;
        }

        return cells;
      })
      .filter((cells): cells is string[] => cells !== null); // Remove null entries

    if (parsedRows.length === 0) return '';

    // Ensure consistent column count across all rows
    const maxCols = Math.max(...parsedRows.map(row => row.length));
    const normalizedRows = parsedRows.map(row => {
      // Pad with empty cells if needed
      while (row.length < maxCols) {
        row.push('');
      }
      // Trim excess cells
      return row.slice(0, maxCols);
    });

    let tableHtml = `
      <div class="overflow-x-auto my-4 rounded-lg border border-gray-300 shadow-md">
        <table class="w-full border-collapse bg-white">
          <thead>
            <tr class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
    `;

    // First row is header
    normalizedRows[0].forEach((cell) => {
      tableHtml += `<th class="px-6 py-3 text-left font-semibold text-sm border-r border-blue-500 last:border-r-0">${cell}</th>`;
    });

    tableHtml += `
            </tr>
          </thead>
          <tbody>
    `;

    // Data rows
    for (let i = 1; i < normalizedRows.length; i++) {
      const bgClass = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      tableHtml += `<tr class="${bgClass} hover:bg-blue-50 transition-colors border-b border-gray-200">`;
      
      normalizedRows[i].forEach((cell) => {
        tableHtml += `<td class="px-6 py-3 text-gray-700 text-sm font-medium">${cell || '-'}</td>`;
      });
      
      tableHtml += '</tr>';
    }

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    return tableHtml;
  };

  const getDetailedErrorMessage = (error: any, response?: Response): string => {
    if (response) {
      switch (response.status) {
        case 400:
          return "Invalid request format. The message structure may be incorrect.";
        case 401:
          return "Authentication failed. API key may be invalid or expired.";
        case 403:
          return "Access forbidden. Check API permissions.";
        case 404:
          return "Resource not found. Check your deployment name and endpoint URL.";
        case 429:
          return "Rate limit exceeded. Please wait before trying again.";
        case 500:
          return "Azure OpenAI service error. Please try again later.";
        default:
          return `API request failed with status ${response.status}`;
      }
    }

    if (error.message.includes('fetch')) {
      return "Network error. Please check your connection.";
    }

    return error.message || "Unknown error occurred";
  };

  useEffect(() => {
    // Add welcome message when component mounts
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I've analyzed your document "${extractedData.metadata?.fileName || 'your PDF'}". I can answer questions about its content, summarize sections, extract specific information, or help you understand the data. What would you like to know?`,
      timestamp: new Date(),
    }]);
  }, [extractedData]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setApiError(null);

    try {
      // Create a condensed version of the document data for context
      const documentSummary = {
        fileName: extractedData.metadata?.fileName,
        pageCount: extractedData.metadata?.pageCount,
        textContent: extractedData.content?.text?.substring(0, 3000) + '...' || '',
        tables: extractedData.content?.tables?.length || 0,
        keyValuePairs: extractedData.content?.keyValuePairs?.length || 0,
      };

      const systemPrompt = generateSystemPrompt({
        fileName: documentSummary.fileName,
        pageCount: documentSummary.pageCount,
        textContent: documentSummary.textContent,
        tableCount: documentSummary.tables,
        keyValueCount: documentSummary.keyValuePairs,
      });

      console.log('Sending request to Azure OpenAI...');

      const requestBody = {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage.content }
        ],
        max_tokens: currentTemplate.maxTokens,
        temperature: currentTemplate.temperature,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      // Use environment variables for endpoint and key; validate before calling
      const azureOpenAiEndpoint = (import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string) || '';
      const azureOpenAiApiKey = (import.meta.env.VITE_AZURE_OPENAI_API_KEY as string) || '';
      const azureOpenAiDeployment = (import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME as string) || (import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string) || 'gpt-4o-mini';
      const azureOpenAiApiVersion = (import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string) || '2024-12-01-preview';

      // Enhanced validation with specific error messages
      if (!azureOpenAiEndpoint) {
        throw new Error('Missing VITE_AZURE_OPENAI_ENDPOINT. Please check your environment variables.');
      }

      if (!azureOpenAiApiKey) {
        throw new Error('Missing VITE_AZURE_OPENAI_API_KEY. Please check your environment variables.');
      }

      if (!azureOpenAiDeployment) {
        throw new Error('Missing VITE_AZURE_OPENAI_DEPLOYMENT_NAME or VITE_AZURE_OPENAI_DEPLOYMENT. Please check your environment variables.');
      }

      // Improved URL construction with better error handling
      const chatUrl = `${azureOpenAiEndpoint.replace(/\/$/, '')}/openai/deployments/${azureOpenAiDeployment}/chat/completions?api-version=${azureOpenAiApiVersion}`;

      console.log('Chat URL:', chatUrl);
      console.log('Using deployment:', azureOpenAiDeployment);
      console.log('Using API version:', azureOpenAiApiVersion);

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureOpenAiApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Request URL was:', chatUrl);
        throw new Error(getDetailedErrorMessage(null, response));
      }

      const data = await response.json();
      console.log('Response data:', data);

      const assistantResponse = data.choices?.[0]?.message?.content || 'I apologize, but I received an empty response. Please try rephrasing your question.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = getDetailedErrorMessage(error);
      setApiError(errorMessage);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again or rephrase your question.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);

      toast({
        title: "Error sending message",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Can you summarize the key points?",
    "What tables or data are included?",
    "Extract all the important dates and numbers",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    textareaRef.current?.focus();
  };

  return (
    <Card className="h-full w-full flex flex-col shadow-lg border-gray-200 rounded-lg overflow-hidden">
      <CardHeader className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-col md:flex-row gap-2">
          <div>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
              AI Document Chat
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ask questions about your document and get intelligent answers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentTemplate.name}
            </Badge>
            <PromptSettings
              currentTemplateId={currentTemplate.id}
              onTemplateChange={setCurrentTemplate}
            />
          </div>
        </div>
        {apiError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {apiError}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-white">
        {/* Messages Area */}
        <ScrollArea className="flex-1 w-full overflow-hidden" ref={scrollAreaRef}>
          <div className="p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex w-full max-w-[95%] md:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    } items-start gap-2 md:gap-3`}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white ${message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                      }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-2.5 md:p-3 max-w-full ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}
                  >
                    <div
                      className="text-xs md:text-sm overflow-x-auto break-words"
                      dangerouslySetInnerHTML={{
                        __html: message.role === 'assistant' ? formatResponse(message.content) : message.content
                      }}
                    />
                    <div
                      className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <div className="bg-gray-50 text-gray-900 rounded-lg p-2.5 md:p-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                      <span className="text-xs md:text-sm">Analyzing your question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t bg-gray-50 flex-shrink-0">
            <p className="text-xs md:text-sm text-gray-600 mb-2 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 text-xs transition-colors"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t bg-white flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-2 md:px-3 h-auto bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
