import React from 'react';

export function scoreColor(score) {
  if (score >= 7) return 'green';
  if (score >= 4) return 'yellow';
  return 'red';
}

export function runningAverage(scores) {
  if (!scores || scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export default function LiveScorePanel({ scores = [], totalQuestions = 5, isPending = false }) {
  const avg = runningAverage(scores);

  return (
    <div className="w-full md:max-w-[30vw] bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-4">
      <div className="flex flex-col border-b border-gray-100 pb-3">
        <h3 className="text-lg font-semibold text-gray-800">Live Score</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">{scores.length}/{totalQuestions} answered</span>
          <span className="text-sm font-medium text-gray-700">
            Avg: {avg !== null ? avg : '—'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {scores.map((item, index) => {
          const color = scoreColor(item.score);
          const colorClasses = {
            green: 'bg-green-100 text-green-800 border-green-200',
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            red: 'bg-red-100 text-red-800 border-red-200',
          }[color];

          return (
            <div key={index} className="flex justify-between items-center p-2 rounded border bg-gray-50 border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                {item.isCorrect === false && (
                  <span className="text-red-500 font-bold" title="Incorrect">✗</span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colorClasses}`}>
                {item.score}/10
              </span>
            </div>
          );
        })}

        {isPending && (
          <div className="flex justify-between items-center p-2 rounded border bg-gray-50 border-gray-100 animate-pulse">
            <span className="text-sm font-medium text-gray-400">Evaluating...</span>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    </div>
  );
}
