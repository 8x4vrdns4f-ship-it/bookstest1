/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  eventTitle?: string
  eventSummary?: string
  businessName?: string
  rows?: Array<{ label: string; value: string }>
  occurredAt?: string
}

const PlatformAlertEmail = ({
  eventTitle = 'Platform event',
  eventSummary = '',
  businessName = '',
  rows = [],
  occurredAt = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{eventTitle}{businessName ? ` — ${businessName}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>BookSuite platform alert</Text>
        <Heading style={h1}>{eventTitle}</Heading>
        {eventSummary ? <Text style={text}>{eventSummary}</Text> : null}
        <Section style={card}>
          {businessName ? (
            <Text style={detail}><strong>Business:</strong> {businessName}</Text>
          ) : null}
          {(rows || []).map((r, i) => (
            <Text key={i} style={detail}><strong>{r.label}:</strong> {r.value}</Text>
          ))}
          {occurredAt ? <Text style={detail}><strong>When:</strong> {occurredAt}</Text> : null}
        </Section>
        <Text style={footer}>Sent automatically by BookSuite.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlatformAlertEmail,
  subject: (d: Record<string, any>) =>
    `[BookSuite] ${d?.eventTitle ?? 'Platform event'}${d?.businessName ? ` — ${d.businessName}` : ''}`,
  displayName: 'Platform — instant alert (admin)',
  previewData: {
    eventTitle: 'Booking payment taken',
    eventSummary: 'A booking deposit was captured.',
    businessName: 'Sharp Cuts Barbers',
    rows: [
      { label: 'Client', value: 'Jane Doe' },
      { label: 'Service', value: 'Skin fade' },
      { label: 'Amount charged', value: 'GBP 15.00' },
      { label: 'Platform fee', value: 'GBP 1.50' },
    ],
    occurredAt: '5 Aug 2026, 19:04',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const kicker = { fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#3B82F6', fontWeight: 'bold', margin: '0 0 8px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
