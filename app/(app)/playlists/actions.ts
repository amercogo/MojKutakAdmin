"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPlaylists() {
    const supabase = await createClient();
    const { data: playlists, error } = await supabase
        .from("playlists")
        .select(`
            *,
            playlist_posts (count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching playlists:", error);
        return { error: "Failed to load playlists" };
    }

    return { playlists };
}

export async function createPlaylist(title: string, slug: string, description: string, tags: string[], thumbnailUrl: string | null) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("playlists")
        .insert([{
            title,
            slug,
            description,
            tags,
            thumbnail_url: thumbnailUrl
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating playlist:", error);
        return { error: "Failed to create playlist" };
    }

    revalidatePath("/playlists");
    return { playlist: data };
}

export async function updatePlaylist(id: string, title: string, slug: string, description: string, tags: string[], thumbnailUrl: string | null) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("playlists")
        .update({
            title,
            slug,
            description,
            tags,
            thumbnail_url: thumbnailUrl
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating playlist:", error);
        return { error: "Failed to update playlist" };
    }

    revalidatePath("/playlists");
    return { playlist: data };
}

export async function deletePlaylist(id: string) {
    const supabase = await createClient();

    // Delete playlist_posts relations first to avoid foreign key constraints
    await supabase.from("playlist_posts").delete().eq("playlist_id", id);

    const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting playlist:", error);
        return { error: "Failed to delete playlist" };
    }

    revalidatePath("/playlists");
    return { success: true };
}

export async function getPlaylistVideos(playlistId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("playlist_posts")
        .select(`
            *,
            posts (*)
        `)
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

    if (error) {
        return { error: "Failed to load playlist videos" };
    }

    return { videos: data };
}

export async function removeVideoFromPlaylist(playlistId: string, postId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("playlist_posts")
        .delete()
        .match({ playlist_id: playlistId, post_id: postId });

    if (error) {
        return { error: "Failed to remove video" };
    }

    revalidatePath("/playlists");
    return { success: true };
}

export async function addVideoToPlaylist(playlistId: string, postId: string, position: number = 0) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("playlist_posts")
        .insert([{
            playlist_id: playlistId,
            post_id: postId,
            position
        }]);

    if (error) {
        return { error: "Failed to add video" };
    }

    revalidatePath("/playlists");
    return { success: true };
}

export async function searchPostsNotInPlaylist(playlistId: string, searchQuery: string) {
    const supabase = await createClient();

    // 1. Find all posts currently in the playlist
    const { data: existingPosts } = await supabase
        .from("playlist_posts")
        .select("post_id")
        .eq("playlist_id", playlistId);

    const existingPostIds = existingPosts?.map((p: any) => p.post_id) || [];

    // 2. Search for posts not in that list
    let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
    }

    if (existingPostIds.length > 0) {
        // We use not.in logic. Since Supabase expects a comma separated string for not.in
        query = query.not("id", "in", `(${existingPostIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
        return { error: "Failed to search posts" };
    }

    return { posts: data };
}
