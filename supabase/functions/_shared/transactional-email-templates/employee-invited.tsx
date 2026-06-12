/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inviteeName?: string
  businessName?: string
  companyCode?: string
  joinUrl?: string
}

const EmployeeInvitedEmail = ({
  inviteeName, businessName = 'a business', companyCode = '',
  joinUrl = 'https://booksuite.online/auth?mode=signup',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {businessName} on BookSuite</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're invited to {businessName}</Heading>
        <Text style={text}>
          {inviteeName ? `Hi ${inviteeName},` : 'Hi,'} you've been added as a team member at{' '}
          <strong>{businessName}</strong> on BookSuite.
        </Text>
        <Text style={text}>To join, sign up with the company code below:</Text>
        <Text style={codeBox}>{companyCode}</Text>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={joinUrl} style={btn}>Join {businessName}</Button>
        </Section>
        <Text style={footer}>— The BookSuite team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EmployeeInvitedEmail,
  subject: (d: Record<string, any>) => `You've been invited to join ${d?.businessName ?? 'a business'} on BookSuite`,
  displayName: 'Employee invited',
  previewData: { inviteeName: 'Sam', businessName: 'Sample Salon', companyCode: 'BS-ABCDEF', joinUrl: 'https://booksuite.online/auth?mode=signup' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const codeBox = { fontFamily: 'monospace', fontSize: '24px', letterSpacing: '4px', textAlign: 'center' as const, padding: '14px', backgroundColor: '#0F172A', color: '#ffffff', borderRadius: '8px', margin: '8px 0 16px' }
const btn = { backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
