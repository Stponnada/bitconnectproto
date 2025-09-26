
import React from 'react';

const RightSidebar: React.FC = () => {
  return (
    <aside className="w-1/4 lg:w-1/5 h-screen sticky top-0 p-4 hidden lg:block">
        <div className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Suggested for you</h2>
            <div className="space-y-4">
                {/* Placeholder users */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src="https://picsum.photos/seed/user1/40" alt="avatar" className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-semibold text-sm">John Doe</p>
                            <p className="text-xs text-gray-400">@johndoe</p>
                        </div>
                    </div>
                    <button className="bg-white text-black font-bold text-sm py-1 px-4 rounded-full">Follow</button>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src="https://picsum.photos/seed/user2/40" alt="avatar" className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-semibold text-sm">Jane Smith</p>
                            <p className="text-xs text-gray-400">@janesmith</p>
                        </div>
                    </div>
                    <button className="bg-white text-black font-bold text-sm py-1 px-4 rounded-full">Follow</button>
                </div>
            </div>
        </div>
    </aside>
  );
};

export default RightSidebar;
