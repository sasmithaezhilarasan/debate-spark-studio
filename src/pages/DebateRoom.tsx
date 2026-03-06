import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, Mic, Timer, AlertTriangle, Trophy, Star, Users, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface RoomData {
  id: string;
  topic: string;
  description: string;
  category: string;
  host_id: string;
  host_username: string;
  host_avatar: string;
  max_participants: number;
  participant_count: number;
  status: string;
  room_code: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string;
  content: string;
  side: string;
  created_at: string;
}

const DebateRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [showModPanel, setShowModPanel] = useState(false);
  const [mySide, setMySide] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<{ user_id: string; side: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch room
  useEffect(() => {
    if (!id) return;
    const fetchRoom = async () => {
      const { data } = await supabase.from("debate_rooms").select("*").eq("id", id).single();
      if (data) setRoom(data as RoomData);
    };
    fetchRoom();
  }, [id]);

  // Fetch participants & check if joined
  useEffect(() => {
    if (!id || !user) return;
    const fetchParticipants = async () => {
      const { data } = await supabase.from("room_participants").select("user_id, side").eq("room_id", id);
      if (data) {
        setParticipants(data);
        const me = data.find((p) => p.user_id === user.id);
        if (me) {
          setMySide(me.side);
          setJoined(true);
        }
      }
    };
    fetchParticipants();
  }, [id, user]);

  // Fetch messages & subscribe to realtime
  useEffect(() => {
    if (!id) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("debate_messages")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    const channel = supabase
      .channel(`room-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "debate_messages", filter: `room_id=eq.${id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${id}` }, (payload) => {
        // Refresh participants
        supabase.from("room_participants").select("user_id, side").eq("room_id", id).then(({ data }) => {
          if (data) setParticipants(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const timerPercent = (timeLeft / 300) * 100;

  const handleJoin = async (side: "for" | "against") => {
    if (!user || !id) return;
    const { error } = await supabase.from("room_participants").insert({
      room_id: id,
      user_id: user.id,
      side,
    });
    if (error) {
      toast.error("Failed to join room");
      return;
    }
    setMySide(side);
    setJoined(true);
    toast.success(`Joined as ${side === "for" ? "For" : "Against"}!`);
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !profile || !id || !mySide) return;
    const { error } = await supabase.from("debate_messages").insert({
      room_id: id,
      sender_id: user.id,
      sender_username: profile.username,
      sender_avatar: profile.avatar_url,
      content: input,
      side: mySide,
    });
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    setInput("");
  };

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h1 className="font-display text-sm font-semibold text-foreground">{room.topic}</h1>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs">{room.category}</Badge>
              <button
                onClick={() => { navigator.clipboard.writeText(room.room_code); toast("Code copied!"); }}
                className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary hover:bg-primary/20 transition-colors"
                title="Click to copy room code"
              >
                {room.room_code} <Copy className="h-3 w-3" />
              </button>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {participants.length}/{room.max_participants}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowModPanel(!showModPanel)}>
            <Star className="h-4 w-4" />
          </Button>
        </div>
        {/* Timer */}
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className={`font-mono font-semibold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              {formatTime(timeLeft)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${timerPercent}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        </div>
      </header>

      {/* AI Moderator Panel */}
      <AnimatePresence>
        {showModPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border">
            <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">AI Moderator</h2>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex items-start gap-3 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Debate in progress</p>
                    <p className="text-xs text-muted-foreground">AI moderation is monitoring this debate</p>
                  </div>
                </CardContent>
              </Card>
              {timeLeft === 0 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <Card className="glow-primary border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <Trophy className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-display text-sm font-bold text-primary">Debate Complete!</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join prompt if not joined */}
      {!joined && (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Card className="p-6 text-center space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Choose Your Side</h2>
            <p className="text-sm text-muted-foreground">Pick a side to join this debate</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => handleJoin("for")} className="bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30">
                For
              </Button>
              <Button onClick={() => handleJoin("against")} variant="destructive">
                Against
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-accent/10 text-accent">For</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive">Against</Badge>
          </div>

          {messages.length === 0 && joined && (
            <div className="py-12 text-center text-sm text-muted-foreground">No messages yet. Start the debate!</div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.side === "for" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`flex gap-3 ${msg.side === "against" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={msg.sender_avatar} />
                  <AvatarFallback>{msg.sender_username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] space-y-1 ${msg.side === "against" ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2">
                    {msg.side === "against" && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {isMe ? "You" : msg.sender_username}
                    </span>
                    {msg.side === "for" && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.side === "for"
                      ? "rounded-tl-sm bg-primary/15 text-foreground"
                      : "rounded-tr-sm bg-secondary text-foreground"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — only show if joined */}
      {joined && (
        <div className="border-t border-border bg-background/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Mic className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Make your argument..."
              className="rounded-xl"
            />
            <Button onClick={handleSend} size="icon" className="shrink-0 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateRoom;
