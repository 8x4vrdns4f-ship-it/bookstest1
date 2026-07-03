/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  date?: string
  time?: string
  confirmationCode?: string
  checkInUrl?: string
  depositAmount?: string
  manageUrl?: string
}

const BookingConfirmedEmail = ({
  businessName = 'the business',
  clientName,
  service = 'your booking',
  date = '',
  time = '',
  confirmationCode = '',
  checkInUrl = '',
  depositAmount,
  manageUrl = '',
}: Props) => {
  const qrSrc = checkInUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(checkInUrl)}`
    : ''
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your booking with {businessName} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking confirmed ✓</Heading>
          <Text style={text}>
            {clientName ? `Hi ${clientName},` : 'Hi,'} your booking with{' '}
            <strong>{businessName}</strong> has been accepted.
          </Text>
          <Section style={card}>
            <Text style={detail}><strong>Service:</strong> {service}</Text>
            <Text style={detail}><strong>Date:</strong> {date}</Text>
            <Text style={detail}><strong>Time:</strong> {time}</Text>
            {depositAmount && (
              <Text style={detail}><strong>Deposit:</strong> {depositAmount}</Text>
            )}
          </Section>
          <Heading as="h2" style={h2}>Check-in code</Heading>
          <Text style={text}>
            Show this QR at the venue, or give the 6-character code to reception.
          </Text>
          {qrSrc && (
            <Section style={qrWrap}>
              <Img src={qrSrc} width="200" height="200" alt="Check-in QR code" />
            </Section>
          )}
          <Text style={codeBox}>{confirmationCode}</Text>
          {checkInUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={checkInUrl} style={btn}>Self check-in</Button>
            </Section>
          )}
          {manageUrl && (
            <Section style={{ textAlign: 'center', margin: '16px 0' }}>
              <Button href={manageUrl} style={btnSecondary}>Manage your booking</Button>
            </Section>
          )}
          <Text style={footer}>See you soon — {businessName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingConfirmedEmail,
  subject: (d: Record<string, any>) =>
    `Your booking with ${d?.businessName ?? 'us'} is confirmed`,
  displayName: 'Booking confirmed',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    service: 'Haircut',
    date: '15 Jun 2026',
    time: '14:30',
    confirmationCode: 'X7K2P9',
    checkInUrl: 'https://booksuite.online/kiosk/BS-ABCDEF?code=X7K2P9',
    depositAmount: '£10.00',
    manageUrl: 'https://booksuite.online/booking/manage/abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0F172A', margin: '24px 0 8px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const qrWrap = { textAlign: 'center' as const, margin: '12px 0' }
const codeBox = {
  fontFamily: 'monospace', fontSize: '28px', letterSpacing: '6px',
  textAlign: 'center' as const, padding: '14px', backgroundColor: '#0F172A',
  color: '#ffffff', borderRadius: '8px', margin: '8px 0 16px',
}
const btn = {
  backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
}
const btnSecondary = {
  backgroundColor: '#F1F5F9', color: '#0F172A', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
  border: '1px solid #CBD5E1',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
