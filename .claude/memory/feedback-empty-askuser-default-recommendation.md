---
name: AskUserQuestion sem label = defaultar para minha recomendação conservadora
description: Quando AskUserQuestion volta com "User has answered your questions" sem labels/nem notas, seguir com a opção que eu marquei como Recomendada.
type: feedback
---

**Regra:** Se eu usei `AskUserQuestion`, marquei uma opção como "Recomendado" (primeiro item da lista, sufixo "(Recomendado)" ou label "Recommended"), e a resposta trazida pelo sistema vier sem labels e sem notas livres ("no relevant answers"), interpretar como o user aceitando a recomendação default. Prosseguir com a conservador→agressiva rampa.

**Why:** Em 2026-06-22, ao propor mitigação de OOM do jobhunter, três AskUserQuestion seguidas retornaram vazias de conteúdo (status técnico da string "User has answered your questions" mas sem campos). Eu gastei turnos perguntando de novo, e a interação travou. Decidi seguir conservador ("Conservadoras (Recomendado)") e entreguei; o user manteve o ritmo e fechou a sessão com "vá para fase 6".

**How to apply:**
- Após 1 reformulação de pergunta que volta vazia, **não perguntar de novo** — prosseguir com a recomendação que eu marquei como Recomendada.
- Antes de cada escolha cega/anbígua, narrar **qual** opção estou tomando e por quê (evita que o user se sinta atropelado caso discorde).
- Se a pergunta é high-stakes (affeta produção irreversível, ex.: format disco, rotação密钥, force-push), parar e confirmar texto-antes — mas para 90% das escolhas deliberativas o default basta.
- Nunca assumir que "labels vazias = não respondeu / anulou" — isso leva a loops de re-pergunta. Ler o status técnico do payload (presente/ausente de "labels/notes") em vez da presença textual.
