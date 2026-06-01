/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  applicantName?: string
  businessName?: string
  reason?: string
}

const JoinRequestDeclinedEmail = ({
  applicantName, businessName = 'the team', reason = 'No reason provided.',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update on your request to join {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Request declined</Heading>
        <Text style={text}>
          {applicantName ? `Hi ${applicantName},` : 'Hi,'} unfortunately your
          request to join <strong>{businessName}</strong> was declined.
        </Text>
        <Heading as="h2" style={h2}>Reason</Heading>
        <Text style={reasonBox}>{reason}</Text>
        <Text style={text}>You're welcome to apply again if anything changes.</Text>
        <Text style={footer}>— The BookSuite team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JoinRequestDeclinedEmail,
  subject: (d: Record<string, any>) => `Update on your request to join ${d?.businessName ?? 'the team'}`,
  displayName: 'Join request declined',
  previewData: { applicantName: 'Sam', businessName: 'Sample Salon', reason: 'We are not hiring for this role at the moment.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0F172A', margin: '16px 0 8px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const reasonBox = {
  fontSize: '14px', color: '#0F172A', backgroundColor: '#FEF2F2',
  borderLeft: '4px solid #EF4444', padding: '12px 14px', borderRadius: '6px',
  margin: '0 0 16px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
