/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  link?: string
  minutes?: number
}

const ClientPortalLinkEmail = ({ link = '#', minutes = 30 }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your secure link to view your bookings</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>View your bookings</Heading>
        <Text style={text}>
          Tap the button below to see all your upcoming and past bookings. You can reschedule,
          cancel or book again from there — no password needed.
        </Text>
        <Button style={button} href={link}>View my bookings</Button>
        <Text style={small}>
          This link works once and expires in {minutes} minutes. If you didn't ask for it,
          you can safely ignore this email.
        </Text>
        <Text style={footer}>— BookSuite</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ClientPortalLinkEmail,
  subject: 'Your link to view your bookings',
  displayName: 'Customer portal sign-in link',
  previewData: { link: 'https://booksuite.online/my-bookings/verify?token=example', minutes: 30 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 16px' }
const button = {
  backgroundColor: '#38BDF8', color: '#0B1220', borderRadius: '10px',
  padding: '12px 22px', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none',
  display: 'inline-block', margin: '4px 0 20px',
}
const small = { fontSize: '12px', color: '#64748B', lineHeight: '1.5', margin: '0 0 8px' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
