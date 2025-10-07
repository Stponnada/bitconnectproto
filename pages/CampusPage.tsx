// src/pages/CampusPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BuildingStorefrontIcon, ArchiveBoxIcon } from '../components/icons';

const FeatureCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string }> = ({ to, icon, title, description }) => (
    <Link to={to} className="block bg-secondary-light dark:bg-secondary rounded-lg p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-tertiary-light dark:border-tertiary">
        <div className="flex items-center space-x-4">
            <div className="bg-tertiary-light dark:bg-tertiary p-3 rounded-full">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">{title}</h3>
                <p className="mt-1 text-text-secondary-light dark:text-text-secondary">{description}</p>
            </div>
        </div>
    </Link>
);

const CampusPage: React.FC = () => {
    const { profile } = useAuth();
    const campusName = profile?.campus || 'Campus';

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Welcome to BITS {campusName}</h1>
            <p className="mt-2 text-lg text-text-secondary-light dark:text-text-secondary">Explore services and facilities available on campus.</p>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <FeatureCard
                    to="/campus/reviews"
                    icon={<BuildingStorefrontIcon className="w-8 h-8 text-brand-green" />}
                    title="Campus Places"
                    description="Find and review eateries, shops, and other spots."
                />
                <FeatureCard
                    to="/campus/lost-and-found"
                    icon={<ArchiveBoxIcon className="w-8 h-8 text-brand-green" />}
                    title="Lost & Found"
                    description="Report or find lost and found items on campus."
                />
            </div>
        </div>
    );
};

export default CampusPage;