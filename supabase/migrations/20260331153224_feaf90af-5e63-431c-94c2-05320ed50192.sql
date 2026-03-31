
ALTER TABLE public.client_shares 
ADD COLUMN client_response text DEFAULT NULL,
ADD COLUMN client_response_at timestamp with time zone DEFAULT NULL;

CREATE POLICY "Anyone can update client response"
ON public.client_shares
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
