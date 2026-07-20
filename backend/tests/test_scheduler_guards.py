import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.scheduler_service import _scan_job_wrapper, _weekly_report_wrapper, job_statuses

@pytest.mark.asyncio
async def test_scheduler_guard_prevents_overlapping():
    # Prepara o estado como já rodando
    job_statuses["scan_jobs"]["is_running"] = True

    with patch("app.services.scan_service.run_scan", new_callable=AsyncMock) as mock_run:
        await _scan_job_wrapper()
        # Não deve ter chamado o scanner porque o job já estava marcado como rodando (bloqueado pelo guard)
        mock_run.assert_not_called()

    # Limpa a trava de teste
    job_statuses["scan_jobs"]["is_running"] = False

@pytest.mark.asyncio
async def test_weekly_report_skipped_when_no_jobs_or_apps():
    job_statuses["weekly_report"]["is_running"] = False

    with patch("app.services.notification_service.send_email", new_callable=AsyncMock) as mock_send_email:
        # Patch as queries do SQLAlchemy para retornar 0 vagas e 0 candidaturas
        with patch("app.core.database.async_session") as mock_session_ctx:
            mock_session = AsyncMock()
            mock_session_ctx.return_value.__aenter__.return_value = mock_session

            mock_result = MagicMock()
            mock_result.scalar.return_value = 0
            mock_result.scalar_one_or_none.return_value = None
            mock_session.execute.return_value = mock_result

            await _weekly_report_wrapper()
            # Não deve enviar e-mail se não houve atividade na semana
            mock_send_email.assert_not_called()

@pytest.mark.asyncio
async def test_weekly_report_sends_email_with_activity():
    job_statuses["weekly_report"]["is_running"] = False

    with patch("app.services.notification_service.send_email", new_callable=AsyncMock) as mock_send_email:
        with patch("app.core.database.async_session") as mock_session_ctx:
            mock_session = AsyncMock()
            mock_session_ctx.return_value.__aenter__.return_value = mock_session

            # Mock de resultados sequenciais:
            # 1. total_jobs: 15
            # 2. total_apps: 3
            # 3. best_job: mock job object
            mock_res_jobs = MagicMock()
            mock_res_jobs.scalar.return_value = 15

            mock_res_apps = MagicMock()
            mock_res_apps.scalar.return_value = 3

            class MockJob:
                title = "Analista de RH"
                company = "CapyCorp"
                score = 95

            mock_res_best = MagicMock()
            mock_res_best.scalar_one_or_none.return_value = MockJob()

            # Quando o SQLAlchemy for executado, retorna as queries sequenciais mapeadas
            mock_session.execute.side_effect = [mock_res_jobs, mock_res_apps, mock_res_best]

            await _weekly_report_wrapper()

            # Deve ter enviado o e-mail consolidado relatando a atividade da semana
            mock_send_email.assert_called_once()
            subject, body = mock_send_email.call_args[0]
            assert "Relatório Semanal" in subject
            assert "15" in body
            assert "3" in body
            assert "CapyCorp" in body
            assert "Analista de RH" in body
