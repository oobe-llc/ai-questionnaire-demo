import React, { useState, useEffect } from 'react';
import './App.css';

const questionsData = [
  {
    id: 1,
    question: "体の痛みはありますか？",
    options: [
      { text: "はい", nextQuestionId: 2 },
      { text: "いいえ", nextQuestionId: 3 }
    ]
  },
  {
    id: 2,
    question: "痛みがある部位を教えてください。",
    options: [
      { text: "頭", nextQuestionId: 4 },
      { text: "腹部", nextQuestionId: 4 }
    ]
  },
  {
    id: 3,
    question: "特に問題がないようですね。ほかに質問はありますか？",
    options: [
      { text: "はい", nextQuestionId: 5 },
      { text: "いいえ", nextQuestionId: null }
    ]
  },
  {
    id: 4,
    question: "痛みの度合いを教えてください（1〜10）。",
    options: Array.from({ length: 10 }, (_, i) => ({
      text: `${i + 1}`,
      nextQuestionId: null
    }))
  },
  {
    id: 5,
    question: "別の症状を教えてください。",
    options: [
      { text: "頭痛", nextQuestionId: 4 },
      { text: "発熱", nextQuestionId: 4 }
    ]
  }
];

function App() {
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diagnosticHistory, setDiagnosticHistory] = useState([]); // 新しい状態変数

  const currentQuestion = questionsData.find(q => q.id === currentQuestionId);

  // Web Speech API を使った音声認識
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        handleVoiceCommand(speechResult);
      };

      recognition.onend = () => {
        setRecognitionActive(false);
      };

      const startRecognition = () => {
        if (!recognitionActive) {
          setRecognitionActive(true);
          recognition.start();
        }
      };

      const recognitionButton = document.querySelector('#start-recognition');
      if (recognitionButton) {
        recognitionButton.addEventListener('click', startRecognition);
      }

      return () => {
        if (recognitionButton) {
          recognitionButton.removeEventListener('click', startRecognition);
        }
      };
    } else {
      alert("Web Speech APIがこのブラウザでサポートされていません");
    }
  }, [recognitionActive]);

  const handleVoiceCommand = (speechResult) => {
    const normalizedResult = speechResult.trim();
    
    const numberPatterns = [
      { pattern: /いち|1/, value: "1" },
      { pattern: /に|2/, value: "2" },
      { pattern: /さん|3/, value: "3" },
      { pattern: /よん|4/, value: "4" },
      { pattern: /ご|5/, value: "5" },
      { pattern: /ろく|6/, value: "6" },
      { pattern: /しち|7/, value: "7" },
      { pattern: /はち|8/, value: "8" },
      { pattern: /きゅう|9/, value: "9" },
      { pattern: /じゅう|10/, value: "10" }
    ];

    const matchedResult = numberPatterns.find(({ pattern }) => pattern.test(normalizedResult));
    const mappedResult = matchedResult ? matchedResult.value : normalizedResult;

    const option = currentQuestion.options.find(o => o.text === mappedResult);
    if (option) {
      handleAnswer(option.text, option.nextQuestionId);
    } else {
      alert("認識できませんでした。もう一度試してください。");
    }
  };

  const handleOptionClick = (optionText, nextQuestionId) => {
    handleAnswer(optionText, nextQuestionId);
  };

  const handleAnswer = (answerText, nextQuestionId) => {
    // 問診履歴に追加
    setDiagnosticHistory(prevHistory => [
      ...prevHistory,
      { question: currentQuestion.question, answer: answerText }
    ]);

    if (nextQuestionId) {
      setCurrentQuestionId(nextQuestionId);
    } else {
      alert("問診が完了しました。");
    }
  };

  return (
    <div className="App">
      <h1>AI問診アプリ</h1>
      {currentQuestion && (
        <div className="container">
          <h2>{currentQuestion.question}</h2>
          <div className="button-container">
            {currentQuestion.options.map((option, index) => (
              <button key={index} onClick={() => handleOptionClick(option.text, option.nextQuestionId)}>
                {option.text}
              </button>
            ))}
          </div>
          <p>音声認識: {transcript}</p>
          <button id="start-recognition">
            音声で答える
          </button>
        </div>
      )}
      <div className="diagnostic-history">
        <h3>問診履歴</h3>
        <ul>
          {diagnosticHistory.map((item, index) => (
            <li key={index}>
              <strong>{item.question}</strong>: {item.answer}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;