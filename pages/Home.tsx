
import React, { useState, useCallback } from 'react';
import CreatePost from '../components/CreatePost';
import Feed from '../components/Feed';

const Home: React.FC = () => {
    const [newPost, setNewPost] = useState<any>(null);

    const onPostCreated = useCallback((post: any) => {
        setNewPost(post);
    }, []);

    return (
        <div>
            <div className="p-4 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur-md">
                <h1 className="text-xl font-bold">Home</h1>
            </div>
            <CreatePost onPostCreated={onPostCreated} />
            <Feed newPost={newPost} />
        </div>
    );
};

export default Home;
