import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, User, Bot, Plus, MessageSquare, Menu, Settings, Sparkles, Mail, PenTool, Copy, Trash2, Clock, RotateCcw, Wifi, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsModal from './SettingsModal';
import { ToastContainer } from './components/Toast';
import MarkdownMessage from './components/MarkdownMessage';

import { API_BASE_URL } from './config';

function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    // Toast notifications
    const [toasts, setToasts] = useState([]);

    // Conversation management with localStorage
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);

    // Settings
    const [settings, setSettings] = useState({
        userName: 'User',
        userId: 'anonymous',
        backendUrl: API_BASE_URL,
        fontSize: 'medium',
        useSupabase: false,
    });

    // Recipients management
    const [recipients, setRecipients] = useState([]);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Toast management
    const addToast = useCallback((type, message, duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    // Load conversations and settings from localStorage on mount
    useEffect(() => {
        const savedConversations = localStorage.getItem('email_agent_conversations');
        if (savedConversations) {
            setConversations(JSON.parse(savedConversations));
        }

        const savedSettings = localStorage.getItem('email_agent_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);

            setSettings(prev => ({
                ...prev,
                ...parsed,
                backendUrl: API_BASE_URL, // 🔥 FORCE ENV BACKEND
            }));
        }

        const savedRecipients = localStorage.getItem('email_agent_recipients');
        if (savedRecipients) {
            setRecipients(JSON.parse(savedRecipients));
        }
    }, []);

    // Check backend connection on mount
    useEffect(() => {
        checkConnection();
    }, [settings.backendUrl]);

    // Auto-save current conversation to localStorage
    useEffect(() => {
        if (currentConversationId && messages.length > 0) {
            const title = messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'New conversation';
            const conversationData = {
                id: currentConversationId,
                title,
                messages,
                updated_at: new Date().toISOString(),
            };

            const existing = conversations.filter(c => c.id !== currentConversationId);
            const updated = [conversationData, ...existing].slice(0, 50);
            setConversations(updated);
            localStorage.setItem('email_agent_conversations', JSON.stringify(updated));
        }
    }, [messages, currentConversationId]);

    // Check backend connection
    const checkConnection = async () => {
        try {
            const response = await axios.get(`${settings.backendUrl}/`, { timeout: 3000 });
            setIsOnline(true);
        } catch (error) {
            setIsOnline(false);
        }
    };

    // Generate simple UUID
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Start new conversation
    const startNewChat = () => {
        setMessages([]);
        setInput('');
        setCurrentConversationId(generateUUID());
        setIsSidebarOpen(false); // Close sidebar after starting new chat
    };

    // Switch to existing conversation
    const switchConversation = (conversationId) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            setMessages(conversation.messages || []);
            setCurrentConversationId(conversationId);
            setIsSidebarOpen(false); // Close sidebar after switching
        }
    };

    // Delete conversation
    const deleteConversation = (id, e) => {
        e.stopPropagation();

        if (!window.confirm('Delete this conversation?')) return;

        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);
        localStorage.setItem('email_agent_conversations', JSON.stringify(updated));

        if (currentConversationId === id) {
            startNewChat();
        }
    };

    // Update settings
    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('email_agent_settings', JSON.stringify(newSettings));
    };

    // Clear all conversations
    const clearAllConversations = () => {
        setConversations([]);
        localStorage.removeItem('email_agent_conversations');
        startNewChat();
    };

    // Update recipients
    const updateRecipients = (newRecipients) => {
        setRecipients(newRecipients);
        localStorage.setItem('email_agent_recipients', JSON.stringify(newRecipients));
    };

    // Send message
    const sendMessage = async (messageText = input) => {
        if (!messageText.trim()) return;

        // Check connection first
        if (!isOnline) {
            addToast('error', 'Backend server is not reachable. Please check if it\'s running.');
            return;
        }

        // Create new conversation if needed
        if (!currentConversationId) {
            setCurrentConversationId(generateUUID());
        }

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(
                `${settings.backendUrl}/api/chat`,
                {
                    message: userMessage.content,
                    history: messages,
                    recipients: recipients.length > 0 ? recipients : undefined
                },
                { timeout: 60000 }
            );

            const aiMessage = { role: 'assistant', content: response.data.response };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Error sending message:', error);

            let errorMessage = 'Sorry, I encountered an error.';
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage = 'Request timed out. The server is taking too long to respond.';
            } else if (error.response) {
                errorMessage = `Server error: ${error.response.status}. ${error.response.data?.detail || 'Please try again.'}`;
            } else if (error.request) {
                errorMessage = 'Cannot reach the server. Please ensure the backend is running.';
                setIsOnline(false);
            }

            addToast('error', errorMessage);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${errorMessage}`,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Regenerate last response
    const regenerateResponse = () => {
        if (messages.length < 2) return;

        // Find the last user message
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;

        // Remove the last assistant message
        setMessages(prev => {
            const newMessages = [...prev];
            const lastAssistantIndex = newMessages.map(m => m.role).lastIndexOf('assistant');
            if (lastAssistantIndex !== -1) {
                newMessages.splice(lastAssistantIndex, 1);
            }
            return newMessages;
        });

        // Resend the last user message
        setTimeout(() => {
            sendMessage(lastUserMessage.content);
        }, 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleExamplePrompt = (prompt) => {
        setInput(prompt);
        textareaRef.current?.focus();
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const examplePrompts = [
        {
            icon: Mail,
            title: "Draft a professional email",
            prompt: "Help me draft a professional email to schedule a meeting with my team next week"
        },
        {
            icon: PenTool,
            title: "Write a follow-up email",
            prompt: "Write a follow-up email to a client about our project proposal"
        },
        {
            icon: Sparkles,
            title: "Create a thank you note",
            prompt: "Create a thank you email for my colleague who helped me with the presentation"
        }
    ];

    return (
        <div className="flex h-screen bg-gpt-gray text-gpt-text overflow-hidden">
            {/* Toast Container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onUpdateSettings={updateSettings}
                onClearAll={clearAllConversations}
                isOnline={isOnline}
                onCheckConnection={checkConnection}
                recipients={recipients}
                onUpdateRecipients={updateRecipients}
                addToast={addToast}
            />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ x: isSidebarOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-gpt-dark border-r border-gpt-border
                    md:translate-x-0 flex flex-col h-screen shadow-elevation-lg md:shadow-none"
                style={{ backgroundColor: '#171717' }}
            >
                {/* Close Button (visible on mobile) */}
                <div className="flex items-center justify-between p-3 border-b border-gpt-border bg-gpt-dark md:hidden">
                    <h2 className="text-sm font-semibold text-gpt-text">Menu</h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 hover:bg-gpt-hover rounded-lg transition-colors"
                    >
                        <X size={18} className="text-gpt-textDim" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-2 border-b border-gpt-border bg-gpt-dark">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gpt-borderBright 
                                 hover:bg-gpt-hover active:scale-[0.98] text-sm text-white transition-all duration-200 
                                 group shadow-sm hover:shadow-glow-sm ripple"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-medium">New chat</span>
                    </button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-2 py-3 bg-gpt-dark">
                    {conversations.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-semibold text-gpt-textMuted px-3 py-2">Recent</div>
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => switchConversation(conv.id)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gpt-hover 
                                        text-sm transition-all duration-200 cursor-pointer group relative
                                        ${currentConversationId === conv.id ? 'bg-gpt-hover' : ''}
                                    `}
                                >
                                    <MessageSquare size={16} className="shrink-0 text-gpt-textDim group-hover:text-gpt-accent transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-gpt-text">{conv.title}</p>
                                        <p className="text-xs text-gpt-textMuted flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTimestamp(conv.updated_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded 
                                                 text-gpt-textMuted hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-gpt-border p-2 bg-gradient-to-t from-gpt-dark/50">
                    <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gpt-hover 
                                 text-sm text-gpt-textDim hover:text-white transition-all duration-200 group"
                    >
                        <User size={16} className="group-hover:scale-110 transition-transform" />
                        <span>{settings.userName}</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowSettings(true);
                            setIsSidebarOpen(false); // Close sidebar when opening settings
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gpt-hover 
                                 text-sm text-gpt-textDim hover:text-white transition-all duration-200 group"
                    >
                        <Settings size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                        <span>Settings</span>
                    </button>
                </div>
            </motion.div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gpt-border bg-gpt-gray/80 backdrop-blur-xl shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-gpt-hoverBright rounded-lg transition-colors active:scale-95"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Email Agent</span>
                        {isOnline ? (
                            <Wifi size={16} className="text-emerald-400" title="Connected" />
                        ) : (
                            <WifiOff size={16} className="text-red-400" title="Disconnected" />
                        )}
                    </div>
                    <button
                        onClick={startNewChat}
                        className="p-2 hover:bg-gpt-hoverBright rounded-lg transition-colors active:scale-95"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Desktop Connection Indicator */}
                <div className="hidden md:flex items-center justify-end px-6 py-2 border-b border-gpt-border/50 bg-gpt-gray/50">
                    <div className="flex items-center gap-2 text-xs">
                        {isOnline ? (
                            <>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-gpt-textMuted">Connected to backend</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-red-400">Backend offline</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center px-4 py-12"
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="w-16 h-16 mb-6 bg-gradient-accent rounded-2xl flex items-center justify-center shadow-glow gradient-animate"
                            >
                                <Sparkles size={32} className="text-white" />
                            </motion.div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gpt-textDim bg-clip-text text-transparent">
                                Email Agent
                            </h1>
                            <p className="text-gpt-textDim mb-12 text-center max-w-md">
                                Your AI-powered email assistant. I can help you draft, compose, and send professional emails.
                            </p>

                            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                {examplePrompts.map((example, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        onClick={() => handleExamplePrompt(example.prompt)}
                                        className="p-4 glass-strong hover:bg-gpt-light border border-gpt-border 
                                                 hover:border-gpt-borderBright rounded-xl text-left transition-all duration-200 
                                                 group hover:shadow-elevation active:scale-[0.98]"
                                    >
                                        <example.icon size={20} className="text-gpt-accent mb-2 group-hover:scale-110 transition-transform" />
                                        <h3 className="text-sm font-medium text-gpt-text mb-1">{example.title}</h3>
                                        <p className="text-xs text-gpt-textMuted line-clamp-2">{example.prompt}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`w-full border-b border-gpt-border/50 group ${msg.role === 'assistant' ? 'bg-gpt-light/50' : 'bg-transparent'}`}
                                >
                                    <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-4 md:px-6 py-6 md:py-8 items-start">
                                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg shrink-0 flex items-center justify-center shadow-md
                                            ${msg.role === 'assistant' ? 'bg-gradient-accent' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
                                            {msg.role === 'assistant' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-[15px] leading-7">
                                                {msg.role === 'assistant' && !msg.isError ? (
                                                    <MarkdownMessage content={msg.content} />
                                                ) : (
                                                    <div className="whitespace-pre-wrap break-words text-gpt-text">{msg.content}</div>
                                                )}
                                            </div>

                                            {msg.role === 'assistant' && !msg.isError && (
                                                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(msg.content);
                                                            addToast('success', 'Copied to clipboard!', 2000);
                                                        }}
                                                        className="p-1.5 rounded hover:bg-gpt-hover text-gpt-textMuted hover:text-gpt-text transition-colors"
                                                        title="Copy to clipboard"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    {index === messages.length - 1 && (
                                                        <button
                                                            onClick={regenerateResponse}
                                                            className="p-1.5 rounded hover:bg-gpt-hover text-gpt-textMuted hover:text-gpt-text transition-colors"
                                                            title="Regenerate response"
                                                        >
                                                            <RotateCcw size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full bg-gpt-light/50 border-b border-gpt-border/50"
                                >
                                    <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-4 md:px-6 py-6 md:py-8 items-start">
                                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-accent shrink-0 flex items-center justify-center shadow-md">
                                            <Bot size={20} className="text-white" />
                                        </div>
                                        <div className="flex gap-1.5 items-center h-7">
                                            <span className="w-2 h-2 bg-gpt-accent/60 rounded-full animate-typing"></span>
                                            <span className="w-2 h-2 bg-gpt-accent/60 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-2 h-2 bg-gpt-accent/60 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} className="h-32 md:h-40" />
                </div>

                {/* Input Area */}
                <div className="shrink-0 border-t border-gpt-border bg-gradient-to-t from-gpt-gray via-gpt-gray to-transparent px-4 pb-6 pt-4">
                    <div className="max-w-3xl mx-auto">
                        <div className={`flex items-end w-full px-4 py-3 glass-strong backdrop-blur-xl rounded-2xl 
                            border transition-all duration-200 shadow-elevation
                            ${input.trim() || isLoading ? 'border-gpt-accent shadow-glow' : 'border-gpt-borderBright hover:border-gpt-borderBright/60'}`}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Message Email Agent..."
                                rows={1}
                                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none outline-none 
                                         text-gpt-text placeholder-gpt-textMuted text-[15px] leading-6 max-h-[200px]"
                                disabled={isLoading}
                            />

                            <button
                                onClick={() => sendMessage()}
                                disabled={isLoading || !input.trim()}
                                className={`ml-2 p-2 rounded-lg transition-all duration-200 shrink-0 ripple
                                    ${input.trim() && !isLoading
                                        ? 'bg-gpt-accent hover:bg-gpt-accentHover text-white shadow-md hover:shadow-glow active:scale-95'
                                        : 'bg-transparent text-gpt-textMuted cursor-not-allowed'}`}
                            >
                                <Send size={18} />
                            </button>
                        </div>

                        <div className="text-center text-xs text-gpt-textMuted mt-3 px-4">
                            Email Agent can make mistakes. Please verify important information.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
