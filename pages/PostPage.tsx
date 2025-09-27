// src/pages/PostPage.tsx (with added debugging)

import React, [ useState, useEffect } from 'react';
// ... other imports

// ... Comment Component ...

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ... useEffect logic is correct ...
  }, [postId]);

  // ==================================================================
  // THE FIX IS HERE: We've added logging to see what's happening.
  // ==================================================================
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleCommentSubmit initiated.');

    // Checkpoint 1: Log the data we're about to use.
    console.log('[DEBUG] Checking conditions:', { user, post, newComment });
    if (!user || !post || !newComment.trim()) {
      console.log('[DEBUG] A condition failed. Exiting silently.');
      return;
    }

    setIsSubmitting(true);
    
    const commentData = {
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    };

    // Checkpoint 2: Log the exact data being sent to Supabase.
    console.log('[DEBUG] Attempting to insert:', commentData);

    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select('*, profiles(*)')
      .single();

    // Checkpoint 3: Log the response from Supabase, whatever it is.
    console.log('[DEBUG] Supabase response:', { data, error });

    if (error) {
      // This will now show any hidden errors from Supabase.
      console.error("Error posting comment (from catch block):", error);
    } else if (data) {
      console.log('[DEBUG] Success! Adding new comment to UI.');
      setComments(prevComments => [...prevComments, data as any]);
      setNewComment(''); // The input box will clear if this line is reached.
    } else {
      console.warn('[DEBUG] Insert succeeded, but no data was returned from the select().');
    }
    
    setIsSubmitting(false);
  };

  // ... (the rest of your PostPage component JSX) ...
  return (
    // ...
  );
};

export default PostPage;