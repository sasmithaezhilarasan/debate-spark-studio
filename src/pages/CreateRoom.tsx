import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/data/mockData";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const CreateRoom = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("6");
  const [created, setCreated] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!topic.trim() || !category) {
      toast.error("Please fill in topic and category");
      return;
    }
    if (!user || !profile) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("debate_rooms")
      .insert({
        topic,
        description,
        category,
        host_id: user.id,
        host_username: profile.username,
        host_avatar: profile.avatar_url,
        max_participants: parseInt(maxParticipants),
      })
      .select("id, room_code")
      .single();

    if (error) {
      toast.error("Failed to create room");
      setLoading(false);
      return;
    }

    // Auto-join as host on the "for" side
    await supabase.from("room_participants").insert({
      room_id: data.id,
      user_id: user.id,
      side: "for",
    });

    setRoomId(data.id);
    setRoomCode(data.room_code);
    setCreated(true);
    setLoading(false);
    toast.success("Room created!");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Create Debate Room</h1>

          {!created ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What should we debate?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Max Participants</label>
                <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min="2" max="20" />
              </div>
              <Button onClick={handleCreate} disabled={loading} size="lg" className="w-full rounded-xl py-6 text-lg font-semibold glow-primary">
                {loading ? "Creating..." : "Create Room"}
              </Button>
            </div>
          ) : (
            <Card className="space-y-5 p-6 text-center">
              <h2 className="font-display text-lg font-semibold text-foreground">Room Created!</h2>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Share this room code:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary">{roomCode}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(roomCode);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={() => navigate(`/room/${roomId}`)} className="w-full glow-primary">
                Enter Room
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="secondary" className="w-full">
                Go to Dashboard
              </Button>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreateRoom;
