/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  lastService?: string
  lastDate?: string
  bookingUrl?: string
}

const RebookingReminderEmail = ({
  businessName = 'the business',
  clientName,
  lastService = 'your last visit',
  lastDate = '',
  bookingUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{businessName} would love to see you again</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>We miss you!</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} it's been a little while since {lastService} with <strong>{businessName}</strong>
          {lastDate ? ` on ${lastDate}` : ''}, and we'd love to welcome you back.
        </Text>
        <Text style={text}>
          Booking again takes less than a minute — pick a time that suits you and we'll take care of the rest.
        </Text>
        {bookingUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={bookingUrl} style={btn}>Book your next visit</Button>
          </Section>
        )}
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RebookingReminderEmail,
  subject: (d: Record<string, any>) =>
    `${d?.businessName ?? 'We'} would love to see you again`,
  displayName: 'Rebooking reminder — client',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    lastService: 'Haircut',
    lastDate: '15 Jun 2026',
    bookingUrl: 'https://booksuite.online/book/example',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const btn = {
  backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
