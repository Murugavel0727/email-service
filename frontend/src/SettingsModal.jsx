import React, { useState, useEffect } from 'react';
import { X, User, Server, Palette, Database, Trash2, Download, Upload, CheckCircle, XCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipientManager from './components/RecipientManager';

function SettingsModal({ isOpen, onClose, settings, onUpdateSettings, onClearAll, isOnline, onCheckConnection, recipients, onUpdateRecipients, addToast }) {
    const [activeTab, setActiveTab] = useState('account');
    const [localSettings, setLocalSettings] = useState(settings);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
            onClearAll();
            onClose();
        }
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        await onCheckConnection();
        setTimeout(() => setIsTestingConnection(false), 1000);
    };

    const handleExportData = () => {
        const conversations = localStorage.getItem('email_agent_conversations');
        const settingsData = localStorage.getItem('email_agent_settings');
        const recipientsData = localStorage.getItem('email_agent_recipients');

        const exportData = {
            conversations: conversations ? JSON.parse(conversations) : [],
            settings: settingsData ? JSON.parse(settingsData) : {},
            recipients: recipientsData ? JSON.parse(recipientsData) : [],
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-agent-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);

                    if (importedData.conversations) {
                        localStorage.setItem('email_agent_conversations', JSON.stringify(importedData.conversations));
                    }

                    if (importedData.settings) {
                        localStorage.setItem('email_agent_settings', JSON.stringify(importedData.settings));
                        onUpdateSettings(importedData.settings);
                    }

                    if (importedData.recipients) {
                        localStorage.setItem('email_agent_recipients', JSON.stringify(importedData.recipients));
                        onUpdateRecipients(importedData.recipients);
                    }

                    alert('Data imported successfully! Please refresh the page.');
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'recipients', label: 'Recipients', icon: Mail, badge: recipients?.length || 0 },
        { id: 'api', label: 'API', icon: Server },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'data', label: 'Data', icon: Database },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gpt-surface border border-gpt-borderBright rounded-2xl shadow-elevation-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
                    style={{ backgroundColor: '#1a1a1a' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gpt-border bg-gpt-surface">
                        <h2 className="text-xl font-semibold text-gpt-text">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gpt-hover rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gpt-textDim" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gpt-border overflow-x-auto bg-gpt-surface">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative
                                        ${activeTab === tab.id
                                            ? 'text-gpt-accent'
                                            : 'text-gpt-textDim hover:text-gpt-text'
                                        }
                                    `}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className="px-1.5 py-0.5 bg-gpt-accent/20 text-gpt-accent text-xs rounded-full min-w-[18px] text-center">
                                            {tab.badge}
                                        </span>
                                    )}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gpt-accent"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gpt-surface">
                        {activeTab === 'account' && (
                            <div className="space-y-4 bg-gpt-surface">
                                <div>
                                    <label className="block text-sm font-medium text-gpt-text mb-2">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={localSettings.userName}
                                        onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gpt-input border border-gpt-border rounded-lg 
                                                 text-gpt-text placeholder-gpt-textMuted focus:border-gpt-accent 
                                                 focus:ring-1 focus:ring-gpt-accent outline-none transition-colors"
                                        placeholder="Enter your name"
                                    />
                                    <p className="text-xs text-gpt-textMuted mt-2">
                                        This name will be displayed in your profile.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gpt-text mb-2">
                                        User ID
                                    </label>
                                    <div className="px-4 py-2 bg-gpt-dark border border-gpt-border rounded-lg text-gpt-textDim text-sm">
                                        {localSettings.userId || 'anonymous'}
                                    </div>
                                    <p className="text-xs text-gpt-textMuted mt-2">
                                        Your unique identifier for data storage.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'recipients' && (
                            <RecipientManager
                                recipients={recipients || []}
                                onUpdateRecipients={onUpdateRecipients}
                                addToast={addToast}
                            />
                        )}

                        {activeTab === 'api' && (
                            <div className="space-y-4 bg-gpt-surface">
                                <div>
                                    <label className="block text-sm font-medium text-gpt-text mb-2">
                                        Backend URL
                                    </label>
                                    <input
                                        type="text"
                                        value={localSettings.backendUrl}
                                        onChange={(e) => setLocalSettings({ ...localSettings, backendUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-gpt-input border border-gpt-border rounded-lg 
                                                 text-gpt-text placeholder-gpt-textMuted focus:border-gpt-accent 
                                                 focus:ring-1 focus:ring-gpt-accent outline-none transition-colors"
                                        placeholder="http://localhost:8000"
                                    />
                                    <p className="text-xs text-gpt-textMuted mt-2">
                                        URL of your email agent backend server.
                                    </p>
                                </div>

                                <div className={`p-4 border rounded-lg ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {isOnline ? (
                                                <CheckCircle size={18} className="text-emerald-400" />
                                            ) : (
                                                <XCircle size={18} className="text-red-400" />
                                            )}
                                            <span className={`text-sm font-medium ${isOnline ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {isOnline ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleTestConnection}
                                            disabled={isTestingConnection}
                                            className="px-3 py-1 text-xs bg-gpt-input hover:bg-gpt-hover border border-gpt-border 
                                                     rounded-lg text-gpt-text transition-colors disabled:opacity-50"
                                        >
                                            {isTestingConnection ? 'Testing...' : 'Test Connection'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gpt-textDim">
                                        {isOnline
                                            ? 'Backend server is reachable and responding'
                                            : 'Cannot connect to backend. Make sure it\'s running.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-4 bg-gpt-surface">
                                <div>
                                    <label className="block text-sm font-medium text-gpt-text mb-2">
                                        Font Size
                                    </label>
                                    <select
                                        value={localSettings.fontSize}
                                        onChange={(e) => setLocalSettings({ ...localSettings, fontSize: e.target.value })}
                                        className="w-full px-4 py-2 bg-gpt-input border border-gpt-border rounded-lg 
                                                 text-gpt-text focus:border-gpt-accent focus:ring-1 focus:ring-gpt-accent 
                                                 outline-none transition-colors"
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gpt-text mb-2">
                                        Theme
                                    </label>
                                    <div className="p-4 bg-gpt-dark border border-gpt-border rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gpt-dark to-gpt-light rounded-lg border border-gpt-borderBright"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gpt-text">Dark Mode</p>
                                                <p className="text-xs text-gpt-textDim">Currently active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-4 bg-gpt-surface">
                                <div className="p-4 bg-gpt-dark border border-gpt-border rounded-lg">
                                    <h3 className="text-sm font-medium text-gpt-text mb-2">Storage Information</h3>
                                    <p className="text-xs text-gpt-textDim mb-3">
                                        Your conversations are stored {localSettings.useSupabase ? 'in Supabase cloud' : 'locally in your browser'}.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleExportData}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gpt-input 
                                                     hover:bg-gpt-hoverBright border border-gpt-border rounded-lg 
                                                     text-sm text-gpt-text transition-colors"
                                        >
                                            <Download size={16} />
                                            Export Data
                                        </button>
                                        <button
                                            onClick={handleImportData}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gpt-input 
                                                     hover:bg-gpt-hoverBright border border-gpt-border rounded-lg 
                                                     text-sm text-gpt-text transition-colors"
                                        >
                                            <Upload size={16} />
                                            Import Data
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
                                    <p className="text-xs text-gpt-textDim mb-3">
                                        Permanently delete all your conversations. This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={handleClearAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 
                                                 border border-red-500/50 rounded-lg text-sm text-red-400 
                                                 transition-colors w-full justify-center"
                                    >
                                        <Trash2 size={16} />
                                        Clear All Conversations
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gpt-border bg-gpt-surface">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gpt-textDim hover:text-gpt-text transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-gpt-accent hover:bg-gpt-accentHover text-white text-sm 
                                     rounded-lg transition-colors shadow-md"
                        >
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SettingsModal;
