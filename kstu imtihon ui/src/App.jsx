import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import ALL_QUESTIONS from './questions.json';

const TOTAL_QUESTIONS = 50;

export default function App() {
  const questions = useMemo(
    () =>
      ALL_QUESTIONS.slice(0, TOTAL_QUESTIONS).map((q, i) => ({
        id: i + 1,
        text: `${i + 1}. ${q.text}`,
        options: q.options,
        correct: q.correct,
      })),
    []
  );

  const [answers, setAnswers] = useState(new Array(TOTAL_QUESTIONS).fill(null));
  const [timeLeft, setTimeLeft] = useState(59 * 60 + 43);
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.getAttribute('data-index'));
          setActiveQuestion(id);
        }
      });
    }, {
      root: null,
      rootMargin: '-30% 0px -70% 0px',
      threshold: 0
    });

    const elements = document.querySelectorAll('.question-card');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [questions]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (index, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[index] = optionIndex;
    setAnswers(newAnswers);
  };

  const currentBatchIndex = Math.floor(activeQuestion / 25);

  return (
    <div className="app-container">
      <div className="top-yellow-bar"></div>
      <header className="header">
        <div className="header-left"></div>

        <div className="header-center">
          <span className="timer-text">{formatTime(timeLeft)}</span>
        </div>

        <div className="header-right">
          <button className="icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-area">
          <div className="exam-info-card">
            <h2>2025/2026 60110500-Boshlang'ich ta'lim (sirtqi) 1-kurs Umumiy psixologiya</h2>
            <p>
              2023/2024 60110500-Bitiruv ishi (sirtqi) 5-kurs Umumiy. Jami {TOTAL_QUESTIONS} ta savol. O'tish bali 30 ball. Buning uchun kamida 15 ta savolga to'g'ri javob berishingiz kerak bo'ladi.
            </p>
          </div>

          <div className="questions-list">
            {questions.map((q, qIndex) => {
              return (
                <div
                  key={qIndex}
                  className="question-card"
                  id={`question-${qIndex}`}
                  data-index={qIndex}
                >
                  <div className="question-text">{q.text}</div>
                  <div className="options-list">
                    {q.options.map((option, optIndex) => {
                      const isCorrect = optIndex === q.correct;
                      return (
                        <label
                          key={optIndex}
                          className={`option-label ${isCorrect ? 'is-correct' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={answers[qIndex] === optIndex}
                            onChange={() => handleOptionSelect(qIndex, optIndex)}
                          />
                          <span className="option-text">{option}</span>
                          <span className="hint-icon" aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-area">
          <div className="answers-card">
            <div className="answers-header">
              <h3>Javoblar</h3>
            </div>
            <div className="answers-grid">
              {Array.from({ length: 25 }).map((_, idx) => {
                const absoluteIndex = currentBatchIndex * 25 + idx;

                if (absoluteIndex >= TOTAL_QUESTIONS) return null;

                const isAnswered = answers[absoluteIndex] !== null;
                const isActive = activeQuestion === absoluteIndex;

                return (
                  <button
                    key={idx}
                    className={`grid-circle ${isActive ? 'active' : (isAnswered ? 'answered' : '')}`}
                    onClick={() => {
                      document.getElementById(`question-${absoluteIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="answers-footer">
              <button className="finish-btn">Yakunlash</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
