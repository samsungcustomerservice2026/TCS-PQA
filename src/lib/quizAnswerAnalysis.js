/** Per-question answer stats for host reports */

export function analyzeQuizQuestions(session, answers = []) {
  const questions = session?.questions || [];
  const stats = questions.map((question, index) => {
    const rows = answers.filter((a) => (a.questionIndex ?? 0) === index);
    const correct = rows.filter((a) => a.correct).length;
    const wrong = rows.length - correct;
    const total = rows.length;
    return {
      index,
      question,
      correct,
      wrong,
      total,
      correctPct: total ? Math.round((correct / total) * 100) : 0,
      wrongPct: total ? Math.round((wrong / total) * 100) : 0,
    };
  });

  const withAnswers = stats.filter((s) => s.total > 0);
  const mostCorrect = withAnswers.length
    ? [...withAnswers].sort((a, b) => b.correctPct - a.correctPct || b.correct - a.correct)[0]
    : null;
  const mostWrong = withAnswers.length
    ? [...withAnswers].sort((a, b) => b.wrongPct - a.wrongPct || b.wrong - a.wrong)[0]
    : null;

  return { stats, mostCorrect, mostWrong };
}

export function questionLabel(question, lang = 'en') {
  if (!question) return '—';
  const prompt = lang === 'ar' && question.promptAr ? question.promptAr : question.prompt;
  return prompt || `Question ${(question.index ?? 0) + 1}`;
}
