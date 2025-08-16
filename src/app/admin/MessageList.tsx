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

      // Update the message in the local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead } : msg
      ));

      // Update selected message if it's the same one
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead });
      }

      // Update unread count
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

      // Remove the message from local state
      const deletedMessage = messages.find(msg => msg._id === messageId);
      setMessages(messages.filter(msg => msg._id !== messageId));
      
      // Update pagination counts
      setPagination(prev => ({
        ...prev,
        totalMessages: prev.totalMessages - 1,
      }));

      // Update unread count if the deleted message was unread
      if (deletedMessage && !deletedMessage.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Close modal if the deleted message is currently selected
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }

      toast.success('Message deleted successfully');
      
      // Refresh the list if the current page becomes empty
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
    // Mark as read when opened
    if (!message.isRead) {
      await markAsRead(message._id, true);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-base-content/70">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All messages are read'}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('all')}
          >
            All ({pagination.totalMessages})
          </button>
          <button
            className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`btn btn-sm ${filter === 'read' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('read')}
          >
            Read ({pagination.totalMessages - unreadCount})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages..."
            className="input input-bordered input-sm pl-10 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                className={`p-4 hover:bg-base-300 cursor-pointer transition-colors ${
                  !message.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
                onClick={() => openMessageModal(message)}
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
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(message._id, !message.isRead);
                      }}
                    >
                      {message.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message._id);
                      }}
                      disabled={deletingMessageId === message._id}
                    >
                      {deletingMessageId === message._id ? (
                        <div className="loading loading-spinner loading-xs"></div>
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            className="btn btn-sm btn-outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            className="btn btn-sm btn-outline"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
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
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setSelectedMessage(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            
            <div className="modal-action">
              <button
                className="btn btn-error btn-outline"
                onClick={() => deleteMessage(selectedMessage._id)}
                disabled={deletingMessageId === selectedMessage._id}
              >
                {deletingMessageId === selectedMessage._id ? (
                  <>
                    <div className="loading loading-spinner loading-xs"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Message
                  </>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => markAsRead(selectedMessage._id, !selectedMessage.isRead)}
              >
                Mark as {selectedMessage.isRead ? 'Unread' : 'Read'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setSelectedMessage(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
