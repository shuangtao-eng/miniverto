use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

pub mod db;
pub mod api_key_store;
pub mod material_parser;
pub mod material_service;
pub mod provider_store;
pub mod project_store;
pub mod assessment_store;
pub mod note_store;

use db::{MaterialRecord, MaterialStore};
use api_key_store::{
    delete_api_key_with_store, has_api_key_with_store, save_api_key_with_store, SystemCredentialStore,
};
use material_service::{
    delete_material_from_store, ingest_text_material_into_store, list_materials_from_store,
    TextMaterialIngestRequest,
};
use assessment_store::{AssessmentResultRecord, AssessmentStore};
use note_store::{NoteRecord, NoteStore};
use project_store::{ProjectRecord, ProjectStore};
use provider_store::{ProviderConfigRecord, ProviderStore};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MaterialKind {
    Text,
    Document,
    Slides,
    Audio,
    Unsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialClassification {
    pub file_name: String,
    pub kind: MaterialKind,
    pub parser_status: String,
}

fn classify_material_kind(file_name: &str) -> MaterialKind {
    let Some(extension) = file_name.rsplit('.').next().map(str::to_ascii_lowercase) else {
        return MaterialKind::Unsupported;
    };

    match extension.as_str() {
        "txt" | "md" | "markdown" => MaterialKind::Text,
        "pdf" | "docx" => MaterialKind::Document,
        "ppt" | "pptx" => MaterialKind::Slides,
        "mp3" | "m4a" | "wav" => MaterialKind::Audio,
        _ => MaterialKind::Unsupported,
    }
}

pub fn classify_material(file_name: String) -> MaterialClassification {
    let kind = classify_material_kind(&file_name);
    let parser_status = match kind {
        MaterialKind::Text => "ready",
        MaterialKind::Unsupported => "unsupported",
        MaterialKind::Document | MaterialKind::Slides | MaterialKind::Audio => "needs-parser",
    }
    .to_string();

    MaterialClassification {
        file_name,
        kind,
        parser_status,
    }
}

#[tauri::command]
fn classify_material_command(file_name: String) -> MaterialClassification {
    classify_material(file_name)
}

fn app_database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(dir.join("miniverto.sqlite"))
}

#[tauri::command]
fn ingest_text_material(
    app: tauri::AppHandle,
    request: TextMaterialIngestRequest,
) -> Result<MaterialRecord, String> {
    let db_path = app_database_path(&app)?;
    let store = MaterialStore::open(&db_path).map_err(|err| err.to_string())?;
    ingest_text_material_into_store(&store, request)
}

#[tauri::command]
fn list_materials(app: tauri::AppHandle) -> Result<Vec<MaterialRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = MaterialStore::open(&db_path).map_err(|err| err.to_string())?;
    list_materials_from_store(&store)
}

#[tauri::command]
fn delete_material(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = MaterialStore::open(&db_path).map_err(|err| err.to_string())?;
    delete_material_from_store(&store, &id)
}

#[tauri::command]
fn list_projects(app: tauri::AppHandle) -> Result<Vec<ProjectRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = ProjectStore::open(&db_path).map_err(|err| err.to_string())?;
    store.list_projects().map_err(|err| err.to_string())
}

#[tauri::command]
fn upsert_project(app: tauri::AppHandle, project: ProjectRecord) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = ProjectStore::open(&db_path).map_err(|err| err.to_string())?;
    store.upsert_project(&project).map_err(|err| err.to_string())
}

#[tauri::command]
fn delete_project(app: tauri::AppHandle, project_id: String) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let project_store = ProjectStore::open(&db_path).map_err(|err| err.to_string())?;
    project_store.delete_project(&project_id).map_err(|err| err.to_string())?;

    let assessment_store = AssessmentStore::open(&db_path).map_err(|err| err.to_string())?;
    assessment_store
        .delete_results_for_project(&project_id)
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn update_task_progress(
    app: tauri::AppHandle,
    task_id: String,
    status: String,
    user_note: Option<String>,
    assessment_history_json: Option<String>,
) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = ProjectStore::open(&db_path).map_err(|err| err.to_string())?;
    store
        .update_task_progress(
            &task_id,
            &status,
            user_note.as_deref(),
            assessment_history_json.as_deref(),
        )
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn upsert_assessment_result(
    app: tauri::AppHandle,
    result: AssessmentResultRecord,
) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = AssessmentStore::open(&db_path).map_err(|err| err.to_string())?;
    store.upsert_result(&result).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_assessment_results(
    app: tauri::AppHandle,
    project_id: String,
) -> Result<Vec<AssessmentResultRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = AssessmentStore::open(&db_path).map_err(|err| err.to_string())?;
    store.list_results(&project_id).map_err(|err| err.to_string())
}

