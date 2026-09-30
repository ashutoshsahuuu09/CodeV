import re
from typing import List, Dict, Any, Optional
from app.ingestion.secret_filter import redact_secrets

# Regex patterns for symbol detection across major languages
SYMBOL_PATTERNS = {
    "Python": [
        (r'^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(', "function"),
        (r'^class\s+([a-zA-Z0-9_]+)(?:\s*\([^)]*\))?:', "class"),
        (r'^@([a-zA-Z0-9_.]+)', "decorator"),
    ],
    "JavaScript": [
        (r'^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(', "function"),
        (r'^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', "function"),
        (r'^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)', "class"),
        (r'(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']', "endpoint"),
    ],
    "TypeScript": [
        (r'^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*(?:<[^>]+>)?\s*\(', "function"),
        (r'^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', "function"),
        (r'^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)', "class"),
        (r'^(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)', "interface"),
        (r'^(?:export\s+)?type\s+([a-zA-Z0-9_$]+)\s*=', "type"),
    ],
    "Go": [
        (r'^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(', "function"),
        (r'^type\s+([a-zA-Z0-9_]+)\s+struct', "struct"),
        (r'^type\s+([a-zA-Z0-9_]+)\s+interface', "interface"),
    ],
    "Java": [
        (r'^(?:public|protected|private|static|\s)+[\w<>\[\]]+\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{', "function"),
        (r'^(?:public|protected|private|\s)*(?:class|interface|enum)\s+([a-zA-Z0-9_]+)', "class"),
    ],
    "Rust": [
        (r'^(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<[^>]+>)?\s*\(', "function"),
        (r'^(?:pub\s+)?struct\s+([a-zA-Z0-9_]+)', "struct"),
        (r'^(?:pub\s+)?enum\s+([a-zA-Z0-9_]+)', "enum"),
        (r'^impl(?:\s+<[^>]+>)?\s+([a-zA-Z0-9_]+)', "impl"),
    ]
}

def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)

def chunk_code_file(
    file_path: str,
    raw_content: str,
    language: str,
    target_chunk_lines: int = 50,
    overlap_lines: int = 10
) -> List[Dict[str, Any]]:
    """
    Intelligently splits source code into contextual chunks with symbol awareness,
    line number tracking, secret redaction, and token estimates.
    """
    clean_content = redact_secrets(raw_content)
    lines = clean_content.splitlines()
    total_lines = len(lines)

    if total_lines == 0:
        return []

    # If small file, return single chunk
    if total_lines <= target_chunk_lines + 15:
        return [{
            "file_path": file_path,
            "language": language,
            "symbol_name": None,
            "symbol_type": "module",
            "start_line": 1,
            "end_line": total_lines,
            "chunk_content": clean_content,
            "chunk_tokens": estimate_tokens(clean_content)
        }]

    # Identify symbols with line numbers
    symbols_at_lines = {}
    patterns = SYMBOL_PATTERNS.get(language, [])
    # Also apply JS patterns for TS or React
    if "JavaScript" in language or "TypeScript" in language:
        patterns = SYMBOL_PATTERNS["JavaScript"] + SYMBOL_PATTERNS.get("TypeScript", [])

    for idx, line in enumerate(lines):
        stripped = line.strip()
        for pattern, sym_type in patterns:
            match = re.search(pattern, stripped)
            if match:
                sym_name = match.group(1)
                symbols_at_lines[idx + 1] = (sym_name, sym_type)
                break

    chunks = []
    current_start = 0

    while current_start < total_lines:
        current_end = min(current_start + target_chunk_lines, total_lines)

        # Try to break on a symbol boundary if near the end
        adjusted_end = current_end
        if current_end < total_lines:
            for offset in range(0, 15):
                candidate_line = current_end - offset
                if candidate_line in symbols_at_lines and candidate_line > current_start + 15:
                    adjusted_end = candidate_line - 1
                    break

        chunk_lines = lines[current_start:adjusted_end]
        chunk_text = "\n".join(chunk_lines)

        start_line_num = current_start + 1
        end_line_num = adjusted_end

        # Find dominant symbol in this chunk
        primary_sym_name = None
        primary_sym_type = "block"
        for l_num in range(start_line_num, end_line_num + 1):
            if l_num in symbols_at_lines:
                primary_sym_name, primary_sym_type = symbols_at_lines[l_num]
                break

        chunks.append({
            "file_path": file_path,
            "language": language,
            "symbol_name": primary_sym_name,
            "symbol_type": primary_sym_type,
            "start_line": start_line_num,
            "end_line": end_line_num,
            "chunk_content": chunk_text,
            "chunk_tokens": estimate_tokens(chunk_text)
        })

        if adjusted_end >= total_lines:
            break

        current_start = adjusted_end - overlap_lines
        if current_start < 0:
            current_start = 0
        if current_start >= total_lines:
            break

    return chunks
