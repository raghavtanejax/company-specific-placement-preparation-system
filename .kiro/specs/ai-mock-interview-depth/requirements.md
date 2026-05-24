# Requirements Document

## Introduction

This feature enhances the existing AI Mock Interview module in the company-specific placement preparation system. The current system supports text-based interview sessions with Gemini AI, per-answer scoring, and a basic post-interview summary. This enhancement adds three depth layers: voice input/output support (using browser Web Speech APIs), real-time feedback scoring displayed live during the interview, and a detailed post-interview report that identifies weak areas with actionable improvement guidance. The goal is to make the mock interview experience closer to a real interview and more useful for targeted preparation.

## Glossary

- **Interview_Session**: An active or completed mock interview record stored in MongoDB, identified by an `interviewId`.
- **Voice_Input**: Speech captured from the user's microphone via the Web Speech Recognition API, transcribed to text and submitted as an answer.
- **Voice_Output**: Text-to-speech playback of AI interviewer messages via the Web Speech Synthesis API.
- **Live_Score_Panel**: A UI component visible during the chat phase that displays per-answer scores and a running average score in real time.
- **Answer_Feedback**: The per-answer evaluation object returned by the backend after each user response, containing a score (0–10), correctness flag, strengths, and improvements.
- **Post_Interview_Report**: A detailed summary document generated at interview completion, containing overall score, per-question breakdown, weak area analysis, topic-level performance, and study recommendations.
- **Weak_Area**: A topic or skill domain where the candidate scored below 6/10 across one or more answers in the session.
- **Running_Average**: The mean of all per-answer scores collected so far in the current session, updated after each answer is evaluated.
- **Speech_Recognition**: The browser's `window.SpeechRecognition` or `window.webkitSpeechRecognition` API used for voice input.
- **Speech_Synthesis**: The browser's `window.speechSynthesis` API used for voice output.
- **Gemini_API**: Google's Generative AI API (currently `gemini-2.5-flash` by default) used to generate interview questions, evaluate answers, and produce the post-interview report.
- **Report_Controller**: The backend Express controller responsible for generating and serving the Post_Interview_Report.
- **MockInterview_Model**: The existing Mongoose model (`MockInterview`) that stores interview sessions, messages, and feedback in MongoDB.

---

## Requirements

### Requirement 1: Voice Input During Interview

**User Story:** As a candidate, I want to speak my answers aloud instead of typing, so that I can practice communicating verbally just like in a real interview.

#### Acceptance Criteria

1. WHEN the candidate clicks the microphone button during an active Interview_Session, THE Voice_Input system SHALL begin capturing audio from the user's microphone using the Speech_Recognition API.
2. WHEN Speech_Recognition produces a final transcript, THE Voice_Input system SHALL append the transcript text to the current answer input field, separated from any existing text by a single space, without replacing any text already typed.
3. WHEN the candidate clicks the microphone button while Voice_Input is active, THE Voice_Input system SHALL stop audio capture and set the microphone state to inactive.
4. IF the browser does not support the Speech_Recognition API, THEN THE Interview_Session interface SHALL hide the microphone button and display a tooltip stating "Voice input is not supported in this browser".
5. IF microphone permission is denied by the user or the operating system, THEN THE Voice_Input system SHALL display an inline error message stating "Microphone access denied. Please allow microphone access in your browser settings.", set the microphone state to inactive, and disable further microphone activation attempts until the page is reloaded.
6. WHILE Voice_Input is active, THE Interview_Session interface SHALL display a visual indicator (pulsing animation on the microphone button) to show that audio capture is in progress.
7. WHEN audio capture stops, THE Interview_Session interface SHALL remove the visual indicator within 200ms.
8. WHILE Voice_Input is active, THE Voice_Input system SHALL display interim transcript results in the input field within 500ms of each interim result being produced by Speech_Recognition; finalized text already appended to the input field SHALL NOT be modified by subsequent interim results.
9. WHEN the Speech_Recognition API emits an error event (including no-speech, network, or audio-capture errors), or WHEN no speech is detected for 10 consecutive seconds, THE Voice_Input system SHALL stop audio capture, set the microphone state to inactive, remove the visual indicator within 200ms, and display an inline error message describing the error type.

---

