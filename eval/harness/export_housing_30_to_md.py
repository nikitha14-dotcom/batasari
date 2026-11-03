import json
from pathlib import Path


INPUT_JSON = "harness_results_housing_30_v8_full30.json"
OUTPUT_MD = "harness_results_housing_30_v8_full30.md"


def fmt(value):
    """Render None/empty values cleanly."""
    if value is None:
        return "N/A"
    return str(value)


def classification_result(expected, actual):
    if expected is None and actual is None:
        return "N/A"

    if expected == actual:
        return f"PASS — expected `{expected}`, got `{actual}`"

    return f"FAIL — expected `{expected}`, got `{actual}`"


def get_clarification_items(route):
    """Return clean structured clarification questions from a router result."""
    if not isinstance(route, dict):
        return []

    items = route.get("clarification_items") or []
    return [str(item).strip() for item in items if str(item).strip()]


def render_clarification_block(actual_classification, route, user_reply=None):
    """Show the clarification audit only when the model classified the turn ambiguous."""
    if actual_classification != "ambiguous":
        return []

    lines = [
        "### Clarification Asked",
        "",
    ]

    items = get_clarification_items(route)
    if items:
        lines.extend([f"- {item}" for item in items])
    else:
        lines.append("*No structured clarification questions found in `clarification_items`.*")

    lines.append("")

    if user_reply is not None:
        lines.extend([
            "### User Response to Clarification",
            "",
            user_reply or "*Empty user response.*",
            "",
        ])
    else:
        lines.extend([
            "### User Response to Clarification",
            "",
            "*No user response in this test case — evaluation stops after the clarification question.*",
            "",
        ])

    return lines


def render_single_turn(row):
    lines = []

    expected = row.get("expected_classification")
    actual = row.get("actual_classification")
    route = row.get("turn_1_route") or row.get("router") or {}

    lines.extend([
        "### Interaction Classification",
        "",
        f"- **Expected:** `{fmt(expected)}`",
        f"- **Actual:** `{fmt(actual)}`",
        f"- **Match:** {fmt(row.get('classification_match'))}",
        "",
    ])

    # For ambiguous turns, surface exactly what the router asked.
    lines.extend(
        render_clarification_block(
            actual_classification=actual,
            route=route,
            user_reply=None,
        )
    )

    lines.extend([
        "### Final Response",
        "",
        row.get("final_response") or "*No response generated.*",
        "",
    ])

    return lines


def render_multi_turn(row):
    lines = []

    turn_1_actual = row.get("actual_turn_1_classification")
    turn_2_actual = row.get("actual_turn_2_classification")
    turn_1_route = row.get("turn_1_route") or row.get("router") or {}
    turn_2_route = row.get("turn_2_route") or {}
    turn_2_input = row.get("turn_2_input")

    lines.extend([
        "### Turn 1",
        "",
        f"- **Expected classification:** `{fmt(row.get('expected_turn_1_classification'))}`",
        f"- **Actual classification:** `{fmt(turn_1_actual)}`",
        f"- **Match:** {fmt(row.get('turn_1_classification_match'))}",
        "",
    ])

    # If turn 1 is ambiguous, show the structured questions plus the simulated
    # user's response that allowed turn 2 to happen.
    lines.extend(
        render_clarification_block(
            actual_classification=turn_1_actual,
            route=turn_1_route,
            user_reply=turn_2_input,
        )
    )

    lines.extend([
        "**Assistant response (full turn 1 text):**",
        "",
        row.get("turn_1_response") or "*No turn-1 response generated.*",
        "",
        "### Turn 2",
        "",
        "**User:**",
        "",
        turn_2_input or "*No turn-2 input found.*",
        "",
        f"- **Expected classification:** `{fmt(row.get('expected_turn_2_classification'))}`",
        f"- **Actual classification:** `{fmt(turn_2_actual)}`",
        f"- **Match:** {fmt(row.get('turn_2_classification_match'))}",
        "",
    ])

    # Handle the case where turn 2 is still ambiguous. There is no turn 3 in
    # this harness, so the MD will explicitly say no further user response exists.
    lines.extend(
        render_clarification_block(
            actual_classification=turn_2_actual,
            route=turn_2_route,
            user_reply=None,
        )
    )

    lines.extend([
        "**Assistant response:**",
        "",
        row.get("turn_2_response") or row.get("final_response") or "*No turn-2 response generated.*",
        "",
    ])

    return lines


