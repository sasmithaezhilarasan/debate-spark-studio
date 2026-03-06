
-- Function to generate a 6-character room code
CREATE OR REPLACE FUNCTION public.generate_room_code() RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add room_code column
ALTER TABLE public.debate_rooms
  ADD COLUMN room_code text UNIQUE NOT NULL DEFAULT public.generate_room_code();

-- Allow host to delete their room
CREATE POLICY "Host can delete their room"
  ON public.debate_rooms
  FOR DELETE
  USING (auth.uid() = host_id);
