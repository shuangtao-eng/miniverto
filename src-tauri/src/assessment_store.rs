use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AssessmentResultRecord {
    pub id: String,
    pub project_id: String,
    pub score_pct: i64,
    pub correct: i64,
    pub total: i64,
    pub level: String,
    pub level_label: String,
    pub mastery_summary: String,
    pub weak_bands_json: String,
    pub next_plan_title: String,
    pub next_plan_focus_json: String,
    pub next_plan_duration_days: i64,
    pub created_at: i64,
}

pub struct AssessmentStore {
    conn: Connection,
}

impl AssessmentStore {
    pub fn open(path: &Path) -> Result<Self> {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let conn = Connection::open(path)?;
        let store = Self { conn };
        store.init_schema()?;
        Ok(store)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS assessment_results (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              score_pct INTEGER NOT NULL,
              correct_count INTEGER NOT NULL,
              total_count INTEGER NOT NULL,
              level TEXT NOT NULL,
              level_label TEXT NOT NULL,
              mastery_summary TEXT NOT NULL,
              weak_bands_json TEXT NOT NULL,
              next_plan_title TEXT NOT NULL,
              next_plan_focus_json TEXT NOT NULL,
              next_plan_duration_days INTEGER NOT NULL,
              created_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_assessment_results_project
              ON assessment_results(project_id, created_at DESC);
            ",
        )?;
        Ok(())
    }

