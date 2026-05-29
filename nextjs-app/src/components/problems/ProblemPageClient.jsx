'use client';

/**
 * ProblemPageClient.jsx
 * ──────────────────────
 * Client Component — the interactive right-panel of the problem page.
 *
 * WHY A SEPARATE CLIENT COMPONENT?
 * ──────────────────────────────────
 * The parent `page.js` is a Server Component. It renders all the semantic
 * HTML (h1, description, test cases) on the server for Googlebot.
 *
 * This component handles EVERYTHING that requires browser APIs:
 *   • Monaco Editor (Web Workers, DOM, ResizeObserver)
 *   • Language selection state
 *   • Code execution via Piston API
 *   • Submission feedback
 *   • Framer Motion animations
 *
 * The server component passes `question` as a prop so this component
 * gets all the data it needs WITHOUT making an additional API call
 * (which would increase LCP and waste bandwidth on mobile).
 *
 * LAZY LOADING STRATEGY (ssr: false)
 * ─────────────────────────────────────
 * Monaco Editor is ~4MB of JavaScript. If Next.js tries to include it
 * in the server render or initial bundle, it will:
 *   1. Crash the server (Node.js has no `document`, `window`, or workers)
 *   2. Bloat the JavaScript bundle that Googlebot must download
 *   3. Delay the LCP metric by forcing the browser to parse 4MB of JS
 *      before it can show the user anything
 *
 * `dynamic(() => import(...), { ssr: false })` tells Next.js:
 *   • Don't include this in the server HTML at all.
 *   • Don't include it in the initial client JavaScript bundle.
 *   • Load it asynchronously, in a separate chunk, only when the
 *     browser needs to render this component.
 *   • Show the `loading` fallback until the chunk arrives.
 *
 * This means Core Web Vitals are measured on the FAST server content,
 * and Monaco loads in the background without affecting LCP or FID.
 */

