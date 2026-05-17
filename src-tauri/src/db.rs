use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MaterialRecord {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub source: String,
    pub parser_status: String,
    pub summary: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MaterialChunk {
    pub id: String,
    pub material_id: String,
    pub ordinal: i64,
    pub text: String,
}

pub struct MaterialStore {
    conn: Connection,
}

impl MaterialStore {
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

            CREATE TABLE IF NOT EXISTS materials (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              kind TEXT NOT NULL,
              source TEXT NOT NULL,
              parser_status TEXT NOT NULL,
              summary TEXT,
              created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS material_chunks (
              id TEXT PRIMARY KEY,
              material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
              ordinal INTEGER NOT NULL,
              text TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_material_chunks_material_id
              ON material_chunks(material_id, ordinal);
            ",
        )?;
        Ok(())
    }

    pub fn upsert_material(&self, material: &MaterialRecord) -> Result<()> {
        self.conn.execute(
            "
            INSERT INTO materials (id, name, kind, source, parser_status, summary, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              kind = excluded.kind,
              source = excluded.source,
              parser_status = excluded.parser_status,
              summary = excluded.summary
            ",
            params![
                material.id,
                material.name,
                material.kind,
                material.source,
                material.parser_status,
                material.summary,
                material.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn replace_chunks(&self, material_id: &str, chunks: &[MaterialChunk]) -> Result<()> {
        self.conn.execute(
            "DELETE FROM material_chunks WHERE material_id = ?1",
            params![material_id],
        )?;

        for chunk in chunks {
            self.conn.execute(
                "
                INSERT INTO material_chunks (id, material_id, ordinal, text)
                VALUES (?1, ?2, ?3, ?4)
                ",
                params![chunk.id, chunk.material_id, chunk.ordinal, chunk.text],
            )?;
        }

        Ok(())
    }

    pub fn list_materials(&self) -> Result<Vec<MaterialRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, name, kind, source, parser_status, summary, created_at
            FROM materials
            ORDER BY created_at ASC, name ASC
            ",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(MaterialRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                kind: row.get(2)?,
                source: row.get(3)?,
                parser_status: row.get(4)?,
                summary: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        rows.collect()
    }

    pub fn list_chunks(&self, material_id: &str) -> Result<Vec<MaterialChunk>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT id, material_id, ordinal, text
            FROM material_chunks
            WHERE material_id = ?1
            ORDER BY ordinal ASC
            ",
        )?;

        let rows = stmt.query_map(params![material_id], |row| {
            Ok(MaterialChunk {
                id: row.get(0)?,
                material_id: row.get(1)?,
                ordinal: row.get(2)?,
                text: row.get(3)?,
            })
        })?;

        rows.collect()
    }

    pub fn delete_material(&self, material_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM materials WHERE id = ?1",
            params![material_id],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn initializes_schema_and_saves_materials_with_chunks() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("miniverto.sqlite");
        let store = MaterialStore::open(&db_path).unwrap();

        let material = MaterialRecord {
            id: "mat-1".to_string(),
            name: "notes.md".to_string(),
            kind: "text".to_string(),
            source: "pasted".to_string(),
            parser_status: "ready".to_string(),
            summary: Some("Ownership and borrowing notes".to_string()),
            created_at: 1_775_000_000,
        };

        store.upsert_material(&material).unwrap();
        store
            .replace_chunks(
                &material.id,
                &[MaterialChunk {
                    id: "chunk-1".to_string(),
                    material_id: material.id.clone(),
                    ordinal: 0,
                    text: "Ownership controls moves.".to_string(),
                }],
            )
            .unwrap();

        let materials = store.list_materials().unwrap();
        let chunks = store.list_chunks(&material.id).unwrap();

        assert_eq!(materials, vec![material]);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].text, "Ownership controls moves.");
    }

    #[test]
    fn deletes_material_and_its_chunks() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("miniverto.sqlite");
        let store = MaterialStore::open(&db_path).unwrap();

        let material = MaterialRecord {
            id: "mat-delete".to_string(),
            name: "delete-me.md".to_string(),
            kind: "text".to_string(),
            source: "pasted".to_string(),
            parser_status: "ready".to_string(),
            summary: None,
            created_at: 1_775_000_002,
        };

        store.upsert_material(&material).unwrap();
        store
            .replace_chunks(
                &material.id,
                &[MaterialChunk {
                    id: "chunk-delete".to_string(),
                    material_id: material.id.clone(),
                    ordinal: 0,
                    text: "temporary".to_string(),
                }],
            )
            .unwrap();

        store.delete_material(&material.id).unwrap();

        assert!(store.list_materials().unwrap().is_empty());
        assert!(store.list_chunks(&material.id).unwrap().is_empty());
    }
}
