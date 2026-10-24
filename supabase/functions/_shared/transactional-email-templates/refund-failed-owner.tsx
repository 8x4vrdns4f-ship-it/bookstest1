/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  when?: string
  amount?: string
  error?: string
}

const RefundFailedOwnerEmail = ({ clientName = 'a client', service = 'a booking', when = '', amount = '', error }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Refund failed for {clientName} — action needed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Refund failed</Heading>
        <Text style={text}>
          The refund for <strong>{clientName}</strong>, {when} didn't go through. Please refund manually or press
          "Retry refund" on the booking in your BookSuite dashboard.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Service:</strong> {service}</Text>
          <Text style={detail}><strong>When:</strong> {when}</Text>
          {amount && <Text style={detail}><strong>Amount:</strong> {amount}</Text>}
          {error && <Text style={detail}><strong>Reason:</strong> {error}</Text>}
        </Section>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RefundFailedOwnerEmail,
  subject: (d: Record<string, any>) => `Refund failed for ${d?.clientName ?? 'a client'}, ${d?.when ?? ''} — please refund manually or retry`,
  displayName: 'Refund failed (owner)',
  previewData: { clientName: 'Jane', service: 'Haircut', when: '15 Jun 2026 14:30', amount: '£25.00', error: 'Insufficient balance' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#B91C1C', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
