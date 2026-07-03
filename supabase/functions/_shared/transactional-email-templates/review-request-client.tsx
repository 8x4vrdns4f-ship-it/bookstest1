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
  reviewUrl?: string
}

const ReviewRequestClientEmail = ({
  businessName = 'the business',
  clientName,
  service = 'your appointment',
  date = '',
  reviewUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>How was your experience with {businessName}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>How did it go?</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} we hope you enjoyed your {service} with <strong>{businessName}</strong> on {date}.
        </Text>
        <Text style={text}>
          We would love to hear about your experience. It only takes a few seconds.
        </Text>
        {reviewUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={reviewUrl} style={btn}>Leave a review</Button>
          </Section>
        )}
        <Text style={text}>
          Your feedback helps us improve and lets others know what to expect.
        </Text>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewRequestClientEmail,
  subject: (d: Record<string, any>) =>
    `How was your experience with ${d?.businessName ?? 'us'}?`,
  displayName: 'Review request — client',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    service: 'Haircut',
    date: '15 Jun 2026',
    reviewUrl: 'https://booksuite.online/review/abc123',
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
