import os
import hashlib
from typing import List, Dict, Any, Optional
from app.ingestion.secret_filter import is_sensitive_file

# Ignored directories
IGNORED_DIRS = {
    ".git", ".github", "node_modules", "dist", "build", "__pycache__",
    ".venv", "venv", "env", ".next", ".nuxt", "coverage", ".pytest_cache",
    ".idea", ".vscode", "vendor", "target", "bin", "obj", ".turbo",
    ".cache", "tmp", "temp", "storage"
}

# Ignored extensions (binaries, media, lockfiles, large data)
IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".mp4", ".mp3", ".pdf",
    ".zip", ".tar", ".gz", ".7z", ".rar", ".exe", ".dll", ".so", ".dylib", ".class",
    ".pyc", ".pyo", ".pyd", ".wasm", ".map", ".min.js", ".min.css",
    ".lock", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Cargo.lock", "poetry.lock"
}

# Language extension mapping
LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".c": "C",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".go": "Go",
    ".rs": "Rust",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".mdx": "Markdown (MDX)",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".dockerfile": "Dockerfile",
    "dockerfile": "Dockerfile",
    ".toml": "TOML"
}

def detect_language(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    filename = parts[-1].lower()
    
    if filename == "dockerfile" or filename.startswith("dockerfile."):
        return "Dockerfile"
    if filename == "makefile":
        return "Makefile"

    _, ext = os.path.splitext(filename)
    return LANGUAGE_MAP.get(ext, "Plain Text")

def is_supported_code_file(relative_path: str, file_size_bytes: int, max_size_kb: int = 500) -> bool:
    if file_size_bytes > (max_size_kb * 1024):
        return False

    parts = relative_path.replace("\\", "/").split("/")
    
    # Check directory ignore list
    for part in parts[:-1]:
        if part in IGNORED_DIRS or part.startswith("."):
            return False

    filename = parts[-1].lower()
    if filename.startswith(".") and not (filename in [".env.example", ".gitignore", ".eslintrc"]):
        return False

    if is_sensitive_file(relative_path):
        return False

    _, ext = os.path.splitext(filename)
    if ext in IGNORED_EXTENSIONS or filename in IGNORED_EXTENSIONS:
        return False

    # Check if recognized language
    lang = detect_language(relative_path)
    return lang != "Plain Text" or filename in ["dockerfile", "makefile", "readme.md", "contributing.md"]

def scan_directory(root_dir: str, max_files: int = 1000) -> List[Dict[str, Any]]:
    """
    Recursively scans directory and returns list of eligible source files with metadata.
    """
    discovered_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # In-place modify dirnames to skip ignored dirs
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and not d.startswith(".")]

        for fname in filenames:
            abs_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(abs_path, root_dir).replace("\\", "/")

            try:
                file_size = os.path.getsize(abs_path)
            except OSError:
                continue

            if not is_supported_code_file(rel_path, file_size):
                continue

            # Read content with encoding fallbacks
            content = None
            for enc in ["utf-8", "latin-1", "cp1252"]:
                try:
                    with open(abs_path, "r", encoding=enc, errors="replace") as f:
                        content = f.read()
                    break
                except Exception:
                    continue

            if content is None:
                continue

            # Skip binary files that have null bytes
            if "\x00" in content:
                continue

            lines = content.splitlines()
            line_count = len(lines)
            sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
            language = detect_language(rel_path)

            discovered_files.append({
                "relative_path": rel_path,
                "file_name": fname,
                "language": language,
                "size_bytes": file_size,
                "line_count": line_count,
                "sha256": sha256,
                "raw_content": content,
            })

            if len(discovered_files) >= max_files:
                break
        
        if len(discovered_files) >= max_files:
            break

    return discovered_files
