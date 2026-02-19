"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Search, Edit2, Trash2, Calendar, Eye, Heart, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import ModalObjava from "./components/ModalObjava";

// Formatting helper
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function ObjavePage() {
    const supabase = createClient();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [filter, setFilter] = useState("all"); // 'all', '7days', '30days'

    // Fetch Posts
    const fetchPosts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false });

            if (filter === "7days") {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                query = query.gte("created_at", date.toISOString());
            } else if (filter === "30days") {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                query = query.gte("created_at", date.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Neuspješno učitavanje objava");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [filter]);

    // Handlers
    const handleCreateNew = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const handleEdit = (post: any) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleDelete = async (postId: string, imageUrl: string) => {
        if (!window.confirm("Da li ste sigurni da želite obrisati ovu objavu? Ova radnja se ne može poništiti.")) {
            return;
        }

        try {
            // 1. Delete image from storage if exists
            if (imageUrl) {
                const imagePath = imageUrl.split("/").pop(); // Extract filename from URL
                if (imagePath) {
                    await supabase.storage.from("post-images").remove([imagePath]);
                }
            }

            // 2. Delete post from DB
            const { error } = await supabase.from("posts").delete().eq("id", postId);
            if (error) throw error;

            toast.success("Objava uspješno obrisana");
            fetchPosts(); // Refresh list

        } catch (error: any) {
            console.error("Error deleting post:", error);
            toast.error("Neuspješno brisanje objave");
        }
    };

    const handleModalSuccess = () => {
        fetchPosts();
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Upravljanje Objavama
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Kreirajte, uredite i upravljajte svojim sadržajem.
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-4 py-2.5 outline-none font-medium shadow-sm"
                    >
                        <option value="all">Sve vrijeme</option>
                        <option value="30days">Zadnjih 30 dana</option>
                        <option value="7days">Zadnjih 7 dana</option>
                    </select>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Kreiraj Novo
                    </button>
                </div>
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : posts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Objava</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kreirano</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Radnje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                    {post.image_url ? (
                                                        <Image
                                                            src={post.image_url}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{post.title}</p>
                                                    <p className="text-xs text-gray-500 font-mono truncate max-w-xs">/{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                Objavljeno
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {formatDate(post.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(post)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                                    title="Uredi Objavu"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id, post.image_url)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Obriši Objavu"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nema pronađenih objava</h3>
                        <p className="text-gray-500 max-w-sm mt-2 mb-6">
                            Započnite kreiranjem svoje prve objave. Pojavit će se ovdje nakon objavljivanja.
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            Kreiraj Prvu Objavu
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ModalObjava
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingPost}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
