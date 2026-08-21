/**
 * Application constants
 */

const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

const ACCOUNT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled'
};

const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const RESOURCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const RESOURCE_CATEGORIES = {
  COURSE_MATERIAL: 'course_material',
  ASSIGNMENT: 'assignment',
  PAST_EXAM: 'past_exam'
};

const RESOURCE_CATEGORY_LABELS = {
  course_material: 'Course Material',
  assignment: 'Assignment',
  past_exam: 'Past Exam'
};

const REPORT_REASONS = {
  SPAM: 'spam',
  COPYRIGHT: 'copyright',
  DUPLICATE: 'duplicate',
  LOW_QUALITY: 'low_quality',
  WRONG_DEPARTMENT: 'wrong_department',
  OTHER: 'other'
};

const REPORT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

const NOTIFICATION_TYPES = {
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  RESOURCE_APPROVED: 'resource_approved',
  RESOURCE_REJECTED: 'resource_rejected',
  REPORT_RESOLVED: 'report_resolved',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  NEW_RESOURCE: 'new_resource',
  SYSTEM: 'system'
};

const VERIFICATION_ACTIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  REACTIVATED: 'reactivated'
};

const STUDENT_ID_REGEX = /^WOUR\/(\d{4})\/(1[6-9])$/;

const ITEMS_PER_PAGE = 20;
const MAX_PAGE_SIZE = 100;

module.exports = {
  USER_ROLES,
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
  RESOURCE_STATUS,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_LABELS,
  REPORT_REASONS,
  REPORT_STATUS,
  NOTIFICATION_TYPES,
  VERIFICATION_ACTIONS,
  STUDENT_ID_REGEX,
  ITEMS_PER_PAGE,
  MAX_PAGE_SIZE
};

