
export interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
  bio?: string;
}

export interface Post {
  id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: Profile;
  like_count: number;
  user_has_liked: boolean;
}
