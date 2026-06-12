/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  ownerName?: string
  applicantName?: string
  applicantEmail?: string
  applicantPhone?: string
  businessName?: string
  dashboardUrl?: string
}

const JoinRequestReceivedOwnerEmail = ({
  ownerName, applicantName = 'Someone', applicantEmail = '', applicantPhone, businessName = 'your business',
  dashboardUrl = 'https://booksuite.online/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{applicantName} wants to join {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New join request</Heading>
        <Text style={text}>
          {ownerName ? `Hi ${ownerName},` : 'Hi,'} <strong>{applicantName}</strong> wants to join{' '}
          <strong>{businessName}</strong>.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Name:</strong> {applicantName}</Text>
          <Text style={detail}><strong>Email:</strong> {applicantEmail}</Text>
          {applicantPhone && <Text style={detail}><strong>Phone:</strong> {applicantPhone}</Text>}
        </Section>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={dashboardUrl} style={btn}>Review in dashboard</Button>
        </Section>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JoinRequestReceivedOwnerEmail,
  subject: (d: Record<string, any>) => `${d?.applicantName ?? 'Someone'} wants to join ${d?.businessName ?? 'your business'}`,
  displayName: 'Join request received (owner)',
  previewData: { ownerName: 'Alex', applicantName: 'Sam', applicantEmail: 'sam@example.com', applicantPhone: '+44...', businessName: 'Sample Salon', dashboardUrl: 'https://booksuite.online/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const btn = { backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
