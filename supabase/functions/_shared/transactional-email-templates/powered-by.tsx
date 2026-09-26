/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Hr, Link, Section, Text } from 'npm:@react-email/components@0.0.22'

/**
 * Low-key growth footer for customer-facing emails. Every appointment email is
 * seen by people who often run their own business — this invites them to create
 * their own BookSuite booking page.
 */
export const PoweredByFooter = ({ source = 'email' }: { source?: string }) => (
  <Section style={wrap}>
    <Hr style={hr} />
    <Text style={line}>
      Booked with <strong style={brand}>BookSuite</strong> — the simple booking platform for
      independent businesses.{' '}
      <Link
        href={`https://booksuite.online/auth?mode=signup&ref=${encodeURIComponent(source)}`}
        style={link}
      >
        Create your own booking page free →
      </Link>
    </Text>
  </Section>
)

const wrap = { margin: '28px 0 0' }
const hr = { borderColor: '#E2E8F0', margin: '0 0 12px' }
const line = { fontSize: '12px', color: '#94A3B8', lineHeight: '1.6', margin: '0' }
const brand = { color: '#0F172A' }
const link = { color: '#3B82F6', textDecoration: 'none', fontWeight: 'bold' as const }
