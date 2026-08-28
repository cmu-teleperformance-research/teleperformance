# v3 — tighter persistence + previous state

Builds on v2. Same model (`gpt-4.1-mini-2025-04-14`).

## Changes vs v2
1. `previous_state` / `previous_score` are passed in the user message. They come from **this model's** prior label on the same call, in segment order — not RA gold (no leakage).
2. Persist only for acknowledgments of information just collected. Greetings, rapport, empty ASR, and post-verification thanks go to Interpretation 0.
3. `How are you?` is rapport, not Exploration.
4. Mid-intake `Sure.` stays Exploration; empty willingness (`I can handle that.`) is Resolution 0.

## Results (zero-shot)
Interpretation recovered (14 vs RA 11; v2 had collapsed to 2). State disagreements dropped from 13 to 8.

| Metric | v2 zero-shot | v3 zero-shot |
|---|---|---|
| Acc vs consensus | 0.800 | **0.877** |
| κ vs consensus | 0.618 | **0.792** |
| 4-way α | 0.800 | **0.869** |
| Score ICC(A,1) | 0.537 | **0.570** |
| Score MAE | 0.487 | **0.451** |

## Production
`scoring_production.txt` is the live `teleperformance/backend/prompts/evaluation/scoring.txt` copy. The backend currently injects `previous_state=(not provided)` because the live scorer is not sequential yet. The notebook zero-shot path is the real v3 experiment.
