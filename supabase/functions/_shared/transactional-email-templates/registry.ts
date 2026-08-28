/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as bookingConfirmed } from './booking-confirmed.tsx'
import { template as bookingDeclined } from './booking-declined.tsx'
import { template as bookingRequestExpired } from './booking-request-expired.tsx'
import { template as bookingFollowup } from './booking-followup.tsx'
import { template as bookingPaidOwner } from './booking-paid-owner.tsx'
import { template as bookingRefunded } from './booking-refunded.tsx'
import { template as bookingCancelledClient } from './booking-cancelled-client.tsx'
import { template as joinRequestApproved } from './join-request-approved.tsx'
import { template as joinRequestDeclined } from './join-request-declined.tsx'
import { template as joinRequestReceivedOwner } from './join-request-received-owner.tsx'
import { template as subscriptionCanceled } from './subscription-canceled.tsx'
import { template as subscriptionActivated } from './subscription-activated.tsx'
import { template as employeeInvited } from './employee-invited.tsx'
import { template as welcome } from './welcome.tsx'
import { template as bookingRequestExpiredOwner } from './booking-request-expired-owner.tsx'
import { template as bookingRequestReminderOwner } from './booking-request-reminder-owner.tsx'
import { template as bookingReminderClient } from './booking-reminder-client.tsx'
import { template as reviewRequestClient } from './review-request-client.tsx'
import { template as waitlistAdded } from './waitlist-added.tsx'
import { template as waitlistSlotOpen } from './waitlist-slot-open.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as contactReceivedOwner } from './contact-received-owner.tsx'
import { template as platformAlert } from './platform-alert.tsx'
import { template as platformDailySummary } from './platform-daily-summary.tsx'
import { template as rebookingReminder } from './rebooking-reminder.tsx'
import { template as campaignEmail } from './campaign-email.tsx'



export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmed': bookingConfirmed,
  'booking-declined': bookingDeclined,
  'booking-request-expired': bookingRequestExpired,
  'booking-followup': bookingFollowup,
  'booking-paid-owner': bookingPaidOwner,
  'booking-refunded': bookingRefunded,
  'booking-cancelled-client': bookingCancelledClient,
  'join-request-approved': joinRequestApproved,
  'join-request-declined': joinRequestDeclined,
  'join-request-received-owner': joinRequestReceivedOwner,
  'subscription-canceled': subscriptionCanceled,
  'subscription-activated': subscriptionActivated,
  'employee-invited': employeeInvited,
  'welcome': welcome,
  'booking-request-expired-owner': bookingRequestExpiredOwner,
  'booking-request-reminder-owner': bookingRequestReminderOwner,
  'booking-reminder-client': bookingReminderClient,
  'review-request-client': reviewRequestClient,
  'waitlist-added': waitlistAdded,
  'waitlist-slot-open': waitlistSlotOpen,
  'contact-confirmation': contactConfirmation,
  'contact-received-owner': contactReceivedOwner,
  'platform-alert': platformAlert,
  'platform-daily-summary': platformDailySummary,
  'rebooking-reminder': rebookingReminder,
  'campaign-email': campaignEmail,
}

