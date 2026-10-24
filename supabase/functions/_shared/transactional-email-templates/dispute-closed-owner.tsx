/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  clientName?: string
  service?: string
  when?: string
  amount?: string
  outcome?: 'won' | 'lost' | 'closed'
}

const line = (o?: string, amount?: string) =>
  o === 'won'
    ? `Good news — the bank ruled in your favour. ${amount} has been returned to your payouts, along with any fee Stripe gave back.`
    : o === 'lost'
      ? `The bank ruled in the client's favour. The ${amount} and the chargeback fee stay with the client's bank.`
      : `The dispute was closed without money moving.`

const DisputeClosedOwnerEmail = ({ clientName = 'a client', service = 'a booking', when = '', amount = '', outcome = 'closed' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Chargeback {outcome}: {clientName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Chargeback {outcome === 'closed' ? 'closed' : outcome}</Heading>
        <Text style={text}>{line(outcome, amount)}</Text>
        <Section style={card}>
          <Text style={detail}><strong>Client:</strong> {clientName}</Text>
          <Text style={detail}><strong>Booking:</strong> {service} · {when}</Text>
          <Text style={detail}><strong>Amount:</strong> {amount}</Text>
        </Section>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DisputeClosedOwnerEmail,
  subject: (d: Record<string, any>) => `Chargeback ${d?.outcome ?? 'closed'}: ${d?.clientName ?? 'a client'} (${d?.amount ?? ''})`,
  displayName: 'Chargeback closed (owner)',
  previewData: { clientName: 'Jane', service: 'Haircut', when: '2026-06-15 14:30', amount: '£10.00', outcome: 'won' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
