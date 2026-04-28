// Shared notification category constants used by NotificationScreen and NotificationDetailScreen

export const CATEGORY_LABELS = {
  SESSION_REMINDER:  'Reminders',
  SESSION_MISSED:    'Reminders',
  ENROLMENT_RECEIPT: 'Updates',
  ENROLMENT_RENEWAL: 'Updates',
  REGISTRATION:      'Updates',
  BIRTHDAY:          'Special',
  STUDENT_WELCOME:   'Special',
  GENERAL:           'Announcements',
};

export const CATEGORY_COLORS = {
  Reminders:     '#10b981', // green
  Updates:       '#f59e0b', // amber
  Announcements: '#6366f1', // indigo
  Special:       '#ec4899', // pink
};

// Reverse map: display label → raw category values (for client-side filtering)
export const CATEGORY_RAW_MAP = {
  Reminders:     ['SESSION_REMINDER', 'SESSION_MISSED'],
  Updates:       ['ENROLMENT_RECEIPT', 'ENROLMENT_RENEWAL', 'REGISTRATION'],
  Announcements: ['GENERAL'],
  Special:       ['BIRTHDAY', 'STUDENT_WELCOME'],
};

export const FILTER_TABS = ['All', 'Unread'];
