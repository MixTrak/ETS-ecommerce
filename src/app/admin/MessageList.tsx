'use client';

import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  MailOpen, 
  Search, 
  Calendar, 
  User, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MessagesResponse {
  messages: Message[];
  pagination: Pagination;
  unreadCount: number;
}

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const fetchMessages = async (page = 1, isRead?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (isRead !== undefined) {
        params.append('isRead', isRead.toString());
      }

      const response = await fetch(`/api/admin/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: MessagesResponse = await response.json();
      setMessages(data.messages);
      setPagination(data.pagination);
      setUnreadCount(data.unreadCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, isRead }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead } : msg
      ));

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead });
      }

      if (isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setUnreadCount(prev => prev + 1);
      }

      toast.success(`Message marked as ${isRead ? 'read' : 'unread'}`);
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    setDeletingMessageId(messageId);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      const deletedMessage = messages.find(msg => msg._id === messageId);
      setMessages(messages.filter(msg => msg._id !== messageId));
      
      setPagination(prev => ({
        ...prev,
        totalMessages: prev.totalMessages - 1,
      }));

      if (deletedMessage && !deletedMessage.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }

      toast.success('Message deleted successfully');
      
      if (messages.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'read' | 'unread') => {
    setFilter(newFilter);
    setCurrentPage(1);
    if (newFilter === 'all') {
      fetchMessages(1);
    } else {
      fetchMessages(1, newFilter === 'read');
    }
  };

  const handlePageChange = (page: number) => {
    if (filter === 'all') {
      fetchMessages(page);
    } else {
      fetchMessages(page, filter === 'read');
    }
  };

  const filteredMessages = messages.filter(message => {
    if (searchTerm === '') return true;
    return (
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openMessageModal = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      await markAsRead(message._id, true);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <motion.div className="flex items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="loading loading-spinner loading-lg"></div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex justify-between items-center" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-base-content/70">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All messages are read'}
          </p>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleFilterChange(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${pagination.totalMessages})` : f === 'unread' ? `(${unreadCount})` : `(${pagination.totalMessages - unreadCount})`}
            </motion.button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
          <motion.input
            type="text"
            placeholder="Search messages..."
            className="input input-bordered input-sm pl-10 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        {filteredMessages.length === 0 ? (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Mail className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">No messages found</p>
          </motion.div>
        ) : (
          <div className="divide-y divide-base-300">
            <AnimatePresence>
              {filteredMessages.map((message, i) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 hover:bg-base-300 cursor-pointer transition-colors ${!message.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                  onClick={() => openMessageModal(message)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {message.isRead ? (
                          <MailOpen className="w-4 h-4 text-base-content/50" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                        <h3 className={`font-semibold truncate ${!message.isRead ? 'text-primary' : ''}`}>
                          {message.name}
                        </h3>
                        <span className="text-sm text-base-content/50">
                          {message.email}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 line-clamp-2 mb-2">
                        {message.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-base-content/50">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <motion.button
                        className="btn btn-ghost btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(message._id, !message.isRead);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {message.isRead ? 'Mark Unread' : 'Mark Read'}
                      </motion.button>
                      <motion.button
                        className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(message._id);
                        }}
                        disabled={deletingMessageId === message._id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {deletingMessageId === message._id ? (
                          <div className="loading loading-spinner loading-xs"></div>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <motion.button
            className="btn btn-sm btn-outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(currentPage - 1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <span className="text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>

          <motion.button
            className="btn btn-sm btn-outline"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div className="modal modal-open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-box max-w-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Message Details</h3>
                  <div className="flex items-center gap-4 text-sm text-base-content/70">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedMessage.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedMessage.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedMessage.createdAt)}
                    </div>
                  </div>
                </div>
                <motion.button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setSelectedMessage(null)}
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  ✕
                </motion.button>
              </div>

              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="modal-action">
                <motion.button
                  className="btn btn-error btn-outline"
                  onClick={() => deleteMessage(selectedMessage._id)}
                  disabled={deletingMessageId === selectedMessage._id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {deletingMessageId === selectedMessage._id ? (
                    <>
                      <div className="loading loading-spinner loading-xs"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete Message
                    </>
                  )}
                </motion.button>
                    <motion.button
                    className="btn btn-outline"
                    onClick={() => {
                      if (!selectedMessage) return;
                      markAsRead(selectedMessage._id, !selectedMessage.isRead);
                      setSelectedMessage(prev =>
                        prev ? { ...prev, isRead: !prev.isRead } : prev
                      );
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Mark as {selectedMessage.isRead ? 'Unread' : 'Read'}
                  </motion.button>
                  <motion.button
                    className="btn btn-primary"
                    onClick={() => setSelectedMessage(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  export default MessageList;
  