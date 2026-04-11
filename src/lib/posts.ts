import { supabase } from "./supabase";
import type { Pillar, Post } from "@/types/post";

export async function getPosts(pillar?: Pillar): Promise<Post[]> {
  if (!supabase) return [];

  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (pillar) {
    query = query.eq("pillar", pillar);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return data as Post;
}
