import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Settings,
    Plus,
    Save,
    Trash2,
    Copy,
    Download,
    Upload,
    AlertCircle,
    CheckCircle,
    Sparkles,
    FileText,
    Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    PromptTemplate,
    OutputStyle,
    getPresetTemplates,
    AVAILABLE_VARIABLES,
    substituteVariables
} from '@/lib/PromptTemplates';
import {
    saveCustomTemplate,
    loadCustomTemplates,
    deleteCustomTemplate,
    getActiveTemplateId,
    setActiveTemplateId,
    exportTemplates,
    importTemplates,
    duplicateTemplate,
} from '@/lib/PromptStorage';

interface PromptSettingsProps {
    onTemplateChange: (template: PromptTemplate) => void;
    currentTemplateId: string;
}

const PromptSettings: React.FC<PromptSettingsProps> = ({ onTemplateChange, currentTemplateId }) => {
    const [open, setOpen] = useState(false);
    const [presetTemplates] = useState<PromptTemplate[]>(getPresetTemplates());
    const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<PromptTemplate>>({});

    // Load custom templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const loaded = loadCustomTemplates();
        setCustomTemplates(loaded);
    };

    // Find and set the current template
    useEffect(() => {
        const allTemplates = [...presetTemplates, ...customTemplates];
        const current = allTemplates.find(t => t.id === currentTemplateId);
        if (current) {
            setSelectedTemplate(current);
        }
    }, [currentTemplateId, presetTemplates, customTemplates]);

    const handleSelectTemplate = (template: PromptTemplate) => {
        setActiveTemplateId(template.id);
        setSelectedTemplate(template);
        onTemplateChange(template);
        toast({
            title: 'Template activated',
            description: `Now using "${template.name}" template`,
        });
    };

    const handleCreateNew = () => {
        setIsEditing(true);
        setEditingTemplate({
            id: `custom_${Date.now()}`,
            name: '',
            description: '',
            isCustom: true,
            systemPrompt: '',
            outputStyle: 'structured',
            maxTokens: 1500,
            temperature: 0.7,
        });
    };

    const handleSaveCustomTemplate = () => {
        if (!editingTemplate.name || !editingTemplate.systemPrompt) {
            toast({
                title: 'Validation Error',
                description: 'Please provide a name and system prompt',
                variant: 'destructive',
            });
            return;
        }

        try {
            const template: PromptTemplate = {
                id: editingTemplate.id || `custom_${Date.now()}`,
                name: editingTemplate.name,
                description: editingTemplate.description || '',
                isCustom: true,
                systemPrompt: editingTemplate.systemPrompt,
                outputStyle: editingTemplate.outputStyle || 'structured',
                maxTokens: editingTemplate.maxTokens || 1500,
                temperature: editingTemplate.temperature || 0.7,
            };

            saveCustomTemplate(template);
            loadTemplates();
            setIsEditing(false);
            setEditingTemplate({});

            toast({
                title: 'Template saved',
                description: `"${template.name}" has been saved successfully`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save template',
                variant: 'destructive',
            });
        }
    };

    const handleEditTemplate = (template: PromptTemplate) => {
        setIsEditing(true);
        setEditingTemplate(template);
    };

    const handleDeleteTemplate = (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                deleteCustomTemplate(id);
                loadTemplates();
                toast({
                    title: 'Template deleted',
                    description: 'Custom template has been removed',
                });
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to delete template',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleDuplicate = (template: PromptTemplate) => {
        try {
            const newTemplate = duplicateTemplate(template);
            loadTemplates();
            toast({
                title: 'Template duplicated',
                description: `Created "${newTemplate.name}"`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to duplicate template',
                variant: 'destructive',
            });
        }
    };

    const handleExport = () => {
        try {
            const json = exportTemplates();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hosho-templates-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            toast({
                title: 'Templates exported',
                description: 'Download started',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to export templates',
                variant: 'destructive',
            });
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const count = importTemplates(json);
                loadTemplates();

                toast({
                    title: 'Templates imported',
                    description: `Successfully imported ${count} template(s)`,
                });
            } catch (error) {
                toast({
                    title: 'Import failed',
                    description: error instanceof Error ? error.message : 'Invalid file format',
                    variant: 'destructive',
                });
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('custom-prompt-textarea') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = editingTemplate.systemPrompt || '';
            const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);

            setEditingTemplate({ ...editingTemplate, systemPrompt: newText });

            // Restore cursor position
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
            }, 0);
        }
    };

    const TemplateCard = ({ template, isActive }: { template: PromptTemplate; isActive: boolean }) => (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'border-2 border-blue-500 bg-blue-50' : ''
                }`}
            onClick={() => handleSelectTemplate(template)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            {template.isCustom ? <FileText className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                            {template.name}
                            {isActive && <Badge variant="default" className="ml-2">Active</Badge>}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                            {template.description}
                        </CardDescription>
                    </div>
                    {template.isCustom && (
                        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTemplate(template)}
                                className="h-8 w-8 p-0"
                            >
                                <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(template)}
                                className="h-8 w-8 p-0"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {template.outputStyle}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {template.maxTokens} tokens
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        temp: {template.temperature}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Prompt Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Prompt Template Settings</DialogTitle>
                    <DialogDescription>
                        Choose a preset template or create your own custom prompts
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="presets" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="presets">Preset Templates</TabsTrigger>
                        <TabsTrigger value="custom">Custom Prompts</TabsTrigger>
                        <TabsTrigger value="editor">
                            {isEditing ? 'Edit Prompt' : 'Create New'}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="presets" className="flex-1 overflow-hidden">
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-3">
                                {presetTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        isActive={template.id === currentTemplateId}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="custom" className="flex-1 overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button onClick={handleCreateNew} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create New Custom Prompt
                                </Button>
                                <Button variant="outline" onClick={handleExport} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                                <Button variant="outline" className="gap-2" asChild>
                                    <label htmlFor="import-file">
                                        <Upload className="h-4 w-4" />
                                        Import
                                        <input
                                            id="import-file"
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={handleImport}
                                        />
                                    </label>
                                </Button>
                            </div>

                            <ScrollArea className="h-[440px] pr-4">
                                {customTemplates.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No custom templates yet. Click "Create New Custom Prompt" to get started.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-3">
                                        {customTemplates.map((template) => (
                                            <TemplateCard
                                                key={template.id}
                                                template={template}
                                                isActive={template.id === currentTemplateId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="editor" className="flex-1 overflow-hidden">
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="template-name">Template Name *</Label>
                                        <Input
                                            id="template-name"
                                            placeholder="My Custom Template"
                                            value={editingTemplate.name || ''}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="output-style">Output Style</Label>
                                        <Select
                                            value={editingTemplate.outputStyle || 'structured'}
                                            onValueChange={(value) => setEditingTemplate({ ...editingTemplate, outputStyle: value as OutputStyle })}
                                        >
                                            <SelectTrigger id="output-style">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="structured">Structured</SelectItem>
                                                <SelectItem value="detailed">Detailed</SelectItem>
                                                <SelectItem value="concise">Concise</SelectItem>
                                                <SelectItem value="short">Short</SelectItem>
                                                <SelectItem value="long">Long</SelectItem>
                                                <SelectItem value="technical">Technical</SelectItem>
                                                <SelectItem value="summary">Summary</SelectItem>
                                                <SelectItem value="qa">Q&A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="template-description">Description</Label>
                                    <Input
                                        id="template-description"
                                        placeholder="Brief description of this template"
                                        value={editingTemplate.description || ''}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="max-tokens">Max Tokens</Label>
                                        <Input
                                            id="max-tokens"
                                            type="number"
                                            min="100"
                                            max="4000"
                                            value={editingTemplate.maxTokens || 1500}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, maxTokens: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="temperature">Temperature</Label>
                                        <Input
                                            id="temperature"
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={editingTemplate.temperature || 0.7}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, temperature: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="custom-prompt-textarea">System Prompt *</Label>
                                        <span className="text-xs text-gray-500">
                                            {editingTemplate.systemPrompt?.length || 0} characters
                                        </span>
                                    </div>
                                    <Textarea
                                        id="custom-prompt-textarea"
                                        placeholder="Enter your custom system prompt here. You can use variables like {fileName}, {pageCount}, etc."
                                        className="min-h-[200px] font-mono text-sm"
                                        value={editingTemplate.systemPrompt || ''}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, systemPrompt: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Insert Variables</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_VARIABLES.map((variable) => (
                                            <Button
                                                key={variable.key}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => insertVariable(variable.key)}
                                                className="text-xs"
                                                title={variable.description}
                                            >
                                                {`{${variable.key}}`}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Click a variable to insert it at cursor position
                                    </p>
                                </div>

                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Variables will be automatically replaced with actual document data when the prompt is used.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSaveCustomTemplate} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Save Template
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingTemplate({});
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default PromptSettings;
