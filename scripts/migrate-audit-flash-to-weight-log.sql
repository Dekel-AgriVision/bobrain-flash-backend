-- =============================================================================
-- Migration de l'historique audit_flash -> weight_log / station_session / weight_daily
-- ADR-0022. MariaDB >= 10.2 ou MySQL >= 8.0 (fonctions de fenêtre LAG).
--
-- Mode d'emploi (voir aussi ADR-0022, section « Mise en production ») :
--   1. Sauvegarder audit_flash :
--        mysqldump --single-transaction bobrain_db audit_flash | gzip > audit_flash_AAAAMMJJ.sql.gz
--   2. Déployer la nouvelle version de l'API et la démarrer une fois
--      (création de weight_log, station_session, weight_daily).
--   3. Régler @from / @to ci-dessous et exécuter ce script, MOIS PAR MOIS si la table est grosse :
--        mysql bobrain_db < scripts/migrate-audit-flash-to-weight-log.sql
--      @to = date/heure de mise en service de la nouvelle version (pas de double comptage).
--   4. Redémarrer l'API : la maintenance des partitions découpe les mois migrés.
--   5. Vérifier les écrans d'audit, puis vider l'ancienne table : TRUNCATE TABLE audit_flash;
--
-- Règle de dédoublonnage proche de l'écriture en temps réel : une ligne est gardée si
-- le poids ou le statut change par rapport à la trame précédente de la même station,
-- ou si c'est la première trame d'une tranche de 30 secondes (battement).
-- Le résumé journalier compte, lui, TOUTES les trames.
-- =============================================================================

SET @from := '2000-01-01 00:00:00';   -- début de la tranche (inclus)
SET @to   := '2100-01-01 00:00:00';   -- fin de la tranche (exclue) = mise en service
SET @heartbeat_seconds := 30;

-- 1. Postes (une ligne par combinaison distincte, sans doublon avec l'existant)
INSERT INTO station_session (branch, station, computer_name, computer_user, user_name, user_profile, first_seen_at, last_seen_at)
SELECT g.branch, g.station, g.cn, g.cu, g.un, g.up, g.first_at, g.last_at
FROM (
  SELECT a.branch, a.station,
         LEFT(a.computer_name, 128) AS cn, LEFT(a.computer_user, 128) AS cu,
         LEFT(a.user_name, 128) AS un, LEFT(a.user_profile, 255) AS up,
         MIN(a.created_at) AS first_at, MAX(a.created_at) AS last_at
  FROM audit_flash a
  WHERE a.created_at >= @from AND a.created_at < @to
    AND a.branch IS NOT NULL AND a.station IS NOT NULL
  GROUP BY a.branch, a.station, cn, cu, un, up
) g
WHERE NOT EXISTS (
  SELECT 1 FROM station_session s
  WHERE s.branch = g.branch AND s.station = g.station
    AND s.computer_name <=> g.cn AND s.computer_user <=> g.cu
    AND s.user_name <=> g.un AND s.user_profile <=> g.up
);

-- 2. Pesées dédoublonnées
INSERT INTO weight_log (measured_at, branch, station, sent_weight, status, reference, ticket,
                        input_from_bc, output_from_bc, frame, latency, is_monitored, timestamp, session_id)
SELECT x.created_at, x.branch, x.station, x.sent_weight, LEFT(x.status, 32), LEFT(x.reference, 32), LEFT(x.ticket, 64),
       x.input_from_bc, x.output_from_bc, LEFT(x.frame, 255),
       CASE WHEN x.latency REGEXP '^-?[0-9]{1,9}$' THEN CAST(x.latency AS SIGNED) END,
       COALESCE(x.is_monitored, 0), x.timestamp,
       (SELECT MIN(s.id) FROM station_session s
         WHERE s.branch = x.branch AND s.station = x.station
           AND s.computer_name <=> LEFT(x.computer_name, 128) AND s.computer_user <=> LEFT(x.computer_user, 128)
           AND s.user_name <=> LEFT(x.user_name, 128) AND s.user_profile <=> LEFT(x.user_profile, 255))
FROM (
  SELECT a.*,
         LAG(a.sent_weight) OVER w AS prev_weight,
         LAG(a.status)      OVER w AS prev_status,
         LAG(a.created_at)  OVER w AS prev_at,
         FLOOR(UNIX_TIMESTAMP(a.created_at) / @heartbeat_seconds) AS bucket,
         LAG(FLOOR(UNIX_TIMESTAMP(a.created_at) / @heartbeat_seconds)) OVER w AS prev_bucket
  FROM audit_flash a
  WHERE a.created_at >= @from AND a.created_at < @to
    AND a.branch IS NOT NULL AND a.station IS NOT NULL
  WINDOW w AS (PARTITION BY a.branch, a.station ORDER BY a.created_at, a.id)
) x
WHERE x.prev_at IS NULL
   OR NOT (x.sent_weight <=> x.prev_weight)
   OR NOT (x.status <=> x.prev_status)
   OR x.bucket <> x.prev_bucket
ORDER BY x.created_at;

-- 3. Résumé journalier (toutes les trames)
INSERT INTO weight_daily (day, branch, station, frames_count, rows_count, weight_count, weight_min, weight_max, weight_sum)
SELECT DATE(a.created_at), a.branch, a.station,
       COUNT(*), 0,
       SUM(a.sent_weight > 0),
       MIN(CASE WHEN a.sent_weight > 0 THEN a.sent_weight END),
       MAX(CASE WHEN a.sent_weight > 0 THEN a.sent_weight END),
       COALESCE(SUM(CASE WHEN a.sent_weight > 0 THEN a.sent_weight END), 0)
FROM audit_flash a
WHERE a.created_at >= @from AND a.created_at < @to
  AND a.branch IS NOT NULL AND a.station IS NOT NULL
GROUP BY DATE(a.created_at), a.branch, a.station
ON DUPLICATE KEY UPDATE
  frames_count = frames_count + VALUES(frames_count),
  weight_count = weight_count + VALUES(weight_count),
  weight_min   = LEAST(COALESCE(weight_min, VALUES(weight_min)), COALESCE(VALUES(weight_min), weight_min)),
  weight_max   = GREATEST(COALESCE(weight_max, VALUES(weight_max)), COALESCE(VALUES(weight_max), weight_max)),
  weight_sum   = weight_sum + VALUES(weight_sum);

UPDATE weight_daily d
JOIN (
  SELECT DATE(measured_at) AS day, branch, station, COUNT(*) AS c
  FROM weight_log
  WHERE measured_at >= @from AND measured_at < @to
  GROUP BY DATE(measured_at), branch, station
) w ON w.day = d.day AND w.branch = d.branch AND w.station = d.station
SET d.rows_count = d.rows_count + w.c;

-- 4. Contrôle
SELECT
  (SELECT COUNT(*) FROM audit_flash WHERE created_at >= @from AND created_at < @to) AS audit_flash_trames,
  (SELECT COUNT(*) FROM weight_log  WHERE measured_at >= @from AND measured_at < @to) AS weight_log_lignes;
