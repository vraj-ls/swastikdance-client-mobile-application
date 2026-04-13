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

// Category labels for notification content type
const CATEGORY_LABELS = {
  SESSION_REMINDER: 'Reminders',
  SESSION_MISSED: 'Reminders',
  ENROLMENT_RECEIPT: 'Updates',
  ENROLMENT_RENEWAL: 'Updates',
  BIRTHDAY: 'Special',
  STUDENT_WELCOME: 'Special',
  GENERAL: 'Announcements',
  REGISTRATION: 'Updates',
};

const CATEGORY_COLORS = {
  Reminders: '#10b981',    // Green
  Updates: '#f59e0b',      // Amber
  Announcements: '#6366f1', // Indigo
  Special: '#ec4899',      // Pink
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
 * Strips HTML tags and converts HTML entities to readable text.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
    .replace(/<\/p>/gi, '\n\n')     // Convert </p> to double newlines
    .replace(/<[^>]+>/g, '')         // Strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')         // Replace &nbsp; with space
    .replace(/&amp;/g, '&')          // Replace &amp; with &
    .replace(/&lt;/g, '<')          // Replace &lt; with <
    .replace(/&gt;/g, '>')          // Replace &gt; with >
    .replace(/&quot;/g, '"')        // Replace &quot; with "
    .replace(/&#39;/g, "'")         // Replace &#39; with '
    .trim();
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

  // Get category from detail (notification content type) or fall back to type (channel)
  const categoryLabel = detail.category ? (CATEGORY_LABELS[detail.category] ?? detail.category) : null;
  const channelLabel = TYPE_LABELS[detail.type] ?? detail.type;
  const badgeColor = categoryLabel ? (CATEGORY_COLORS[categoryLabel] ?? colors.primary) : (TYPE_COLORS[detail.type] ?? colors.primary);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Category badge */}
      {categoryLabel && (
        <View style={[styles.categoryBadge, { backgroundColor: badgeColor + '1A' }]}>
          <Text style={[styles.categoryBadgeText, { color: badgeColor }]}>
            {categoryLabel}
          </Text>
        </View>
      )}

      {/* Channel badge */}
      <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[detail.type] ?? colors.textSecondary) + '1A' }]}>
        {getIcon(detail.type, TYPE_COLORS[detail.type] ?? colors.textSecondary)}
        <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[detail.type] ?? colors.textSecondary }]}>
          {channelLabel}
        </Text>
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
