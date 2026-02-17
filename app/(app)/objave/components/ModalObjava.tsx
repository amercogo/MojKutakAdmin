"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Image as ImageIcon, X, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import Image from "next/image";

type ModalObjavaProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess: () => void;
};

export default function ModalObjava({ isOpen, onClose, initialData, onSuccess }: ModalObjavaProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [description, setDescription] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Initialize form with data if editing
    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setSlug(initialData.slug || "");
            setContent(initialData.content || "");
            setDescription(initialData.description || "");
            setYoutubeUrl(initialData.youtube_url || "");
            setTags(initialData.tags || []);
            setImagePreview(initialData.image_url || null);
            setFile(null); // Reset file selection
        } else if (isOpen && !initialData) {
            // Reset form for new post
            resetForm();
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setContent("");
        setDescription("");
        setYoutubeUrl("");
        setTags([]);
        setFile(null);
        setImagePreview(null);
        setTagInput("");
    };

    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        if (!initialData) { // Only auto-generate slug for new posts to avoid breaking links
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
        }
    };

    // Handle Image Selection & Compression
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const originalFile = e.target.files[0];

            try {
                // Compression Options
                const options = {
                    maxSizeMB: 0.2, // Target 200KB
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                };

                // Create preview immediately for better UX
                setImagePreview(URL.createObjectURL(originalFile));

                const compressedFile = await imageCompression(originalFile, options);
                setFile(compressedFile);
                toast.success(`Image compressed: ${(compressedFile.size / 1024).toFixed(0)}KB (was ${(originalFile.size / 1024 / 1024).toFixed(2)}MB)`);

            } catch (error) {
                console.error("Image compression error:", error);
                toast.error("Failed to compress image");
            }
        }
    };

    // Remove Image
    const removeImage = () => {
        setFile(null);
        setImagePreview(null);
    };

    // Tag Management
    const addTag = () => {
        if (!tagInput.trim()) return;
        if (tags.length >= 5) {
            toast.error("Max 5 tags allowed");
            return;
        }
        if (tags.includes(tagInput.trim())) {
            toast.error("Tag already exists");
            return;
        }
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Convert keys to array if needed to prevent input bug
    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !slug) {
            toast.error("Title and Slug are required");
            return;
        }

        setLoading(true);

        try {
            let publicImageUrl = imagePreview; // Default to existing URL if editing

            // 1. Upload Image if exists (new file selected)
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${slug}.${fileExt}`;
                const filePath = `${fileName}`;

                // If editing and has old image, maybe delete old one? 
                // optimizing by ignoring delete for now to be safe with storage limits logic simplified

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath);

                publicImageUrl = publicUrlData.publicUrl;
            }

            const postData = {
                title,
                slug,
                content,
                description,
                youtube_url: youtubeUrl || null,
                image_url: publicImageUrl,
                tags,
            };

            let dbError;

            if (initialData) {
                // UPDATE
                const { error } = await supabase
                    .from('posts')
                    .update(postData)
                    .eq('id', initialData.id);
                dbError = error;
            } else {
                // INSERT
                const { error } = await supabase
                    .from('posts')
                    .insert(postData);
                dbError = error;
            }

            if (dbError) throw dbError;

            toast.success(initialData ? "Post updated!" : "Post created!");
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {initialData ? "Edit Post" : "Create New Post"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {initialData ? "Update your article details." : "Add a new article or video."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Reuse Form Layout */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="Enter post title"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="post-slug-url"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Description (Short Summary)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Brief overview for SEO and cards..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 resize-none bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Image & YouTube */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Image Upload */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                <label className="text-sm font-semibold text-gray-700 block">Featured Image</label>

                                {!imagePreview ? (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 bg-white rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="mb-1 text-sm text-gray-500 font-medium">Click to upload</p>
                                            <p className="text-xs text-gray-400">JPG, PNG (Max 10MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                ) : (
                                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200 group bg-white">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* YouTube Link */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-2">
                                <label className="text-sm font-semibold text-gray-700">YouTube URL (Optional)</label>
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                                />
                            </div>

                            {/* Tags */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                                    <span className="text-xs text-gray-400">{tags.length}/5</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium shadow-sm">
                                            <span>#{tag}</span>
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder={tags.length >= 5 ? "Max tags reached" : "Type and press Enter"}
                                        disabled={tags.length >= 5}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        disabled={!tagInput || tags.length >= 5}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Main Content */}
                        <div className="lg:col-span-2">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-2 h-full flex flex-col">
                                <label className="text-sm font-semibold text-gray-700">Content (Markdown / HTML)</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your amazing post content here..."
                                    className="w-full flex-1 px-4 py-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 font-mono text-sm resize-none min-h-[400px] bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {loading ? "Saving..." : (initialData ? "Update Post" : "Publish Post")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
