/** Experimental condition routes → post-login landing copy.
 *  Customize title / description / skills per condition as needed.
 */
export const CONDITIONS = {
  cond1: {
    id: "cond1",
    label: "Baseline",
    title: "CSR De-escalation Baseline Training Simulator",
    description: "Static VC only.",
    what_to_expect:
      "You will be presented with a static virtual customer and you will need to respond to them. You will not receive any feedback on your responses.",
    showFeedbackPanel: false,
  },
  cond2: {
    id: "cond2",
    label: "Explicit Feedback",
    title: "CSR De-escalation Explicit Feedback Training Simulator",
    description:
      "Static VC reply + side-panel coaching message: skill name + level + one actionable suggestion.",
    what_to_expect:
      "You will be presented with a static virtual customer and you will need to respond to them. You will receive feedback on your responses in the side-panel.",
    showFeedbackPanel: true,
  },
  cond3: {
    id: "cond3",
    label: "Implicit Feedback",
    title: "CSR De-escalation Implicit Feedback Training Simulator",
    description:
      "Adaptive VC — select 1 of 9 generation prompts (3 states × 3 levels). Each prompt fixes the persona, scenario facts, and dialogue history, and varies only the behavioral constraint — the VC's emotion, tone, and language at that level. The level determines how the customer feels and behaves; the LLM prompt determines the wording.",
    what_to_expect:
      "You will be presented with a static virtual customer and you will need to respond to them. You will receive feedback on your responses in the side-panel.",
    showFeedbackPanel: false,
  },
  cond4: {
    id: "cond4",
    label: "Combined Feedback",
    title: "CSR De-escalation Combined Feedback Training Simulator",
    description: "Both channels.",
    what_to_expect:
      "You will be presented with a static virtual customer and you will need to respond to them. You will receive feedback on your responses in the side-panel.",
    showFeedbackPanel: true,
  },
};

export const CONDITION_IDS = Object.keys(CONDITIONS);

export function isValidCondition(id) {
  return Boolean(id && CONDITIONS[id]);
}
