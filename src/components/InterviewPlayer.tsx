import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speakTTS } from "../services/api";

type Answer = { question: string; answer: string; startedAt: number; endedAt: number };
type Props = {
  questions: string[];
  minuteLimit?: number;
  autoStart?: boolean;
  onComplete?: (answers: Answer[]) => void;
};

const ONE_SEC = 1000;

const InterviewPlayer: React.FC<Props> = ({
  questions,
  minuteLimit = 1,
  autoStart = true,
  onComplete,
}) => {
  const [idx, setIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(minuteLimit * 60);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const question = useMemo(() => questions[idx] ?? "", [questions, idx]);

  const stopTimer = useCallback(() => {
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(minuteLimit * 60);
    tickerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickerRef.current!);
          tickerRef.current = null;
        }
        return Math.max(0, s - 1);
      });
    }, ONE_SEC);
  }, [minuteLimit, stopTimer]);

  const playQuestion = useCallback(async () => {
    if (!question) return;
    setIsLoading(true);
    setIsSpeaking(true);
    stopTimer();
    try {
      const blob = await speakTTS(question);
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        startTimeRef.current = Date.now();
        startTimer();
      };
      await audioRef.current.play().catch(() => {
        setIsSpeaking(false);
        startTimeRef.current = Date.now();
        startTimer();
      });
    } catch {
      setIsSpeaking(false);
      startTimeRef.current = Date.now();
      startTimer();
    } finally {
      setIsLoading(false);
    }
  }, [question, startTimer, stopTimer]);

  const next = useCallback((finalize: boolean) => {
    stopTimer();
    const startedAt = startTimeRef.current;
    const endedAt = Date.now();
    setAnswers((prev) => [
      ...prev,
      { question, answer: answer.trim(), startedAt, endedAt },
    ]);
    setAnswer("");
    if (idx + 1 < questions.length) {
      setIdx((n) => n + 1);
      if (!finalize) setTimeout(() => playQuestion(), 40);
    } else {
      onComplete?.([
        ...answers,
        { question, answer: answer.trim(), startedAt, endedAt },
      ]);
    }
  }, [answer, idx, onComplete, playQuestion, question, questions.length, answers, stopTimer]);

  useEffect(() => {
    if (secondsLeft === 0 && !isSpeaking) next(false);
  }, [secondsLeft, isSpeaking, next]);

  useEffect(() => {
    if (!question) return;
    if (autoStart) playQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [stopTimer]);

  const progressPct =
    ((questions.length ? idx + 1 : 0) / Math.max(1, questions.length)) * 100;

  return (
    <div className="w-full max-w-3xl rounded-2xl shadow p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">Question {idx + 1} of {questions.length}</div>
        <div className="text-sm">{secondsLeft}s</div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded">
        <div className="h-2 rounded bg-gray-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mt-4 text-lg font-medium">{question || "No questions."}</div>

      <div className="mt-3 flex gap-2">
        <button
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
          onClick={() => playQuestion()}
        >
          Replay
        </button>
        <button
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          onClick={() => next(false)}
        >
          Skip
        </button>
      </div>

      <textarea
        className="mt-4 w-full rounded border p-3 min-h-[120px]"
        placeholder="Type your answer (optional). Submitting moves to the next question."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={isSpeaking}
      />

      <div className="mt-3 flex justify-end">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={isSpeaking}
          onClick={() => next(false)}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
};
export default InterviewPlayer;