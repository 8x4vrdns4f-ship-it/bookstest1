/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  tier?: string
  winbackCode?: string
  resubscribeUrl?: string
}

const SubscriptionCanceledEmail = ({
  businessName = 'there',
  tier = 'your plan',
  winbackCode = 'COMEBACK20',
  resubscribeUrl = 'https://booksuite.online/pricing',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your BookSuite subscription has been canceled — here's 20% off if you come back</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sorry to see you go 👋</Heading>
        <Text style={text}>
          Hi {businessName}, your <strong>{tier}</strong> subscription has been canceled
          and your access to BookSuite has been removed immediately.
        </Text>
        <Text style={text}>
          If this was a mistake, or you change your mind — we'd love to have you back.
        </Text>
        <Section style={offer}>
          <Text style={offerHead}>🎁 Come back & save 20%</Text>
          <Text style={offerBody}>
            Resubscribe within the next 30 days and get <strong>20% off your first 3 months</strong>
            on any plan — no card tricks, just a thank-you for giving us another shot.
          </Text>
          <Text style={codeBox}>{winbackCode}</Text>
        </Section>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={resubscribeUrl} style={btn}>Resubscribe with 20% off</Button>
        </Section>
        <Text style={footer}>
          We'd genuinely love to know why you left — just reply to this email.
          <br />— The BookSuite team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionCanceledEmail,
  subject: 'Your BookSuite subscription has been canceled',
  displayName: 'Subscription canceled (with winback offer)',
  previewData: {
    businessName: 'Sample Salon',
    tier: 'Gold',
    winbackCode: 'COMEBACK20',
    resubscribeUrl: 'https://booksuite.online/pricing',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const offer = { backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '20px', margin: '20px 0' }
const offerHead = { fontSize: '16px', fontWeight: 'bold', color: '#1E3A8A', margin: '0 0 8px' }
const offerBody = { fontSize: '14px', color: '#1E3A8A', lineHeight: '1.5', margin: '0 0 12px' }
const codeBox = {
  fontFamily: 'monospace', fontSize: '22px', letterSpacing: '4px',
  textAlign: 'center' as const, padding: '12px', backgroundColor: '#0F172A',
  color: '#ffffff', borderRadius: '8px', margin: '8px 0 0',
}
const btn = {
  backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 28px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '28px 0 0', lineHeight: '1.5' }
