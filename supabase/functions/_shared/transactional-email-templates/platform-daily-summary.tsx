/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Group {
  title: string
  lines: string[]
}

interface Props {
  dateLabel?: string
  headline?: string
  stats?: Array<{ label: string; value: string }>
  groups?: Group[]
  quiet?: boolean
}

const PlatformDailySummaryEmail = ({
  dateLabel = '',
  headline = '',
  stats = [],
  groups = [],
  quiet = false,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>BookSuite daily summary{dateLabel ? ` — ${dateLabel}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>BookSuite daily summary</Text>
        <Heading style={h1}>{dateLabel}</Heading>
        {headline ? <Text style={text}>{headline}</Text> : null}

        {quiet ? (
          <Section style={card}>
            <Text style={detail}>No activity in the last 24 hours.</Text>
          </Section>
        ) : (
          <>
            <Section style={card}>
              {(stats || []).map((s, i) => (
                <Text key={i} style={detail}><strong>{s.label}:</strong> {s.value}</Text>
              ))}
            </Section>
            {(groups || []).map((g, i) => (
              <Section key={i} style={group}>
                <Text style={groupTitle}>{g.title}</Text>
                {(g.lines || []).map((l, j) => (
                  <Text key={j} style={line}>• {l}</Text>
                ))}
              </Section>
            ))}
          </>
        )}

        <Text style={footer}>Sent automatically by BookSuite each evening.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlatformDailySummaryEmail,
  subject: (d: Record<string, any>) => `[BookSuite] Daily summary — ${d?.dateLabel ?? 'today'}`,
  displayName: 'Platform — daily summary (admin)',
  previewData: {
    dateLabel: '5 Aug 2026',
    headline: '3 new signups, 12 bookings, GBP 240.00 processed.',
    stats: [
      { label: 'New signups', value: '3' },
      { label: 'Subscriptions started', value: '2' },
      { label: 'Subscriptions cancelled', value: '0' },
      { label: 'Bookings taken', value: '12' },
      { label: 'Gross payments', value: 'GBP 240.00' },
      { label: 'Platform fees earned', value: 'GBP 24.00' },
      { label: 'Refunds issued', value: '1' },
    ],
    groups: [{ title: 'New signups', lines: ['Sharp Cuts Barbers', 'Bella Trattoria'] }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const kicker = { fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#3B82F6', fontWeight: 'bold', margin: '0 0 8px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }
const card = { backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px', margin: '16px 0' }
const group = { margin: '16px 0 0' }
const groupTitle = { fontSize: '14px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 4px' }
const line = { fontSize: '14px', color: '#334155', margin: '2px 0' }
const detail = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