def export_json_to_markdown(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        rows = json.load(f)

    lines = [
        "# Housing End-to-End Evaluation — 30 Cases",
        "",
        f"Source: `{input_path}`",
        "",
        f"Total runs: **{len(rows)}**",
        "",
        "---",
        "",
    ]

    classification_matches = 0
    classification_total = 0
    successful_runs = 0
    ambiguous_turns = 0

    for i, row in enumerate(rows, start=1):
        eval_id = row.get("eval_id", f"CASE_{i}")
        question = row.get("question", "")
        interaction_type = row.get("interaction_type", "single_turn")
        status = row.get("status", "unknown")

        if status == "success":
            successful_runs += 1

        lines.extend([
            f"## {i}. {eval_id}",
            "",
            "### Execution Metadata",
            "",
            f"- **Status:** `{status}`",
            f"- **Source owner:** `{fmt(row.get('source_owner'))}`",
            f"- **Interaction type:** `{interaction_type}`",
            f"- **Model:** `{fmt(row.get('model_used'))}`",
            f"- **Prompt version:** `{fmt(row.get('prompt_version'))}`",
            f"- **Latency:** `{fmt(row.get('latency_ms'))} ms`",
            f"- **Input tokens:** `{fmt(row.get('input_tokens'))}`",
            f"- **Output tokens:** `{fmt(row.get('output_tokens'))}`",
            f"- **Estimated cost:** `${fmt(row.get('estimated_cost_usd'))}`",
            f"- **Web searches:** `{fmt(row.get('web_search_requests'))}`",
            f"- **Stop reason:** `{fmt(row.get('stop_reason'))}`",
            "",
            "### User Question",
            "",
            question,
            "",
        ])

        if interaction_type == "multi_turn":
            lines.extend(render_multi_turn(row))

            for classification_key in (
                "actual_turn_1_classification",
                "actual_turn_2_classification",
            ):
                if row.get(classification_key) == "ambiguous":
                    ambiguous_turns += 1

            for match_key in (
                "turn_1_classification_match",
                "turn_2_classification_match",
            ):
                match = row.get(match_key)
                if match is not None:
                    classification_total += 1
                    if match is True:
                        classification_matches += 1

        else:
            lines.extend(render_single_turn(row))

            if row.get("actual_classification") == "ambiguous":
                ambiguous_turns += 1

            match = row.get("classification_match")
            if match is not None:
                classification_total += 1
                if match is True:
                    classification_matches += 1

        if row.get("original_feedback"):
            lines.extend([
                "### Original Clarification-Test Feedback",
                "",
                row["original_feedback"],
                "",
            ])

        if row.get("error_message"):
            lines.extend([
                "### Error",
                "",
                f"```text\n{row['error_message']}\n```",
                "",
            ])

        lines.extend([
            "---",
            "",
        ])

    # Add summary at top.
    summary = [
        "## Run Summary",
        "",
        f"- **Successful runs:** {successful_runs}/{len(rows)}",
        f"- **Classification checks passed:** "
        f"{classification_matches}/{classification_total}"
        if classification_total
        else "- **Classification checks passed:** N/A",
        f"- **Ambiguous turns with clarification audit shown:** {ambiguous_turns}",
        "",
        "---",
        "",
    ]

    lines[6:6] = summary

    Path(output_path).write_text(
        "\n".join(lines),
        encoding="utf-8",
    )

    print(f"Done. Markdown written to: {output_path}")
    print(f"Successful runs: {successful_runs}/{len(rows)}")
    print(f"Ambiguous turns shown: {ambiguous_turns}")

    if classification_total:
        print(
            f"Classification matches: "
            f"{classification_matches}/{classification_total}"
        )


if __name__ == "__main__":
    export_json_to_markdown(
        INPUT_JSON,
        OUTPUT_MD,
    )

