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
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'email', 'sms', 'push'

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

  // Open detail screen — marks as read handled inside detail screen
  const handleOpenMessage = (item) => {
    navigation.navigate('NotificationDetail', { message: item });

    // Optimistically update local state so list shows as read immediately
    if (!item.read) {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === item._id ? { ...msg, read: true } : msg))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      onPress={() => handleOpenMessage(item)}
      activeOpacity={0.7}
    >
      <View style={styles.messageContent}>
        <Text style={styles.messageTitle} numberOfLines={1}>
          {item.title || item.subject}
        </Text>
        <Text style={styles.messageBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.messageTime}>{formatDate(item.createdAt)}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {['all', 'unread'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.filterTab, filter === tab && styles.filterTabActive]}
          onPress={() => setFilter(tab)}
        >
          <Text
            style={[
              styles.filterText,
              filter === tab && styles.filterTextActive,
            ]}
          >
            {tab === 'unread' && unreadCount > 0
              ? `Unread (${unreadCount})`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
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
  unreadDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
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
