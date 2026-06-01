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
  reason?: string
}

const BookingDeclinedEmail = ({
  businessName = 'the business', clientName, service = 'your booking',
  date = '', time = '', reason = 'No reason was provided.',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update on your booking with {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Booking declined</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} unfortunately{' '}
          <strong>{businessName}</strong> wasn't able to accept your booking.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
        </Section>
        <Heading as="h2" style={h2}>Reason</Heading>
        <Text style={reasonBox}>{reason}</Text>
        <Text style={text}>You're welcome to try another time that works for you.</Text>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingDeclinedEmail,
  subject: (d: Record<string, any>) =>
    `Update on your booking with ${d?.businessName ?? 'us'}`,
  displayName: 'Booking declined',
  previewData: {
    businessName: 'Sample Salon', clientName: 'Jane', service: 'Haircut',
    date: '15 Jun 2026', time: '14:30',
    reason: 'Fully booked at that time — please try another slot.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0F172A', margin: '20px 0 8px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '12px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const reasonBox = {
  fontSize: '14px', color: '#0F172A', backgroundColor: '#FEF2F2',
  borderLeft: '4px solid #EF4444', padding: '12px 14px', borderRadius: '6px',
  margin: '0 0 16px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
