/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  reviewUrl?: string
}

const BookingFollowupEmail = ({
  businessName = 'the business', clientName, reviewUrl = '#',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for visiting {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thanks for visiting!</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} thanks for choosing{' '}
          <strong>{businessName}</strong>. We hope you had a great experience.
        </Text>
        <Text style={text}>
          If you have a minute, we'd really appreciate a quick review — it
          helps a lot.
        </Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={reviewUrl} style={btn}>Leave a review</Button>
        </Section>
        <Text style={footer}>See you again soon — {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingFollowupEmail,
  subject: (d: Record<string, any>) => `How was your visit to ${d?.businessName ?? 'us'}?`,
  displayName: 'Booking follow-up',
  previewData: {
    businessName: 'Sample Salon', clientName: 'Jane',
    reviewUrl: 'https://g.page/r/sample/review',
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
