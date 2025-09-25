export interface Profile {
  user_id: string;
  updated_at?: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  campus: string | null;
  admission_year: number | null;
  branch: string | null;
  relationship_status: string | null;
  dorm_building: string | null;
  dorm_room: string | null;
  dining_hall: string | null;
  clubs: string | null;
  profile_complete: boolean;
  email?: string;
}

export interface Post {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile | null;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  post_id: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}
