## Add Room Code for Joining Debates

Currently, rooms are shared via long UUID links. This plan adds a short, human-readable room code that users can type in to join a room.

### How It Will Work

1. **When a room is created**, a short 6-character alphanumeric code (e.g., `ABC123`) is generated and stored alongside the room.
2. **The creator sees the code** on the success screen (instead of just the long link) and can share it easily.
3. **A "Join Room" input** is added to the Dashboard where users can type a room code and be taken directly to that room.

### Changes

**1. Database Migration**

- Add a `room_code` column (text, unique, not null) to the `debate_rooms` table.
- Auto-generate a 6-character uppercase alphanumeric code using a database function so every new room gets one automatically.

**2. Update CreateRoom.tsx**

- After room creation, display the generated room code prominently (large, copyable text).
- Keep the "Enter Room" and "Go to Dashboard" buttons.
- Remove or de-emphasize the long invite link in favor of the short code.

**3. Update Dashboard.tsx**

- Add a "Join Room" section at the top of the page with an input field for entering a 6-character room code and a "Join" button.
- On submit, look up the room by its code in the database and navigate to `/room/{room_id}`.
- Show an error toast if the code is invalid.

**4. Update DebateRoom.tsx**

- Display the room code in the header so participants can share it with others during the debate.

### Technical Details

**Database function for code generation:**

```sql
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS text AS $$
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
$$ LANGUAGE plpgsql;
```

Characters like `0`, `O`, `1`, `I` are excluded to avoid confusion.

**New column:**

```sql
ALTER TABLE public.debate_rooms
  ADD COLUMN room_code text UNIQUE NOT NULL DEFAULT generate_room_code();
```

**Dashboard join flow (pseudocode):**

```
user enters code -> query debate_rooms where room_code = code -> navigate to /room/{id}
```

**Files to modify:**

- New migration SQL file (database changes)
- `src/pages/CreateRoom.tsx` -- show room code on success
- `src/pages/Dashboard.tsx` -- add join-by-code input
- `src/pages/DebateRoom.tsx` -- show room code in header
- `src/integrations/supabase/types.ts` -- auto-updated after migration

and also make sure to have an option to delete the room if not required by user