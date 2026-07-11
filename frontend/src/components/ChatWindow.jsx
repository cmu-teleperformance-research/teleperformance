import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import axios from "axios";
import MessageBubble from "./MessageBubble";
import FeedbackPanel from "./FeedbackPanel";
import WorkflowPortal from "./workflow/WorkflowPortal";
import NavBar from "./NavBar";
import { HomeGuideContent } from "./WelcomePage";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/chat`;

const SCENARIO_LABELS = {
  flight_cancellation: "Flight Cancellation",
  baggage_delay: "Lost Baggage",
  refund_request: "Refund Request",
};

export default function ChatWindow({ sessionConfig, token, navProps, onEndSession, onAuthExpired, storedSessionId, initialSessionId, initialCustomerResponse, onSessionRestoreFailed }) {
  // scenario/persona/training are always already known by the time this
  // component mounts — either from InstructionsPage's /start call (fresh
  // session, see initialSessionId/initialCustomerResponse below) or from
  // sessionStorage (resuming a stored session after a page reload).
  const { scenario, persona, training } = sessionConfig;

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [portalStep, setPortalStep] = useState(0);
  const [portalCompleted, setPortalCompleted] = useState([]);
  const [error, setError] = useState(null);
  const [portalHeight, setPortalHeight] = useState(280);
  const [showGuide, setShowGuide] = useState(false);
  const [workflowData, setWorkflowData] = useState({
    searchQuery: "",
    applicationStatus: false,
    searchNotFound: false,
    delayReason: "",
    resolution: "",
    caseNote: "",
    caseOutcome: "",
  });

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // App auth rides on a custom header, not Authorization — that header is
  // reserved for Cloud Run's own "Require authentication" identity check.
  const authHeaders = { "X-App-Token": token };

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current) return;
      const delta = e.clientY - dragStartY.current;
      const containerH = containerRef.current?.clientHeight ?? window.innerHeight;
      const newH = Math.min(Math.max(dragStartHeight.current + delta, 80), containerH - 160);
      setPortalHeight(newH);
    }

    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const activeFeedback =
    selectedIdx !== null ? messages[selectedIdx]?.feedback ?? null : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    console.log("📊 CURRENT MESSAGES:", messages);
  }, [messages]);

  // ADD: Persist messages to sessionStorage per session
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      sessionStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  useEffect(() => {
    const controller = new AbortController();

    async function init() {
      setLoading(true);
      try {
        if (storedSessionId) {
          // ADD: Show cached messages instantly before backend responds
          const cached = sessionStorage.getItem(`messages_${storedSessionId}`);
          if (cached) {
            try { setMessages(JSON.parse(cached)); } catch {}
          }

          const response = await axios.get(
            `${API_BASE_URL}/sessions/${storedSessionId}`,
            { headers: authHeaders, signal: controller.signal }
          );
          setSessionId(Number(storedSessionId));
          setMessages(response.data.messages);
          return;
        }

        // Fresh session — InstructionsPage already called /start and
        // resolved scenario/persona/mode before this component ever mounted,
        // so there's no network call here: just adopt what it got.
        setSessionId(initialSessionId);
        setMessages([{ role: "assistant", content: initialCustomerResponse }]);
      } catch (err) {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) { onAuthExpired(); return; }

        if (storedSessionId) {
          // No /start fallback here anymore — bounce back to the landing
          // flow so a fresh session can be assigned via InstructionsPage.
          onSessionRestoreFailed();
          return;
        }
        setError("Failed to start session. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    init();
    return () => controller.abort();
    // Runs once on mount — a fresh ChatWindow instance is one session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    console.log("🚀 Sending message:", trimmed);

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    if (!training) {
      // ── Streaming path (evaluation mode) ──────────────────────────────────
      const csrIdx = updatedMessages.length - 1;
      let userMessageId = null;
      try {
        const res = await fetch(`${API_BASE_URL}/chat-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/plain",
            "X-App-Token": token,
          },
          cache: "no-store",
          body: JSON.stringify({
            scenario, persona, training,
            message: trimmed,
            history: updatedMessages,
            session_id: sessionId,
          }),
        });

        if (res.status === 401) { onAuthExpired(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        userMessageId = res.headers.get("X-User-Message-Id");

        if (!res.body) {
          setMessages(prev => [...prev, { role: "assistant", content: "Streaming is not supported in this environment. Please try again." }]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let started = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;

            if (!started) {
              started = true;
              flushSync(() => {
                setMessages(prev => [...prev, { role: "assistant", content: chunk }]);
              });
            } else {
              flushSync(() => {
                setMessages(prev => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: next[next.length - 1].content + chunk,
                  };
                  return next;
                });
              });
            }
          }
          if (!started) {
            setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
          }
        } catch (streamErr) {
          console.error("❌ STREAM READ ERROR:", streamErr);
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
            } else {
              next.push({ role: "assistant", content: "Something went wrong. Please try again." });
            }
            return next;
          });
        }
      } catch (err) {
        console.error("❌ STREAM ERROR:", err);
        setMessages(prev => {
          if (prev[prev.length - 1]?.role !== "assistant") {
            return [...prev, { role: "assistant", content: "Something went wrong. Please try again." }];
          }
          return prev;
        });
        setError("Failed to reach the server. Please try again.");
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }

      // Run evaluation pipeline in background (hidden from participant, saved to DB)
      if (userMessageId) {
        axios.post(
          `${API_BASE_URL}/feedback`,
          {
            scenario, persona,
            message: trimmed,
            history: updatedMessages,
            session_id: sessionId,
            user_message_id: Number(userMessageId),
          },
          { headers: authHeaders }
        ).catch(err => {
          console.error("❌ BACKGROUND FEEDBACK ERROR:", err);
        });
      }
      return;
    }

    // ── Non-streaming path (training mode — full JSON with feedback) ───────
    try {
      console.log("📤 Request payload:", {
        scenario,
        persona,
        training,
        message: trimmed,
        history: updatedMessages,
        session_id: sessionId
      });

      const response = await axios.post(
        API_URL,
        {
          scenario,
          persona,
          training,
          message: trimmed,
          history: updatedMessages,
          session_id: sessionId
        },
        { headers: authHeaders }
      );

      console.log("📥 FULL RESPONSE:", response.data);

      const { customer_response, user_message_id } = response.data;
      const csrIdx = updatedMessages.length - 1;

      // Show customer response immediately and unblock the send button
      setMessages(prev => [...prev, { role: "assistant", content: customer_response }]);
      setLoading(false);
      inputRef.current?.focus();

      // Fetch feedback from the separate evaluation pipeline
      setFeedbackLoading(true);
      try {
        const fbRes = await axios.post(
          `${API_BASE_URL}/feedback`,
          {
            scenario,
            persona,
            message: trimmed,
            history: updatedMessages,
            session_id: sessionId,
            user_message_id,
          },
          { headers: authHeaders }
        );
        const fb = fbRes.data.feedback;
        if (fb) {
          setMessages(prev =>
            prev.map((m, i) => i === csrIdx ? { ...m, feedback: fb } : m)
          );
          console.log("🎯 Setting selectedIdx to:", csrIdx);
          setSelectedIdx(csrIdx);
        }
      } catch (fbErr) {
        console.error("❌ FEEDBACK ERROR:", fbErr);
        if (fbErr.response?.status === 401) { onAuthExpired(); return; }
      } finally {
        setFeedbackLoading(false);
      }

    } catch (err) {
      console.error("❌ ERROR:", err);
      if (err.response?.status === 401) {
        onAuthExpired();
        return;
      }
      setError("Failed to reach the server. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function goToStep(stepIndex) {
    setPortalStep(stepIndex);
  }

  const modeLabel = training ? "Training" : "Evaluation";
  const headerLabel = scenario
    ? `${modeLabel} — ${SCENARIO_LABELS[scenario] || scenario}`
    : "Starting session...";

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-800">CSR Simulator</span>
          <span className="text-sm text-gray-400">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowGuide(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
          >
            Home Guide
          </button>
          <button
            onClick={() => {
              if (sessionId) sessionStorage.removeItem(`messages_${sessionId}`);
              onEndSession(messages, sessionId);
            }}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            End Session & Get Report
          </button>
          <NavBar {...navProps} />
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">

        <div style={{ height: portalHeight }} className="flex flex-col overflow-hidden flex-shrink-0">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Internal Portal
            </span>
            {portalStep > 0 && (
              <span className="text-xs text-gray-400">
                · Step {portalStep + 1}/6
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <WorkflowPortal
              scenario={scenario}
              persona={persona}
              step={portalStep}
              completed={portalCompleted}
              onAdvance={(stepId) => {
                setPortalCompleted(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
                setPortalStep(s => Math.min(s + 1, 5));
              }}
              onReset={() => {
                setPortalStep(0);
                setPortalCompleted([]);
                setWorkflowData({ searchQuery: "", applicationStatus: false, searchNotFound: false, delayReason: "", resolution: "", caseNote: "", caseOutcome: "" });
              }}
              onGoToStep={goToStep}
              workflowData={workflowData}
              setWorkflowData={setWorkflowData}
            />
          </div>
        </div>

        <div
          onMouseDown={(e) => {
            isDragging.current = true;
            dragStartY.current = e.clientY;
            dragStartHeight.current = portalHeight;
            document.body.style.cursor = "row-resize";
            document.body.style.userSelect = "none";
          }}
          className="h-2 flex-shrink-0 bg-gray-200 hover:bg-blue-400 cursor-row-resize flex items-center justify-center transition-colors group"
        >
          <div className="w-8 h-0.5 rounded-full bg-gray-400 group-hover:bg-white transition-colors" />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Chat
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-100">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  hasFeedback={!!msg.feedback}
                  isSelected={selectedIdx === i}
                  onClick={msg.feedback ? () => setSelectedIdx(i) : undefined}
                />
              ))}

              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="text-gray-400 text-sm">Customer is typing...</div>
              )}

              {error && (
                <div className="text-center text-red-500 text-sm">{error}</div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="bg-white border-t border-gray-200 px-6 py-3">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  className="flex-1 border rounded-xl px-4 py-3 text-sm"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {training && (
            <div className="w-72 bg-white border-l overflow-y-auto">
              <FeedbackPanel feedback={activeFeedback} feedbackLoading={feedbackLoading} />
            </div>
          )}
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gray-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <span className="font-semibold text-gray-800">Home Guide</span>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none transition"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <HomeGuideContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
