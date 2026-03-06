import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { trendingTopics, CATEGORIES } from "@/data/mockData";
import { Search, TrendingUp, Users, Plus, LogOut, Flame, Clock, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RoomRow {
  id: string;
  topic: string;
  description: string;
  category: string;
  host_id: string;
  host_username: string;
  host_avatar: string;
  participant_count: number;
  max_participants: number;
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-destructive/20 text-destructive border-destructive/30" },
  waiting: { label: "Waiting", className: "bg-accent/20 text-accent border-accent/30" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border" },
};

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [myRooms, setMyRooms] = useState<RoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-character room code");
      return;
    }
    setJoiningByCode(true);
    const { data, error } = await supabase
      .from("debate_rooms")
      .select("id")
      .eq("room_code", code)
      .single();
    setJoiningByCode(false);
    if (error || !data) {
      toast.error("Room not found. Check the code and try again.");
      return;
    }
    navigate(`/room/${data.id}`);
  };

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase.from("debate_rooms").delete().eq("id", roomId);
    if (error) {
      toast.error("Failed to delete room");
      return;
    }
    toast.success("Room deleted");
    setMyRooms((prev) => prev.filter((r) => r.id !== roomId));
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("debate_rooms").select("*").order("created_at", { ascending: false });
      if (data) setRooms(data as RoomRow[]);
      setLoadingRooms(false);
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchMyRooms = async () => {
      // Rooms I host or participate in
      const { data: hosted } = await supabase.from("debate_rooms").select("*").eq("host_id", user.id);
      const { data: participated } = await supabase.from("room_participants").select("room_id").eq("user_id", user.id);
      
      if (participated && participated.length > 0) {
        const participatedIds = participated.map((p) => p.room_id);
        const { data: joinedRooms } = await supabase.from("debate_rooms").select("*").in("id", participatedIds);
        const all = [...(hosted || []), ...(joinedRooms || [])];
        const unique = Array.from(new Map(all.map((r) => [r.id, r])).values());
        setMyRooms(unique as RoomRow[]);
      } else {
        setMyRooms((hosted || []) as RoomRow[]);
      }
    };
    fetchMyRooms();
  }, [user]);

  const filteredTopics = trendingTopics.filter(
    (t) =>
      (selectedCategory === "All" || t.category === selectedCategory) &&
      t.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRooms = rooms.filter(
    (r) =>
      (selectedCategory === "All" || r.category === selectedCategory) &&
      r.topic.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMyRooms = myRooms.filter(
    (r) =>
      (selectedCategory === "All" || r.category === selectedCategory) &&
      r.topic.toLowerCase().includes(search.toLowerCase())
  );

  const RoomCard = ({ room, index, showDelete }: { room: RoomRow; index: number; showDelete?: boolean }) => {
    const status = statusConfig[room.status] || statusConfig.waiting;
    return (
      <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className="cursor-pointer transition-colors hover:bg-card/80" onClick={() => navigate(`/room/${room.id}`)}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-sm font-semibold text-foreground">{room.topic}</h3>
              <Badge variant="outline" className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={room.host_avatar} />
                  <AvatarFallback>{room.host_username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{room.host_username}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {room.participant_count}/{room.max_participants} joined
              </span>
            </div>
            {showDelete && room.host_id === user?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Room
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            Debate<span className="text-primary">Arena</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground sm:block">{profile?.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Join by Code */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 p-4">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              placeholder="Enter room code"
              className="font-mono text-center tracking-widest uppercase max-w-[180px]"
              maxLength={6}
            />
            <Button onClick={handleJoinByCode} disabled={joiningByCode} className="gap-2">
              {joiningByCode ? "Joining..." : "Join Room"} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics and rooms..." className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <Button key={cat} size="sm" variant={selectedCategory === cat ? "default" : "secondary"} onClick={() => setSelectedCategory(cat)} className="shrink-0 rounded-full text-xs">
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList className="w-full justify-start gap-1 bg-secondary">
            <TabsTrigger value="trending" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Trending</TabsTrigger>
            <TabsTrigger value="explore" className="gap-1.5"><Users className="h-3.5 w-3.5" />Explore</TabsTrigger>
            <TabsTrigger value="myrooms" className="gap-1.5"><Clock className="h-3.5 w-3.5" />My Rooms</TabsTrigger>
          </TabsList>

          {/* Trending Topics — still mocked */}
          <TabsContent value="trending">
            <div className="space-y-3">
              {filteredTopics.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">No topics found</div>
              ) : (
                filteredTopics.map((topic, i) => (
                  <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="cursor-pointer transition-colors hover:bg-card/80">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {topic.trending && <Flame className="h-4 w-4 text-destructive" />}
                            <h3 className="font-medium text-foreground">{topic.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{topic.category}</Badge>
                            <span className="text-xs text-muted-foreground">{topic.engagementCount.toLocaleString()} engaged</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Explore Rooms — from database */}
          <TabsContent value="explore">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => navigate("/create-room")} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Create Room
              </Button>
            </div>
            {loadingRooms ? (
              <div className="py-16 text-center text-muted-foreground">Loading rooms...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-muted-foreground">No rooms found. Create one!</div>
                ) : (
                  filteredRooms.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)
                )}
              </div>
            )}
          </TabsContent>

          {/* My Rooms — from database */}
          <TabsContent value="myrooms">
            {filteredMyRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="font-display text-lg font-semibold text-foreground">No Rooms Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create or join a debate to get started</p>
                <Button onClick={() => navigate("/create-room")} className="mt-4 gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Create Room
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredMyRooms.map((room, i) => <RoomCard key={room.id} room={room} index={i} showDelete />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
