/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactReceivedOwnerEmail = ({ name = 'Someone', email = '', subject = '', message = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form message from {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New support message</Heading>
        <Section style={card}>
          <Text style={detail}><strong>From:</strong> {name} ({email})</Text>
          <Text style={detail}><strong>Subject:</strong> {subject}</Text>
        </Section>
        <Text style={text}>{message}</Text>
        <Text style={footer}>Reply directly to {email}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactReceivedOwnerEmail,
  subject: (d: Record<string, any>) => `Contact form: ${d?.subject ?? 'new message'}`,
  displayName: 'Contact — received (support)',
  previewData: { name: 'Jane', email: 'jane@example.com', subject: 'Question about deposits', message: 'How do refunds work?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px', whiteSpace: 'pre-wrap' as const }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
