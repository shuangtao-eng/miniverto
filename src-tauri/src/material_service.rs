use crate::db::{MaterialChunk, MaterialRecord, MaterialStore};
use crate::material_parser::parse_text_material;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TextMaterialIngestRequest {
    pub id: String,
    pub name: String,
    pub source: String,
    pub content: String,
    pub created_at: i64,
}

pub fn ingest_text_material_into_store(
    store: &MaterialStore,
    request: TextMaterialIngestRequest,
) -> Result<MaterialRecord, String> {
    let parsed = parse_text_material(&request.name, &request.content)?;
    let material = MaterialRecord {
        id: request.id,
        name: parsed.name,
        kind: parsed.kind,
        source: request.source,
        parser_status: parsed.parser_status,
        summary: Some(parsed.summary),
        created_at: request.created_at,
    };
    let chunks: Vec<MaterialChunk> = parsed
        .chunks
        .into_iter()
        .enumerate()
        .map(|(index, text)| MaterialChunk {
            id: format!("{}-chunk-{}", material.id, index),
            material_id: material.id.clone(),
            ordinal: index as i64,
            text,
        })
        .collect();

    store.upsert_material(&material).map_err(|err| err.to_string())?;
    store
        .replace_chunks(&material.id, &chunks)
        .map_err(|err| err.to_string())?;

    Ok(material)
}

pub fn list_materials_from_store(store: &MaterialStore) -> Result<Vec<MaterialRecord>, String> {
    store.list_materials().map_err(|err| err.to_string())
}

pub fn delete_material_from_store(store: &MaterialStore, id: &str) -> Result<(), String> {
    store.delete_material(id).map_err(|err| err.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::MaterialStore;
    use tempfile::tempdir;

    #[test]
    fn ingests_text_material_into_store_with_chunks() {
        let dir = tempdir().unwrap();
        let store = MaterialStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let request = TextMaterialIngestRequest {
            id: "mat-text-1".to_string(),
            name: "course-notes.md".to_string(),
            source: "pasted".to_string(),
            content: "第一章 线性回归\n损失函数和梯度。\n\n第二章 正则化\nL1 与 L2。".to_string(),
            created_at: 1_775_000_001,
        };

        let material = ingest_text_material_into_store(&store, request).unwrap();
        let chunks = store.list_chunks(&material.id).unwrap();

        assert_eq!(material.kind, "text");
        assert_eq!(material.parser_status, "ready");
        assert_eq!(chunks.len(), 2);
        assert!(material.summary.unwrap().contains("线性回归"));
    }

    #[test]
    fn lists_materials_for_library_display() {
        let dir = tempdir().unwrap();
        let store = MaterialStore::open(&dir.path().join("miniverto.sqlite")).unwrap();
        let request = TextMaterialIngestRequest {
            id: "mat-list-1".to_string(),
            name: "list-notes.md".to_string(),
            source: "pasted".to_string(),
            content: "A useful note.".to_string(),
            created_at: 1_775_000_003,
        };

        ingest_text_material_into_store(&store, request).unwrap();

        let materials = list_materials_from_store(&store).unwrap();

        assert_eq!(materials.len(), 1);
        assert_eq!(materials[0].name, "list-notes.md");
    }
}
