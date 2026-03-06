
-- Create debate_rooms table
CREATE TABLE public.debate_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  host_id UUID NOT NULL,
  host_username TEXT NOT NULL,
  host_avatar TEXT NOT NULL DEFAULT '',
  max_participants INTEGER NOT NULL DEFAULT 6,
  participant_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('live', 'waiting', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debate_messages table
CREATE TABLE public.debate_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.debate_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_username TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('for', 'against')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_participants table to track who joined
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.debate_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('for', 'against')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.debate_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- debate_rooms policies
CREATE POLICY "Anyone authenticated can view rooms" ON public.debate_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.debate_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update their room" ON public.debate_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- debate_messages policies
CREATE POLICY "Anyone authenticated can view messages" ON public.debate_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.debate_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- room_participants policies
CREATE POLICY "Anyone authenticated can view participants" ON public.room_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join rooms" ON public.room_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.debate_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;

-- Trigger for updated_at on debate_rooms
CREATE TRIGGER update_debate_rooms_updated_at
  BEFORE UPDATE ON public.debate_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
