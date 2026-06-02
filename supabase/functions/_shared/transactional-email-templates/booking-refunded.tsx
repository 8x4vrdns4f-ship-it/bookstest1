/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  date?: string
  time?: string
  refundAmount?: string
}

const BookingRefundedEmail = ({
  businessName = 'the business',
  clientName,
  service = 'your booking',
  date = '',
  time = '',
  refundAmount,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your deposit has been refunded</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Refund processed</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} your deposit for the booking with{' '}
          <strong>{businessName}</strong> has been refunded.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          {date && <Text style={detail}><strong>Date:</strong> {date}</Text>}
          {time && <Text style={detail}><strong>Time:</strong> {time}</Text>}
          {refundAmount && (
            <Text style={detail}><strong>Refunded:</strong> {refundAmount}</Text>
          )}
        </Section>
        <Text style={text}>
          The funds should appear on your original payment method within 5–10 business days,
          depending on your bank.
        </Text>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingRefundedEmail,
  subject: (d: Record<string, any>) =>
    `Your deposit with ${d?.businessName ?? 'us'} has been refunded`,
  displayName: 'Booking refunded',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    service: 'Haircut',
    date: '15 Jun 2026',
    time: '14:30',
    refundAmount: '£10.00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
