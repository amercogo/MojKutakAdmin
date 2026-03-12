"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Plus, Trash2, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getPlaylistVideos, removeVideoFromPlaylist, addVideoToPlaylist, searchPostsNotInPlaylist } from "../actions";

interface ModalPlaylistDetailProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: any;
    onUpdate: () => void;
}

export default function ModalPlaylistDetail({
    isOpen,
    onClose,
    playlist,
    onUpdate
}: ModalPlaylistDetailProps) {
    const [videos, setVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    // Search tab
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch existing videos
    const loadVideos = async () => {
        if (!playlist?.id) return;
        setLoadingVideos(true);
        const { videos, error } = await getPlaylistVideos(playlist.id);
        if (error) {
            toast.error("Failed to load playlist videos");
        } else {
            setVideos(videos || []);
        }
        setLoadingVideos(false);
    };

    useEffect(() => {
        if (isOpen && playlist) {
            loadVideos();
            setIsSearching(false);
            setSearchQuery("");
            setSearchResults([]);
        }
    }, [isOpen, playlist]);

    // Handle search input changes with debounce
    useEffect(() => {
        if (!isSearching || !playlist?.id) return;

        const timer = setTimeout(async () => {
            setLoadingSearch(true);
            const { posts, error } = await searchPostsNotInPlaylist(playlist.id, searchQuery);
            if (error) {
                toast.error("Failed to search posts");
            } else {
                setSearchResults(posts || []);
            }
            setLoadingSearch(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, isSearching, playlist, videos]); // Re-run search if videos change so added ones disappear

    const handleRemoveVideo = async (postId: string) => {
        if (!playlist?.id) return;
        setProcessingId(postId);

        // Optimistic UI
        const previousVideos = [...videos];
        setVideos(videos.filter(v => v.post_id !== postId));

        const { error } = await removeVideoFromPlaylist(playlist.id, postId);

        if (error) {
            setVideos(previousVideos);
            toast.error("Failed to remove video");
        } else {
            toast.success("Video removed");
            onUpdate();
        }

        setProcessingId(null);
    };

    const handleAddVideo = async (postId: string) => {
        if (!playlist?.id) return;
        setProcessingId(postId);

        // Find post to optimistically add it (if needed)
        const postToAdd = searchResults.find(p => p.id === postId);

        const { error } = await addVideoToPlaylist(playlist.id, postId, videos.length);

        if (error) {
            toast.error("Failed to add video");
        } else {
            toast.success("Video added to playlist");
            // Remove from search results
            setSearchResults(searchResults.filter(p => p.id !== postId));
            // Reload videos to get the new list with relationships
            await loadVideos();
            onUpdate();
        }

        setProcessingId(null);
    };

    return (
        <AnimatePresence>
            {isOpen && playlist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex flex-col border-b border-gray-100">
                            <div className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                                        {playlist.title}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Manage videos in this playlist</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-6 gap-6">
                                <button
                                    onClick={() => setIsSearching(false)}
                                    className={`pb-3 text-sm font-bold border-b-2 transition-colors ${!isSearching ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                >
                                    Saved Videos ({videos.length})
                                </button>
                                <button
                                    onClick={() => setIsSearching(true)}
                                    className={`pb-3 text-sm font-bold border-b-2 transition-colors ${isSearching ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                >
                                    Add New Videos
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 relative">
                            {!isSearching ? (
                                /* Saved Videos List */
                                <div className="p-6">
                                    {loadingVideos ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    ) : videos.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Video className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Empty Playlist</h3>
                                            <p className="text-gray-500 mt-2 max-w-sm mx-auto mb-6">
                                                This playlist doesnt have any videos yet. Go to the Add New Videos tab to search and add some.
                                            </p>
                                            <button
                                                onClick={() => setIsSearching(true)}
                                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Start Adding
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {videos.map((item) => {
                                                const post = item.posts;
                                                const isProcessing = processingId === item.post_id;
                                                return (
                                                    <div
                                                        key={`pl-${item.post_id}`}
                                                        className={`bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                                                    >
                                                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {post.image_url ? (
                                                                <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><Video className="w-5 h-5 text-gray-400" /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-gray-900 text-sm truncate">{post.title}</h4>
                                                            <p className="text-xs text-gray-500 truncate mt-1">/{post.slug}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveVideo(item.post_id)}
                                                            title="Remove from playlist"
                                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Search and Add Tab */
                                <div className="p-6 flex flex-col h-full">
                                    <div className="relative mb-6 flex-shrink-0">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search posts to add..."
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all font-medium text-sm"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {loadingSearch ? (
                                            <div className="flex justify-center py-10">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-gray-500 text-sm font-medium">
                                                    {searchQuery ? "No posts found matching your search." : "Type to start searching posts."}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {searchResults.map((post) => {
                                                    const isProcessing = processingId === post.id;
                                                    return (
                                                        <div
                                                            key={`sr-${post.id}`}
                                                            className={`bg-white p-3 rounded-2xl border border-gray-100 hover:border-blue-200 shadow-sm flex items-center gap-4 transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                                                        >
                                                            <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                                {post.image_url ? (
                                                                    <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center"><Video className="w-4 h-4 text-gray-400" /></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-gray-900 text-sm truncate">{post.title}</h4>
                                                                <p className="text-xs text-gray-500 truncate mt-0.5">/{post.slug}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddVideo(post.id)}
                                                                title="Add to playlist"
                                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                            >
                                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                                Add
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
