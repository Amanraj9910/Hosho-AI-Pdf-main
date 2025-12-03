import os

file_path = r'c:\ML-Models\Hosho-AI-Pdf-main\src\components\ChatInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Read {len(content)} bytes")

# 1. API Params
old_api = """        max_tokens: 1000,
        temperature: 0.7,"""
new_api = """        max_tokens: currentTemplate.maxTokens,
        temperature: currentTemplate.temperature,"""

if old_api in content:
    content = content.replace(old_api, new_api)
    print("Replaced API params")
else:
    print("Could not find API params block")

# 2. Card Header
old_header = """      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          AI Document Chat
        </CardTitle>
        <CardDescription>
          Ask questions about your document and get intelligent answers
        </CardDescription>"""

new_header = """      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              AI Document Chat
            </CardTitle>
            <CardDescription>
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
        </div>"""

if old_header in content:
    content = content.replace(old_header, new_header)
    print("Replaced Card Header")
else:
    print("Could not find Card Header block")

# 3. System Prompt
marker_start = "const systemPrompt = `You are an AI assistant"
# Using a unique part near the end of the prompt
marker_end_text = "✅ Always cleanly divide each part: Projections | Drivers | Guidelines | Conclusion"

start_idx = content.find(marker_start)
end_idx_text = content.find(marker_end_text)

if start_idx != -1 and end_idx_text != -1:
    # Find the closing `;` after the marker_end_text
    # The file has `\n \n`;` after the text
    end_semi = content.find("`;", end_idx_text)
    
    if end_semi != -1:
        new_prompt = """      const systemPrompt = generateSystemPrompt({
        fileName: documentSummary.fileName,
        pageCount: documentSummary.pageCount,
        textContent: documentSummary.textContent,
        tableCount: documentSummary.tables,
        keyValueCount: documentSummary.keyValuePairs,
      });"""
        
        # Replace from start_idx to end_semi + 2 (length of "`;")
        content = content[:start_idx] + new_prompt + content[end_semi+2:]
        print("Replaced System Prompt")
    else:
        print("Could not find end of System Prompt")
else:
    print(f"Could not find System Prompt markers. Start: {start_idx}, EndText: {end_idx_text}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done writing file")
