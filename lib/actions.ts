'use server'

import { GradeEnum } from "../lib/generated/prisma";
import prisma from "../lib/prisma";
import { createSession, logout as logoutSession, getSession } from "../lib/session";
import { redirect } from "next/navigation";

// Define the shape of the data coming from the client
interface SubjectInput {
    code: string;
    name: string;
    credits: number;
    grade: string;
}

interface SaveTranscriptParams {
    semester?: string;
    year?: string;
    subjects: SubjectInput[];
    grade10ScaleCGPA: number;
    grade4ScaleCGPA: number;
}

export async function logout() {
    await logoutSession();
    redirect("/");
}

export async function getUserTranscripts() {
    const session = await getSession();
    if (!session || !session.userId) {
        return [];
    }

    try {
        const transcripts = await prisma.semester.findMany({
            where: {
                studentId: session.userId as string,
            },
            include: {
                subjects: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 8,
        });
        return transcripts;
    } catch (error) {
        console.error("Failed to fetch transcripts:", error);
        return [];
    }
}

export async function getStudentProfile() {
    const session = await getSession();
    if (!session || !session.userId) {
        return null;
    }

    try {
        const student = await prisma.student.findUnique({
            where: {
                id: session.userId as string,
            },
            select: {
                name: true,
                registrationNumber: true,
                rollNumber: true,
            }
        });
        return student;
    } catch (error) {
        console.error("Failed to fetch student profile:", error);
        return null;
    }
}


export async function studentRecord(studentData?: { registrationNumber?: string, rollNumber?: string, name?: string }, id?: string) {
    const { registrationNumber, rollNumber, name } = studentData || {};

    if (id) {
        // Update existing student
        return await prisma.student.update({
            where: { id },
            data: {
                registrationNumber,
                rollNumber,
                name,
            },
        });
    }

    if (registrationNumber && rollNumber && name) {
        // Create new student
        return await prisma.student.create({
            data: {
                registrationNumber,
                rollNumber,
                name,
            },
        });
    }

    throw new Error("Missing required student data for creation");
}


export async function transcriptRecord(transcriptData: SaveTranscriptParams, studentId?: string) {
    const { semester, year, subjects, grade10ScaleCGPA, grade4ScaleCGPA } = transcriptData;

    try {
        if (!studentId) {
            throw new Error("Student ID is required to save transcript");
        }

        const transcript = await prisma.semester.create({
            data: {
                semester,
                year,
                grade10ScaleCGPA,
                grade4ScaleCGPA,
                student: {
                    connect: {
                        id: studentId,
                    },
                },
                subjects: {
                    create: subjects.map(subject => ({
                        subjectCode: subject.code,
                        subjectName: subject.name,
                        credits: subject.credits,
                        grade: subject.grade as GradeEnum,
                    })),
                },
            },
        });
        return transcript;
    } catch (error) {
        if (!studentId) {
            throw new Error("Student ID is required to save transcript");
        }
        const transcript = await prisma.semester.create({
            data: {
                semester,
                year,
                grade10ScaleCGPA,
                grade4ScaleCGPA,
                student: {
                    connect: {
                        id: studentId,
                    },
                },
                subjects: {
                    create: subjects.map(subject => ({
                        subjectCode: subject.code,
                        subjectName: subject.name,
                        credits: subject.credits,
                        grade: subject.grade as GradeEnum,
                    })),
                },
            },
        });
        return transcript;
    }
}

export async function login(formData: FormData) {
    const registrationNumber = formData.get("registrationNumber") as string;
    const rollNumber = formData.get("rollNumber") as string;

    // Basic validation
    if (!registrationNumber || !rollNumber) {
        throw new Error("Missing credentials");
    }

    const student = await prisma.student.findUnique({
        where: { rollNumber },
    });

    if (!student || student.registrationNumber !== registrationNumber) {
        throw new Error("Invalid credentials");
    }

    await createSession(student.id);
    redirect("/");
}

export async function register(formData: FormData) {
    const name = formData.get("name") as string;
    const registrationNumber = formData.get("registrationNumber") as string;
    const rollNumber = formData.get("rollNumber") as string;

    if (!name || !registrationNumber || !rollNumber) {
        throw new Error("Missing registration details");
    }
    try {
        const student = await studentRecord({ name, registrationNumber, rollNumber });
        await createSession(student.id);
    } catch (error) {
        console.error("Registration/Session error:", error);
        throw error;
    }

    redirect("/");
}

export async function deleteTranscript(transcriptId: string) {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Unauthorized");
    }

    try {
        const transcript = await prisma.semester.findUnique({
            where: { id: transcriptId },
            select: { studentId: true }
        });

        if (!transcript || transcript.studentId !== session.userId) {
            throw new Error("Unauthorized or transcript not found");
        }

        await prisma.$transaction([
            prisma.subject.deleteMany({ where: { semesterId: transcriptId } }),
            prisma.semester.delete({ where: { id: transcriptId } })
        ]);

        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        throw error;
    }
}

export async function updateTranscript(transcriptId: string, transcriptData: SaveTranscriptParams) {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Unauthorized");
    }

    const { semester, year, subjects, grade10ScaleCGPA, grade4ScaleCGPA } = transcriptData;

    try {
        const transcript = await prisma.semester.findUnique({
            where: { id: transcriptId },
            select: { studentId: true }
        });

        if (!transcript || transcript.studentId !== session.userId) {
            throw new Error("Unauthorized or transcript not found");
        }

        await prisma.$transaction([
            prisma.subject.deleteMany({ where: { semesterId: transcriptId } }),
            prisma.semester.update({
                where: { id: transcriptId },
                data: {
                    semester,
                    year,
                    grade10ScaleCGPA,
                    grade4ScaleCGPA,
                    subjects: {
                        create: subjects.map(subject => ({
                            subjectCode: subject.code,
                            subjectName: subject.name,
                            credits: subject.credits,
                            grade: subject.grade as GradeEnum,
                        })),
                    },
                },
            })
        ]);

        return { success: true };
    } catch (error) {
        console.error("Update error:", error);
        throw error;
    }
}

export async function getTranscriptById(transcriptId: string) {
    const session = await getSession();
    if (!session || !session.userId) {
        return null;
    }

    try {
        const transcript = await prisma.semester.findUnique({
            where: { id: transcriptId },
            include: {
                subjects: true,
            },
        });

        if (!transcript || transcript.studentId !== session.userId) {
            return null;
        }

        return transcript;
    } catch (error) {
        console.error("Fetch transcript error:", error);
        return null;
    }
}

