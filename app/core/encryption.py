# app/core/encryption.py

"""
Modul enkripsi untuk chat room.
Menggunakan Fernet (AES-128-CBC + HMAC) dari library `cryptography`.
Key di-derive dari SECRET_KEY menggunakan PBKDF2.
"""

import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


def _get_fernet() -> Fernet:
    """Derive a Fernet key from the app SECRET_KEY."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"medicall-chat-salt-v1",  # fixed salt, OK for app-level encryption
        iterations=100_000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return Fernet(key)


_fernet = _get_fernet()


def encrypt_messages(messages: list[dict]) -> str:
    """Encrypt a list of message dicts into a Fernet token string."""
    json_bytes = json.dumps(messages, ensure_ascii=False).encode("utf-8")
    return _fernet.encrypt(json_bytes).decode("utf-8")


def decrypt_messages(token: str) -> list[dict]:
    """Decrypt a Fernet token string back into a list of message dicts."""
    if not token:
        return []
    try:
        json_bytes = _fernet.decrypt(token.encode("utf-8"))
        return json.loads(json_bytes.decode("utf-8"))
    except Exception:
        return []
