/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  clientName?: string
  service?: string
  date?: string
  time?: string
  late?: boolean
  moneyNote?: string
}

const BookingCancelledOwnerEmail = ({ clientName = 'A client', service = 'a booking', date = '', time = '', late, moneyNote }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{clientName} cancelled — the slot is free again</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{late ? 'Late cancellation' : 'Booking cancelled'}</Heading>
        <Text style={text}>
          <strong>{clientName}</strong> cancelled their booking. The slot is free again and anyone on your waitlist for that day has been told.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>Date:</strong> {date}</Text>
          <Text style={detail}><strong>Time:</strong> {time}</Text>
          {moneyNote && <Text style={detail}><strong>Payment:</strong> {moneyNote}</Text>}
        </Section>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingCancelledOwnerEmail,
  subject: (d: Record<string, any>) => `${d?.late ? 'Late cancellation' : 'Cancellation'}: ${d?.clientName ?? 'a client'}, ${d?.date ?? ''} ${d?.time ?? ''}`.trim(),
  displayName: 'Client cancelled (owner)',
  previewData: { clientName: 'Jane', service: 'Haircut', date: '15 Jun 2026', time: '14:30', late: true, moneyNote: 'You keep the £5.00 deposit; £20.00 was refunded.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
