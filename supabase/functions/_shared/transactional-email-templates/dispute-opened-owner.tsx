/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  clientName?: string
  service?: string
  when?: string
  amount?: string
  dueBy?: string
  reason?: string
  confirmationCode?: string
  checkedIn?: boolean
}

const DisputeOpenedOwnerEmail = ({ clientName = 'a client', service = 'a booking', when = '', amount = '', dueBy, reason, confirmationCode, checkedIn }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Chargeback opened by {clientName} — {amount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>A client has disputed a payment</Heading>
        <Text style={text}>
          <strong>{clientName}</strong> asked their bank to reverse a payment of <strong>{amount}</strong>. The disputed amount
          and Stripe's chargeback fee have been taken back from your payouts while the bank reviews it.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Booking:</strong> {service} · {when}</Text>
          {reason && <Text style={detail}><strong>Bank's reason:</strong> {reason}</Text>}
          {dueBy && <Text style={detail}><strong>Evidence deadline:</strong> {dueBy}</Text>}
          {confirmationCode && <Text style={detail}><strong>Confirmation code:</strong> {confirmationCode}</Text>}
          <Text style={detail}><strong>Checked in:</strong> {checkedIn ? 'Yes' : 'No'}</Text>
        </Section>
        <Text style={text}>
          Reply to this email before the deadline with anything that shows the client booked and agreed to your terms.
          BookSuite can submit evidence for you, such as the booking record, the confirmation code and the check-in status.
          If the dispute is won, the money and any returned fee go back to you.
        </Text>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DisputeOpenedOwnerEmail,
  subject: (d: Record<string, any>) => `Chargeback: ${d?.clientName ?? 'a client'} disputed ${d?.amount ?? 'a payment'}`,
  displayName: 'Chargeback opened (owner)',
  previewData: { clientName: 'Jane', service: 'Haircut', when: '2026-06-15 14:30', amount: '£10.00', dueBy: '2026-06-30', reason: 'fraudulent', confirmationCode: 'AB12CD', checkedIn: true },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#B91C1C', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
