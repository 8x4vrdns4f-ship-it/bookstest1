/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  date?: string
  time?: string
  address?: string
  manageUrl?: string
}

const BookingReminderClientEmail = ({
  businessName = 'the business',
  clientName,
  service = 'your appointment',
  date = '',
  time = '',
  address = '',
  manageUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reminder: {service} with {businessName} tomorrow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Upcoming appointment</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} this is a friendly reminder about your appointment tomorrow.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Business:</strong> {businessName}</Text>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
          {address && <Text style={detail}><strong>Location:</strong> {address}</Text>}
        </Section>
        {manageUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={manageUrl} style={btn}>Manage your booking</Button>
          </Section>
        )}
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingReminderClientEmail,
  subject: (d: Record<string, any>) =>
    `Reminder: Your appointment with ${d?.businessName ?? 'us'} is tomorrow`,
  displayName: 'Booking reminder — client',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    service: 'Haircut',
    date: '15 Jun 2026',
    time: '14:30',
    address: '123 High Street, London',
    manageUrl: 'https://booksuite.online/booking/manage/abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '12px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const btn = {
  backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
