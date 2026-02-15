
import AdminSidebar from "@/components/AdminSidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-white dark:bg-neutral-900">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="flex-1 ml-72 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
