// src/types.ts

// src/types.ts (Updated)

export interface Roommate {
  user_id: string;
  username: string;
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
  // --- NEW FIELDS ---
  following_count: number;
  follower_count: number;
  is_following: boolean; // Is the current user following this profile?
  is_followed_by?: boolean; // Is this profile following the current user?
  roommates: Roommate[] | null;
  gender: string | null;
  birthday: string | null;
  avg_seller_rating?: number;
  total_seller_ratings?: number;
}

// --- NEW TYPE for the chat list ---
export interface ConversationSummary {
  participant: Profile;
  // MODIFIED: These can now be null for contacts without a chat history
  last_message_sender_id: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
}

// ... Post, Comment, and Search interfaces remain the same

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
  // --- THIS IS THE FIX ---
  // Replace `user_has_liked` with `user_vote` to match the component's usage.
  user_vote: 'like' | 'dislike' | null;
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
  profiles: Profile | null; // This will hold the author's profile
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
  profiles: Profile | null; // For author info
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
  seller_profile: Profile; // The seller's profile is nested
  primary_image_url: string | null;
  all_images: string[] | null;
}