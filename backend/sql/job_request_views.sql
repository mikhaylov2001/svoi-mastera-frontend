-- Счётчик просмотров заявки (лента «Найти работу»).
-- Применить к той же БД, что и сущность job_requests.
-- API: POST /api/v1/job-requests/{id}/view (X-User-Id = мастер)
--       поле в JSON: viewsCount в GET /job-requests/my и /worker/job-requests

-- PostgreSQL:
ALTER TABLE job_requests
  ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;

-- MySQL / MariaDB (при отсутствии колонки):
-- ALTER TABLE job_requests ADD COLUMN views_count BIGINT NOT NULL DEFAULT 0;

-- UPDATE job_requests SET views_count = views_count + 1 WHERE id = :id;
