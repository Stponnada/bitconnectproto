export interface Profile {
  user_id: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  full_name?: string;
  bio?: string;
  email?: string;
  campus?: string;
  admission_year?: number;
  branch?: string;
  relationship_status?: string;
  dorm_building?: string;
  dorm_room?: string;
  dining_hall?: string;
  clubs?: string;
  profile_complete?: boolean;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  post_id: number;
  profiles: Pick<Profile, 'username' | 'avatar_url' | 'full_name'>;
}

export interface Post {
  id: number;
  content: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
  like_count: number;
  user_has_liked: boolean;
  comment_count: number;
  comments?: Comment[];
}