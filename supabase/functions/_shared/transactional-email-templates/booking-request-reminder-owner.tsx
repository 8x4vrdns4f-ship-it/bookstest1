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
  deposit?: string
  dashboardUrl?: string
}

const BookingRequestReminderOwnerEmail = ({
  businessName = 'your business', clientName = 'A customer', service = 'a service',
  date = '', time = '', deposit = '', dashboardUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You have a pending booking request at {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pending booking request</Heading>
        <Text style={text}>
          You have a booking request at <strong>{businessName}</strong> that hasn't been answered yet. It will expire soon if you don't accept or decline it.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Client:</strong> {clientName}</Text>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
          {deposit && <Text style={detail}><strong>Deposit:</strong> {deposit}</Text>}
        </Section>
        {dashboardUrl && (
          <Section style={{ margin: '16px 0' }}>
            <Button href={dashboardUrl} style={cta}>
              Review request
            </Button>
          </Section>
        )}
        <Text style={text}>
          Accepting will charge the deposit and confirm the booking. Declining leaves the customer's card untouched.
        </Text>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingRequestReminderOwnerEmail,
  subject: (d: Record<string, any>) =>
    `You have a pending booking request at ${d?.businessName ?? 'your business'}`,
  displayName: 'Booking request reminder — owner',
  previewData: {
    businessName: 'Sample Salon', clientName: 'Jane', service: 'Haircut',
    date: '15 Jun 2026', time: '14:30', deposit: '£10.00',
    dashboardUrl: 'https://booksuite.online/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '12px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const cta = {
  backgroundColor: '#60A5FA',
  color: '#0F172A',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
