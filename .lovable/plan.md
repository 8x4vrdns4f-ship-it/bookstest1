## Tasks

### 1. Update the 'Automatic transactional emails' card
- File: `src/components/landing/ExpandedFeatures.tsx`
- Change description text for "Automatic transactional emails" to state that they are sent automatically from BookSuite on your behalf, instead of referencing custom domains.

### 2. Update the 'Gift codes & subscriptions' card
- File: `src/components/landing/ExpandedFeatures.tsx`
- Change description text for "Gift codes & subscriptions" to indicate "Coming soon" while maintaining the context of future features.

---

## Technical Details

We will edit `src/components/landing/ExpandedFeatures.tsx` directly to adjust the content of the `features` array:

1. Update index 3 ("Gift codes & subscriptions"):
   ```typescript
   {
     Icon: Gift,
     title: "Gift codes & subscriptions",
     body: "Coming soon. Offer custom promo codes and subscription tiers to your clients on BookSuite.",
   }
   ```

2. Update index 4 ("Automatic transactional emails"):
   ```typescript
   {
     Icon: Mail,
     title: "Automatic transactional emails",
     body: "Booking confirmations, reminders, payment receipts, refund notices, and staff invites — all sent automatically from BookSuite on your behalf.",
   }
   ```
