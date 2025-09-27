// src/types.ts (Corrected)

export interface Profile {
  // ... your existing Profile type is likely correct ...
  user_id: string;
  username: string;
  full_name: string | null;
  // ... etc.
}

export interface Post {
  id: string; // THE FIX IS HERE: Changed from number to string
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile | null; // This is the joined profile data
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

export interface Comment {
  id: number; // The comment's own ID can be a number
  content: string;
  user_id: string;
  post_id: string; // THE FIX IS HERE: Changed from number to string
  created_at: string;
  profiles: Profile | null; // The joined profile of the comment author
}