/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  date?: string
  bookingUrl?: string
}

const WaitlistSlotOpenEmail = ({ businessName = 'the business', clientName, service, date = '', bookingUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A slot just opened at {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>A slot just opened!</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} good news — a slot has opened up at <strong>{businessName}</strong> on your preferred date.
        </Text>
        <Section style={card}>
          {service && <Text style={detail}><strong>Service:</strong> {service}</Text>}
          <Text style={detail}><strong>Date:</strong> {date}</Text>
        </Section>
        <Text style={text}>Slots go fast — book now to secure it.</Text>
        {bookingUrl && (
          <Section style={{ textAlign: 'center', margin: '20px 0' }}>
            <Button href={bookingUrl} style={button}>Book now</Button>
          </Section>
        )}
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistSlotOpenEmail,
  subject: (d: Record<string, any>) => `A slot just opened at ${d?.businessName ?? 'us'}`,
  displayName: 'Waitlist — slot open',
  previewData: { businessName: 'Sample Salon', clientName: 'Jane', service: 'Haircut', date: '15 Jun 2026', bookingUrl: 'https://booksuite.online' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const button = { backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
