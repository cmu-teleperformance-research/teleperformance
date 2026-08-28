# v4 — v3 prompt on gpt-4o

Same rubric and sequential `previous_state` input as v3. Only the model changes: `gpt-4.1-mini-2025-04-14` → `gpt-4o`.

This isolates model capacity from prompt wording.

## Results (zero-shot, n=65)

| Metric | v3 mini | v4 gpt-4o |
|---|---|---|
| Acc vs consensus | 0.877 | 0.892 |
| κ vs consensus | 0.792 | 0.821 |
| 4-way α | 0.869 | 0.883 |
| Score ICC(A,1) | 0.570 | 0.474 |
| Score MAE | 0.451 | 0.431 |

State disagreements vs consensus: 7.
