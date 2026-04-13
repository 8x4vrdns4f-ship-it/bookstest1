
CREATE POLICY "Allow public booking inserts via widget"
ON public.bookings
FOR INSERT
TO anon
WITH CHECK (true);
