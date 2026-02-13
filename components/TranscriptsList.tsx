"use client"
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle2, Trash2, Edit2, Loader2, ArrowRight } from "lucide-react";
import { deleteTranscript } from "@/lib/actions";

interface Subject {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
}

interface Transcript {
    id: string;
    semester?: string | null;
    year?: string | null;
    grade10ScaleCGPA: number;
    grade4ScaleCGPA: number;
    createdAt: Date | string;
    subjects: Subject[];
}

export default function TranscriptsList({ transcripts: initialTranscripts }: { transcripts: Transcript[] }) {
    const [transcripts, setTranscripts] = useState<Transcript[]>(initialTranscripts);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        toast.warning("Delete Transcript?", {
            description: "Are you sure you want to delete this transcript? Action cannot be undone.",
            action: {
                label: "Delete",
                onClick: async () => {
                    setIsDeleting(id);
                    try {
                        await deleteTranscript(id);
                        setTranscripts(transcripts.filter(t => t.id !== id));
                        toast.success("Transcript deleted successfully");
                    } catch (error) {
                        console.error(error);
                        toast.error("Failed to delete transcript");
                    } finally {
                        setIsDeleting(null);
                    }
                }
            }
        });
    };

    const handleEdit = (transcript: Transcript) => {
        // Prepare data for GradeConverter
        const formattedSubjects = transcript.subjects.map((s) => ({
            id: Math.random().toString(36).substring(2, 11),
            code: s.subjectCode,
            name: s.subjectName,
            credits: s.credits,
            grade: s.grade
        }));

        localStorage.setItem("makaut-grades", JSON.stringify(formattedSubjects));
        localStorage.setItem("makaut-details", JSON.stringify({
            semester: transcript.semester,
            year: transcript.year,
        }));
        localStorage.setItem("makaut-active-transcript-id", transcript.id);

        router.push("/");
    };

    if (!transcripts || transcripts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 glass rounded-2xl">
                <FileText size={48} className="text-zinc-600" />
                <h3 className="text-xl font-bold text-white">No Transcripts Found</h3>
                <p className="text-zinc-400 max-w-md">
                    You haven't saved any transcripts yet. Use the Grade Converter to calculate and save your first transcript.
                </p>
                <a href="/" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    Create New Transcript
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {transcripts.map((t, index) => (
                    <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText size={64} className="text-white" />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {(t.semester && t.semester !== "") ? `Semester ${t.semester}` : `Transcript #${index + 1}`}
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-mono mt-1">
                                        {t.year ? `Year: ${t.year}` : new Date(t.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(t)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-primary transition-all"
                                        title="Edit Transcript"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        disabled={isDeleting === t.id}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
                                        title="Delete Transcript"
                                    >
                                        {isDeleting === t.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 bg-white/5 rounded-xl px-3">
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">MAKAUT</p>
                                    <p className="text-xl font-bold text-white">{t.grade10ScaleCGPA.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-primary/70 uppercase tracking-wider font-bold mb-1">Scholaro</p>
                                    <p className="text-xl font-bold text-primary">{t.grade4ScaleCGPA.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-zinc-600" />
                                    <span>{t.subjects.length} Subjects</span>
                                </div>
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                                >
                                    View Details <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

