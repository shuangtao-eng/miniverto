use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NoteRecord {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tags_json: String,
    pub links_json: String,
    pub source_type: String,
    pub project_id: Option<String>,
    pub task_id: Option<String>,
    pub material_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct NoteStore {
    conn: Connection,
}

impl NoteStore {
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
            CREATE TABLE IF NOT EXISTS notes (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              tags_json TEXT NOT NULL,
              links_json TEXT NOT NULL,
              source_type TEXT NOT NULL,
              project_id TEXT,
              task_id TEXT,
              material_id TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
            CREATE INDEX IF NOT EXISTS idx_notes_task ON notes(task_id);
            ",
        )?;
        Ok(())
    }

    pub fn upsert_note(&self, note: &NoteRecord) -> Result<()> {
        self.conn.execute(
            "
            INSERT INTO notes (
              id, title, body, tags_json, links_json, source_type,
              project_id, task_id, material_id, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              body = excluded.body,
              tags_json = excluded.tags_json,
              links_json = excluded.links_json,
              source_type = excluded.source_type,
              project_id = excluded.project_id,
              task_id = excluded.task_id,
              material_id = excluded.material_id,
              updated_at = excluded.updated_at
            ",
            params![
                note.id,
                note.title,
                note.body,
                note.tags_json,
                note.links_json,
                note.source_type,
                note.project_id,
                note.task_id,
                note.material_id,
                note.created_at,
                note.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_notes(&self) -> Result<Vec<NoteRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, title, body, tags_json, links_json, source_type,
                   project_id, task_id, material_id, created_at, updated_at
            FROM notes
            ORDER BY updated_at DESC, title ASC
            ",
        )?;
        let rows = stmt.query_map([], row_to_note)?;
        rows.collect()
    }

    pub fn search_notes(&self, query: &str) -> Result<Vec<NoteRecord>> {
        let pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "
            SELECT id, title, body, tags_json, links_json, source_type,
                   project_id, task_id, material_id, created_at, updated_at
            FROM notes
            WHERE title LIKE ?1 OR body LIKE ?1 OR tags_json LIKE ?1 OR links_json LIKE ?1
            ORDER BY updated_at DESC, title ASC
            ",
        )?;
        let rows = stmt.query_map(params![pattern], row_to_note)?;
        rows.collect()
    }

    pub fn delete_note(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }
}

fn row_to_note(row: &rusqlite::Row<'_>) -> Result<NoteRecord> {
    Ok(NoteRecord {
        id: row.get(0)?,
        title: row.get(1)?,
        body: row.get(2)?,
        tags_json: row.get(3)?,
        links_json: row.get(4)?,
        source_type: row.get(5)?,
        project_id: row.get(6)?,
        task_id: row.get(7)?,
        material_id: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn saves_searches_and_deletes_knowledge_notes() {
        let dir = tempdir().unwrap();
        let store = NoteStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let note = NoteRecord {
            id: "note-1".to_string(),
            title: "Active Recall".to_string(),
            body: "Practice retrieval and connect to [[Spacing Effect]].".to_string(),
            tags_json: "[\"method\"]".to_string(),
            links_json: "[\"Spacing Effect\"]".to_string(),
            source_type: "task".to_string(),
            project_id: Some("project-1".to_string()),
            task_id: Some("task-1".to_string()),
            material_id: None,
            created_at: "2026-04-27T12:00:00.000Z".to_string(),
            updated_at: "2026-04-27T12:00:00.000Z".to_string(),
        };

        store.upsert_note(&note).unwrap();

        let notes = store.list_notes().unwrap();
        assert_eq!(notes, vec![note.clone()]);
        assert_eq!(store.search_notes("retrieval").unwrap(), vec![note.clone()]);
        assert_eq!(store.search_notes("method").unwrap(), vec![note.clone()]);

        store.delete_note("note-1").unwrap();
        assert!(store.list_notes().unwrap().is_empty());
    }
}
