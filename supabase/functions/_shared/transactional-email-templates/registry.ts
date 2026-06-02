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
import { template as bookingFollowup } from './booking-followup.tsx'
import { template as bookingPaidOwner } from './booking-paid-owner.tsx'
import { template as bookingRefunded } from './booking-refunded.tsx'
import { template as joinRequestApproved } from './join-request-approved.tsx'
import { template as joinRequestDeclined } from './join-request-declined.tsx'
import { template as subscriptionCanceled } from './subscription-canceled.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmed': bookingConfirmed,
  'booking-declined': bookingDeclined,
  'booking-followup': bookingFollowup,
  'booking-paid-owner': bookingPaidOwner,
  'booking-refunded': bookingRefunded,
  'join-request-approved': joinRequestApproved,
  'join-request-declined': joinRequestDeclined,
  'subscription-canceled': subscriptionCanceled,
}
