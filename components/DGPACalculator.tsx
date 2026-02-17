"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, Eye, X, Download, Calculator, Info,
    TrendingUp, Award, FileText, BarChart3, Printer
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subject {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
}

interface SemesterTranscript {
    id: string;
    semester: string | null;
    year: string | null;
    grade10ScaleCGPA: number;
    grade4ScaleCGPA: number;
    createdAt: Date | string;
    subjects: Subject[];
}

interface DGPACalculatorProps {
    transcripts: SemesterTranscript[];
    profile: { name: string; rollNumber: string; registrationNumber: string } | null;
}

// ─── Grade Point Maps ────────────────────────────────────────────────────────

const GRADE_POINTS_10: Record<string, number> = {
    O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 2,
};

const GRADE_POINTS_4: Record<string, number> = {
    O: 4.0, E: 4.0, A: 3.5, B: 3.0, C: 2.5, D: 2.0, F: 0.0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convertDGPAto4Scale(dgpa10: number): number {
    // Use linear interpolation between MAKAUT grade-point boundaries
    // to map 10-scale DGPA → 4-scale, matching the Scholaro table.
    const breakpoints: [number, number][] = [
        [10, 4.0],
        [9, 4.0],
        [8, 3.5],
        [7, 3.0],
        [6, 2.5],
        [5, 2.0],
        [2, 0.0],
    ];

    if (dgpa10 >= 9) return 4.0;
    if (dgpa10 <= 2) return 0.0;

    for (let i = 0; i < breakpoints.length - 1; i++) {
        const [upper10, upper4] = breakpoints[i];
        const [lower10, lower4] = breakpoints[i + 1];
        if (dgpa10 >= lower10 && dgpa10 <= upper10) {
            const ratio = (dgpa10 - lower10) / (upper10 - lower10);
            return lower4 + ratio * (upper4 - lower4);
        }
    }
    return 0;
}

function formatOrdinal(val: string): string {
    if (!val) return "";
    const num = parseInt(val);
    if (isNaN(num)) return val;
    const v = num % 100;
    const suffixes = ["th", "st", "nd", "rd"];
    const index = (v - 20) % 10;
    const suffix = suffixes[index] || suffixes[v] || suffixes[0];
    return `${val}${suffix}`;
}

function getAcademicYear(semesterNum: string | null): string {
    if (!semesterNum) return "Other";
    const num = parseInt(semesterNum);
    if (isNaN(num)) return semesterNum;
    return String(Math.ceil(num / 2));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DGPACalculator({ transcripts, profile }: DGPACalculatorProps) {
    const [showPreview, setShowPreview] = useState(false);

    // Sort transcripts by semester number (ascending)
    const sortedTranscripts = useMemo(() => {
        return [...transcripts].sort((a, b) => {
            const semA = parseInt(a.semester || "0");
            const semB = parseInt(b.semester || "0");
            return semA - semB;
        });
    }, [transcripts]);

    // ─── Compute per-semester details ────────────────────────────────────────
    const semesterDetails = useMemo(() => {
        return sortedTranscripts.map((t) => {
            const totalCredits = t.subjects.reduce((acc, s) => acc + s.credits, 0);

            // Recalculate SGPA on 10-scale from raw subjects (authoritative)
            const sgpa10Pts = t.subjects.reduce(
                (acc, s) => acc + (GRADE_POINTS_10[s.grade] ?? 0) * s.credits,
                0
            );
            const sgpa10 = totalCredits > 0 ? sgpa10Pts / totalCredits : 0;

            // Recalculate SGPA on 4-scale from raw subjects
            const sgpa4Pts = t.subjects.reduce(
                (acc, s) => acc + (GRADE_POINTS_4[s.grade] ?? 0) * s.credits,
                0
            );
            const sgpa4 = totalCredits > 0 ? sgpa4Pts / totalCredits : 0;

            return {
                ...t,
                totalCredits,
                sgpa10,
                sgpa4,
            };
        });
    }, [sortedTranscripts]);

    // ─── Group semesters by academic year & compute YGPA ───────────────────
    // Use the stored year field for grouping, sort groups & semesters numerically.
    const yearGroups = useMemo(() => {
        const map = new Map<string, typeof semesterDetails>();

        for (const sem of semesterDetails) {
            const yr = sem.year || "Other";
            if (!map.has(yr)) {
                map.set(yr, []);
            }
            map.get(yr)!.push(sem);
        }

        // Build sorted groups with YGPA
        const groups: {
            year: string;
            semesters: typeof semesterDetails;
            ygpa10: number;
            ygpa4: number;
            totalCredits: number;
            totalSubjects: number;
        }[] = [];

        for (const [year, semesters] of map) {
            // Sort semesters within each year by semester number
            semesters.sort((a, b) => parseInt(a.semester || "0") - parseInt(b.semester || "0"));

            // YGPA = (Credit Index Odd Sem + Credit Index Even Sem) / (Credits Odd + Credits Even)
            const yearCredits = semesters.reduce((acc, s) => acc + s.totalCredits, 0);
            const yearSubjects = semesters.reduce((acc, s) => acc + s.subjects.length, 0);

            const creditIndex10 = semesters.reduce((acc, s) => {
                return acc + s.subjects.reduce(
                    (a, sub) => a + (GRADE_POINTS_10[sub.grade] ?? 0) * sub.credits, 0
                );
            }, 0);

            const creditIndex4 = semesters.reduce((acc, s) => {
                return acc + s.subjects.reduce(
                    (a, sub) => a + (GRADE_POINTS_4[sub.grade] ?? 0) * sub.credits, 0
                );
            }, 0);

            const ygpa10 = yearCredits > 0 ? creditIndex10 / yearCredits : 0;
            const ygpa4 = yearCredits > 0 ? creditIndex4 / yearCredits : 0;

            groups.push({ year, semesters, ygpa10, ygpa4, totalCredits: yearCredits, totalSubjects: yearSubjects });
        }

        // Sort groups numerically by year
        groups.sort((a, b) => parseInt(a.year || "0") - parseInt(b.year || "0"));

        return groups;
    }, [semesterDetails]);

    // ─── DGPA Computation (Official MAKAUT Formula) ──────────────────────
    // For 4 Year: DGPA = (YGPA1 + YGPA2 + 1.5×YGPA3 + 1.5×YGPA4) / 5
    // For 3 Year: DGPA = (YGPA1 + YGPA2 + YGPA3) / 3
    // For 2 Year: DGPA = (YGPA1 + YGPA2) / 2
    // For 1 Year: DGPA = YGPA1
    const { dgpa10, dgpa4, totalCreditsAll, totalSubjectsAll } = useMemo(() => {
        const totalCredits = semesterDetails.reduce((acc, s) => acc + s.totalCredits, 0);
        const totalSubjects = semesterDetails.reduce((acc, s) => acc + s.subjects.length, 0);
        const n = yearGroups.length;

        if (n === 0) return { dgpa10: 0, dgpa4: 0, totalCreditsAll: 0, totalSubjectsAll: 0 };

        // MAKAUT weights: Year 1,2 = 1.0; Year 3+ = 1.5
        // For 4-year: denominator = 1 + 1 + 1.5 + 1.5 = 5
        // For 3-year: denominator = 1 + 1 + 1 = 3
        // General: sum of weights
        let weightedSum10 = 0;
        let weightedSum4 = 0;
        let denominator = 0;

        yearGroups.forEach((group, idx) => {
            const yearNum = idx + 1; // 1-indexed year
            const weight = (n >= 4 && yearNum >= 3) ? 1.5 : 1.0;
            weightedSum10 += group.ygpa10 * weight;
            weightedSum4 += group.ygpa4 * weight;
            denominator += weight;
        });

        const d10 = denominator > 0 ? weightedSum10 / denominator : 0;
        const d4 = denominator > 0 ? weightedSum4 / denominator : 0;

        return {
            dgpa10: d10,
            dgpa4: d4,
            totalCreditsAll: totalCredits,
            totalSubjectsAll: totalSubjects,
        };
    }, [semesterDetails, yearGroups]);

    // The 4-scale DGPA computed via MAKAUT weighted formula is the primary
    const finalDGPA4 = dgpa4;

    const handlePrint = () => {
        window.print();
    };

    if (transcripts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto p-6 text-center"
            >
                <div className="glass rounded-2xl p-12 space-y-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
                        <BarChart3 size={48} className="text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-300">No Semesters Found</h2>
                    <p className="text-zinc-500 text-sm max-w-md mx-auto">
                        Save at least one semester transcript from the converter to calculate your DGPA.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Calculator size={16} /> Go to Converter
                    </a>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 selection:bg-primary/30">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 print:hidden pt-4"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 glass">
                    <Award size={32} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Degree <span className="gradient-text">GPA</span>
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-lg mx-auto mt-1">
                        DGPA across all semesters • MAKAUT to Scholaro 4.0 Scale
                    </p>
                </div>
            </motion.header>

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden"
            >
                {/* DGPA 10-scale */}
                <div className="glass rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 text-white/5 group-hover:text-white/10 transition-all">
                        <BarChart3 size={48} />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-2">MAKAUT DGPA</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-white tracking-tight">{dgpa10.toFixed(2)}</span>
                        <span className="text-xs font-medium text-zinc-600">/ 10</span>
                    </div>
                </div>

                {/* DGPA 4-scale */}
                <div className="glass rounded-2xl p-5 relative overflow-hidden bg-primary/5 border-primary/20 group">
                    <div className="absolute top-0 right-0 p-3 text-primary/5 group-hover:text-primary/10 transition-all">
                        <GraduationCap size={48} />
                    </div>
                    <p className="text-primary/70 font-bold uppercase tracking-wider text-[10px] mb-2">Scholaro DGPA</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold gradient-text tracking-tight">{finalDGPA4.toFixed(2)}</span>
                        <span className="text-xs font-medium text-primary/50">/ 4.0</span>
                    </div>
                </div>

                {/* Total Semesters */}
                <div className="glass rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 text-white/5 group-hover:text-white/10 transition-all">
                        <FileText size={48} />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-2">Semesters</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-white tracking-tight">{semesterDetails.length}</span>
                        <span className="text-xs font-medium text-zinc-600">total</span>
                    </div>
                </div>

                {/* Total Credits */}
                <div className="glass rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 text-white/5 group-hover:text-white/10 transition-all">
                        <TrendingUp size={48} />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] mb-2">Total Credits</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-white tracking-tight">{totalCreditsAll}</span>
                        <span className="text-xs font-medium text-zinc-600">earned</span>
                    </div>
                </div>
            </motion.div>

            {/* Semester-wise Breakdown Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-2xl overflow-hidden print:hidden"
            >
                <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                        <BarChart3 size={16} className="text-primary" /> Semester Breakdown
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="glass glass-hover px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border-primary/20 text-zinc-200"
                        >
                            <Eye size={14} className="text-primary" /> Preview
                        </button>
                        <button
                            onClick={handlePrint}
                            className="glass glass-hover px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border-primary/20 text-zinc-200"
                        >
                            <Printer size={14} className="text-primary" /> Print
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                <th className="px-6 py-3 font-medium">Semester</th>
                                <th className="px-6 py-3 font-medium text-center">Subjects</th>
                                <th className="px-6 py-3 font-medium text-center">Credits</th>
                                <th className="px-6 py-3 font-medium text-center">SGPA (10)</th>
                                <th className="px-6 py-3 font-medium text-center">SGPA (4.0)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {semesterDetails.map((sem, i) => (
                                <motion.tr
                                    key={sem.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className="group hover:bg-white/2 transition-colors"
                                >
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                {sem.semester || "?"}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200">
                                                    {sem.semester ? `${formatOrdinal(sem.semester)} Semester` : "Semester"}
                                                </div>
                                                {sem.year && (
                                                    <div className="text-[10px] text-zinc-500">Year {sem.year}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="text-xs text-zinc-400 font-mono">{sem.subjects.length}</span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="text-xs text-zinc-400 font-mono">{sem.totalCredits}</span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="text-sm font-bold text-white font-mono">{sem.sgpa10.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="text-sm font-bold gradient-text font-mono">{sem.sgpa4.toFixed(2)}</span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-primary/20 bg-primary/5">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">DGPA (Overall)</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-zinc-300 font-mono">{totalSubjectsAll}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-zinc-300 font-mono">{totalCreditsAll}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-black text-white font-mono">{dgpa10.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-black gradient-text font-mono">{finalDGPA4.toFixed(2)}</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </motion.div>

            {/* Methodology / Info */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden"
            >
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                        <Calculator size={14} /> DGPA Formula (MAKAUT Official)
                    </h4>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            <span className="text-zinc-200 font-semibold">YGPA</span> (Yearly GPA) combines
                            both semesters of a year:
                        </p>
                        <div className="bg-black/60 rounded-lg p-2.5 font-mono text-[11px] text-primary text-center border border-primary/10">
                            YGPA = (CI<sub>odd</sub> + CI<sub>even</sub>) / (Cr<sub>odd</sub> + Cr<sub>even</sub>)
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            <span className="text-zinc-200 font-semibold">DGPA</span> for 4-year B.Tech:
                        </p>
                        <div className="bg-black/60 rounded-lg p-2.5 font-mono text-[11px] text-primary text-center border border-primary/10">
                            DGPA = (YGPA₁ + YGPA₂ + 1.5×YGPA₃ + 1.5×YGPA₄) / 5
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The <span className="text-zinc-200 font-semibold">4.0 Scale</span> DGPA uses the same MAKAUT
                            weighted formula applied to Scholaro-converted grade points.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                        <Info size={14} /> Scholaro Mapping
                    </h4>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 pb-2 border-b border-white/5">
                            <span>MAKAUT Grade</span>
                            <span>Scholaro GPA</span>
                        </div>
                        {Object.entries(GRADE_POINTS_4).map(([grade, val]) => (
                            <div key={grade} className={`flex justify-between text-xs font-mono ${grade === 'F' ? 'border-t border-white/5 pt-1 mt-1' : ''}`}>
                                <span className={grade === 'F' ? 'text-red-400' : 'text-zinc-300'}>
                                    {grade} ({GRADE_POINTS_10[grade]})
                                </span>
                                <span className={grade === 'F' ? 'text-red-500 font-bold' : 'text-primary font-bold'}>
                                    {val.toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── Preview Modal ─────────────────────────────────────────────── */}
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
                                    <Eye size={16} className="text-primary" /> DGPA Report Preview
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrint}
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

                            {/* Document Preview */}
                            <div className="flex-1 overflow-auto bg-zinc-800 p-4 md:p-8">
                                <div
                                    className="bg-white text-black w-full max-w-[210mm] mx-auto p-[10mm] md:p-[15mm] shadow-2xl min-h-[297mm] flex flex-col justify-between"
                                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                                >
                                    <div className="space-y-6">
                                        {/* Header */}
                                        <div className="flex justify-between items-start border-b-2 border-black pb-4">
                                            <div className="space-y-1">
                                                <h1 className="text-2xl font-bold tracking-tight text-black uppercase">
                                                    Consolidated Grade Report
                                                </h1>
                                                <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">
                                                    Maulana Abul Kalam Azad University of Technology
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="font-mono text-[10px] text-zinc-500">DEGREE GPA</div>
                                                <div className="font-black text-2xl text-black">{finalDGPA4.toFixed(2)}</div>
                                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">4.0 scale</div>
                                            </div>
                                        </div>

                                        {/* Student Details */}
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 py-2 border-b border-zinc-100 pb-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Student Name</p>
                                                    <p className="font-bold text-sm uppercase">{profile?.name || "---"}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Roll No.</p>
                                                        <p className="font-mono text-xs">{profile?.rollNumber || "---"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Reg. No.</p>
                                                        <p className="font-mono text-xs">{profile?.registrationNumber || "---"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Programme</p>
                                                    <p className="font-bold text-sm">Bachelor of Technology</p>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Semesters</p>
                                                        <p className="font-bold text-base">{semesterDetails.length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Credits</p>
                                                        <p className="font-bold text-base">{totalCreditsAll}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Semester-wise SGPA Table */}
                                        <div>
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-3 border-b border-zinc-200 pb-1">
                                                Semester-wise Grade Point Average
                                            </h2>
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b-2 border-black text-[10px] font-bold uppercase tracking-wider">
                                                        <th className="text-left py-2 w-12">#</th>
                                                        <th className="text-left py-2">Semester</th>
                                                        <th className="text-center py-2 w-20">Subjects</th>
                                                        <th className="text-center py-2 w-20">Credits</th>
                                                        <th className="text-center py-2 w-24">SGPA (10)</th>
                                                        <th className="text-right py-2 w-24">SGPA (4.0)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                    {yearGroups.map((group, gIdx) => {
                                                        const weight = (yearGroups.length >= 4 && gIdx + 1 >= 3) ? 1.5 : 1.0;
                                                        return (
                                                            <>
                                                                <tr key={`year-${group.year}`} className="bg-zinc-100">
                                                                    <td colSpan={6} className="py-2 px-2 font-bold text-[11px] uppercase tracking-wider text-black">
                                                                        {formatOrdinal(group.year)} Year
                                                                        {yearGroups.length >= 4 && <span className="ml-2 text-[9px] text-zinc-500 normal-case">(weight: ×{weight})</span>}
                                                                    </td>
                                                                </tr>
                                                                {group.semesters.map((sem) => (
                                                                    <tr key={sem.id}>
                                                                        <td className="py-2 font-mono text-zinc-400 pl-4">{sem.semester || "?"}</td>
                                                                        <td className="py-2 font-medium text-black">
                                                                            {sem.semester ? `${formatOrdinal(sem.semester)} Semester` : "Semester"}
                                                                        </td>
                                                                        <td className="py-2 text-center font-mono text-zinc-600">{sem.subjects.length}</td>
                                                                        <td className="py-2 text-center font-mono text-zinc-600">{sem.totalCredits}</td>
                                                                        <td className="py-2 text-center font-bold font-mono">{sem.sgpa10.toFixed(2)}</td>
                                                                        <td className="py-2 text-right font-bold font-mono">{sem.sgpa4.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr key={`ygpa-${group.year}`} className="bg-zinc-50 border-t border-zinc-200">
                                                                    <td colSpan={2} className="py-1.5 text-right font-bold uppercase text-[9px] tracking-wider pr-4 text-zinc-600">
                                                                        YGPA (Year {group.year})
                                                                    </td>
                                                                    <td className="py-1.5 text-center font-mono text-[10px] text-zinc-500">{group.totalSubjects}</td>
                                                                    <td className="py-1.5 text-center font-mono text-[10px] text-zinc-500">{group.totalCredits}</td>
                                                                    <td className="py-1.5 text-center font-bold font-mono text-[11px]">{group.ygpa10.toFixed(2)}</td>
                                                                    <td className="py-1.5 text-right font-bold font-mono text-[11px]">{group.ygpa4.toFixed(2)}</td>
                                                                </tr>
                                                            </>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-black bg-zinc-50/80">
                                                        <td colSpan={2} className="py-3 text-right font-bold uppercase text-[10px] tracking-wider pr-4">
                                                            Degree Grade Point Average (DGPA)
                                                        </td>
                                                        <td className="py-3 text-center font-bold font-mono">{totalSubjectsAll}</td>
                                                        <td className="py-3 text-center font-bold font-mono">{totalCreditsAll}</td>
                                                        <td className="py-3 text-center font-black text-base font-mono">{dgpa10.toFixed(2)}</td>
                                                        <td className="py-3 text-right font-black text-base font-mono">{finalDGPA4.toFixed(2)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Signature */}
                                        <div className="border-t-2 border-black pt-3 mt-4">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[9px] text-zinc-600 space-y-1 font-medium">
                                                    {/* <p className="font-bold text-black uppercase tracking-wide">Grade Conversion Report</p>
                                                    <p>Scholaro International Standard — MAKAUT India Grading</p>
                                                    <p className="mt-2 text-zinc-400">
                                                        Generated on {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                                                    </p> */}
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Hidden Print Content ───────────────────────────────────────── */}
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
                        .dgpa-print-container {
                            padding: 8mm 10mm !important;
                        }
                        .dgpa-page-break {
                            page-break-before: always;
                        }
                    }
                `}} />
                <div className="dgpa-print-container">
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-2">
                            <div className="space-y-0.5">
                                <h1 className="text-xl font-bold tracking-tight text-black uppercase">
                                    Consolidated Grade Report
                                </h1>
                                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                                    Maulana Abul Kalam Azad University of Technology
                                </p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <div className="font-mono text-[9px] text-zinc-500">DEGREE GPA (4.0 SCALE)</div>
                                <div className="font-black text-xl text-black">{finalDGPA4.toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Student Details */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-1 border-b border-zinc-100 pb-2">
                            <div className="space-y-1.5">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Student Name</p>
                                    <p className="font-bold text-xs uppercase">{profile?.name || "---"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Roll No.</p>
                                        <p className="font-mono text-[10px]">{profile?.rollNumber || "---"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Reg. No.</p>
                                        <p className="font-mono text-[10px]">{profile?.registrationNumber || "---"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Programme</p>
                                    <p className="font-bold text-xs">Bachelor of Technology</p>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Semesters</p>
                                        <p className="font-bold text-sm">{semesterDetails.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Credits</p>
                                        <p className="font-bold text-sm">{totalCreditsAll}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Table */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-3 border-b border-zinc-200 pb-1">
                                Semester-wise Grade Point Average
                            </h2>
                            <table className="w-full text-[10px]">
                                <thead>
                                    <tr className="border-b-2 border-black text-[9px] font-bold uppercase tracking-wider">
                                        <th className="text-left py-1 w-8">#</th>
                                        <th className="text-left py-1">Semester</th>
                                        <th className="text-center py-1 w-16">Subjects</th>
                                        <th className="text-center py-1 w-16">Credits</th>
                                        <th className="text-center py-1 w-20">SGPA (10)</th>
                                        <th className="text-right py-1 w-20">SGPA (4.0)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {yearGroups.map((group, gIdx) => {
                                        const weight = (yearGroups.length >= 4 && gIdx + 1 >= 3) ? 1.5 : 1.0;
                                        return (
                                            <>
                                                <tr key={`print-year-${group.year}`} className="bg-zinc-100">
                                                    <td colSpan={6} className="py-1 px-2 font-bold text-[10px] uppercase tracking-wider text-black">
                                                        {formatOrdinal(group.year)} Year
                                                        {yearGroups.length >= 4 && <span className="ml-2 text-[8px] text-zinc-500 normal-case">(weight: ×{weight})</span>}
                                                    </td>
                                                </tr>
                                                {group.semesters.map((sem) => (
                                                    <tr key={sem.id}>
                                                        <td className="py-1 font-mono text-zinc-400 pl-4 text-[10px]">{sem.semester || "?"}</td>
                                                        <td className="py-1 font-medium text-black text-[10px]">
                                                            {sem.semester ? `${formatOrdinal(sem.semester)} Sem` : "Sem"}
                                                        </td>
                                                        <td className="py-1 text-center font-mono text-zinc-600">{sem.subjects.length}</td>
                                                        <td className="py-1 text-center font-mono text-zinc-600">{sem.totalCredits}</td>
                                                        <td className="py-1 text-center font-bold font-mono">{sem.sgpa10.toFixed(2)}</td>
                                                        <td className="py-1 text-right font-bold font-mono">{sem.sgpa4.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr key={`print-ygpa-${group.year}`} className="bg-zinc-50 border-t border-zinc-200">
                                                    <td colSpan={2} className="py-1.5 text-right font-bold uppercase text-[9px] tracking-wider pr-4 text-zinc-600">
                                                        YGPA (Year {group.year})
                                                    </td>
                                                    <td className="py-1.5 text-center font-mono text-[10px] text-zinc-500">{group.totalSubjects}</td>
                                                    <td className="py-1.5 text-center font-mono text-[10px] text-zinc-500">{group.totalCredits}</td>
                                                    <td className="py-1.5 text-center font-bold font-mono text-[11px]">{group.ygpa10.toFixed(2)}</td>
                                                    <td className="py-1.5 text-right font-bold font-mono text-[11px]">{group.ygpa4.toFixed(2)}</td>
                                                </tr>
                                            </>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black bg-zinc-50/80">
                                        <td colSpan={2} className="py-2 text-right font-bold uppercase text-[9px] tracking-wider pr-4">
                                            Degree Grade Point Average (DGPA)
                                        </td>
                                        <td className="py-2 text-center font-bold font-mono">{totalSubjectsAll}</td>
                                        <td className="py-2 text-center font-bold font-mono">{totalCreditsAll}</td>
                                        <td className="py-2 text-center font-black text-sm font-mono">{dgpa10.toFixed(2)}</td>
                                        <td className="py-2 text-right font-black text-sm font-mono">{finalDGPA4.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Signature */}
                        <div className="border-t-2 border-black pt-3 mt-3">
                            <div className="flex justify-end items-end">
                                <div className="text-right">
                                    <div className="h-10 w-48 border-b-2 border-black mb-2 ml-auto"></div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-black">Authorized Signature</p>
                                </div>
                            </div>
                        </div>

                    </div>


                </div>
            </div>
        </div>
    );
}
