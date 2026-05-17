use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProjectRecord {
    pub id: String,
    pub emoji: String,
    pub title: String,
    pub goal_summary: String,
    pub status: String,
    pub completed_tasks: i64,
    pub total_tasks: i64,
    pub critic_score: Option<f64>,
    pub last_active: String,
    pub milestones: Vec<MilestoneRecord>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MilestoneRecord {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub success_criteria: String,
    pub ordinal: i64,
    pub tasks: Vec<TaskRecord>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskRecord {
    pub id: String,
    pub milestone_id: String,
    pub kind: String,
    pub title: String,
    pub description: Option<String>,
    pub estimated_minutes: i64,
    pub status: String,
    pub suggested_date: Option<String>,
    pub acceptance_criteria: Option<String>,
    pub learning_content_json: Option<String>,
    pub recommended_references_json: Option<String>,
    pub assessment_history_json: Option<String>,
    pub user_note: Option<String>,
    pub ordinal: i64,
}

pub struct ProjectStore {
    conn: Connection,
}

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    column_type: &str,
) -> Result<()> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let columns = stmt.query_map([], |row| row.get::<_, String>(1))?;
    for existing in columns {
        if existing? == column {
            return Ok(());
        }
    }

    conn.execute(
        &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, column_type),
        [],
    )?;
    Ok(())
}

