import { getSession } from "../../lib/session";
import { getUserTranscripts } from "../../lib/actions";
import { redirect } from "next/navigation";
import TranscriptsList from "../../components/TranscriptsList";

export const metadata = {
    title: "My Transcripts | MAKAUT Converter",
};

export default async function TranscriptsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/");
    }

    // Function is in lib/actions.ts. I need to ensure I can import it.
    // If lib/actions is a "use server" file, I can import it in another server component.
    const transcripts = await getUserTranscripts();

    return (
        <main className="min-h-screen flex flex-col selection:bg-primary/30">
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="container mx-auto py-12 px-4 flex-1">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Transcripts</h1>
                    <div className="flex items-center gap-4">
                        <a href="/dgpa" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
                            Calculate DGPA &rarr;
                        </a>
                        <a href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            &larr; Back to Converter
                        </a>
                    </div>
                </div>

                <TranscriptsList transcripts={transcripts} />
            </div>
        </main>
    );
}
