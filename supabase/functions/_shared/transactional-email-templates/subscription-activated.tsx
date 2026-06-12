/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  tier?: string
  dashboardUrl?: string
}

const SubscriptionActivatedEmail = ({ name, tier = 'your plan', dashboardUrl = 'https://booksuite.online/dashboard' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your BookSuite subscription is active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're on the {tier} plan 🎉</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} thanks for subscribing — your <strong>{tier}</strong> plan is now active.
        </Text>
        <Text style={text}>All features for your tier are unlocked. You can manage your subscription anytime from your dashboard.</Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={dashboardUrl} style={btn}>Go to dashboard</Button>
        </Section>
        <Text style={footer}>— The BookSuite team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionActivatedEmail,
  subject: (d: Record<string, any>) => `Your ${d?.tier ?? ''} BookSuite plan is active`.replace('  ', ' '),
  displayName: 'Subscription activated',
  previewData: { name: 'Jane', tier: 'gold', dashboardUrl: 'https://booksuite.online/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const btn = { backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
