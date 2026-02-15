
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Dobrodošli, Admine!
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Uspješno ste prijavljeni na Moj Kutak Admin panel.
          </p>
        </div>

        {/* Placeholder functionality for logout or dashboard items */}
        <div className="p-4 border rounded-lg w-full">
          <p className="text-sm text-gray-500">Prijavljeni ste kao: {user.email}</p>
        </div>

      </main>
    </div>
  );
}
