'use client';
import { DiscussionEmbed } from 'disqus-react';

interface DisqusCommentsProps {
    id: number;
    title: string;
    url: string;
}

export default function DisqusComments({ id, title, url }: DisqusCommentsProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <style jsx global>{`
                    #disqus_thread {
                        color-scheme: light;
                        background: white;
                        color: black;
                        padding: 1.5rem;
                    }
                    .dark #disqus_thread {
                        color-scheme: dark;
                        background: #1f2937;
                        color: white;
                    }
                `}</style>
                <DiscussionEmbed
                    shortname='ueventt'
                    config={{
                        url: url,
                        identifier: id.toString(),
                        title: title,
                        language: 'en'
                    }}
                />
            </div>
        </div>
    );
}