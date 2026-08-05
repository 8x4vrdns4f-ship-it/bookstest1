/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  subject?: string
  message?: string
}

const ContactConfirmationEmail = ({ name, subject = '', message = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've got your message — BookSuite support</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thanks for getting in touch</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} we've received your message and a real person will reply
          within one business day.
        </Text>
        <Section style={card}>
          <Text style={detail}><strong>Subject:</strong> {subject}</Text>
          <Text style={detail}>{message}</Text>
        </Section>
        <Text style={text}>
          If it's urgent, just reply to this email and it'll land in the same inbox.
        </Text>
        <Text style={footer}>— The BookSuite team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message — BookSuite',
  displayName: 'Contact — confirmation',
  previewData: { name: 'Jane', subject: 'Question about deposits', message: 'How do refunds work?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0', lineHeight: '1.5' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
