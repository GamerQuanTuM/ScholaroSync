import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import ConversionReport from "@/components/ConversionReport";
import { ArrowLeft, LogOut, BarChart3, FileText } from "lucide-react";
import { logout } from "@/lib/actions";

export const metadata = {
    title: "Conversion Methodology | ScholaroSync — MAKAUT to 4.0 Scale",
    description: "Step-by-step grade conversion methodology from MAKAUT 10-point to Scholaro 4.0 scale — formulas, worked examples, and DGPA calculation.",
};

export default async function ConversionReportPage() {
    const session = await getSession();
    if (!session) redirect("/");

    return (
        <main className="min-h-screen flex flex-col selection:bg-primary/30">
            {/* Decorative Blur Blobs */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <nav className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 print:hidden">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                            <ArrowLeft size={16} /> Back
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">S</div>
                            <span className="font-bold tracking-tight text-xl">Scholaro<span className="text-primary italic">Sync</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
                        <Link href="/dgpa" className="flex items-center gap-2 hover:text-white transition-colors">
                            <BarChart3 size={16} /> <span className="hidden sm:inline">DGPA</span>
                        </Link>
                        <Link href="/transcripts" className="flex items-center gap-2 hover:text-white transition-colors">
                            <FileText size={16} /> <span className="hidden sm:inline">Transcripts</span>
                        </Link>
                        <form action={logout}>
                            <button className="flex items-center gap-2 hover:text-white transition-colors text-red-400">
                                <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto py-12 px-4 flex-1">
                <ConversionReport />
            </div>

            <footer className="border-t border-white/5 py-12 mt-12 bg-black/40 print:hidden">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <p className="text-zinc-500 text-sm">
                        Developed for MAKAUT Students (Batch 2017-2021).
                        Grade conversion based on Scholaro International Standard.
                    </p>
                    <div className="flex justify-center gap-4 grayscale opacity-50">
                        <span className="text-xs uppercase tracking-widest font-semibold font-mono">MAKAUT</span>
                        <span className="text-xs uppercase tracking-widest font-semibold font-mono">Scholaro</span>
                        <span className="text-xs uppercase tracking-widest font-semibold font-mono">WES Standard</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
