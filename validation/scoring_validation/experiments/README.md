# LLM scoring rubric experiments

Frozen prompts, model settings, prediction files, and metrics for each rubric version used on the **round-4** 65-turn / 3-RA gold set.

| Version | Date | Model | What changed | Zero-shot acc vs RA consensus | κ vs consensus | Score ICC(A,1) |
|---|---|---|---|---|---|---|
| [v1](v1/) | 2026-08-26 | gpt-4.1-mini-2025-04-14 | Original rubric (courtesy → Interp 0; strict closings) | 0.769 | 0.617 | 0.352 |
| [v2](v2/) | 2026-08-27 | gpt-4.1-mini-2025-04-14 | RA-aligned: persist activity, closings 2, advice/lookup = Resolution, stricter Expl 2 | 0.800 | 0.618 | 0.537 |
| [v3](v3/) | 2026-08-27 | gpt-4.1-mini-2025-04-14 | Tighter persistence + sequential `previous_state` | 0.877 | 0.792 | 0.570 |
| [v4](v4/) | 2026-08-27 | gpt-4o | Same prompt as v3; model swap mini → gpt-4o | 0.892 | 0.821 | 0.474 |

Gold is always `round4_{joyce,shiyu,simret}_completed.csv`. Do not overwrite a version folder after you have recorded metrics — start `v5/` instead.

## Folder layout (each version)

- `config.json` — model, temperature, inputs, output paths, hypothesis, metrics
- `system_prompt.txt` / `user_template.txt` — exact strings sent to the API
- `fewshot_demos.json` — demos if that version ran few-shot
- `predictions_zero_shot.csv` / `predictions_few_shot.csv` — model labels
- `NOTES.md` — what we learned
- `scoring_production.txt` — copy of the live backend prompt (v3+)

## How to add v5

1. Copy `v4/` to `v5/`.
2. Edit prompts or model; set `config.json` `status` to `in_progress` and clear `metrics`.
3. Point the notebook `LLM_OUTPUT` at a **new** file (`round4_llm_v5.csv`).
4. After the run, copy predictions in, fill `metrics`, set `status: complete`, and add a row to this table.
