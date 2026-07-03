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
}
