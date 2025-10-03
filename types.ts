// src/types.ts

// src/types.ts (Updated)

export interface Profile {
  user_id: string;
  username: string;
  full_name: string | null;
  email?: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  campus: string | null;
  admission_year: number | null;
  branch: string | null;
  dual_degree_branch: string | null;
  relationship_status: string | null;
  dorm_building: string | null;
  dorm_room: string | null;
  dining_hall: string | null;
  gender: string | null;
  birthday: string | null; // <-- ADD THIS LINE
  clubs?: string | null;
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  // --- NEW FIELDS ---
  following_count: number;
  follower_count: number;
  is_following: boolean; // Is the current user following this profile?
}

// ... Post, Comment, and Search interfaces remain the same

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile | null; // This is the joined profile data
  like_count: number;
  dislike_count: number; // Correctly added
  comment_count: number;
  user_has_liked: boolean;
}

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profiles: Profile | null; // The joined profile of the comment author
}

export interface UserSearchResult {
  username: string;
  full_name: string;
  avatar_url: string;
}

export interface PostSearchResult {
  id: string;
  content: string;
  author_username: string;
  author_full_name: string;
}

export interface SearchResults {
  users: UserSearchResult[];
  posts: PostSearchResult[];
}