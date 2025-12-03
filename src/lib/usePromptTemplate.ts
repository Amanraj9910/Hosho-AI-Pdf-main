// Helper hook to manage prompt templates in ChatInterface
import { useState, useEffect } from 'react';
import { PromptTemplate, getPresetTemplates, substituteVariables } from './PromptTemplates';
import { getActiveTemplateId, loadCustomTemplates } from './PromptStorage';

export const usePromptTemplate = () => {
    const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate>(() => {
        const activeId = getActiveTemplateId();
        const allTemplates = [...getPresetTemplates(), ...loadCustomTemplates()];
        return allTemplates.find(t => t.id === activeId) || getPresetTemplates()[0];
    });

    const generateSystemPrompt = (documentData: {
        fileName?: string;
        pageCount?: number;
        textContent?: string;
        tableCount?: number;
        keyValueCount?: number;
    }): string => {
        return substituteVariables(currentTemplate.systemPrompt, {
            fileName: documentData.fileName || 'Unknown',
            pageCount: documentData.pageCount || 0,
            textContent: documentData.textContent || '',
            tableCount: documentData.tableCount || 0,
            keyValueCount: documentData.keyValueCount || 0,
        });
    };

    return {
        currentTemplate,
        setCurrentTemplate,
        generateSystemPrompt,
    };
};