import dynamic              from 'next/dynamic';
import { useState, useRef } from 'react';
import { motion }           from 'framer-motion';
import { Play, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy Monaco Editor — ssr: false is the KEY directive
// ─────────────────────────────────────────────────────────────────────────────

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false, // CRITICAL: Never run Monaco on the server

    // Show a skeleton while the ~4MB Monaco bundle downloads.
    // This skeleton is rendered on the client immediately — zero layout shift.
    loading: () => (
      <div
        style={{
          height:         '400px',
          background:     'rgba(0,0,0,0.4)',
          borderRadius:   '8px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'rgba(255,255,255,0.3)',
          fontFamily:     'JetBrains Mono, monospace',
          fontSize:       '0.85rem',
          border:         '1px solid rgba(255,255,255,0.06)',
          // Skeleton shimmer animation
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
          backgroundSize:  '200% 100%',
          animation:       'shimmer 1.5s infinite',
        }}
        role="status"
        aria-label="Loading code editor..."
      >
        ⚡ Loading editor...
      </div>
    ),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Language presets — default boilerplate for the editor
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGE_STARTERS = {
  javascript: `// JavaScript solution
function solution(input) {
  // Write your code here

}

// Test with first input
console.log(solution(""));`,

  python: `# Python solution
def solution(input_data):
    # Write your code here
    pass

# Test with first input
print(solution(""))`,

  java: `// Java solution
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`,

  cpp: `// C++ solution
#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
};

// Maps display name to Piston API language identifier
const PISTON_LANG_MAP = {
  javascript: { lang: 'javascript', version: '18.15.0' },
  python:     { lang: 'python',     version: '3.10.0'  },
  java:       { lang: 'java',       version: '15.0.2'  },
  cpp:        { lang: 'c++',        version: '10.2.0'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProblemPageClient({ question }) {
  const [language,     setLanguage]     = useState('javascript');
  const [code,         setCode]         = useState(LANGUAGE_STARTERS.javascript);
  const [output,       setOutput]       = useState('');
  const [isRunning,    setIsRunning]    = useState(false);
  const [runResult,    setRunResult]    = useState(null); // 'pass' | 'fail' | 'error'
  const [activeTab,    setActiveTab]    = useState('editor'); // 'editor' | 'output'
  const editorRef = useRef(null);

  // Handle language switch — reset code to the new language's starter
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(LANGUAGE_STARTERS[newLang] || '');
    setOutput('');
    setRunResult(null);
  };

  // Reset editor to the default starter for the current language
  const handleReset = () => {
    setCode(LANGUAGE_STARTERS[language] || '');
    setOutput('');
    setRunResult(null);
  };

  /**
   * handleRun — submits code to the Piston open-source code execution API.
   * Piston runs code in an isolated sandbox with no network access.
   *
   * PISTON API DOCS: https://github.com/engineer-man/piston
   *
   * For production, consider:
   *   1. Self-hosting Piston to avoid rate limits
   *   2. Adding a backend proxy to log execution events
   *   3. Adding JWT auth to the execution endpoint to prevent abuse
   */
  const handleRun = async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    setActiveTab('output');

    try {
      const { lang, version } = PISTON_LANG_MAP[language];

      // Prepare stdin from the first test case (if coding question)
      const stdin = question.testCases?.[0]?.input || '';

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          version,
          files: [{ name: 'solution', content: code }],
          stdin,
        }),
      });

      const result = await response.json();

      if (result.run?.stderr) {
        setOutput(`❌ Runtime Error:\n${result.run.stderr}`);
        setRunResult('error');
      } else {
        const actualOutput   = (result.run?.stdout || '').trim();
        const expectedOutput = (question.testCases?.[0]?.expectedOutput || '').trim();

        setOutput(actualOutput || '(no output)');

        // Auto-check against the first test case's expected output
        if (expectedOutput && actualOutput === expectedOutput) {
          setRunResult('pass');
        } else if (expectedOutput) {
          setRunResult('fail');
        }
      }
    } catch (err) {
      setOutput(`Network error: ${err.message}\nCheck your internet connection or try again.`);
      setRunResult('error');
    } finally {
      setIsRunning(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="problem-editor-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      style={{
        background:    'rgba(255,255,255,0.02)',
        borderRadius:  '16px',
        border:        '1px solid rgba(255,255,255,0.07)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0.75rem 1rem',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          background:     'rgba(0,0,0,0.2)',
          flexWrap:       'wrap',
          gap:            '0.5rem',
        }}
      >
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          aria-label="Select programming language"
          style={{
            background:    'rgba(255,255,255,0.06)',
            border:        '1px solid rgba(255,255,255,0.1)',
            borderRadius:  '6px',
            color:         'var(--text-main)',
            padding:       '0.35rem 0.7rem',
            fontSize:      '0.82rem',
            fontWeight:    600,
            cursor:        'pointer',
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python 3</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleReset}
            aria-label="Reset code to default"
            title="Reset code"
            style={{
              background:    'rgba(255,255,255,0.06)',
              border:        '1px solid rgba(255,255,255,0.1)',
              borderRadius:  '6px',
              color:         'var(--text-muted)',
              padding:       '0.35rem 0.6rem',
              cursor:        'pointer',
              display:       'flex',
              alignItems:    'center',
              gap:           '4px',
              fontSize:      '0.8rem',
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            aria-label={isRunning ? 'Running code...' : 'Run code'}
            style={{
              background:    isRunning ? 'rgba(139,92,246,0.4)' : 'var(--gradient-primary, #8B5CF6)',
              border:        'none',
              borderRadius:  '6px',
              color:         '#fff',
              padding:       '0.35rem 1rem',
              cursor:        isRunning ? 'not-allowed' : 'pointer',
              display:       'flex',
              alignItems:    'center',
              gap:           '6px',
              fontSize:      '0.82rem',
              fontWeight:    700,
              transition:    'opacity 0.2s',
              opacity:       isRunning ? 0.7 : 1,
            }}
          >
            {isRunning
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
              : <><Play size={14} /> Run Code</>
            }
          </button>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display:      'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background:   'rgba(0,0,0,0.15)',
        }}
        role="tablist"
        aria-label="Editor panels"
      >
        {['editor', 'output'].map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:       '0.5rem 1.25rem',
              background:    'none',
              border:        'none',
              borderBottom:  activeTab === tab ? '2px solid #8B5CF6' : '2px solid transparent',
              color:         activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
              cursor:        'pointer',
              fontSize:      '0.82rem',
              fontWeight:    activeTab === tab ? 600 : 400,
              textTransform: 'capitalize',
              transition:    'color 0.15s, border-color 0.15s',
            }}
          >
            {tab === 'output'
              ? `Output ${runResult === 'pass' ? '✅' : runResult === 'fail' ? '❌' : runResult === 'error' ? '⚠️' : ''}`
              : 'Code Editor'
            }
          </button>
        ))}
      </div>

      {/* ── Monaco Editor Panel ──────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        aria-label="Code editor"
        style={{ display: activeTab === 'editor' ? 'block' : 'none' }}
      >
        {/*
          MonacoEditor is loaded with ssr: false — it will only appear after
          the browser has hydrated. The loading skeleton above is shown until
          the ~4MB Monaco bundle has been downloaded and parsed.
        */}
        <MonacoEditor
          height="400px"
          language={language === 'cpp' ? 'cpp' : language}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={(editor) => { editorRef.current = editor; }}
          options={{
            fontSize:               14,
            fontFamily:             'JetBrains Mono, Fira Code, Consolas, monospace',
            fontLigatures:          true,
            minimap:                { enabled: false },
            scrollBeyondLastLine:   false,
            automaticLayout:        true,
            tabSize:                2,
            wordWrap:               'on',
            padding:                { top: 16, bottom: 16 },
            bracketPairColorization:{ enabled: true },
            smoothScrolling:        true,
            cursorBlinking:         'smooth',
            renderLineHighlight:    'gutter',
          }}
        />
      </div>

      {/* ── Output Panel ─────────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        aria-label="Code output"
        style={{ display: activeTab === 'output' ? 'block' : 'none' }}
      >
        {/* Result badge */}
        {runResult && (
          <div
            style={{
              padding:    '0.5rem 1rem',
              background: runResult === 'pass'
                ? 'rgba(16,185,129,0.1)'
                : runResult === 'fail'
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(245,158,11,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display:      'flex',
              alignItems:   'center',
              gap:          '0.5rem',
              fontSize:     '0.82rem',
              fontWeight:   600,
              color:        runResult === 'pass' ? '#34d399' : runResult === 'fail' ? '#f87171' : '#fbbf24',
            }}
            role="alert"
          >
            {runResult === 'pass'
              ? <><CheckCircle size={14} /> Test Case Passed!</>
              : runResult === 'fail'
              ? <><XCircle size={14} /> Output does not match expected.</>
              : <>⚠️ Execution error — check your code</>
            }
          </div>
        )}

        {/* Raw output */}
        <pre
          aria-live="polite"
          aria-label="Code execution output"
          style={{
            margin:     0,
            padding:    '1rem',
            minHeight:  '200px',
            maxHeight:  '400px',
            overflow:   'auto',
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            fontSize:   '0.82rem',
            color:      output ? 'var(--text-main)' : 'var(--text-muted)',
            background: 'rgba(0,0,0,0.3)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}
        >
          {isRunning
            ? 'Executing code...'
            : output || 'Run your code to see output here.'}
        </pre>
      </div>
    </motion.div>
  );
}
