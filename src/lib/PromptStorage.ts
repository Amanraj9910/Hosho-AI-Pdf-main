// Local Storage utility for managing prompt templates

import { PromptTemplate, DEFAULT_TEMPLATE_ID } from './PromptTemplates';

const STORAGE_KEYS = {
    CUSTOM_TEMPLATES: 'hosho_custom_templates',
    ACTIVE_TEMPLATE_ID: 'hosho_active_template_id',
    USER_PREFERENCES: 'hosho_user_preferences',
};

export interface UserPreferences {
    activeTemplateId: string;
    lastUsedCustomTemplateId?: string;
}

// Save a custom template
export const saveCustomTemplate = (template: PromptTemplate): void => {
    try {
        const templates = loadCustomTemplates();
        const existingIndex = templates.findIndex(t => t.id === template.id);

        const updatedTemplate = {
            ...template,
            isCustom: true,
            updatedAt: new Date().toISOString(),
            createdAt: template.createdAt || new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            templates[existingIndex] = updatedTemplate;
        } else {
            templates.push(updatedTemplate);
        }

        localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
    } catch (error) {
        console.error('Error saving custom template:', error);
        throw new Error('Failed to save template. Storage may be full.');
    }
};

// Load all custom templates
export const loadCustomTemplates = (): PromptTemplate[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
        if (!stored) return [];

        const templates = JSON.parse(stored) as PromptTemplate[];
        return templates.filter(t => t.isCustom); // Ensure only custom templates
    } catch (error) {
        console.error('Error loading custom templates:', error);
        return [];
    }
};

// Delete a custom template
export const deleteCustomTemplate = (id: string): void => {
    try {
        const templates = loadCustomTemplates();
        const filtered = templates.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(filtered));

        // If deleted template was active, reset to default
        const prefs = loadUserPreferences();
        if (prefs.activeTemplateId === id) {
            setActiveTemplateId(DEFAULT_TEMPLATE_ID);
        }
    } catch (error) {
        console.error('Error deleting custom template:', error);
        throw new Error('Failed to delete template.');
    }
};

// Get active template ID
export const getActiveTemplateId = (): string => {
    try {
        const prefs = loadUserPreferences();
        return prefs.activeTemplateId || DEFAULT_TEMPLATE_ID;
    } catch (error) {
        console.error('Error getting active template:', error);
        return DEFAULT_TEMPLATE_ID;
    }
};

// Set active template ID
export const setActiveTemplateId = (id: string): void => {
    try {
        const prefs = loadUserPreferences();
        prefs.activeTemplateId = id;
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
    } catch (error) {
        console.error('Error setting active template:', error);
        throw new Error('Failed to save preference.');
    }
};

// Load user preferences
export const loadUserPreferences = (): UserPreferences => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        if (!stored) {
            return { activeTemplateId: DEFAULT_TEMPLATE_ID };
        }
        return JSON.parse(stored) as UserPreferences;
    } catch (error) {
        console.error('Error loading user preferences:', error);
        return { activeTemplateId: DEFAULT_TEMPLATE_ID };
    }
};

// Export all templates as JSON
export const exportTemplates = (): string => {
    try {
        const templates = loadCustomTemplates();
        return JSON.stringify(templates, null, 2);
    } catch (error) {
        console.error('Error exporting templates:', error);
        throw new Error('Failed to export templates.');
    }
};

// Import templates from JSON
export const importTemplates = (jsonString: string): number => {
    try {
        const imported = JSON.parse(jsonString) as PromptTemplate[];

        if (!Array.isArray(imported)) {
            throw new Error('Invalid format: expected an array of templates');
        }

        // Validate each template has required fields
        const validTemplates = imported.filter(t =>
            t.id && t.name && t.systemPrompt && t.outputStyle
        );

        if (validTemplates.length === 0) {
            throw new Error('No valid templates found in import data');
        }

        // Mark all as custom and add timestamps
        const templatesWithMeta = validTemplates.map(t => ({
            ...t,
            isCustom: true,
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        // Merge with existing templates (avoid duplicates by ID)
        const existing = loadCustomTemplates();
        const merged = [...existing];

        templatesWithMeta.forEach(newTemplate => {
            const existingIndex = merged.findIndex(t => t.id === newTemplate.id);
            if (existingIndex >= 0) {
                // Update existing
                merged[existingIndex] = newTemplate;
            } else {
                // Add new
                merged.push(newTemplate);
            }
        });

        localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(merged));
        return templatesWithMeta.length;
    } catch (error) {
        console.error('Error importing templates:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to import templates. Invalid JSON format.');
    }
};

// Clear all custom templates (with confirmation)
export const clearAllCustomTemplates = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_TEMPLATES);

        // Reset to default template
        setActiveTemplateId(DEFAULT_TEMPLATE_ID);
    } catch (error) {
        console.error('Error clearing templates:', error);
        throw new Error('Failed to clear templates.');
    }
};

// Duplicate a template (create a copy with new ID)
export const duplicateTemplate = (template: PromptTemplate): PromptTemplate => {
    const newTemplate: PromptTemplate = {
        ...template,
        id: `${template.id}_copy_${Date.now()}`,
        name: `${template.name} (Copy)`,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    saveCustomTemplate(newTemplate);
    return newTemplate;
};

// Get storage usage info
export const getStorageInfo = (): { used: number; available: number; percentage: number } => {
    try {
        const templates = JSON.stringify(loadCustomTemplates());
        const used = new Blob([templates]).size;
        const available = 5 * 1024 * 1024; // Assume 5MB localStorage limit
        const percentage = (used / available) * 100;

        return { used, available, percentage };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { used: 0, available: 0, percentage: 0 };
    }
};