### Requirement 2: Voice Output for AI Interviewer Messages

**User Story:** As a candidate, I want the AI interviewer's questions and feedback to be read aloud, so that I can listen and respond naturally without reading from a screen.

#### Acceptance Criteria

1. WHEN a new AI interviewer message is added to the chat and voice output is enabled, THE Voice_Output system SHALL automatically read the message aloud using the Speech_Synthesis API.
2. WHEN a new AI message begins being spoken, THE Voice_Output system SHALL cancel any currently playing Speech_Synthesis utterance before starting the new one.
3. WHEN the candidate toggles the voice output button to disabled, THE Voice_Output system SHALL cancel any active Speech_Synthesis utterance within 500 milliseconds.
4. WHEN voice output is disabled, THE Voice_Output system SHALL NOT speak subsequent AI messages until re-enabled.
5. THE Voice_Output system SHALL strip markdown formatting characters (asterisks, underscores, backticks, tildes) and emoji characters in the Unicode ranges U+1F000–U+1FAFF and U+2600–U+27BF from the text before passing it to Speech_Synthesis.
6. WHERE the user's browser supports Speech_Synthesis, THE Voice_Output system SHALL default to voice output enabled when the Interview_Session chat phase begins; this default state SHALL NOT be persisted to localStorage.
7. IF the Speech_Synthesis API is unavailable in the browser, THEN THE Interview_Session interface SHALL hide the voice output toggle button.
8. THE Voice_Output system SHALL use `en-US` as the default language for Speech_Synthesis utterances.
9. WHEN the Speech_Synthesis API emits an error event during an utterance, THE Voice_Output system SHALL log the error and SHALL NOT attempt to re-speak the failed utterance.

---

### Requirement 3: Real-Time Feedback Scoring Panel

**User Story:** As a candidate, I want to see my score update after each answer during the interview, so that I can gauge my performance in real time and adjust my approach.

#### Acceptance Criteria

1. WHEN the backend returns an Answer_Feedback object after evaluating a user response, THE Live_Score_Panel SHALL update to display the score for that answer (0–10) within 500ms of the Answer_Feedback being received by the frontend.
2. WHILE an answer evaluation is in flight (request sent but Answer_Feedback not yet received), THE Live_Score_Panel SHALL display a pending indicator for that answer slot.
3. WHEN a new Answer_Feedback is received, THE Live_Score_Panel SHALL recalculate and display the Running_Average score, rounded to one decimal place.
4. WHILE the Live_Score_Panel is displaying scores, THE Live_Score_Panel SHALL display a color-coded indicator for each answer score: green for scores 7–10, yellow for scores 4–6, and red for scores 0–3 (inclusive of 0).
5. WHEN the Interview_Session chat phase begins, THE Live_Score_Panel SHALL display an answer count of "0/N answered" where N is the total number of questions for the session; WHEN each Answer_Feedback is received, THE Live_Score_Panel SHALL increment the answered count by one.
6. WHILE the Interview_Session is in the chat phase and the interruption duration does not exceed 30 seconds, THE Live_Score_Panel SHALL remain visible in the chat interface without requiring the candidate to scroll or navigate away from the chat.
7. WHEN an answer is marked `isCorrect: false` in the Answer_Feedback, THE Live_Score_Panel SHALL display a dedicated icon or symbol next to that answer's score entry that is visually differentiated from correct-answer entries.
8. THE Live_Score_Panel SHALL occupy no more than 30% of the viewport width and SHALL NOT overlap the chat message area or the answer input field on screen widths of 768px and above.

---

### Requirement 4: Detailed Post-Interview Report Generation

**User Story:** As a candidate, I want a comprehensive report after my interview that breaks down my performance by question and identifies my weak areas, so that I know exactly what to study next.

#### Acceptance Criteria

