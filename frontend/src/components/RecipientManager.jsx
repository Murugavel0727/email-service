import React, { useState } from 'react';
import { Mail, X, Plus, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RecipientManager = ({ recipients, onUpdateRecipients, addToast }) => {
    const [emailInput, setEmailInput] = useState('');
    const [error, setError] = useState('');

    // Email validation regex
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleAddRecipient = () => {
        const email = emailInput.trim().toLowerCase();

        // Validation
        if (!email) {
            setError('Please enter an email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (recipients.includes(email)) {
            setError('This email is already in the list');
            return;
        }

        // Add recipient
        const updatedRecipients = [...recipients, email];
        onUpdateRecipients(updatedRecipients);
        setEmailInput('');
        setError('');

        if (addToast) {
            addToast('success', `Added ${email} to recipients`, 2000);
        }
    };

    const handleRemoveRecipient = (emailToRemove) => {
        const updatedRecipients = recipients.filter(email => email !== emailToRemove);
        onUpdateRecipients(updatedRecipients);

        if (addToast) {
            addToast('success', `Removed ${emailToRemove}`, 2000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddRecipient();
        }
        // Clear error when user starts typing
        if (error) {
            setError('');
        }
    };

    return (
        <div className="space-y-4 bg-gpt-surface">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-gpt-accent" />
                <h3 className="text-sm font-medium text-gpt-text">Email Recipients</h3>
                <span className="px-2 py-0.5 bg-gpt-accent/20 text-gpt-accent text-xs rounded-full">
                    {recipients.length}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gpt-textMuted mb-4">
                Add email addresses below. When you ask the agent to send an email, it will be sent to all recipients in this list.
            </p>

            {/* Add Recipient Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gpt-text">
                    Add Email Address
                </label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="example@email.com"
                            className={`w-full px-4 py-2 bg-gpt-input border rounded-lg 
                                     text-gpt-text placeholder-gpt-textMuted 
                                     focus:ring-1 outline-none transition-colors
                                     ${error
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gpt-border focus:border-gpt-accent focus:ring-gpt-accent'
                                }`}
                        />
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-1 mt-1.5 text-xs text-red-400"
                            >
                                <AlertCircle size={12} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </div>
                    <button
                        onClick={handleAddRecipient}
                        className="px-4 py-2 bg-gpt-accent hover:bg-gpt-accentHover text-white rounded-lg 
                                 transition-colors flex items-center gap-2 shadow-md active:scale-95"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Add</span>
                    </button>
                </div>
            </div>

            {/* Recipients List */}
            <div className="mt-6">
                <label className="block text-sm font-medium text-gpt-text mb-3">
                    Current Recipients ({recipients.length})
                </label>

                {recipients.length === 0 ? (
                    <div className="p-6 bg-gpt-dark/50 border border-gpt-border rounded-lg text-center">
                        <Mail size={32} className="mx-auto mb-3 text-gpt-textMuted opacity-50" />
                        <p className="text-sm text-gpt-textMuted">No recipients added yet</p>
                        <p className="text-xs text-gpt-textMuted mt-1">
                            Add email addresses above to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {recipients.map((email, index) => (
                                <motion.div
                                    key={email}
                                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className="flex items-center justify-between p-3 bg-gpt-light/50 
                                             border border-gpt-border rounded-lg group hover:bg-gpt-light 
                                             transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gpt-accent/20 flex items-center justify-center shrink-0">
                                            <Mail size={14} className="text-gpt-accent" />
                                        </div>
                                        <span className="text-sm text-gpt-text truncate">{email}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveRecipient(email)}
                                        className="p-1.5 hover:bg-red-500/20 rounded text-gpt-textMuted 
                                                 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                        title="Remove recipient"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Info Box */}
            {recipients.length > 0 && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                        <strong>Note:</strong> Emails will be sent to all {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                        when you ask the agent to send an email.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecipientManager;
