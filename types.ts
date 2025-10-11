// src/types.ts

// --- NEW: Interface for a roommate ---
export interface Roommate {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

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
  clubs?: string | null;
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  following_count: number;
  follower_count: number;
  is_following: boolean; 
  is_followed_by?: boolean; 
  roommates: Roommate[] | null; // <-- MODIFIED: From string array to Roommate array
  gender: string | null;
  birthday: string | null;
  avg_seller_rating?: number;
  total_seller_ratings?: number;
}

// ... (The rest of the file remains the same)
export interface ConversationSummary {
  conversation_id: string;
  type: 'dm' | 'group';
  name: string | null; // Group name or other user's name for DMs
  participants: ConversationParticipant[];
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
}
export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile | null;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  user_vote: 'like' | 'dislike' | null;
}
export interface Comment {
  id: number;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profiles: Profile | null;
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
export interface CampusPlace {
  id: string;
  name: string;
  category: string;
  location: string | null;
  image_url: string | null;
  campus: string;
  avg_rating: number;
  review_count: number;
}
export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: Profile | null;
}
export interface LostAndFoundItem {
  id: string;
  user_id: string;
  item_type: 'lost' | 'found';
  title: string;
  description: string | null;
  location_found: string | null;
  image_url: string | null;
  status: 'active' | 'reclaimed';
  campus: string;
  created_at: string;
  profiles: Profile | null;
}
export interface MarketplaceImage {
  id: string;
  listing_id: string;
  image_url: string;
}
export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: 'Books & Notes' | 'Electronics' | 'Furniture' | 'Apparel' | 'Cycles & Vehicles' | 'Other';
  campus: string;
  status: 'available' | 'sold';
  created_at: string;
  seller_profile: Profile;
  primary_image_url: string | null;
  all_images: string[] | null;
}

export interface ConversationParticipant {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  name: string | null;
  type: 'dm' | 'group';
  participants: ConversationParticipant[];
}