1. WHEN an Interview_Session's `completedAt` field is set, THE Report_Controller SHALL generate a Post_Interview_Report using the Gemini_API within 10 seconds.
2. THE Post_Interview_Report SHALL include an overall score (0–100), a recommendation label ("Strong Hire", "Hire", "Lean Hire", "No Hire", or "Strong No Hire"), and a 2–4 sentence overall summary.
3. THE Post_Interview_Report SHALL include a per-question breakdown listing, for each question: the question text, the candidate's answer text, the score (0–10), the correctness flag, the correct answer (if the answer was incorrect), at least one strength, and at least one improvement point (up to three each).
4. THE Post_Interview_Report SHALL identify Weak_Areas as topics or skill domains where the candidate scored below 6/10, and SHALL list at least one and no more than three specific study recommendations per Weak_Area.
5. THE Post_Interview_Report SHALL include a topic-level performance breakdown grouping questions by concept with an average score per group; topic labels SHALL be derived from the question content by the Gemini_API.
6. WHEN the candidate navigates to the review phase after interview completion, THE Interview_Session interface SHALL display the Post_Interview_Report with the following named sections: "Overall Performance", "Question Breakdown", "Topic Performance", "Weak Areas", and "Recommendations".
7. THE Post_Interview_Report SHALL be persisted in the MockInterview_Model so that the candidate can retrieve it by loading a past interview from history.
8. IF the Gemini_API call for report generation fails, THEN THE Report_Controller SHALL generate the Post_Interview_Report from the per-answer Answer_Feedback data already stored in the MockInterview_Model, without returning an error to the client.
9. IF both the Gemini_API call and the fallback generation fail, THEN THE Report_Controller SHALL return an HTTP 503 response with the message "Report generation temporarily unavailable. Please try again later."
10. WHEN the candidate views the Post_Interview_Report, THE Interview_Session interface SHALL provide a "Start New Interview" button that resets the session to the setup phase.

---

### Requirement 5: Weak Area Identification and Study Recommendations

**User Story:** As a candidate, I want the system to tell me specifically which topics I am weak in and what I should study, so that I can focus my preparation efficiently.

#### Acceptance Criteria

1. WHEN a Post_Interview_Report is generated, THE Report_Controller SHALL identify Weak_Areas by grouping all Answer_Feedback objects with scores below 6/10 by topic or concept.
2. WHEN at least one Weak_Area is identified, THE Post_Interview_Report SHALL list each Weak_Area with its average score and between one and three concrete study recommendations.
3. WHEN no Weak_Areas are identified (all answers scored 6/10 or above), THE Post_Interview_Report SHALL display the message "No significant weak areas identified. Focus on maintaining your strengths." in the Weak Areas section.
4. WHEN at least one Weak_Area is identified, THE Post_Interview_Report SHALL NOT display the "No significant weak areas identified" message.
5. WHEN a Post_Interview_Report is generated, THE Report_Controller SHALL derive topic labels for Weak_Areas by submitting the question content and answer feedback to the Gemini_API.
6. IF the Gemini_API call for topic label extraction fails, THEN THE Report_Controller SHALL assign the label "General" to all ungrouped Weak_Area answers and continue report generation without returning an error.
7. WHEN the Post_Interview_Report is displayed, THE Post_Interview_Report SHALL present Weak_Areas sorted by average score in ascending order; Weak_Areas with equal average scores SHALL be sorted alphabetically by topic label.

---

### Requirement 6: Voice and Scoring Feature Persistence Across Sessions

**User Story:** As a candidate, I want my voice preferences to be remembered between sessions, so that I do not have to reconfigure them every time I start a new interview.

#### Acceptance Criteria

1. WHEN the candidate changes the voice output enabled/disabled state, THE Interview_Session interface SHALL attempt to persist this preference to `localStorage` under the key `mockInterview_voiceEnabled`.
2. IF the `localStorage` write fails (e.g., due to storage limits or browser privacy settings), THEN THE Interview_Session interface SHALL continue normally and apply the preference only for the current session.
3. WHEN the Interview_Session interface initializes, THE Voice_Output system SHALL read the `mockInterview_voiceEnabled` value from `localStorage` and apply it as the initial voice output state; IF the stored value is not a recognized boolean string ("true" or "false"), THEN THE Voice_Output system SHALL default to voice output enabled.
4. IF the `mockInterview_voiceEnabled` key is absent from `localStorage`, THEN THE Voice_Output system SHALL default to voice output enabled.
5. THE Interview_Session interface SHALL NOT persist the microphone (voice input) active state across sessions.
6. WHEN a new Interview_Session begins, THE Voice_Input system SHALL always initialize in the inactive state.