    pub fn upsert_result(&self, result: &AssessmentResultRecord) -> Result<()> {
        self.conn.execute(
            "
            INSERT INTO assessment_results (
              id, project_id, score_pct, correct_count, total_count, level, level_label,
              mastery_summary, weak_bands_json, next_plan_title, next_plan_focus_json,
              next_plan_duration_days, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
            ON CONFLICT(id) DO UPDATE SET
              project_id = excluded.project_id,
              score_pct = excluded.score_pct,
              correct_count = excluded.correct_count,
              total_count = excluded.total_count,
              level = excluded.level,
              level_label = excluded.level_label,
              mastery_summary = excluded.mastery_summary,
              weak_bands_json = excluded.weak_bands_json,
              next_plan_title = excluded.next_plan_title,
              next_plan_focus_json = excluded.next_plan_focus_json,
              next_plan_duration_days = excluded.next_plan_duration_days,
              created_at = excluded.created_at
            ",
            params![
                result.id,
                result.project_id,
                result.score_pct,
                result.correct,
                result.total,
                result.level,
                result.level_label,
                result.mastery_summary,
                result.weak_bands_json,
                result.next_plan_title,
                result.next_plan_focus_json,
                result.next_plan_duration_days,
                result.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_results(&self, project_id: &str) -> Result<Vec<AssessmentResultRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, project_id, score_pct, correct_count, total_count, level, level_label,
                   mastery_summary, weak_bands_json, next_plan_title, next_plan_focus_json,
                   next_plan_duration_days, created_at
            FROM assessment_results
            WHERE project_id = ?1
            ORDER BY created_at DESC
            ",
        )?;

        let rows = stmt.query_map(params![project_id], row_to_assessment_result)?;
        rows.collect()
    }

    pub fn latest_result(&self, project_id: &str) -> Result<Option<AssessmentResultRecord>> {
        self.conn.query_row(
            "
            SELECT id, project_id, score_pct, correct_count, total_count, level, level_label,
                   mastery_summary, weak_bands_json, next_plan_title, next_plan_focus_json,
                   next_plan_duration_days, created_at
            FROM assessment_results
            WHERE project_id = ?1
            ORDER BY created_at DESC
            LIMIT 1
            ",
            params![project_id],
            row_to_assessment_result,
        ).optional()
    }

    pub fn delete_results_for_project(&self, project_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM assessment_results WHERE project_id = ?1",
            params![project_id],
        )?;
        Ok(())
    }
}

fn row_to_assessment_result(row: &rusqlite::Row<'_>) -> Result<AssessmentResultRecord> {
    Ok(AssessmentResultRecord {
        id: row.get(0)?,
        project_id: row.get(1)?,
        score_pct: row.get(2)?,
        correct: row.get(3)?,
        total: row.get(4)?,
        level: row.get(5)?,
        level_label: row.get(6)?,
        mastery_summary: row.get(7)?,
        weak_bands_json: row.get(8)?,
        next_plan_title: row.get(9)?,
        next_plan_focus_json: row.get(10)?,
        next_plan_duration_days: row.get(11)?,
        created_at: row.get(12)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn saves_and_lists_assessment_results_newest_first() {
        let dir = tempdir().unwrap();
        let store = AssessmentStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let first = AssessmentResultRecord {
            id: "a1".to_string(),
            project_id: "p1".to_string(),
            score_pct: 70,
            correct: 7,
            total: 10,
            level: "mostly-achieved".to_string(),
            level_label: "大部分达成".to_string(),
            mastery_summary: "Miniverto 判断：需要继续加强。".to_string(),
            weak_bands_json: "[\"synthesis\"]".to_string(),
            next_plan_title: "7 天补弱强化方案".to_string(),
            next_plan_focus_json: "[\"综合场景\"]".to_string(),
            next_plan_duration_days: 7,
            created_at: 1_775_000_001,
        };
        let second = AssessmentResultRecord {
            id: "a2".to_string(),
            created_at: 1_775_000_002,
            score_pct: 90,
            correct: 9,
            level: "achieved".to_string(),
            level_label: "目标达成".to_string(),
            mastery_summary: "Miniverto 判断：可以结项。".to_string(),
            weak_bands_json: "[]".to_string(),
            next_plan_title: "进阶挑战方案".to_string(),
            next_plan_focus_json: "[\"项目实战\"]".to_string(),
            next_plan_duration_days: 14,
            ..first.clone()
        };

        store.upsert_result(&first).unwrap();
        store.upsert_result(&second).unwrap();

        let results = store.list_results("p1").unwrap();

        assert_eq!(results, vec![second, first]);
    }

    #[test]
    fn returns_latest_assessment_result_for_project() {
        let dir = tempdir().unwrap();
        let store = AssessmentStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let result = AssessmentResultRecord {
            id: "a1".to_string(),
            project_id: "p1".to_string(),
            score_pct: 80,
            correct: 8,
            total: 10,
            level: "mostly-achieved".to_string(),
            level_label: "大部分达成".to_string(),
            mastery_summary: "Miniverto 判断：接近目标。".to_string(),
            weak_bands_json: "[\"application\"]".to_string(),
            next_plan_title: "7 天补弱强化方案".to_string(),
            next_plan_focus_json: "[\"应用迁移\"]".to_string(),
            next_plan_duration_days: 7,
            created_at: 1_775_000_001,
        };

        store.upsert_result(&result).unwrap();

        assert_eq!(store.latest_result("p1").unwrap(), Some(result));
        assert_eq!(store.latest_result("missing").unwrap(), None);
    }

    #[test]
    fn deletes_assessment_results_for_project() {
        let dir = tempdir().unwrap();
        let store = AssessmentStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let result = AssessmentResultRecord {
            id: "a-delete".to_string(),
            project_id: "p-delete".to_string(),
            score_pct: 60,
            correct: 6,
            total: 10,
            level: "basic".to_string(),
            level_label: "初步掌握".to_string(),
            mastery_summary: "Miniverto 判断：需要加强。".to_string(),
            weak_bands_json: "[\"concept\"]".to_string(),
            next_plan_title: "7 天补弱强化方案".to_string(),
            next_plan_focus_json: "[\"基础概念\"]".to_string(),
            next_plan_duration_days: 7,
            created_at: 1_775_000_003,
        };

        store.upsert_result(&result).unwrap();
        store.delete_results_for_project(&result.project_id).unwrap();

        assert!(store.list_results(&result.project_id).unwrap().is_empty());
    }
}
