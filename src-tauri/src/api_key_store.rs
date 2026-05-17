const SERVICE_NAME: &str = "miniverto";

pub trait CredentialStore {
    fn set_password(&self, provider_id: &str, value: &str) -> Result<(), String>;
    fn has_password(&self, provider_id: &str) -> Result<bool, String>;
    fn delete_password(&self, provider_id: &str) -> Result<(), String>;
}

pub struct SystemCredentialStore;

impl CredentialStore for SystemCredentialStore {
    fn set_password(&self, provider_id: &str, value: &str) -> Result<(), String> {
        keyring::Entry::new(SERVICE_NAME, provider_id)
            .map_err(|err| err.to_string())?
            .set_password(value)
            .map_err(|err| err.to_string())
    }

    fn has_password(&self, provider_id: &str) -> Result<bool, String> {
        match keyring::Entry::new(SERVICE_NAME, provider_id)
            .map_err(|err| err.to_string())?
            .get_password()
        {
            Ok(_) => Ok(true),
            Err(keyring::Error::NoEntry) => Ok(false),
            Err(err) => Err(err.to_string()),
        }
    }

    fn delete_password(&self, provider_id: &str) -> Result<(), String> {
        match keyring::Entry::new(SERVICE_NAME, provider_id)
            .map_err(|err| err.to_string())?
            .delete_credential()
        {
            Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }
}

pub fn save_api_key_with_store(
    store: &impl CredentialStore,
    provider_id: &str,
    value: &str,
) -> Result<(), String> {
    if provider_id.trim().is_empty() {
        return Err("provider_id is required".to_string());
    }
    if value.trim().is_empty() {
        return Err("api key is required".to_string());
    }
    store.set_password(provider_id, value)
}

pub fn has_api_key_with_store(
    store: &impl CredentialStore,
    provider_id: &str,
) -> Result<bool, String> {
    store.has_password(provider_id)
}

pub fn delete_api_key_with_store(
    store: &impl CredentialStore,
    provider_id: &str,
) -> Result<(), String> {
    store.delete_password(provider_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};

    #[derive(Default)]
    struct MemoryCredentialStore {
        values: Arc<Mutex<HashMap<String, String>>>,
    }

    impl CredentialStore for MemoryCredentialStore {
        fn set_password(&self, provider_id: &str, value: &str) -> Result<(), String> {
            self.values.lock().unwrap().insert(provider_id.to_string(), value.to_string());
            Ok(())
        }

        fn has_password(&self, provider_id: &str) -> Result<bool, String> {
            Ok(self.values.lock().unwrap().contains_key(provider_id))
        }

        fn delete_password(&self, provider_id: &str) -> Result<(), String> {
            self.values.lock().unwrap().remove(provider_id);
            Ok(())
        }
    }

    #[test]
    fn saves_checks_and_deletes_api_key_without_exposing_value() {
        let store = MemoryCredentialStore::default();

        save_api_key_with_store(&store, "openrouter", "sk-secret").unwrap();
        assert!(has_api_key_with_store(&store, "openrouter").unwrap());

        delete_api_key_with_store(&store, "openrouter").unwrap();
        assert!(!has_api_key_with_store(&store, "openrouter").unwrap());
    }
}
