# v1 — original rubric

Baseline LLM-as-4th-rater run. Prompt matches the original `scoring.txt` / notebook 7.1 cell.

## What we learned
- Human gold is stable (3-RA state α 0.965, score ICC 0.950). Low 4-way α is the LLM, not the RAs.
- 77% exact-match vs consensus only yields κ ≈ 0.62 because Exploration is ~57% of labels.
- Error clusters: courtesy dump, closing rule, mixed-state (advice/lookup), Exploration 1→2 inflation.
- Few-shot (7 demos) over-triggered Interpretation 0 and hurt state agreement.
