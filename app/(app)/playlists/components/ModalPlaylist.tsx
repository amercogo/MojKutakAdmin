"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import { createPlaylist, updatePlaylist } from "../actions";

interface ModalPlaylistProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess: () => void;
}

export default function ModalPlaylist({
    isOpen,
    onClose,
    initialData,
    onSuccess,
}: ModalPlaylistProps) {
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || "");
                setSlug(initialData.slug || "");
                setDescription(initialData.description || "");
                setTags(initialData.tags || []);
                setImagePreview(initialData.thumbnail_url || null);
            } else {
                setTitle("");
                setSlug("");
                setDescription("");
                setTags([]);
                setImagePreview(null);
                setImageFile(null);
            }
        }
    }, [isOpen, initialData]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (!initialData) {
            setSlug(
                newTitle
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "")
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const newTag = tagsInput.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                if (tags.length >= 5) {
                    toast.error("Možete dodati najviše 5 tagova");
                    return;
                }
                setTags([...tags, newTag]);
            }
            setTagsInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Molimo pošaljite slikovnu datoteku");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Veličina slike treba biti manja od 5MB");
            return;
        }

        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            setImageFile(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            console.error("Error compressing image:", error);
            toast.error("Neuspješna obrada slike");
        }
    };

    const uploadImage = async (file: File) => {
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("post-images") // Reusing the same bucket for simplicity or use 'playlist-thumbnails'
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("post-images")
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new Error("Neuspješno slanje slike");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !slug) {
            toast.error("Molimo popunite obavezna polja");
            return;
        }

        setIsSubmitting(true);

        try {
            let finalImageUrl = initialData?.thumbnail_url;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            if (initialData) {
                const { error } = await updatePlaylist(
                    initialData.id,
                    title,
                    slug,
                    description,
                    tags,
                    finalImageUrl
                );
                if (error) throw new Error(error);
                toast.success("Playlista uspješno ažurirana");
            } else {
                const { error } = await createPlaylist(
                    title,
                    slug,
                    description,
                    tags,
                    finalImageUrl
                );
                if (error) throw new Error(error);
                toast.success("Playlista uspješno kreirana");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving playlist:", error);
            toast.error(error.message || "Neuspješno spremanje playliste");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={!isSubmitting ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {initialData ? "Uredi Playlistu" : "Kreiraj Novu Playlistu"}
                            </h2>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="playlist-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Title and Slug */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">
                                            Naslov <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="npr. React Kurs"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">
                                            Slug <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="react-course"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-mono text-gray-600"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">
                                        Opis
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Dodajte kratak opis o ovoj playlisti..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm resize-none"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Tags */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 flex justify-between">
                                        <span>Tagovi (do 5)</span>
                                        <span className="text-gray-400 font-normal">{tags.length}/5</span>
                                    </label>
                                    <div className="w-full min-h-[46px] p-1.5 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all flex flex-wrap gap-2 bg-white">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-1.5 hover:bg-blue-200 p-0.5 rounded-md transition-colors"
                                                    disabled={isSubmitting}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={tags.length < 5 ? "Upiši i pritisni Enter..." : "Maksimalan broj tagova dostignut"}
                                            className="flex-1 min-w-[120px] px-2 py-1 outline-none text-sm bg-transparent"
                                            disabled={tags.length >= 5 || isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">
                                        Istaknuta Slika
                                    </label>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                        disabled={isSubmitting}
                                    />

                                    {imagePreview ? (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                                                    disabled={isSubmitting}
                                                >
                                                    <Upload className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setImageFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                                    }}
                                                    className="p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-full text-white transition-colors"
                                                    disabled={isSubmitting}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSubmitting}
                                            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700">
                                                    Klikni za upload slike
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    PNG, JPG ili WebP (max. 5MB)
                                                </p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Odustani
                            </button>
                            <button
                                type="submit"
                                form="playlist-form"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {initialData ? "Sačuvaj Promjene" : "Kreiraj Playlistu"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
