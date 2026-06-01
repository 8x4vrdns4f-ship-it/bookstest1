/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  applicantName?: string
  businessName?: string
  role?: string
  loginUrl?: string
}

const JoinRequestApprovedEmail = ({
  applicantName, businessName = 'the team', role = 'team member',
  loginUrl = 'https://booksuite.online/auth',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're in — welcome to {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {businessName} 🎉</Heading>
        <Text style={text}>
          {applicantName ? `Hi ${applicantName},` : 'Hi,'} your request to join{' '}
          <strong>{businessName}</strong> has been approved.
        </Text>
        <Text style={text}>Your role: <strong>{role}</strong></Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={loginUrl} style={btn}>Log in to BookSuite</Button>
        </Section>
        <Text style={footer}>— The BookSuite team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JoinRequestApprovedEmail,
  subject: (d: Record<string, any>) => `You've been approved to join ${d?.businessName ?? 'the team'}`,
  displayName: 'Join request approved',
  previewData: { applicantName: 'Sam', businessName: 'Sample Salon', role: 'receptionist', loginUrl: 'https://booksuite.online/auth' },
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
