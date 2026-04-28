import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Mail, MessageSquare, Bell, Inbox as InboxIcon } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../constants/notifications';
import { stripHtml } from '../utils/formatters';
import authService from '../services/authService';

const TYPE_LABELS = {
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push Notification',
  NOTIFICATION: 'Notification',
};

const TYPE_COLORS = {
  EMAIL: colors.primary,
  SMS: colors.info,
  PUSH: '#8b5cf6',
  NOTIFICATION: '#8b5cf6',
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function getIcon(type, color) {
  const props = { color, size: 22 };
  switch (type) {
    case 'EMAIL':        return <Mail {...props} />;
    case 'SMS':          return <MessageSquare {...props} />;
    case 'PUSH':
    case 'NOTIFICATION': return <Bell {...props} />;
    default:             return <InboxIcon {...props} />;
  }
}

function formatFullDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders body text with any URLs highlighted as tappable orange links.
 */
function BodyWithLinks({ text }) {
  if (!text) return null;

  // Strip HTML tags first
  const cleanText = stripHtml(text);
  const parts = cleanText.split(URL_REGEX);

  return (
    <Text style={styles.body}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // reset lastIndex after test()
          URL_REGEX.lastIndex = 0;
          return (
            <Text
              key={i}
              style={styles.link}
              onPress={() => Linking.openURL(part)}
            >
              {part}
            </Text>
          );
        }
        URL_REGEX.lastIndex = 0;
        return part;
      })}
    </Text>
  );
}

export default function NotificationDetailScreen({ route }) {
  const { message } = route.params;
  const [detail, setDetail] = useState(message);

  useEffect(() => {
    if (message && !message.read) {
      markRead();
    }
  }, []);

  const markRead = async () => {
    try {
      await authService.markMessageAsRead(message._id);
      setDetail((prev) => ({ ...prev, read: true }));
    } catch (error) {
      console.warn('Could not mark message as read:', error);
    }
  };

  if (!detail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Get category from detail (notification content type), fall back to "General"
  const categoryLabel = detail.category ? (CATEGORY_LABELS[detail.category] ?? detail.category) : 'General';
  const channelLabel = TYPE_LABELS[detail.type] ?? detail.type;
  const categoryColor = CATEGORY_COLORS[categoryLabel] ?? CATEGORY_COLORS['Announcements'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Badges row — channel + category side by side */}
      <View style={styles.badgesRow}>
        <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[detail.type] ?? colors.textSecondary) + '1A' }]}>
          {getIcon(detail.type, TYPE_COLORS[detail.type] ?? colors.textSecondary)}
          <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[detail.type] ?? colors.textSecondary }]}>
            {channelLabel}
          </Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '1A' }]}>
          <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
            {categoryLabel}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{detail.title || detail.subject}</Text>

      {/* Date */}
      <Text style={styles.date}>{formatFullDate(detail.createdAt)}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body — URLs rendered as tappable links */}
      <BodyWithLinks text={detail.body} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
    gap: spacing.sm,
  },
  typeBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
  },
  categoryBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: typography.weights.medium,
  },
});
