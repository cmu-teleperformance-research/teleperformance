/** Post-scenario attention checks: "What was the customer's main issue?" */

const ISSUE_OPTIONS = {
  flight_cancellation: "Their flight was cancelled",
  baggage_delay: "Their checked airline bag had been missing",
  book_flight: "They wanted to purchase a ticket for a trip that was not already booked",
  refund_request: "They received a defective product and wanted a refund",
  package_never_arrived: "A shipped package was marked delivered but never arrived",
  exchange_item: "They wanted to exchange an item for a different size",
  loan_delay: "Their personal loan was delayed",
};

/** Distractors per scenario (other scenario ids). Correct answer is always the scenario itself. */
const DISTRACTORS = {
  flight_cancellation: ["baggage_delay", "book_flight", "refund_request"],
  baggage_delay: [
    "flight_cancellation",
    "package_never_arrived",
    "book_flight",
  ],
  book_flight: ["flight_cancellation", "baggage_delay", "exchange_item"],
  refund_request: ["loan_delay", "package_never_arrived", "exchange_item"],
  package_never_arrived: ["exchange_item", "refund_request", "baggage_delay"],
  exchange_item: ["package_never_arrived", "refund_request", "book_flight"],
  loan_delay: [
    "refund_request",
    "package_never_arrived",
    "flight_cancellation",
  ],
};

export const ATTENTION_CHECK_PROMPT = "What was the customer's main issue?";

/** Fail the path once this many of the 4 checks (2 welcome + 2 post-scenario) are wrong. */
export const ATTENTION_FAIL_LIMIT = 2;

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** @returns {{ prompt: string, correctId: string, options: { id: string, label: string }[] } | null} */
export function getAttentionCheck(scenario, { isLastScenario = false } = {}) {
  if (isLastScenario) return null;

  const label = ISSUE_OPTIONS[scenario];
  const distractors = DISTRACTORS[scenario];
  if (!label || !distractors) return null;

  const options = shuffle([
    { id: scenario, label },
    ...distractors.map((id) => ({ id, label: ISSUE_OPTIONS[id] })),
  ]);

  return {
    prompt: ATTENTION_CHECK_PROMPT,
    correctId: scenario,
    options,
  };
}
