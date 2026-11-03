"""
PAIRWISE judging prompt (Answer A vs Answer B), separate from the absolute
scoring prompt in rubric_config.py. Reuses the rubric and dimension names
from there to keep everything consistent.
"""
from rubric_config import (
    FAILURE_FLAGS,
    RUBRIC_DIMENSIONS,
    format_heading_aliases,
    load_rubric_text,
)

PAIRWISE_SYSTEM_TEMPLATE = """Você é um avaliador (LLM judge) especializado em avaliar respostas de aconselhamento sobre {domain}.

Sua tarefa: comparar DUAS respostas (Answer A e Answer B) à MESMA pergunta de usuário, e dizer qual é melhor segundo a rubrica abaixo - no geral, e dimensão por dimensão. NÃO julgue se a resposta "concorda" textualmente com a outra - julgue cada uma pela rubrica e compare os resultados. Diferenças de redação, ordem ou estrutura que não mudam o conteúdo factual NÃO tornam uma resposta pior.

=== RUBRICA COMPLETA ===
{rubric_text}
=== FIM DA RUBRICA ===

ATENÇÃO - CORRESPONDÊNCIA DE NOMES DE DIMENSÃO:
{heading_aliases}

Responda SOMENTE em JSON válido, sem markdown, sem texto antes ou depois, no formato:
{{
  "overall": "A" | "B" | "equivalent",
  "dimensions": {{"<nome da dimensão>": "A" | "B" | "equivalent", ...}},
  "new_flags_in_a": [{{"flag": "<nome exato da lista de failure flags>", "severity": "Minor|Major|Critical"}}],
  "new_flags_in_b": [{{"flag": "<nome exato da lista de failure flags>", "severity": "Minor|Major|Critical"}}],
  "evidence": "<1-3 frases citando o trecho específico que decidiu a comparação>"
}}

"overall"/cada dimensão: "A" significa Answer A é melhor, "B" significa Answer B é melhor, "equivalent" significa empate/equivalente sob a rubrica.
Use exatamente estes nomes de dimensão: {dimension_names}
Nomes de flag válidos: {flag_names}
Se não houver flag nova em nenhuma resposta, retorne listas vazias.
"""

PAIRWISE_USER_TEMPLATE = """### Classificação esperada da interação (expected_classification)
{expected_classification}

### Contexto do usuário disponível para o modelo (não invente nada além disso)
{user_context}

### Expectativas específicas deste caso (guardrails definidos pelo revisor)
{expectations}

### Pergunta do usuário
{question}

### Answer A
{answer_a}

### Answer B
{answer_b}
"""


def format_expectations(expectations):
    if not expectations:
        return "(nenhuma expectativa específica para este caso)"
    labels = [
        ("must_include", "Deve incluir"),
        ("must_not", "Não deve"),
        ("guardrail", "Guardrail em teste"),
    ]
    lines = [f"- {label}: {expectations[k]}" for k, label in labels if expectations.get(k)]
    return "\n".join(lines) if lines else "(nenhuma expectativa específica para este caso)"


def build_pairwise_prompt(question, answer_a, answer_b, expected_classification=None, user_context=None,
                          domain="moradia/aluguel em Toronto/Ontário", expectations=None):
    rubric_text, is_fallback = load_rubric_text()
    system = PAIRWISE_SYSTEM_TEMPLATE.format(
        domain=domain,
        rubric_text=rubric_text,
        dimension_names=", ".join(RUBRIC_DIMENSIONS),
        heading_aliases=format_heading_aliases(),
        flag_names=", ".join(FAILURE_FLAGS),
    )
    if user_context:
        context_text = "\n".join(f"- {k}: {v}" for k, v in user_context.items())
    else:
        context_text = "(nenhum contexto de perfil disponível para este caso)"
    user = PAIRWISE_USER_TEMPLATE.format(
        question=question,
        answer_a=answer_a,
        answer_b=answer_b,
        expected_classification=expected_classification or "(não informado)",
        user_context=context_text,
        expectations=format_expectations(expectations),
    )
    return system, user, is_fallback

