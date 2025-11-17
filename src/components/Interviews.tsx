// File: src/pages/Interviews.tsx
import React, { useEffect, useState } from "react";
import InterviewPlayer from "../components/InterviewPlayer";
import { generateQuestions, submitAnswers } from "../services/api";

const InterviewsPage: React.FC = () => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Example: fetch by resume_id. Adapt to your flow.
    (async () => {
      setLoading(true);
      try {
        const qs = await generateQuestions({ resume_id: "demo-resume-id" });
        setQuestions(Array.isArray(qs) ? qs : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleComplete = async (answers: any[]) => {
    try {
      await submitAnswers({ candidate_id: "cand-123", job_id: "job-xyz", answers });
      alert("Interview finished. Answers saved.");
    } catch (e) {
      alert("Finished, but failed to save answers.");
    }
  };

  if (loading) return <div className="p-4">Loading questions…</div>;
  if (!questions.length) return <div className="p-4">No questions. Generate questions from the resume first.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Interview</h1>
      <InterviewPlayer questions={questions} onComplete={handleComplete} />
    </div>
  );
};
export default InterviewsPage;
