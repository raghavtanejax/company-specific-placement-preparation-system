import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InterviewReport({ report, onStartNew }) {
  if (!report) return null;

  const {
    totalScore,
    recommendation,
    summary,
    perQuestionBreakdown = [],
    topicPerformance = [],
    weakAreas = []
  } = report;

  // Recommendations: consolidated study action items from all weak areas
  const allRecommendations = weakAreas.flatMap(wa => wa.recommendations || []);
  // Deduplicate recommendations
  const uniqueRecommendations = [...new Set(allRecommendations)];

  // Sort weak areas
  const sortedWeakAreas = [...weakAreas].sort((a, b) => {
    if (a.averageScore !== b.averageScore) {
      return a.averageScore - b.averageScore;
    }
    return a.topic.toLowerCase().localeCompare(b.topic.toLowerCase());
  });

  const getRecColor = (rec) => {
    switch (rec) {
      case 'Strong Hire': return 'bg-green-100 text-green-800';
      case 'Hire': return 'bg-blue-100 text-blue-800';
      case 'Lean Hire': return 'bg-yellow-100 text-yellow-800';
      case 'No Hire': return 'bg-orange-100 text-orange-800';
      case 'Strong No Hire': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Interview Report</h2>

      <section data-section="overall-performance" className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Overall Performance</h3>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-full w-40 h-40 border-4 border-indigo-100">
            <span className="text-4xl font-bold text-indigo-600">{totalScore}</span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRecColor(recommendation)}`}>
                {recommendation}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      </section>

      <section data-section="question-breakdown" className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Question Breakdown</h3>
        <div className="space-y-4">
          {perQuestionBreakdown.map((q, idx) => (
            <details key={idx} className="group border border-gray-200 rounded-lg bg-gray-50 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-white rounded-lg group-open:rounded-b-none group-open:border-b">
                <span className="flex-1 pr-4">
                  <span className="text-gray-500 mr-2">Q{idx + 1}:</span>
                  {q.questionText}
                </span>
                <div className="flex items-center gap-3">
                  {q.isCorrect === false && <span className="text-red-500 font-bold" title="Incorrect">✗</span>}
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded border">
                    {q.score}/10
                  </span>
                </div>
              </summary>
              <div className="p-4 space-y-4 text-sm text-gray-700 bg-white border-t rounded-b-lg">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Your Answer:</h4>
                  <p className="bg-gray-50 p-3 rounded">{q.answerText || '(No answer provided)'}</p>
                </div>
                {q.isCorrect === false && q.correctAnswer && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Correct Answer:</h4>
                    <p className="bg-green-50 text-green-800 p-3 rounded">{q.correctAnswer}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {q.strengths && q.strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-1">Strengths:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {q.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {q.improvements && q.improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-amber-700 mb-1">Improvements:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {q.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section data-section="topic-performance" className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Topic Performance</h3>
        {topicPerformance.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} />
                <YAxis dataKey="topic" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="averageScore" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 italic">No topic data available.</p>
        )}
      </section>

      <section data-section="weak-areas" className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Weak Areas</h3>
        {sortedWeakAreas.length > 0 ? (
          <div className="space-y-4">
            {sortedWeakAreas.map((wa, idx) => (
              <div key={idx} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-red-800">{wa.topic}</h4>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">Avg: {wa.averageScore}</span>
                </div>
                {wa.recommendations && wa.recommendations.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                    {wa.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 bg-green-50 border border-green-200 p-4 rounded-lg">
            No significant weak areas identified. Focus on maintaining your strengths.
          </p>
        )}
      </section>

      <section data-section="recommendations" className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Study Recommendations</h3>
        {uniqueRecommendations.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {uniqueRecommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No specific study recommendations.</p>
        )}
      </section>

      <div className="flex justify-center pt-4">
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
