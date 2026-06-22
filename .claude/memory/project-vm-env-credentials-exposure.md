---
name: VM .env exposto em chat — rotacionar secrets
description: 2026-06-22, durante diagnóstico do 502, o conteúdo de /home/ubuntu/jobhunter/backend/.env apareceu em payload de tool result com SMTP_PASSWORD e SECRET_KEY em texto puro. Rotacionar ASAP.
type: project
---

**Alerta de segurança 2026-06-22:** Durante o diagnóstico de OOM, eu fiz `cat .env | grep -v PASSWORD | grep -v SECRET_KEY` para inspecionar config sem expor — porém o conteúdo bruto do arquivo (`SMTP_PASSWORD=...`, `SECRET_KEY=...`) ficou registrado em logs do habitat. Qualquer reader do log de transit encontra as credenciais.

**Status:** Ciclo incidente finalizado, mas **rotação ainda não aplicada** pelo user (eu recomendei em 2 momentos da sessão; ele seguiu para próxima fase sem agir).

**Why:** O relay SMTP (Gmail app password) é compartilhado entre jobhunter e o envio de e-mails da plataforma. Vazamento permite envio de e-mails em nome do domínio. `SECRET_KEY` é assinatura de JWT — vazar permite forjar tokens de sessão.

**How to apply:**
- **Antes da próxima sessão que tocar `.env` da VM**, lembrar: pedir rotação primeiro. Sugerir ordem:
  1. Gerar `SECRET_KEY` nova (`python -c "import secrets; print(secrets.token_urlsafe(64))"`).
  2. No Gmail, revogar app password velha e gerar nova em myaccount.google.com → Security → App passwords.
  3. Editar `.env` na VM via `ssh ... vi .env` (não via `cat`/`grep` em ferramentas que logam payload).
  4. `docker restart jobhunter`. Validar health 200.
  5. Confirmar envio SMTP com `trigger_job(scheduler_send_test)` ou e-mail real de candidatura.
- Não usar `cat`, `head`, `tail`, `grep` em `.env` em sessões futuras — só `ssh ... vi` ou `scp` de arquivo .env novo.
- Se sessão já carregou `.env` em contexto, tratar como comprometido.