#[tauri::command]
fn get_latest_assessment_result(
    app: tauri::AppHandle,
    project_id: String,
) -> Result<Option<AssessmentResultRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = AssessmentStore::open(&db_path).map_err(|err| err.to_string())?;
    store.latest_result(&project_id).map_err(|err| err.to_string())
}

#[tauri::command]
fn upsert_note(app: tauri::AppHandle, note: NoteRecord) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = NoteStore::open(&db_path).map_err(|err| err.to_string())?;
    store.upsert_note(&note).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_notes(app: tauri::AppHandle) -> Result<Vec<NoteRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = NoteStore::open(&db_path).map_err(|err| err.to_string())?;
    store.list_notes().map_err(|err| err.to_string())
}

#[tauri::command]
fn search_notes(app: tauri::AppHandle, query: String) -> Result<Vec<NoteRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = NoteStore::open(&db_path).map_err(|err| err.to_string())?;
    store.search_notes(&query).map_err(|err| err.to_string())
}

#[tauri::command]
fn delete_note(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = NoteStore::open(&db_path).map_err(|err| err.to_string())?;
    store.delete_note(&id).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_provider_configs(app: tauri::AppHandle) -> Result<Vec<ProviderConfigRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = ProviderStore::open(&db_path).map_err(|err| err.to_string())?;
    store.list_provider_configs().map_err(|err| err.to_string())
}

#[tauri::command]
fn get_default_provider_config(app: tauri::AppHandle) -> Result<Option<ProviderConfigRecord>, String> {
    let db_path = app_database_path(&app)?;
    let store = ProviderStore::open(&db_path).map_err(|err| err.to_string())?;
    store.get_default_provider_config().map_err(|err| err.to_string())
}

#[tauri::command]
fn upsert_provider_config(app: tauri::AppHandle, config: ProviderConfigRecord) -> Result<(), String> {
    let db_path = app_database_path(&app)?;
    let store = ProviderStore::open(&db_path).map_err(|err| err.to_string())?;
    store.upsert_provider_config(&config).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_api_key(provider_id: String, api_key: String) -> Result<(), String> {
    save_api_key_with_store(&SystemCredentialStore, &provider_id, &api_key)
}

#[tauri::command]
fn has_api_key(provider_id: String) -> Result<bool, String> {
    has_api_key_with_store(&SystemCredentialStore, &provider_id)
}

#[tauri::command]
fn delete_api_key(provider_id: String) -> Result<(), String> {
    delete_api_key_with_store(&SystemCredentialStore, &provider_id)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            classify_material_command,
            ingest_text_material,
            list_materials,
            delete_material,
            list_projects,
            upsert_project,
            delete_project,
            update_task_progress,
            upsert_assessment_result,
            list_assessment_results,
            get_latest_assessment_result,
            upsert_note,
            list_notes,
            search_notes,
            delete_note,
            list_provider_configs,
            get_default_provider_config,
            upsert_provider_config,
            save_api_key,
            has_api_key,
            delete_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running Miniverto");
}

#[cfg(test)]
mod tests {
    use super::{classify_material, MaterialKind};

    #[test]
    fn classifies_supported_material_types() {
        assert_eq!(classify_material("notes.md".to_string()).kind, MaterialKind::Text);
        assert_eq!(classify_material("lecture.pdf".to_string()).kind, MaterialKind::Document);
        assert_eq!(classify_material("deck.pptx".to_string()).kind, MaterialKind::Slides);
        assert_eq!(classify_material("audio.wav".to_string()).kind, MaterialKind::Audio);
    }

    #[test]
    fn marks_unknown_material_as_unsupported() {
        let result = classify_material("archive.zip".to_string());

        assert_eq!(result.kind, MaterialKind::Unsupported);
        assert_eq!(result.parser_status, "unsupported");
    }
}
