"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Library, Video, Loader2, PlaySquare } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { getPlaylists, deletePlaylist } from "./actions";
import ModalPlaylist from "./components/ModalPlaylist";
import ModalPlaylistDetail from "./components/ModalPlaylistDetail";

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<any | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailPlaylist, setDetailPlaylist] = useState<any | null>(null);

    const loadPlaylists = async () => {
        setLoading(true);
        const { playlists, error } = await getPlaylists();
        if (error) {
            toast.error("Failed to load playlists");
        } else {
            setPlaylists(playlists || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPlaylists();
    }, []);

    const filteredPlaylists = playlists.filter(playlist =>
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCreateNew = () => {
        setEditingPlaylist(null);
        setIsEditModalOpen(true);
    };

    const handleEdit = (playlist: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPlaylist(playlist);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (playlistId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this playlist? The videos will remain intact, but the playlist connection will be lost forever.")) {
            return;
        }

        const previousPlaylists = [...playlists];
        // Optimistic delete
        setPlaylists(playlists.filter(p => p.id !== playlistId));

        const { error } = await deletePlaylist(playlistId);

        if (error) {
            setPlaylists(previousPlaylists);
            toast.error("Failed to delete playlist");
        } else {
            toast.success("Playlist deleted successfully");
        }
    };

    const handleOpenDetail = (playlist: any) => {
        setDetailPlaylist(playlist);
        setIsDetailModalOpen(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Library className="w-8 h-8 text-blue-600" />
                        Playliste
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Create beautifully curated collections of your content.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Pretraži playliste..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-4 py-2.5 outline-none font-medium shadow-sm w-full sm:w-64"
                    />
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center sm:justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Playlista
                    </button>
                </div>
            </div>

            {/* Playlists Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64 w-full bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : playlists.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredPlaylists.map((playlist) => (
                        <motion.div
                            key={playlist.id}
                            variants={itemVariants}
                            onClick={() => handleOpenDetail(playlist)}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden w-full">
                                {playlist.thumbnail_url ? (
                                    <Image
                                        src={playlist.thumbnail_url}
                                        alt={playlist.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                        <PlaySquare className="w-12 h-12 text-gray-300 group-hover:text-blue-300 transition-colors" />
                                    </div>
                                )}

                                {/* Overlay / Video Count badge */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-white shadow-sm border border-white/10">
                                    <Video className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold leading-none">
                                        {playlist.playlist_posts?.[0]?.count || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                    {playlist.title}
                                </h3>
                                {playlist.description ? (
                                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                                        {playlist.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-1.5 italic">No description provided</p>
                                )}

                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    <div className="flex gap-1.5 overflow-hidden w-full pr-2">
                                        {playlist.tags && playlist.tags.length > 0 ? (
                                            playlist.tags.slice(0, 2).map((tag: string) => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md truncate">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : null}
                                        {playlist.tags && playlist.tags.length > 2 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                +{playlist.tags.length - 2}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleEdit(playlist, e)}
                                            className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50/0 hover:bg-blue-50 rounded-xl transition-colors tooltip"
                                            title="Edit Playlist"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(playlist.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 bg-gray-50/0 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Delete Playlist"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 w-full text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-5 rotate-3 hover:rotate-6 transition-transform">
                        <Library className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No playlists found</h3>
                    <p className="text-gray-500 max-w-sm mt-3 mb-8">
                        Get started by grouping your awesome posts into categorized playlists.
                    </p>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5" />
                        Create First Playlist
                    </button>
                </div>
            )}

            {/* Modals */}
            <ModalPlaylist
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={editingPlaylist}
                onSuccess={loadPlaylists}
            />

            <ModalPlaylistDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                playlist={detailPlaylist}
                onUpdate={loadPlaylists}
            />
        </div>
    );
}
