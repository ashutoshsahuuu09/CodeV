import re

# Patterns to detect sensitive tokens, credentials, and API keys
SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|secret|token|password|passwd|auth[_-]?token|bearer|private[_-]?key)\s*[:=]\s*["\']([a-zA-Z0-9_\-\.\~]{8,})["\']', 2),
    (r'(?i)gh[pousr]_[A-Za-z0-9_]{36,255}', 0), # GitHub Personal Access Tokens
    (r'(?i)sk-[a-zA-Z0-9]{20,64}', 0),          # OpenAI API Keys
    (r'(?i)AIza[0-9A-Za-z-_]{35}', 0),          # Google API Keys
    (r'(?i)AKIA[0-9A-Z]{16}', 0),               # AWS Access Key ID
    (r'-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', 0),
]

SENSITIVE_FILENAMES = {
    ".env", ".env.local", ".env.production", ".env.development", ".env.test",
    "id_rsa", "id_dsa", "id_ed25519", "credentials.json", "service-account.json",
    ".npmrc", ".pypirc", "client_secret.json"
}

def is_sensitive_file(file_path: str) -> bool:
    """Returns True if the file name is typically an environment or credentials file."""
    parts = file_path.replace("\\", "/").split("/")
    filename = parts[-1].lower()
    if filename in SENSITIVE_FILENAMES:
        return True
    if filename.startswith(".env.") or filename.endswith(".pem") or filename.endswith(".key"):
        return True
    return False

def redact_secrets(code_content: str) -> str:
    """Scrubs detected API keys and secrets from the code text before embedding/storing."""
    cleaned = code_content
    for pattern, group_idx in SECRET_PATTERNS:
        if group_idx == 0:
            cleaned = re.sub(pattern, "[REDACTED_SECRET]", cleaned)
        else:
            def replace_match(match):
                full = match.group(0)
                secret = match.group(group_idx)
                return full.replace(secret, "[REDACTED_SECRET]")
            cleaned = re.sub(pattern, replace_match, cleaned)
    return cleaned
