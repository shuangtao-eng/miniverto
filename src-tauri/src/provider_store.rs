use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProviderConfigRecord {
    pub provider_id: String,
    pub base_url: String,
    pub model: String,
    pub enabled: bool,
    pub is_default: bool,
    pub updated_at: i64,
}

pub struct ProviderStore {
    conn: Connection,
}

impl ProviderStore {
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
            CREATE TABLE IF NOT EXISTS provider_configs (
              provider_id TEXT PRIMARY KEY,
              base_url TEXT NOT NULL,
              model TEXT NOT NULL,
              enabled INTEGER NOT NULL,
              is_default INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            );
            ",
        )?;
        Ok(())
    }

    pub fn upsert_provider_config(&self, config: &ProviderConfigRecord) -> Result<()> {
        if config.is_default {
            self.conn.execute("UPDATE provider_configs SET is_default = 0", [])?;
        }

        self.conn.execute(
            "
            INSERT INTO provider_configs (provider_id, base_url, model, enabled, is_default, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(provider_id) DO UPDATE SET
              base_url = excluded.base_url,
              model = excluded.model,
              enabled = excluded.enabled,
              is_default = excluded.is_default,
              updated_at = excluded.updated_at
            ",
            params![
                config.provider_id,
                config.base_url,
                config.model,
                config.enabled,
                config.is_default,
                config.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_provider_configs(&self) -> Result<Vec<ProviderConfigRecord>> {
        let mut stmt = self.conn.prepare(
            "
            SELECT provider_id, base_url, model, enabled, is_default, updated_at
            FROM provider_configs
            ORDER BY is_default DESC, provider_id ASC
            ",
        )?;
        let rows = stmt.query_map([], provider_from_row)?;
        rows.collect()
    }

    pub fn get_default_provider_config(&self) -> Result<Option<ProviderConfigRecord>> {
        self.conn
            .query_row(
                "
                SELECT provider_id, base_url, model, enabled, is_default, updated_at
                FROM provider_configs
                WHERE is_default = 1
                LIMIT 1
                ",
                [],
                provider_from_row,
            )
            .optional()
    }
}

fn provider_from_row(row: &rusqlite::Row<'_>) -> Result<ProviderConfigRecord> {
    Ok(ProviderConfigRecord {
        provider_id: row.get(0)?,
        base_url: row.get(1)?,
        model: row.get(2)?,
        enabled: row.get(3)?,
        is_default: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn saves_and_loads_default_provider_config() {
        let dir = tempdir().unwrap();
        let store = ProviderStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let config = ProviderConfigRecord {
            provider_id: "openrelay".to_string(),
            base_url: "http://127.0.0.1:3456/v1".to_string(),
            model: "openrelay-auto".to_string(),
            enabled: true,
            is_default: true,
            updated_at: 1_775_000_004,
        };

        store.upsert_provider_config(&config).unwrap();

        let default = store.get_default_provider_config().unwrap().unwrap();
        let all = store.list_provider_configs().unwrap();

        assert_eq!(default, config);
        assert_eq!(all, vec![config]);
    }

    #[test]
    fn only_one_provider_can_be_default() {
        let dir = tempdir().unwrap();
        let store = ProviderStore::open(&dir.path().join("miniverto.sqlite")).unwrap();

        store.upsert_provider_config(&ProviderConfigRecord {
            provider_id: "openai".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            model: "gpt-4o".to_string(),
            enabled: true,
            is_default: true,
            updated_at: 1,
        }).unwrap();
        store.upsert_provider_config(&ProviderConfigRecord {
            provider_id: "openrelay".to_string(),
            base_url: "http://127.0.0.1:3456/v1".to_string(),
            model: "openrelay-auto".to_string(),
            enabled: true,
            is_default: true,
            updated_at: 2,
        }).unwrap();

        let all = store.list_provider_configs().unwrap();

        assert_eq!(all.iter().filter(|config| config.is_default).count(), 1);
        assert_eq!(store.get_default_provider_config().unwrap().unwrap().provider_id, "openrelay");
    }
}
