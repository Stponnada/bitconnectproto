import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark">
            <Header />
            <main className="pt-20">
               <div className="w-full max-w-2xl mx-auto px-4">
                 {children}
               </div>
            </main>
        </div>
    );
};

export default Layout;