/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  clientName?: string
  subject?: string
  messageBody?: string
  bookingUrl?: string
  unsubscribeUrl?: string
}

const CampaignEmail = ({
  businessName = 'the business',
  clientName,
  subject = 'News',
  messageBody = '',
  bookingUrl = '',
  unsubscribeUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject}</Heading>
        {messageBody.split(/\n{2,}/).map((para, i) => (
          <Text key={i} style={text}>
            {clientName ? para.replace(/\{name\}/gi, clientName) : para.replace(/\{name\}/gi, 'there')}
          </Text>
        ))}
        {bookingUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={bookingUrl} style={btn}>Book now</Button>
          </Section>
        )}
        <Hr style={{ borderColor: '#E2E8F0', margin: '24px 0 12px' }} />
        <Text style={footer}>
          You received this because you booked with {businessName}.
          {unsubscribeUrl ? (
            <>
              {' '}<a href={unsubscribeUrl} style={{ color: '#94A3B8' }}>Unsubscribe</a>
            </>
          ) : null}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CampaignEmail,
  subject: (d: Record<string, any>) => String(d?.subject ?? 'News'),
  displayName: 'Campaign — client',
  previewData: {
    businessName: 'Sample Salon',
    clientName: 'Jane',
    subject: 'Summer offer: 20% off this week',
    messageBody: 'Hi {name},\n\nBook any appointment this week and save 20%.\n\nSee you soon!',
    bookingUrl: 'https://booksuite.online/book/example',
    unsubscribeUrl: 'https://booksuite.online/unsubscribe/example',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const btn = {
  backgroundColor: '#3B82F6', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '0' }
