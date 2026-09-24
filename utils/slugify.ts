/**
 * Turns a title into a URL slug, transliterating Bosnian/Croatian/Serbian letters
 * instead of dropping them: "Šarena salata, pečenje" -> "sarena-salata-pecenje".
 *
 * Keep in sync with the SQL version in utils/supabase/fix_slugs.sql.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        // đ has no decomposed form, so NFD below would not touch it
        .replace(/đ/g, "dj")
        // č -> c + combining caron, then drop the combining marks (also handles é, ü, ...)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
