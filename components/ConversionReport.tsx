"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, Download, Printer, BookOpen } from "lucide-react";

// ─── Grade Point Maps ────────────────────────────────────────────────────────

const GRADE_POINTS_10: Record<string, number> = {
    O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 2,
};

const GRADE_POINTS_4: Record<string, number> = {
    O: 4.0, E: 4.0, A: 3.5, B: 3.0, C: 2.5, D: 2.0, F: 0.0,
};

const GRADE_DESCRIPTIONS: Record<string, string> = {
    O: "Outstanding",
    E: "Excellent",
    A: "Very Good",
    B: "Good",
    C: "Average",
    D: "Below Average",
    F: "Fail",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversionReport() {
    const [showPreview, setShowPreview] = useState(false);

    const handlePrint = () => window.print();

    // ─── Document Content (shared for preview, inline, and print) ────────
    const DocumentContent = ({ forPrint = false }: { forPrint?: boolean }) => (
        <div
            className={forPrint ? "" : "bg-white text-black w-full max-w-[210mm] mx-auto p-[10mm] md:p-[15mm] shadow-2xl min-h-[297mm]"}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
            <div className={forPrint ? "space-y-4" : "space-y-6"}>
                {/* ── Header ── */}
                <div className="border-b-2 border-black pb-4">
                    <h1 className="text-xl font-bold tracking-tight text-black uppercase text-center">
                        Grade Conversion Methodology
                    </h1>
                    <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest text-center mt-1">
                        Maulana Abul Kalam Azad University of Technology (MAKAUT) — Scholaro 4.0 International Standard
                    </p>
                </div>

                {/* ── SECTION 1: Grade Mapping Table ── */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-zinc-300 pb-1">
                        Section 1: Grade Point Conversion Scale
                    </h2>
                    <p className="text-[10px] text-zinc-600 mb-3 leading-relaxed">
                        The following table shows the one-to-one mapping between MAKAUT letter grades and their
                        corresponding grade points on both the MAKAUT 10-point scale and the Scholaro 4.0 scale.
                        Every subject grade awarded by MAKAUT is converted using this fixed mapping.
                    </p>
                    <table className="w-full text-[10px] border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black text-[9px] font-bold uppercase tracking-wider">
                                <th className="text-left py-2 w-16">Grade</th>
                                <th className="text-left py-2">Description</th>
                                <th className="text-center py-2 w-28">MAKAUT GP (10)</th>
                                <th className="text-center py-2 w-28">Scholaro GP (4.0)</th>
                                <th className="text-center py-2 w-24">Marks Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {Object.entries(GRADE_POINTS_10).map(([grade, gp10]) => (
                                <tr key={grade} className={grade === "F" ? "bg-red-50" : ""}>
                                    <td className="py-2 font-black text-sm">{grade}</td>
                                    <td className="py-2 font-medium">{GRADE_DESCRIPTIONS[grade]}</td>
                                    <td className="py-2 text-center font-bold font-mono">{gp10}</td>
                                    <td className="py-2 text-center font-bold font-mono">{GRADE_POINTS_4[grade].toFixed(1)}</td>
                                    <td className="py-2 text-center text-zinc-500 font-mono">
                                        {grade === "O" ? "≥90" : grade === "E" ? "80–89" : grade === "A" ? "70–79" :
                                            grade === "B" ? "60–69" : grade === "C" ? "50–59" : grade === "D" ? "40–49" : "<40"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-[9px] text-zinc-500 mt-2 italic">
                        Source: Scholaro.com — Evaluation of Foreign Educational Credentials for MAKAUT, West Bengal (Batch 2017-21).
                    </p>
                </div>

                {/* ── SECTION 2: Per-Semester CGPA → 4.0 Conversion ── */}
                <div className="mt-6" style={{ breakBefore: forPrint ? "page" : undefined }}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-zinc-300 pb-1">
                        Section 2: How Per-Semester CGPA Is Converted to the 4.0 Scale
                    </h2>
                    <div className="space-y-4 text-[10px] text-zinc-700 leading-relaxed">
                        <p>
                            MAKAUT awards a letter grade (O, E, A, B, C, D, F) for each subject in a semester.
                            The Semester GPA (SGPA) on the 4.0 scale is derived as follows:
                        </p>

                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">1</span>
                                <div>
                                    <p className="font-bold text-black">Map each letter grade to its 4.0-scale grade point</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        Using the conversion table in Section 1, every MAKAUT letter grade is mapped to
                                        the corresponding Scholaro 4.0 grade point. For example, a grade of &quot;A&quot; (8 on the
                                        10-scale) becomes 3.5 on the 4.0 scale.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">2</span>
                                <div>
                                    <p className="font-bold text-black">Calculate the Credit Index (CI) on the 4.0 scale</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        Multiply each subject&apos;s 4.0-scale grade point by its credit value, then sum across
                                        all subjects in the semester:
                                    </p>
                                    <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-center font-bold mt-2">
                                        CI<sub>4.0</sub> = Σ (GP<sub>4.0, i</sub> × Credits<sub>i</sub>)
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">3</span>
                                <div>
                                    <p className="font-bold text-black">Compute the Semester GPA (SGPA) on the 4.0 scale</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        Divide the 4.0-scale Credit Index by the total credits for that semester:
                                    </p>
                                    <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-center font-bold mt-2">
                                        SGPA<sub>4.0</sub> = CI<sub>4.0</sub> / Total Credits
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worked Example */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-2" style={{ breakInside: "avoid" }}>
                            <p className="font-bold text-[10px] text-black uppercase tracking-wider mb-2">Worked Example</p>
                            <p className="text-[10px] text-zinc-600 mb-2">
                                Suppose a semester has 3 subjects with grades A (3 cr), B (4 cr), E (3 cr):
                            </p>
                            <table className="w-full text-[9px] border-collapse mb-2">
                                <thead>
                                    <tr className="border-b border-zinc-300 text-[8px] font-bold uppercase tracking-wider">
                                        <th className="text-left py-1.5">Subject</th>
                                        <th className="text-center py-1.5 w-14">Grade</th>
                                        <th className="text-center py-1.5 w-14">Credits</th>
                                        <th className="text-center py-1.5 w-16">GP (10)</th>
                                        <th className="text-center py-1.5 w-16">GP (4.0)</th>
                                        <th className="text-center py-1.5 w-16">CI (4.0)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    <tr>
                                        <td className="py-1.5">Subject 1</td>
                                        <td className="py-1.5 text-center font-bold">A</td>
                                        <td className="py-1.5 text-center font-mono">3</td>
                                        <td className="py-1.5 text-center font-mono">8</td>
                                        <td className="py-1.5 text-center font-mono">3.5</td>
                                        <td className="py-1.5 text-center font-mono font-bold">10.5</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5">Subject 2</td>
                                        <td className="py-1.5 text-center font-bold">B</td>
                                        <td className="py-1.5 text-center font-mono">4</td>
                                        <td className="py-1.5 text-center font-mono">7</td>
                                        <td className="py-1.5 text-center font-mono">3.0</td>
                                        <td className="py-1.5 text-center font-mono font-bold">12.0</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5">Subject 3</td>
                                        <td className="py-1.5 text-center font-bold">E</td>
                                        <td className="py-1.5 text-center font-mono">3</td>
                                        <td className="py-1.5 text-center font-mono">9</td>
                                        <td className="py-1.5 text-center font-mono">4.0</td>
                                        <td className="py-1.5 text-center font-mono font-bold">12.0</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black bg-zinc-100">
                                        <td colSpan={2} className="py-1.5 text-right font-bold text-[8px] uppercase pr-2">Total</td>
                                        <td className="py-1.5 text-center font-mono font-bold">10</td>
                                        <td className="py-1.5"></td>
                                        <td className="py-1.5"></td>
                                        <td className="py-1.5 text-center font-mono font-bold">34.5</td>
                                    </tr>
                                </tfoot>
                            </table>
                            <div className="bg-zinc-100 border border-zinc-300 rounded p-2 font-mono text-[10px] text-center font-bold">
                                SGPA<sub>4.0</sub> = 34.5 / 10 = <span className="text-[12px]">3.45</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 3: DGPA (8-Semester) → 4.0 Conversion ── */}
                <div className="mt-6" style={{ breakBefore: forPrint ? "page" : undefined }}>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-zinc-300 pb-1">
                        Section 3: How DGPA (8-Semester) Is Converted to the 4.0 Scale
                    </h2>
                    <div className="space-y-4 text-[10px] text-zinc-700 leading-relaxed">
                        <p>
                            The Degree GPA (DGPA) combines all 8 semesters of the 4-year B.Tech programme using
                            the official MAKAUT weighted formula. The same formula is applied independently to
                            both the 10-point scale and the 4.0 scale to produce the final converted DGPA.
                        </p>

                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">1</span>
                                <div>
                                    <p className="font-bold text-black">Compute YGPA (Yearly GPA) for each year</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        Combine the two semesters in each academic year by summing their Credit Indices
                                        and dividing by their combined total credits:
                                    </p>
                                    <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-center font-bold mt-2">
                                        YGPA = (CI<sub>odd sem</sub> + CI<sub>even sem</sub>) / (Credits<sub>odd</sub> + Credits<sub>even</sub>)
                                    </div>
                                    <p className="text-zinc-500 mt-1 text-[9px]">
                                        This is done separately on both scales — YGPA(10) using 10-scale CIs, and YGPA(4.0) using 4.0-scale CIs.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">2</span>
                                <div>
                                    <p className="font-bold text-black">Apply the MAKAUT weighted formula for DGPA</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        As per the official MAKAUT regulation, Years 1 &amp; 2 carry a weight of <strong>1.0</strong>,
                                        while Years 3 &amp; 4 carry a higher weight of <strong>1.5</strong> (reflecting increased academic rigor):
                                    </p>
                                    <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-center font-bold mt-2">
                                        DGPA = (YGPA₁ × 1.0 + YGPA₂ × 1.0 + YGPA₃ × 1.5 + YGPA₄ × 1.5) / 5
                                    </div>
                                    <p className="text-zinc-500 mt-1 text-[9px]">
                                        Denominator = 1.0 + 1.0 + 1.5 + 1.5 = 5.0
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5">3</span>
                                <div>
                                    <p className="font-bold text-black">Apply the same formula on the 4.0 scale</p>
                                    <p className="text-zinc-600 mt-0.5">
                                        The identical MAKAUT weighted formula is applied to the YGPA values computed from
                                        4.0-scale Credit Indices. This ensures the conversion is done at the <em>subject grade level</em>,
                                        not by mapping the final DGPA number directly:
                                    </p>
                                    <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-center font-bold mt-2">
                                        DGPA<sub>4.0</sub> = (YGPA₁<sub>4.0</sub> × 1.0 + YGPA₂<sub>4.0</sub> × 1.0 + YGPA₃<sub>4.0</sub> × 1.5 + YGPA₄<sub>4.0</sub> × 1.5) / 5
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weight breakdown table */}
                        <div style={{ breakInside: "avoid" }}>
                            <p className="font-bold text-[10px] text-black uppercase tracking-wider mb-2 mt-4">Year Weight Summary</p>
                            <table className="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black text-[9px] font-bold uppercase tracking-wider">
                                        <th className="text-left py-2">Year</th>
                                        <th className="text-left py-2">Semesters</th>
                                        <th className="text-center py-2 w-20">Weight</th>
                                        <th className="text-left py-2">Rationale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    <tr>
                                        <td className="py-2 font-bold">1st Year</td>
                                        <td className="py-2 font-mono text-zinc-600">Sem 1, Sem 2</td>
                                        <td className="py-2 text-center font-mono font-bold">×1.0</td>
                                        <td className="py-2 text-zinc-600">Foundation year</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-bold">2nd Year</td>
                                        <td className="py-2 font-mono text-zinc-600">Sem 3, Sem 4</td>
                                        <td className="py-2 text-center font-mono font-bold">×1.0</td>
                                        <td className="py-2 text-zinc-600">Foundation year</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-bold">3rd Year</td>
                                        <td className="py-2 font-mono text-zinc-600">Sem 5, Sem 6</td>
                                        <td className="py-2 text-center font-mono font-bold">×1.5</td>
                                        <td className="py-2 text-zinc-600">Higher academic rigor</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-bold">4th Year</td>
                                        <td className="py-2 font-mono text-zinc-600">Sem 7, Sem 8</td>
                                        <td className="py-2 text-center font-mono font-bold">×1.5</td>
                                        <td className="py-2 text-zinc-600">Higher academic rigor</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black bg-zinc-50">
                                        <td colSpan={2} className="py-2 font-bold text-[9px] uppercase tracking-wider">Total (Denominator)</td>
                                        <td className="py-2 text-center font-mono font-black">5.0</td>
                                        <td className="py-2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Key Principle */}
                        <div className="bg-zinc-100 border-2 border-black rounded-lg p-4 mt-4 space-y-2" style={{ breakInside: "avoid" }}>
                            <p className="font-bold text-[10px] text-black uppercase tracking-wider">Key Principle</p>
                            <p className="text-[10px] text-zinc-700 leading-relaxed">
                                The conversion from MAKAUT&apos;s 10-point system to the Scholaro 4.0 scale is performed at the
                                <strong> individual subject grade level</strong>, not by mathematically scaling the final CGPA or DGPA.
                                Each subject&apos;s letter grade is independently mapped to its 4.0 equivalent, and all subsequent
                                aggregations (SGPA, YGPA, DGPA) use the same formulas on the converted values.
                                This ensures full transparency and auditability of the final 4.0 GPA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="border-t-2 border-black pt-3 mt-3">
                    <div className="flex justify-between items-end">
                        <div className="text-[9px] text-zinc-600 space-y-1 font-medium">
                            {/* <p className="font-bold text-black uppercase tracking-wide">Conversion Methodology</p>
                            <p>Scholaro International Standard — MAKAUT India Grading</p>
                            <p>O=10(4.0), E=9(4.0), A=8(3.5), B=7(3.0), C=6(2.5), D=5(2.0), F=2(0.0)</p>
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
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 selection:bg-primary/30">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 print:hidden pt-4"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 glass">
                    <BookOpen size={32} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Conversion <span className="gradient-text">Methodology</span>
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-lg mx-auto mt-1">
                        How MAKAUT grades are converted to the Scholaro 4.0 scale — formulas & methodology
                    </p>
                </div>
            </motion.header>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center gap-3 print:hidden"
            >
                <button
                    onClick={() => setShowPreview(true)}
                    className="glass glass-hover px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border-primary/20 text-zinc-200"
                >
                    <Eye size={16} className="text-primary" /> Preview
                </button>
                <button
                    onClick={handlePrint}
                    className="glass glass-hover px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border-primary/20 text-zinc-200"
                >
                    <Printer size={16} className="text-primary" /> Print / PDF
                </button>
            </motion.div>

            {/* Inline Document Preview */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl overflow-hidden print:hidden"
            >
                <div className="px-6 py-4 border-b border-white/5 bg-white/2">
                    <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" /> Document Preview
                    </h3>
                </div>
                <div className="p-4 md:p-8 bg-zinc-800">
                    <DocumentContent />
                </div>
            </motion.div>

            {/* ─── Fullscreen Preview Modal ─── */}
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
                            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Eye size={16} className="text-primary" /> Conversion Methodology
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
                            <div className="flex-1 overflow-auto bg-zinc-800 p-4 md:p-8">
                                <DocumentContent />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Hidden Print Content ─── */}
            <div className="hidden print:block text-black bg-white w-full">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @page { size: A4; margin: 0; }
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            font-family: 'Times New Roman', Times, serif !important;
                            margin: 0;
                        }
                        .conv-print-container { padding: 8mm 10mm !important; }
                    }
                `}} />
                <div className="conv-print-container">
                    <DocumentContent forPrint={true} />
                </div>
            </div>
        </div>
    );
}
