// Google Gemini AI Service for College Management System
// Proxies AI requests securely through the server backend (/api/chat) without exposing client-side credentials.

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

export async function askGemini(prompt: string, systemInstruction?: string): Promise<GeminiResponse> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        role: 'advisor',
        context: systemInstruction ? { instruction: systemInstruction } : {},
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.reply || '',
      success: true,
    };
  } catch (err: any) {
    console.warn('[Gemini AI Service]:', err.message);
    return {
      text: '',
      success: false,
      error: err.message || 'Failed to connect to AI Assistant',
    };
  }
}

export async function generateStudentAcademicSummary(student: {
  name: string;
  grade: string;
  attendancePercent?: number;
  results?: Array<{ subject: string; marks: number; grade: string }>;
}): Promise<string> {
  const prompt = `Please generate an encouraging and insightful academic performance summary for this student:
Name: ${student.name}
Class / Semester: ${student.grade}
Attendance: ${student.attendancePercent ?? 'N/A'}%
Grades: ${student.results?.map((r) => `${r.subject}: ${r.grade} (${r.marks}/100)`).join(', ') || 'N/A'}

Provide 3 short bullet points: Strengths, Areas for Improvement, and General Recommendation.`;

  const res = await askGemini(prompt, 'You are an experienced college academic advisor writing brief, constructive reports.');
  return res.text;
}

export async function draftCampusNotice(title: string, details: string): Promise<string> {
  const prompt = `Draft a formal college announcement circular for students and faculty:
Topic: ${title}
Key Information: ${details}
Keep it concise, professional, and clear.`;

  const res = await askGemini(prompt, 'You are the registrar / administrative head of a top university.');
  return res.text;
}
