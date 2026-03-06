import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, User } from "lucide-react";

const AVATARS = [
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena1",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena2",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena3",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena4",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena5",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena6",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena7",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena8",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena9",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena10",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena11",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena12",
];

const INTERESTS = [
  "Politics", "Technology", "Science", "Philosophy",
  "Sports", "Entertainment", "Health", "Economics",
  "Environment", "Culture",
];

const ProfileSetup = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (profile) return <Navigate to="/dashboard" replace />;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      username: username.trim(),
      avatar_url: selectedAvatar,
      interests: selectedInterests,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Username is already taken");
      } else {
        toast.error("Failed to save profile");
      }
      setSaving(false);
      return;
    }

    await refreshProfile();
    toast.success("Profile created!");
    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8"
      >
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Set Up Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Choose your identity in the arena</p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username..."
              className="pl-10"
              maxLength={20}
            />
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Choose Avatar</label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {AVATARS.map((avatar) => (
              <motion.button
                key={avatar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative rounded-xl border-2 p-2 transition-colors ${
                  selectedAvatar === avatar
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <img src={avatar} alt="Avatar" className="h-full w-full" />
                {selectedAvatar === avatar && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <motion.button
                key={interest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedInterests.includes(interest)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {interest}
              </motion.button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full rounded-xl py-6 text-lg font-semibold glow-primary"
        >
          {saving ? "Creating Profile..." : "Enter the Arena"}
        </Button>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
