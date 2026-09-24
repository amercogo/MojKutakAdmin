import { createClient } from "@/utils/supabase/server";
import { Eye, Heart, FileText, ArrowUp, ArrowDown, Minus, Calendar } from "lucide-react";
import DashboardChart from "@/components/DashboardChart";

// Helper to format large numbers
const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(
        num
    );
};

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function DashboardPage() {
    const supabase = await createClient();

    // 1. Fetch Aggregated Stats (Efficient query)
    // We sum up the pre-calculated stats from `post_stats`
    const { data: statsData, error: statsError } = await supabase
        .from("post_stats")
        .select("total_views, total_likes");

    if (statsError) {
        console.error("Error fetching stats:", statsError);
    }

    // Calculate totals manually from the fetched rows
    const totalViews = statsData?.reduce((acc, curr) => acc + (curr.total_views || 0), 0) || 0;
    const totalLikes = statsData?.reduce((acc, curr) => acc + (curr.total_likes || 0), 0) || 0;

    // Count posts directly: a new post has no post_stats row until its first view/like
    const { count: postsCount, error: postsCountError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

    if (postsCountError) {
        console.error("Error counting posts:", postsCountError);
    }

    const totalPosts = postsCount || 0;

    // Last 30 days vs. the 30 days before, for the change shown on each card
    const { periodStart, prevPeriodStart } = getPeriodBounds();

    const [viewsChange, likesChange, postsChange] = await Promise.all([
        getPeriodChange(supabase, "page_views", "viewed_at", periodStart, prevPeriodStart),
        getPeriodChange(supabase, "likes", "created_at", periodStart, prevPeriodStart),
        getPeriodChange(supabase, "posts", "created_at", periodStart, prevPeriodStart),
    ]);

    // 2. Fetch Top 5 Posts
    const { data: topPosts, error: postsError } = await supabase
        .from("post_stats")
        .select(`
            post_id,
            total_views,
            total_likes,
            posts (
                title,
                slug,
                created_at
            )
        `)
        .order("total_views", { ascending: false })
        .limit(5);

    if (postsError) {
        console.error("Error fetching top posts:", postsError);
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Admin Analitika
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        Zadnje ažuriranje: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Ukupno Pregleda"
                    value={formatNumber(totalViews)}
                    icon={Eye}
                    change={viewsChange}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatsCard
                    title="Ukupno Lajkova"
                    value={formatNumber(totalLikes)}
                    icon={Heart}
                    change={likesChange}
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                />
                <StatsCard
                    title="Ukupno Objava"
                    value={formatNumber(totalPosts)}
                    icon={FileText}
                    change={postsChange}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section (span 2 cols) */}
                <div className="lg:col-span-2">
                    <DashboardChart />
                </div>

                {/* Top Posts Section (span 1 col) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Najbolje Objave</h3>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                Sve vrijeme
                            </span>
                        </div>
                        <div className="p-0">
                            {topPosts && topPosts.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {topPosts.map((post: any, index) => (
                                        <div
                                            key={post.post_id}
                                            className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
                                        >
                                            <div className={`
                                                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {post.posts?.title || "Objava bez naslova"}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> {formatNumber(post.total_views)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3" /> {formatNumber(post.total_likes)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    Nema pronađenih objava.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Start of the last 30 days and of the 30 days before that, as ISO strings
function getPeriodBounds() {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return {
        periodStart: new Date(now - 30 * DAY_MS).toISOString(),
        prevPeriodStart: new Date(now - 60 * DAY_MS).toISOString(),
    };
}

type PeriodChange = {
    current: number;
    previous: number;
} | null;

// Counts rows in the last 30 days and in the 30 days before that
async function getPeriodChange(
    supabase: Awaited<ReturnType<typeof createClient>>,
    table: string,
    dateColumn: string,
    periodStart: string,
    prevPeriodStart: string
): Promise<PeriodChange> {
    const [current, previous] = await Promise.all([
        supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .gte(dateColumn, periodStart),
        supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .gte(dateColumn, prevPeriodStart)
            .lt(dateColumn, periodStart),
    ]);

    if (current.error || previous.error) {
        console.error(`Error fetching period change for ${table}:`, current.error || previous.error);
        return null;
    }

    return { current: current.count || 0, previous: previous.count || 0 };
}

// Helper Component for Stats Cards
function StatsCard({ title, value, icon: Icon, color, bgColor, change }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${bgColor} ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <ChangeIndicator change={change} />
        </div>
    );
}

function ChangeIndicator({ change }: { change: PeriodChange }) {
    if (!change) {
        return (
            <div className="mt-4 text-sm text-gray-400">
                Promjena trenutno nije dostupna
            </div>
        );
    }

    const { current, previous } = change;

    // No baseline to compare against, so show the raw count instead of a percentage
    if (previous === 0) {
        return (
            <div className="mt-4 text-sm text-gray-500 font-medium">
                {formatNumber(current)}
                <span className="text-gray-400 font-normal ml-2">u zadnjih 30 dana</span>
            </div>
        );
    }

    const percent = Math.round(((current - previous) / previous) * 100);
    const Arrow = percent > 0 ? ArrowUp : percent < 0 ? ArrowDown : Minus;
    const colorClass = percent > 0 ? "text-green-600" : percent < 0 ? "text-red-600" : "text-gray-500";

    return (
        <div className={`mt-4 flex items-center text-sm font-medium ${colorClass}`}>
            <Arrow className="w-4 h-4 mr-1" />
            <span>{percent > 0 ? "+" : ""}{percent}%</span>
            <span className="text-gray-400 font-normal ml-2">u odnosu na prethodnih 30 dana</span>
        </div>
    );
}
