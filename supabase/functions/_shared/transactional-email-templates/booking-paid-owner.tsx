/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  clientEmail?: string
  service?: string
  date?: string
  time?: string
  confirmationCode?: string
  depositAmount?: string
}

const BookingPaidOwnerEmail = ({
  businessName = 'your business',
  clientName = 'A customer',
  clientEmail = '',
  service = 'a service',
  date = '',
  time = '',
  confirmationCode = '',
  depositAmount,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New paid booking from {clientName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New paid booking 💰</Heading>
        <Text style={text}>
          You have a new booking at <strong>{businessName}</strong> — the deposit has been paid.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Client:</strong> {clientName}</Text>
          {clientEmail && <Text style={detail}><strong>Email:</strong> {clientEmail}</Text>}
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
          {depositAmount && (
            <Text style={detail}><strong>Deposit paid:</strong> {depositAmount}</Text>
          )}
          {confirmationCode && (
            <Text style={detail}><strong>Confirmation code:</strong> {confirmationCode}</Text>
          )}
        </Section>
        <Text style={text}>Open your BookSuite dashboard to view or manage this booking.</Text>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingPaidOwnerEmail,
  subject: (d: Record<string, any>) =>
    `New paid booking: ${d?.clientName ?? 'customer'} — ${d?.service ?? ''}`.trim(),
  displayName: 'New paid booking (owner)',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    service: 'Haircut',
    date: '15 Jun 2026',
    time: '14:30',
    confirmationCode: 'X7K2P9',
    depositAmount: '£10.00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