impl ProjectStore {
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

            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              emoji TEXT NOT NULL,
              title TEXT NOT NULL,
              goal_summary TEXT NOT NULL,
              status TEXT NOT NULL,
              completed_tasks INTEGER NOT NULL,
              total_tasks INTEGER NOT NULL,
              critic_score REAL,
              last_active TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS milestones (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              success_criteria TEXT NOT NULL,
              ordinal INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
              kind TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              estimated_minutes INTEGER NOT NULL,
              status TEXT NOT NULL,
              suggested_date TEXT,
              acceptance_criteria TEXT,
              learning_content_json TEXT,
              recommended_references_json TEXT,
              assessment_history_json TEXT,
              user_note TEXT,
              ordinal INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id, ordinal);
            CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id, ordinal);
            ",
        )?;
        add_column_if_missing(&self.conn, "tasks", "learning_content_json", "TEXT")?;
        add_column_if_missing(&self.conn, "tasks", "recommended_references_json", "TEXT")?;
        add_column_if_missing(&self.conn, "tasks", "assessment_history_json", "TEXT")?;
        Ok(())
    }

    pub fn upsert_project(&self, project: &ProjectRecord) -> Result<()> {
        self.conn.execute(
            "
            INSERT INTO projects (
              id, emoji, title, goal_summary, status, completed_tasks, total_tasks, critic_score, last_active
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            ON CONFLICT(id) DO UPDATE SET
              emoji = excluded.emoji,
              title = excluded.title,
              goal_summary = excluded.goal_summary,
              status = excluded.status,
              completed_tasks = excluded.completed_tasks,
              total_tasks = excluded.total_tasks,
              critic_score = excluded.critic_score,
              last_active = excluded.last_active
            ",
            params![
                project.id,
                project.emoji,
                project.title,
                project.goal_summary,
                project.status,
                project.completed_tasks,
                project.total_tasks,
                project.critic_score,
                project.last_active,
            ],
        )?;

        self.conn.execute(
            "DELETE FROM milestones WHERE project_id = ?1",
            params![project.id],
        )?;

        for milestone in &project.milestones {
            self.conn.execute(
                "
                INSERT INTO milestones (id, project_id, title, success_criteria, ordinal)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ",
                params![
                    milestone.id,
                    project.id,
                    milestone.title,
                    milestone.success_criteria,
                    milestone.ordinal,
                ],
            )?;

            for task in &milestone.tasks {
                self.conn.execute(
                    "
                    INSERT INTO tasks (
                      id, milestone_id, kind, title, description, estimated_minutes, status,
                      suggested_date, acceptance_criteria, learning_content_json,
                      recommended_references_json, assessment_history_json, user_note, ordinal
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
                    ",
                    params![
                        task.id,
                        milestone.id,
                        task.kind,
                        task.title,
                        task.description,
                        task.estimated_minutes,
                        task.status,
                        task.suggested_date,
                        task.acceptance_criteria,
                        task.learning_content_json,
                        task.recommended_references_json,
                        task.assessment_history_json,
                        task.user_note,
                        task.ordinal,
                    ],
                )?;
            }
        }

        Ok(())
    }

    pub fn list_projects(&self) -> Result<Vec<ProjectRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, emoji, title, goal_summary, status, completed_tasks, total_tasks, critic_score, last_active
            FROM projects
            ORDER BY last_active DESC, title ASC
            ",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(ProjectRecord {
                id: row.get(0)?,
                emoji: row.get(1)?,
                title: row.get(2)?,
                goal_summary: row.get(3)?,
                status: row.get(4)?,
                completed_tasks: row.get(5)?,
                total_tasks: row.get(6)?,
                critic_score: row.get(7)?,
                last_active: row.get(8)?,
                milestones: Vec::new(),
            })
        })?;

        let mut projects: Vec<ProjectRecord> = rows.collect::<Result<Vec<_>>>()?;
        for project in &mut projects {
            project.milestones = self.list_milestones(&project.id)?;
        }
        Ok(projects)
    }

    pub fn delete_project(&self, project_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM projects WHERE id = ?1",
            params![project_id],
        )?;
        Ok(())
    }

    pub fn update_task_progress(
        &self,
        task_id: &str,
        status: &str,
        user_note: Option<&str>,
        assessment_history_json: Option<&str>,
    ) -> Result<()> {
        self.conn.execute(
            "
            UPDATE tasks
            SET
              status = ?2,
              user_note = COALESCE(?3, user_note),
              assessment_history_json = COALESCE(?4, assessment_history_json)
            WHERE id = ?1
            ",
            params![task_id, status, user_note, assessment_history_json],
        )?;

        let project_id: String = self.conn.query_row(
            "
            SELECT milestones.project_id
            FROM tasks
            JOIN milestones ON milestones.id = tasks.milestone_id
            WHERE tasks.id = ?1
            ",
            params![task_id],
            |row| row.get(0),
        )?;

        self.conn.execute(
            "
            UPDATE projects
            SET
              completed_tasks = (
                SELECT COUNT(*)
                FROM tasks
                JOIN milestones ON milestones.id = tasks.milestone_id
                WHERE milestones.project_id = ?1 AND tasks.status = 'completed'
              ),
              total_tasks = (
                SELECT COUNT(*)
                FROM tasks
                JOIN milestones ON milestones.id = tasks.milestone_id
                WHERE milestones.project_id = ?1
              )
            WHERE id = ?1
            ",
            params![project_id],
        )?;

        Ok(())
    }

    fn list_milestones(&self, project_id: &str) -> Result<Vec<MilestoneRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, project_id, title, success_criteria, ordinal
            FROM milestones
            WHERE project_id = ?1
            ORDER BY ordinal ASC
            ",
        )?;

        let rows = stmt.query_map(params![project_id], |row| {
            Ok(MilestoneRecord {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                success_criteria: row.get(3)?,
                ordinal: row.get(4)?,
                tasks: Vec::new(),
            })
        })?;

        let mut milestones: Vec<MilestoneRecord> = rows.collect::<Result<Vec<_>>>()?;
        for milestone in &mut milestones {
            milestone.tasks = self.list_tasks(&milestone.id)?;
        }
        Ok(milestones)
    }

    fn list_tasks(&self, milestone_id: &str) -> Result<Vec<TaskRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, milestone_id, kind, title, description, estimated_minutes, status,
                   suggested_date, acceptance_criteria, learning_content_json,
                   recommended_references_json, assessment_history_json, user_note, ordinal
            FROM tasks
            WHERE milestone_id = ?1
            ORDER BY ordinal ASC
            ",
        )?;

        let rows = stmt.query_map(params![milestone_id], |row| {
            Ok(TaskRecord {
                id: row.get(0)?,
                milestone_id: row.get(1)?,
                kind: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                estimated_minutes: row.get(5)?,
                status: row.get(6)?,
                suggested_date: row.get(7)?,
                acceptance_criteria: row.get(8)?,
                learning_content_json: row.get(9)?,
                recommended_references_json: row.get(10)?,
                assessment_history_json: row.get(11)?,
                user_note: row.get(12)?,
                ordinal: row.get(13)?,
            })
        })?;

        rows.collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn saves_and_loads_project_plan_tree() {
        let dir = tempdir().unwrap();
        let store = ProjectStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let project = ProjectRecord {
            id: "p1".to_string(),
            emoji: "R".to_string(),
            title: "Learn Rust".to_string(),
            goal_summary: "Build a CLI tool".to_string(),
            status: "active".to_string(),
            completed_tasks: 0,
            total_tasks: 1,
            critic_score: Some(8.5),
            last_active: "today".to_string(),
            milestones: vec![MilestoneRecord {
                id: "m1".to_string(),
                project_id: "p1".to_string(),
                title: "Basics".to_string(),
                success_criteria: "Explain ownership".to_string(),
                ordinal: 0,
                tasks: vec![TaskRecord {
                    id: "t1".to_string(),
                    milestone_id: "m1".to_string(),
                    kind: "reading".to_string(),
                    title: "Read ownership chapter".to_string(),
                    description: None,
                    estimated_minutes: 60,
                    status: "pending".to_string(),
                    suggested_date: None,
                    acceptance_criteria: Some("Can summarize ownership".to_string()),
                    learning_content_json: Some("{\"overview\":\"Miniverto guide\"}".to_string()),
                    recommended_references_json: Some("[{\"title\":\"The Rust Book\"}]".to_string()),
                    assessment_history_json: Some("[{\"scorePct\":80}]".to_string()),
                    user_note: None,
                    ordinal: 0,
                }],
            }],
        };

        store.upsert_project(&project).unwrap();

        let projects = store.list_projects().unwrap();

        assert_eq!(projects, vec![project]);
    }

    #[test]
    fn replacing_project_removes_old_plan_children() {
        let dir = tempdir().unwrap();
        let store = ProjectStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let mut project = ProjectRecord {
            id: "p1".to_string(),
            emoji: "R".to_string(),
            title: "Learn Rust".to_string(),
            goal_summary: "Build a CLI tool".to_string(),
            status: "active".to_string(),
            completed_tasks: 0,
            total_tasks: 1,
            critic_score: None,
            last_active: "today".to_string(),
            milestones: vec![MilestoneRecord {
                id: "m1".to_string(),
                project_id: "p1".to_string(),
                title: "Basics".to_string(),
                success_criteria: "Explain ownership".to_string(),
                ordinal: 0,
                tasks: vec![TaskRecord {
                    id: "t1".to_string(),
                    milestone_id: "m1".to_string(),
                    kind: "reading".to_string(),
                    title: "Old task".to_string(),
                    description: None,
                    estimated_minutes: 30,
                    status: "pending".to_string(),
                    suggested_date: None,
                    acceptance_criteria: None,
                    learning_content_json: None,
                    recommended_references_json: None,
                    assessment_history_json: None,
                    user_note: None,
                    ordinal: 0,
                }],
            }],
        };

        store.upsert_project(&project).unwrap();
        project.milestones.clear();
        project.total_tasks = 0;
        store.upsert_project(&project).unwrap();

        let projects = store.list_projects().unwrap();

        assert!(projects[0].milestones.is_empty());
    }

    #[test]
    fn deletes_project_and_plan_children() {
        let dir = tempdir().unwrap();
        let store = ProjectStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let project = ProjectRecord {
            id: "p-delete".to_string(),
            emoji: "R".to_string(),
            title: "Delete me".to_string(),
            goal_summary: "Temporary plan".to_string(),
            status: "active".to_string(),
            completed_tasks: 0,
            total_tasks: 1,
            critic_score: None,
            last_active: "today".to_string(),
            milestones: vec![MilestoneRecord {
                id: "m-delete".to_string(),
                project_id: "p-delete".to_string(),
                title: "Only milestone".to_string(),
                success_criteria: "Gone with project".to_string(),
                ordinal: 0,
                tasks: vec![TaskRecord {
                    id: "t-delete".to_string(),
                    milestone_id: "m-delete".to_string(),
                    kind: "reading".to_string(),
                    title: "Only task".to_string(),
                    description: None,
                    estimated_minutes: 30,
                    status: "pending".to_string(),
                    suggested_date: None,
                    acceptance_criteria: None,
                    learning_content_json: None,
                    recommended_references_json: None,
                    assessment_history_json: None,
                    user_note: None,
                    ordinal: 0,
                }],
            }],
        };

        store.upsert_project(&project).unwrap();
        store.delete_project(&project.id).unwrap();

        assert!(store.list_projects().unwrap().is_empty());
    }

    #[test]
    fn updates_task_status_note_and_project_counts() {
        let dir = tempdir().unwrap();
        let store = ProjectStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let project = ProjectRecord {
            id: "p-progress".to_string(),
            emoji: "R".to_string(),
            title: "Track progress".to_string(),
            goal_summary: "Persist task progress".to_string(),
            status: "active".to_string(),
            completed_tasks: 0,
            total_tasks: 1,
            critic_score: None,
            last_active: "today".to_string(),
            milestones: vec![MilestoneRecord {
                id: "m-progress".to_string(),
                project_id: "p-progress".to_string(),
                title: "Milestone".to_string(),
                success_criteria: "Task saved".to_string(),
                ordinal: 0,
                tasks: vec![TaskRecord {
                    id: "t-progress".to_string(),
                    milestone_id: "m-progress".to_string(),
                    kind: "practice".to_string(),
                    title: "Save note".to_string(),
                    description: None,
                    estimated_minutes: 30,
                    status: "pending".to_string(),
                    suggested_date: None,
                    acceptance_criteria: None,
                    learning_content_json: None,
                    recommended_references_json: None,
                    assessment_history_json: None,
                    user_note: None,
                    ordinal: 0,
                }],
            }],
        };

        store.upsert_project(&project).unwrap();
        store
            .update_task_progress(
                "t-progress",
                "completed",
                Some("Finished with notes"),
                Some("[{\"scorePct\":80}]"),
            )
            .unwrap();

        let projects = store.list_projects().unwrap();
        let updated = &projects[0];
        let task = &updated.milestones[0].tasks[0];

        assert_eq!(updated.completed_tasks, 1);
        assert_eq!(updated.total_tasks, 1);
        assert_eq!(task.status, "completed");
        assert_eq!(task.user_note.as_deref(), Some("Finished with notes"));
        assert_eq!(task.assessment_history_json.as_deref(), Some("[{\"scorePct\":80}]"));
    }
}
