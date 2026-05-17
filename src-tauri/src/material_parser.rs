use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ParsedMaterial {
    pub name: String,
    pub kind: String,
    pub parser_status: String,
    pub summary: String,
    pub chunks: Vec<String>,
}

pub fn parse_text_material(name: &str, content: &str) -> Result<ParsedMaterial, String> {
    let normalized = content.trim().replace("\r\n", "\n");
    if normalized.is_empty() {
        return Err("text material is empty".to_string());
    }

    let chunks: Vec<String> = normalized
        .split("\n\n")
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(ToString::to_string)
        .collect();

    let chunks = if chunks.is_empty() {
        vec![normalized.clone()]
    } else {
        chunks
    };

    let summary: String = normalized.chars().take(180).collect();

    Ok(ParsedMaterial {
        name: name.to_string(),
        kind: "text".to_string(),
        parser_status: "ready".to_string(),
        summary,
        chunks,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_plain_text_into_summary_and_chunks() {
        let parsed = parse_text_material(
            "notes.md",
            "第一章 所有权\nRust ownership prevents double free.\n\n第二章 借用\nBorrowing allows references.",
        )
        .unwrap();

        assert_eq!(parsed.kind, "text");
        assert_eq!(parsed.parser_status, "ready");
        assert!(parsed.summary.contains("第一章"));
        assert_eq!(parsed.chunks.len(), 2);
    }

    #[test]
    fn rejects_empty_text_material() {
        let err = parse_text_material("empty.txt", "   ").unwrap_err();

        assert!(err.contains("empty"));
    }
}
