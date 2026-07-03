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
}

const BookingRequestExpiredEmail = ({
  businessName = 'the business', clientName, service = 'your booking',
  date = '', time = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking request with {businessName} expired</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Booking request expired</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} your booking request with{' '}
          <strong>{businessName}</strong> wasn't confirmed within 48 hours, so it has been cancelled automatically.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
        </Section>
        <Text style={text}>
          <strong>No charge was made</strong> to your card. You're welcome to request another time whenever you're ready.
        </Text>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingRequestExpiredEmail,
  subject: (d: Record<string, any>) =>
    `Your booking request with ${d?.businessName ?? 'us'} expired`,
  displayName: 'Booking request expired',
  previewData: {
    businessName: 'Sample Salon', clientName: 'Jane', service: 'Haircut',
    date: '15 Jun 2026', time: '14:30',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '12px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
