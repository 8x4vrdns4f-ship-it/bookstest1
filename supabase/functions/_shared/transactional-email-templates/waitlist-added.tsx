/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  service?: string
  date?: string
  timeWindow?: string
}

const WaitlistAddedEmail = ({ businessName = 'the business', clientName, service, date = '', timeWindow }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the waitlist at {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're on the waitlist</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} thanks for joining the waitlist at <strong>{businessName}</strong>.
          We'll email you as soon as a slot opens up on your preferred date.
        </Text>
        <Section style={card}>
          {service && <Text style={detail}><strong>Service:</strong> {service}</Text>}
          <Text style={detail}><strong>Preferred date:</strong> {date}</Text>
          {timeWindow && <Text style={detail}><strong>Preferred time:</strong> {timeWindow}</Text>}
        </Section>
        <Text style={footer}>— {businessName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistAddedEmail,
  subject: (d: Record<string, any>) => `You're on the waitlist at ${d?.businessName ?? 'us'}`,
  displayName: 'Waitlist — added',
  previewData: { businessName: 'Sample Salon', clientName: 'Jane', service: 'Haircut', date: '15 Jun 2026', timeWindow: '14:00–17:00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
