import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    // Simple table detection and formatting
    const lines = content.split('\n');
    let inTable = false;
    let tableRows: string[] = [];
    let result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect table-like content (contains | or consistent spacing)
      if (line.includes('|') && line.split('|').length > 2) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      } else {
        if (inTable) {
          // End of table, format it
          result.push(createTable(tableRows));
          tableRows = [];
          inTable = false;
        }
        if (line) result.push(line);
      }
    }

    if (inTable && tableRows.length > 0) {
      result.push(createTable(tableRows));
    }

    return result.join('\n');
  };

  const createTable = (rows: string[]): string => {
    if (rows.length === 0) return '';

    let tableHtml = '<table class="w-full border-collapse border border-gray-300 my-4">';
    
    rows.forEach((row, index) => {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
      const isHeader = index === 0;
      const tag = isHeader ? 'th' : 'td';
      const bgClass = isHeader ? 'bg-gray-100' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
      
      tableHtml += `<tr class="${bgClass}">`;
      cells.forEach(cell => {
        tableHtml += `<${tag} class="border border-gray-300 px-3 py-2 text-left ${isHeader ? 'font-bold' : ''}">${cell}</${tag}>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += '</table>';
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

      const systemPrompt = `You are an AI assistant analyzing a document. Here is the extracted data from the document:

Document: ${documentSummary.fileName}
Pages: ${documentSummary.pageCount}
Content Preview: ${documentSummary.textContent}
Tables Found: ${documentSummary.tables}
Key-Value Pairs: ${documentSummary.keyValuePairs}

Please answer the user's question based on this document data. Provide responses in clean, structured plain text only. Do not use markdown symbols such as *, **, or -.

When the user requests a list of tags in a SWIFT file, extract and display each tag's data in a table format using pipe | separators.

The table should have three clear columns:
Tag | Heading | Data

Formatting Rules:
Each tag must appear only once per row. Do not break rows into multiple lines.
If a tag occurs multiple times (like 71F), combine the values in the same row or differentiate as 71F-1, 71F-2.
Ensure all headings are standardized and consistently formatted (e.g., use Sender's Reference, not Sender's Reference - Details).
Clean the data: remove any extra characters such as # at the end of numbers or unnecessary whitespace.
Make sure the table rows are visually aligned and properly structured using | only.

📚 STRUCTURED RESPONSE FORMAT FOR ALL QUERIES:
When responding to any user query — whether about capacity, deadlines, compliance, timelines, or technical requirements:

- 📘 Present content in clearly separated **sections** with appropriate **headings** (e.g., "Overview", "Technical Specs", "Deadlines", "Financial Terms", "Conclusion").
- 📊 Use **tables** for any data involving numbers across years, units, deadlines, pricing, or tagged fields.
- 🔹 Use **bulleted lists** for grouped information (e.g., eligibility criteria, scope items, benefits, components).
- ✨ Use **icons/emojis** (optional) for better clarity, especially in chat UIs:
  - 📌 Requirement
  - 📅 Date/Deadline
  - ⚙️ Technical Detail
  - 💰 Financial Info
  - 📈 Trend/Projection
  - ✅ Available/Accepted
  - ❌ Not Allowed
- 📄 Keep responses concise but complete. Avoid long paragraphs.
- 🟢 Always end with a **brief conclusion** or summary remark when appropriate, explaining:
  - Why the section is important
  - What action or attention it requires
  - How it relates to overall document objectives

✅ This format ensures answers are:
- Easy to scan
- Visually structured
- Professionally organized
- Ready for chatbot display

📚 FOR ANY DOCUMENT SECTION INVOLVING DEMAND PROJECTIONS OR CAPACITY REQUIREMENTS:
- Always structure the output into clear blocks:
  - 📘 Section Header
  - 🔹 Sub-sections like "Purpose", "Peak Demand", "Generation", "Technical Requirements", "Submission", "Conclusion"

Always place a clear, standalone heading above each table like:
  **Projected System Peak Demand (GW)**  
  or  
  **Projected Total Electricity Generation (GWh)**

- Do not inline the heading with the table itself. Add a **line break** between the heading and the table.

✅ Example Format:

📊 **Projected System Peak Demand (GW)**

| Year | Upper | Base | Lower |
|------|-------|------|-------|
| 2024 | 8.5   | 8.3  | 8.1   |
| ...  | ...   | ...  | ...   |

📊 **Projected Total Electricity Generation (GWh)**

| Year | Upper | Base | Lower |
|------|-------|------|-------|
| 2024 | 61,400 | 60,200 | 59,100 |
| ...  | ...    | ...    | ...    |

- Ensure each projection type has its own title and is not merged together.
- Always use correct units in parentheses (e.g., GW, GWh) to avoid ambiguity.
- Add a line break before and after the table to improve visual clarity.
- Use bullet lists for explanation points (📌), influencing factors (📈), and sectoral impact (e.g., 🏭 manufacturing, 💻 digital).
- Always include a short **conclusion section** summarizing why this requirement matters and what action the user/stakeholder should consider.
- Use **visual separators and emojis** to enhance clarity, especially in chat UIs.
- ❌ Do NOT leave raw tables or mix bullets with paragraphs
- ✅ Always cleanly divide each part: Projections | Drivers | Guidelines | Conclusion`;

      console.log('Sending request to Azure OpenAI...');
      
      const requestBody = {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage.content }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      // ✅ FIXED: Updated environment variable names and validation
      const azureOpenAiEndpoint = (import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string) || '';
      const azureOpenAiApiKey = (import.meta.env.VITE_AZURE_OPENAI_API_KEY as string) || '';
      const azureOpenAiDeployment = (import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME as string) || 'gpt-4o-mini'; // ✅ Fixed variable name
      const azureOpenAiApiVersion = '2024-12-01-preview';

      // ✅ Enhanced validation with specific error messages
      if (!azureOpenAiEndpoint) {
        throw new Error('Missing VITE_AZURE_OPENAI_ENDPOINT. Please check your environment variables.');
      }
      
      if (!azureOpenAiApiKey) {
        throw new Error('Missing VITE_AZURE_OPENAI_API_KEY. Please check your environment variables.');
      }

      if (!azureOpenAiDeployment) {
        throw new Error('Missing VITE_AZURE_OPENAI_DEPLOYMENT_NAME. Please check your environment variables.');
      }

      // ✅ Improved URL construction with better error handling
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
    <Card className="h-[600px] flex flex-col max-w-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          AI Document Chat
        </CardTitle>
        <CardDescription>
          Ask questions about your document and get intelligent answers
        </CardDescription>
        {apiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {apiError}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } items-start space-x-2`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-2'
                        : 'bg-purple-600 text-white mr-2'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div 
                      className="text-sm overflow-x-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: message.role === 'assistant' ? formatResponse(message.content) : message.content 
                      }}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
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
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing your question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t">
            <p className="text-sm text-gray-600 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-3"
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
