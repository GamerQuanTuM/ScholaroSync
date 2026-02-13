"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Calculator, Info, RefreshCw, GraduationCap, Edit2, Download, Eye, X, CheckCircle2, FileText, LayoutGrid, Save
} from "lucide-react";
import { cn } from "../lib/utils";
import { transcriptRecord, updateTranscript } from "../lib/actions";

import { SessionPayload } from "../lib/session";

interface DBSubject {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
    semesterId: string;
}

interface DBTranscript {
    id: string;
    semester: string | null;
    year: string | null;
    grade10ScaleCGPA: number;
    grade4ScaleCGPA: number;
    studentId: string;
    createdAt: Date;
    updatedAt: Date;
    subjects: DBSubject[];
}

interface Subject {
    id: string;
    code: string;
    name: string;
    credits: number;
    grade: string;
}

const GRADE_POINTS_10: Record<string, number | null> = {
    O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 2,
};

const GRADE_POINTS_4: Record<string, number | null> = {
    O: 4.0, E: 4.0, A: 3.5, B: 3.0, C: 2.5, D: 2.0, F: 0.0,
};

export default function GradeConverter({ session, profile, initialTranscript }: {
    session?: SessionPayload | null,
    profile?: { name: string, rollNumber: string, registrationNumber: string } | null,
    initialTranscript?: DBTranscript | null
}) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [newSubject, setNewSubject] = useState<Omit<Subject, "id">>({
        code: "", name: "", credits: 4, grade: "O",
    });
    const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // 1. Priority: If initialTranscript is passed (Edit Mode)
        if (initialTranscript) {
            setSubjects(initialTranscript.subjects.map((s: DBSubject) => ({
                id: s.id,
                code: s.subjectCode,
                name: s.subjectName,
                credits: s.credits,
                grade: s.grade
            })));
            setSemester(initialTranscript.semester || "");
            setYear(initialTranscript.year || "");
            setActiveTranscriptId(initialTranscript.id);

            if (profile) {
                setStudentName(profile.name);
                setRollNo(profile.rollNumber);
                setRegNo(profile.registrationNumber);
            }

            setIsLoaded(true);
            return;
        }

        // 2. Draft Mode: Load from local storage
        const savedGrades = localStorage.getItem("makaut-grades");
        if (savedGrades) {
            try {
                setSubjects(JSON.parse(savedGrades));
            } catch (e) {
                console.error("Failed to parse grades", e);
            }
        }

        const savedDetails = localStorage.getItem("makaut-details");
        if (savedDetails) {
            try {
                const details = JSON.parse(savedDetails);
                if (details.semester) setSemester(details.semester);
                if (details.year) setYear(details.year);

                // If profile is present, it's the primary source for student details
                if (profile) {
                    setStudentName(profile.name);
                    setRollNo(profile.rollNumber);
                    setRegNo(profile.registrationNumber);
                } else {
                    if (details.studentName) setStudentName(details.studentName);
                    if (details.rollNo) setRollNo(details.rollNo);
                    if (details.regNo) setRegNo(details.regNo);
                }
            } catch (e) {
                console.error("Failed to parse details", e);
            }
        }

        const savedActiveId = localStorage.getItem("makaut-active-transcript-id");
        if (savedActiveId) setActiveTranscriptId(savedActiveId);

        setIsLoaded(true);
    }, [profile, initialTranscript]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("makaut-grades", JSON.stringify(subjects));
    }, [subjects, isLoaded]);

    // New state for report details
    const [semester, setSemester] = useState("");
    const [year, setYear] = useState("");

    // Initialize with profile data if available
    const [studentName, setStudentName] = useState(profile?.name || "");
    const [rollNo, setRollNo] = useState(profile?.rollNumber || "");
    const [regNo, setRegNo] = useState(profile?.registrationNumber || "");

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("makaut-details", JSON.stringify({ semester, year, studentName, rollNo, regNo }));
    }, [semester, year, studentName, rollNo, regNo, isLoaded]);

    const addOrUpdateSubject = () => {
        if (!newSubject.name && !newSubject.code) return;
        if (editingId) {
            setSubjects(subjects.map(s => s.id === editingId ? { ...newSubject, id: editingId } : s));
            setEditingId(null);
        } else {
            setSubjects([...subjects, { ...newSubject, id: Math.random().toString(36).substr(2, 9) }]);
        }
        setNewSubject({ code: "", name: "", credits: 4, grade: "O" });
    };

    const startEdit = (subject: Subject) => {
        setEditingId(subject.id);
        setNewSubject({ ...subject });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewSubject({ code: "", name: "", credits: 4, grade: "O" });
    };

    const removeSubject = (id: string) => {
        setSubjects(subjects.filter((s) => s.id !== id));
        if (editingId === id) cancelEdit();
    };

    const clearAll = () => {
        toast.warning("Are you sure?", {
            description: "This will reset all entries and start a new report.",
            action: {
                label: "Confirm Reset",
                onClick: () => {
                    setSubjects([]);
                    setEditingId(null);
                    setActiveTranscriptId(null);
                    setSemester("");
                    setYear("");
                    localStorage.removeItem("makaut-active-transcript-id");
                    localStorage.removeItem("makaut-grades");
                    localStorage.removeItem("makaut-details");
                    router.replace("/");
                    toast.success("All data cleared.");
                },
            },
        });
    };

    const calculateGPA = (scale: "10" | "4") => {
        const valid = subjects.filter(s => (scale === "10" ? GRADE_POINTS_10[s.grade] : GRADE_POINTS_4[s.grade]) !== null);
        if (valid.length === 0) return (0).toFixed(2);
        const credits = valid.reduce((acc, s) => acc + Number(s.credits), 0);
        const points = valid.reduce((acc, s) => acc + (Number(scale === "10" ? GRADE_POINTS_10[s.grade] : GRADE_POINTS_4[s.grade]) * Number(s.credits)), 0);
        return (points / credits).toFixed(2);
    };

    // const totalCredits = subjects.reduce((acc, s) => acc + Number(s.credits), 0);
    const calculableCredits = subjects.filter(s => GRADE_POINTS_10[s.grade] !== null).reduce((acc, s) => acc + Number(s.credits), 0);

    const handleDownload = () => {
        window.print();
    };

    const handleSave = async () => {
        if (subjects.length === 0) return;

        const currentUserId = session?.userId || userId; // Fallback to local state if needed, but session is primary

        if (!currentUserId) {
            toast.error("Please login to save your transcript.");
            return;
        }

        setIsSaving(true);
        try {
            const transcriptData = {
                semester: semester || undefined,
                year: year || undefined,
                grade10ScaleCGPA: parseFloat(calculateGPA("10")),
                grade4ScaleCGPA: parseFloat(calculateGPA("4")),
                subjects: subjects.map(s => ({
                    code: s.code,
                    name: s.name,
                    credits: s.credits,
                    grade: s.grade
                }))
            };

            let result;
            if (activeTranscriptId) {
                result = await updateTranscript(activeTranscriptId, transcriptData);
            } else {
                result = await transcriptRecord(transcriptData, currentUserId);
            }

            if (result) {
                toast.success(activeTranscriptId ? "Transcript updated successfully!" : "Transcript saved successfully!");
            } else {
                toast.error("Failed to save transcript. Please try again.");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatOrdinal = (val: string, type: "Semester" | "Year") => {
        if (!val) return "";
        const num = parseInt(val);
        if (isNaN(num)) return val; // Return original if not a number (e.g. "Fall")

        // If Year > 1000, probably calendar year
        if (type === "Year" && num > 1000) return `Year ${val}`;

        const v = num % 100;
        const suffixes = ["th", "st", "nd", "rd"];
        const index = (v - 20) % 10;
        const suffix = (suffixes[index] || suffixes[v] || suffixes[0]);

        return `${val}${suffix} ${type}`;
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 selection:bg-primary/30">

            {/* Editing Mode Banner */}
            {activeTranscriptId && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass bg-primary/10 border-primary/20 p-4 rounded-2xl flex items-center justify-between no-print"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-lg">
                            <Edit2 size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Editing Saved Transcript</p>
                            <p className="text-xs text-zinc-400">Changes will overwrite the existing record.</p>
                        </div>
                    </div>
                    <button
                        onClick={clearAll}
                        className="text-xs font-bold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5"
                    >
                        Cancel Edit
                    </button>
                </motion.div>
            )}

            {/* Header Section - Compact */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 print:hidden pt-4"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 glass">
                    <GraduationCap size={32} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        MAKAUT <span className="gradient-text">Converter</span>
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-lg mx-auto mt-1">
                        Batch 2017-21 Grading System • Scholaro Scale 2
                    </p>
                </div>
            </motion.header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:hidden">

                {/* Left Bar: Controls */}
                <aside className="lg:col-span-4 space-y-4 order-2 lg:order-1">
                    {/* Report Details */}
                    <div className="glass rounded-2xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            Report Details
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Student Name</label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={studentName}
                                    onChange={(e) => !profile && setStudentName(e.target.value)}
                                    readOnly={!!profile}
                                    className={cn(
                                        "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm transition-all font-medium text-zinc-200",
                                        profile ? "opacity-60 cursor-not-allowed" : "focus:ring-1 focus:ring-primary/50"
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Reg. No</label>
                                    <input
                                        type="text"
                                        placeholder="Registration No"
                                        value={regNo}
                                        onChange={(e) => !profile && setRegNo(e.target.value)}
                                        readOnly={!!profile}
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm transition-all font-medium text-zinc-200",
                                            profile ? "opacity-60 cursor-not-allowed" : "focus:ring-1 focus:ring-primary/50"
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Roll No</label>
                                    <input
                                        type="text"
                                        placeholder="Roll No"
                                        value={rollNo}
                                        onChange={(e) => !profile && setRollNo(e.target.value)}
                                        readOnly={!!profile}
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm transition-all font-medium text-zinc-200",
                                            profile ? "opacity-60 cursor-not-allowed" : "focus:ring-1 focus:ring-primary/50"
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Semester</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5th"
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-medium text-zinc-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Year</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2023"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-medium text-zinc-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        layout
                        className={cn(
                            "glass rounded-2xl p-5 space-y-5 transition-all duration-300",
                            editingId && "ring-1 ring-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
                        )}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                {editingId ? "Edit Subject" : "New Subject"}
                            </h3>
                            {editingId && (
                                <button
                                    onClick={cancelEdit}
                                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Code</label>
                                    <input
                                        type="text" placeholder="CS501" value={newSubject.code}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Name</label>
                                    <input
                                        type="text" placeholder="Operating Systems" value={newSubject.name}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all"
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Credits</label>
                                        <input
                                            type="number" min="1" max="10" value={newSubject.credits}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all"
                                            onChange={(e) => setNewSubject({ ...newSubject, credits: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Grade</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                            value={newSubject.grade}
                                            onChange={(e) => setNewSubject({ ...newSubject, grade: e.target.value })}
                                        >
                                            {Object.keys(GRADE_POINTS_10).map(g => (
                                                <option key={g} value={g} className="bg-[#050505]">{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={addOrUpdateSubject}
                                className={cn(
                                    "w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg",
                                    editingId ? "bg-white text-black hover:bg-zinc-200" : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                )}
                            >
                                {editingId ? <RefreshCw size={16} /> : <Plus size={16} />}
                                {editingId ? "Update" : "Add Subject"}
                            </button>
                        </div>
                    </motion.div>

                    {/* Mapping Legend */}
                    <div className="glass rounded-2xl p-5 border-white/5 bg-white/2">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={12} /> Scale Reference
                        </h4>
                        <div className="space-y-1">
                            {Object.entries(GRADE_POINTS_4).filter(([k]) => k !== 'F').map(([grade, val], i) => (
                                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                    <span className="text-zinc-400 text-xs font-semibold">{grade} {grade === 'O' || grade === 'E' ? '' : ''}</span>
                                    <span className="text-zinc-200 text-xs font-mono">{val?.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Right Bar: Results & List */}
                <main className="lg:col-span-8 space-y-6 order-1 lg:order-2">

                    {/* Top Info Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-white">Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {subjects.length > 0 && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="glass glass-hover px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border-primary/20 text-zinc-200 disabled:opacity-50"
                                    >
                                        <Save size={14} className={cn("text-primary", isSaving && "animate-spin")} />
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="glass glass-hover px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border-primary/20 text-zinc-200"
                                    >
                                        <Eye size={14} className="text-primary" /> Preview
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="glass glass-hover px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 text-zinc-400 hover:text-red-400 border-white/5"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* KPI Dashboard - Compact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div layout className="glass rounded-2xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-white/10 transition-all">
                                <LayoutGrid size={64} />
                            </div>
                            <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-2">MAKAUT Score (10.0)</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white tracking-tight">{calculateGPA("10")}</span>
                                <span className="text-sm font-medium text-zinc-600">CGPA</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                <FileText size={12} />
                                <span>Credits: <span className="text-zinc-300">{calculableCredits}</span></span>
                            </div>
                        </motion.div>

                        <motion.div layout className="glass rounded-2xl p-5 relative overflow-hidden bg-primary/5 border-primary/20 group">
                            <div className="absolute top-0 right-0 p-4 text-primary/5 group-hover:text-primary/10 transition-all">
                                <GraduationCap size={64} />
                            </div>
                            <p className="text-primary/70 font-bold uppercase tracking-wider text-[10px] mb-2">Scholaro (4.0)</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold gradient-text tracking-tight">{calculateGPA("4")}</span>
                                <span className="text-sm font-medium text-primary/50">GPA</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-primary/60">
                                <CheckCircle2 size={12} />
                                <span>Verified Scale</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Subjects List - Clean Table */}
                    <div className="glass rounded-2xl overflow-hidden min-h-[300px] flex flex-col">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-200">Transcript</h3>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{subjects.length} Subjects</span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {subjects.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center space-y-3 opacity-50">
                                    <Plus size={32} className="text-zinc-700" />
                                    <p className="text-zinc-600 text-xs font-medium">No subjects added</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                            <th className="px-6 py-3 font-medium">Code</th>
                                            <th className="px-6 py-3 font-medium">Subject Name</th>
                                            <th className="px-6 py-3 font-medium text-center">Credits</th>
                                            <th className="px-6 py-3 font-medium text-center">Grade</th>
                                            <th className="px-6 py-3 font-medium text-right">Points</th>
                                            <th className="px-6 py-3 font-medium text-right w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence mode="popLayout">
                                            {subjects.map((sub) => (
                                                <motion.tr
                                                    key={sub.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className={cn(
                                                        "group hover:bg-white/2 transition-colors",
                                                        editingId === sub.id && "bg-primary/5 hover:bg-primary/10"
                                                    )}
                                                >
                                                    <td className="px-6 py-3">
                                                        <span className="font-mono text-xs text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">{sub.code || "---"}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="text-sm font-medium text-zinc-300">{sub.name || "Untitled"}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="text-xs text-zinc-400 font-mono">{sub.credits}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-0.5 rounded border",
                                                            sub.grade === 'F' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                                                        )}>{sub.grade}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="text-sm font-bold text-zinc-200">{GRADE_POINTS_4[sub.grade]?.toFixed(1)}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit(sub)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors">
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button onClick={() => removeSubject(sub.id)} className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-500 hover:text-red-400 transition-colors">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Methodology Section - Compact */}
            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden"
            >
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                        <Calculator size={14} /> Conversion Logic
                    </h4>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 pb-2 border-b border-white/5">
                            <span>MAKAUT Grade</span>
                            <span>Scholaro GPA</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">O (10)</span>
                                <span className="text-primary font-bold">4.0</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">E (9)</span>
                                <span className="text-primary font-bold">4.0</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">A (8)</span>
                                <span className="text-primary font-bold">3.5</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">B (7)</span>
                                <span className="text-primary font-bold">3.0</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">C (6)</span>
                                <span className="text-primary font-bold">2.5</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-300">D (5)</span>
                                <span className="text-primary font-bold">2.0</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono border-t border-white/5 pt-1 mt-1">
                                <span className="text-red-400">F (2)</span>
                                <span className="text-red-500 font-bold">0.0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                        <Info size={14} /> Method
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        We use the <span className="text-zinc-300 font-medium">Scholaro International Scale</span> for verifying 2017-21 batch grades. This method applies a weighted average to individual grades (O=4.0, A=3.5, etc.) rather than converting the final CGPA directly, ensuring higher accuracy for US/Canada applications.
                    </p>
                </div>
            </motion.footer>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 print:hidden"
                    >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl border border-white/10 flex flex-col shadow-2xl bg-zinc-900"
                        >
                            {/* Modal Controls */}
                            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Eye size={16} className="text-primary" /> Report Preview
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDownload}
                                        className="bg-zinc-100 hover:bg-white text-black px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all"
                                    >
                                        <Download size={14} /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Document Sheet - Clean Professional Layout */}
                            <div className="flex-1 overflow-auto bg-zinc-800 p-4 md:p-8">
                                <div
                                    className="bg-white text-black w-full max-w-[210mm] mx-auto p-[10mm] md:p-[15mm] shadow-2xl min-h-[297mm] flex flex-col justify-between"
                                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                                >
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <div className="flex justify-between items-start border-b-2 border-black pb-4">
                                            <div className="space-y-1">
                                                <h1 className="text-2xl font-bold tracking-tight text-black uppercase">Official Transcript</h1>
                                                <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Maulana Abul Kalam Azad University of Technology</p>
                                            </div>
                                            {/* <div className="text-right space-y-1">
                                                <div className="font-mono text-[10px] text-zinc-500">DATE ISSUED</div>
                                                <div className="font-bold text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                            </div> */}
                                        </div>

                                        {/* Student Detail Grid */}
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 py-2 border-b border-zinc-100 pb-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Student Name</p>
                                                    <p className="font-bold text-sm uppercase">{studentName || "---"}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Roll No.</p>
                                                        <p className="font-mono text-xs">{rollNo || "---"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Reg. No.</p>
                                                        <p className="font-mono text-xs">{regNo || "---"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Academic Session</p>
                                                    <p className="font-bold text-sm">
                                                        {semester ? formatOrdinal(semester, "Semester") : "---"}
                                                        {year ? ` (${formatOrdinal(year, "Year")})` : ""}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Credits</p>
                                                        <p className="font-bold text-base">{calculableCredits}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">GPA (4.0 Scale)</p>
                                                        <p className="font-black text-2xl text-black">{calculateGPA("4")}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Table */}
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b-2 border-black text-[10px] font-bold uppercase tracking-wider">
                                                    <th className="text-left py-2 w-20">Code</th>
                                                    <th className="text-left py-2">Subject Title</th>
                                                    <th className="text-center py-2 w-16">Credits</th>
                                                    <th className="text-center py-2 w-16">Grade</th>
                                                    <th className="text-right py-2 w-20">Points</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {subjects.map((sub, i) => (
                                                    <tr key={i}>
                                                        <td className="py-2 font-mono text-zinc-500 text-[10px]">{sub.code || "---"}</td>
                                                        <td className="py-2 font-medium text-black uppercase">{sub.name || "---"}</td>
                                                        <td className="py-2 text-center text-zinc-600 font-mono">{sub.credits}</td>
                                                        <td className="py-2 text-center font-bold tracking-tighter">{sub.grade}</td>
                                                        <td className="py-2 text-right font-bold text-black font-mono">{GRADE_POINTS_4[sub.grade]?.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                                {/* Summary Row */}
                                                <tr className="border-t-2 border-black bg-zinc-50/50">
                                                    <td colSpan={2} className="py-3 text-right font-bold uppercase text-[10px] tracking-wider pr-4">Aggregated Results</td>
                                                    <td className="py-3 text-center font-bold font-mono">{calculableCredits}</td>
                                                    <td className="py-3"></td>
                                                    <td className="py-3 text-right font-black text-lg font-mono">{calculateGPA("4")}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-zinc-200 pt-4 mt-6">
                                        <div className="flex justify-between items-end">
                                            <div className="text-[10px] text-zinc-400 space-y-0.5 uppercase tracking-tighter font-medium">
                                                {/* <p className="font-bold text-zinc-500">Validation Protocol</p>
                                                <p>Scholaro International Standard (Batch 2017-21)</p>
                                                <p>Transcript ID: {activeTranscriptId || "DRAFT-MODE"}</p> */}
                                            </div>
                                            <div className="text-right">
                                                <div className="h-10 w-48 border-b-2 border-black mb-2 ml-auto"></div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-black">Registrar / Auth. Signatory</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Print Content - Optimized for PDF Generation */}
            <div className="hidden print:block text-black bg-white w-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            font-family: 'Times New Roman', Times, serif !important;
                            margin: 0;
                        }
                        .print-container {
                            padding: 15mm !important;
                        }
                    }
                `}} />
                <div className="print-container">
                    <div className="space-y-5">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-4">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight text-black uppercase">Official Transcript</h1>
                                <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Maulana Abul Kalam Azad University of Technology</p>
                            </div>
                            {/* <div className="text-right space-y-1">
                                <div className="font-mono text-[10px] text-zinc-500">DATE ISSUED</div>
                                <div className="font-bold text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div> */}
                        </div>

                        {/* Student Detail Grid */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 py-2 border-b border-zinc-100 pb-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Student Name</p>
                                    <p className="font-bold text-sm uppercase">{studentName || "---"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Roll No.</p>
                                        <p className="font-mono text-xs">{rollNo || "---"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Reg. No.</p>
                                        <p className="font-mono text-xs">{regNo || "---"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Academic Session</p>
                                    <p className="font-bold text-sm">
                                        {semester ? formatOrdinal(semester, "Semester") : "---"}
                                        {year ? ` (${formatOrdinal(year, "Year")})` : ""}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Credits</p>
                                        <p className="font-bold text-base">{calculableCredits}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-0.5">GPA (4.0 Scale)</p>
                                        <p className="font-black text-2xl text-black">{calculateGPA("4")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Table */}
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-black text-[10px] font-bold uppercase tracking-wider">
                                    <th className="text-left py-2 w-20">Code</th>
                                    <th className="text-left py-2">Subject Title</th>
                                    <th className="text-center py-2 w-16">Credits</th>
                                    <th className="text-center py-2 w-16">Grade</th>
                                    <th className="text-right py-2 w-20">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {subjects.map((sub, i) => (
                                    <tr key={i}>
                                        <td className="py-2 font-mono text-zinc-500 text-[10px]">{sub.code || "---"}</td>
                                        <td className="py-2 font-medium text-black uppercase">{sub.name || "---"}</td>
                                        <td className="py-2 text-center text-zinc-600 font-mono">{sub.credits}</td>
                                        <td className="py-2 text-center font-bold tracking-tighter">{sub.grade}</td>
                                        <td className="py-2 text-right font-bold text-black font-mono">{GRADE_POINTS_4[sub.grade]?.toFixed(1)}</td>
                                    </tr>
                                ))}
                                {/* Summary Row */}
                                <tr className="border-t-2 border-black bg-zinc-50/50">
                                    <td colSpan={2} className="py-3 text-right font-bold uppercase text-[10px] tracking-wider pr-4">Aggregated Results</td>
                                    <td className="py-3 text-center font-bold font-mono">{calculableCredits}</td>
                                    <td className="py-3"></td>
                                    <td className="py-3 text-right font-black text-lg font-mono">{calculateGPA("4")}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer - Moved closer to the table */}
                    <div className="border-t border-zinc-200 pt-4 mt-6">
                        <div className="flex justify-between items-end">
                            <div className="text-[9px] text-zinc-600 space-y-1 uppercase tracking-tighter font-medium">
                                {/* <p className="font-bold text-black">Conversion Methodology</p>
                                <p>Scholaro International Standard (MAKAUT Batch 2017-21)</p>
                                <p>O=10(4.0), E=9(4.0), A=8(3.5), B=7(3.0), C=6(2.5), D=5(2.0), F=2(0.0)</p> */}
                            </div>
                            <div className="text-right">
                                <div className="h-10 w-48 border-b-2 border-black mb-2 ml-auto"></div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-black">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

