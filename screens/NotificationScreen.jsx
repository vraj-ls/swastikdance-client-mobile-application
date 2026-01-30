import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  Check,
  X,
  Inbox as InboxIcon,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

export default function NotificationScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'email', 'sms'

  // Fetch inbox messages
  const fetchInbox = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        let filterParams = {};
        if (filter === 'unread') {
          filterParams.read = false;
        } else if (filter === 'email') {
          filterParams.type = 'EMAIL';
        } else if (filter === 'sms') {
          filterParams.type = 'SMS';
        } else if (filter === 'push') {
          filterParams.type = 'PUSH';
        }

        const data = await authService.getInbox(
          filterParams.type,
          filterParams.read
        );

        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);

        // Update badge count
        await notificationService.setBadgeCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching inbox:', error);
        Alert.alert('Error', 'Failed to load messages');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  // Initial load
  useEffect(() => {
    // Clear badge when viewing notifications
    notificationService.clearBadge();
    fetchInbox();
  }, [fetchInbox]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInbox(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchInbox]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchInbox(false);
  };

  // Mark as read
  const handleMarkAsRead = async (id) => {
    try {
      await authService.markMessageAsRead(id);

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === id ? { ...msg, read: true } : msg
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  // Mark as unread
  const handleMarkAsUnread = async (id) => {
    try {
      await authService.markMessageAsUnread(id);

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === id ? { ...msg, read: false } : msg
        )
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as unread');
    }
  };

  // Delete message
  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteMessage(id);

              // Remove from local state
              setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg._id !== id)
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await authService.markAllMessagesAsRead();

      // Update all messages to read
      setMessages((prevMessages) =>
        prevMessages.map((msg) => ({ ...msg, read: true }))
      );
      setUnreadCount(0);

      Alert.alert('Success', 'All messages marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  // Get icon based on message type
  const getIcon = (type) => {
    const iconProps = { color: colors.white, size: 20 };
    switch (type) {
      case 'EMAIL':
        return <Mail {...iconProps} />;
      case 'SMS':
        return <MessageSquare {...iconProps} />;
      case 'PUSH':
      case 'NOTIFICATION':
        return <Bell {...iconProps} />;
      default:
        return <InboxIcon {...iconProps} />;
    }
  };

  const getIconStyle = (type) => {
    switch (type) {
      case 'EMAIL':
        return styles.iconEmail;
      case 'SMS':
        return styles.iconSMS;
      case 'PUSH':
      case 'NOTIFICATION':
        return styles.iconPush;
      default:
        return styles.iconGeneral;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Render message item
  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.messageCard, !item.read && styles.unreadCard]}
      onPress={() => !item.read && handleMarkAsRead(item._id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, getIconStyle(item.type)]}>
        {getIcon(item.type)}
      </View>

      <View style={styles.messageContent}>
        <Text style={styles.messageTitle} numberOfLines={1}>
          {item.title || item.subject}
        </Text>
        <Text style={styles.messageBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.messageTime}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.actionButtons}>
        {!item.read ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMarkAsRead(item._id);
            }}
          >
            <Check color={colors.success} size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMarkAsUnread(item._id);
            }}
          >
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item._id);
          }}
        >
          <Trash2 color={colors.error} size={18} />
        </TouchableOpacity>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        onPress={() => setFilter('all')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'all' && styles.filterTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterTab,
          filter === 'unread' && styles.filterTabActive,
        ]}
        onPress={() => setFilter('unread')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'unread' && styles.filterTextActive,
          ]}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterTab,
          filter === 'email' && styles.filterTabActive,
        ]}
        onPress={() => setFilter('email')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'email' && styles.filterTextActive,
          ]}
        >
          Email
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'sms' && styles.filterTabActive]}
        onPress={() => setFilter('sms')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'sms' && styles.filterTextActive,
          ]}
        >
          SMS
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell color={colors.textTertiary} size={64} />
      <Text style={styles.emptyTitle}>No Messages</Text>
      <Text style={styles.emptyText}>
        {filter === 'unread'
          ? "You're all caught up!"
          : "You don't have any messages yet"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterTabs()}

      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
          messages.length === 0 && styles.listContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterTab: {
    paddingHorizontal: spacing.md - spacing.xs,
    paddingVertical: spacing.sm - spacing.xs,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: colors.secondary,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  markAllButton: {
    backgroundColor: colors.white,
    padding: spacing.md - spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  markAllText: {
    fontSize: typography.sizes.sm,
    color: colors.secondary,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  listContainerEmpty: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  unreadCard: {
    borderColor: colors.secondary,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md - spacing.xs,
  },
  iconEmail: {
    backgroundColor: colors.secondary,
  },
  iconSMS: {
    backgroundColor: colors.info,
  },
  iconPush: {
    backgroundColor: '#8b5cf6',
  },
  iconGeneral: {
    backgroundColor: colors.textSecondary,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  messageBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm - spacing.xs,
  },
  messageTime: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
