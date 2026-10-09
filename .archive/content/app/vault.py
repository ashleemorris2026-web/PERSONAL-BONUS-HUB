"""Secure credential vault - encrypts credentials with a user-supplied passphrase."""
from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class CredentialVault:
    """Manages encrypted storage of casino credentials."""

    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.salt_path = os.path.join(data_dir, ".salt")
        self.vault_path = os.path.join(data_dir, ".vault")
        self._fernet: Optional[Fernet] = None
        self._passphrase: Optional[str] = None

    def _get_or_create_salt(self) -> bytes:
        if os.path.exists(self.salt_path):
            with open(self.salt_path, "rb") as f:
                return f.read()
        salt = os.urandom(16)
        with open(self.salt_path, "wb") as f:
            f.write(salt)
        return salt

    def _derive_key(self, passphrase: str) -> bytes:
        salt = self._get_or_create_salt()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        return base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))

    def unlock(self, passphrase: str) -> bool:
        """Unlock the vault with a passphrase. Returns True if successful."""
        try:
            key = self._derive_key(passphrase)
            self._fernet = Fernet(key)
            self._passphrase = passphrase
            # Test by trying to read existing vault
            if os.path.exists(self.vault_path):
                with open(self.vault_path, "rb") as f:
                    self._fernet.decrypt(f.read())
            return True
        except Exception:
            self._fernet = None
            self._passphrase = None
            return False

    def is_unlocked(self) -> bool:
        return self._fernet is not None

    def store_credentials(self, username: str, password: str) -> None:
        """Store casino credentials in the encrypted vault."""
        if not self._fernet:
            raise RuntimeError("Vault is not unlocked")

        data = {"username": username, "password": password}
        encrypted = self._fernet.encrypt(json.dumps(data).encode())
        with open(self.vault_path, "wb") as f:
            f.write(encrypted)

    def get_credentials(self) -> dict:
        """Retrieve casino credentials from the vault."""
        if not self._fernet:
            raise RuntimeError("Vault is not unlocked")

        if not os.path.exists(self.vault_path):
            return {}

        with open(self.vault_path, "rb") as f:
            decrypted = self._fernet.decrypt(f.read())
        return json.loads(decrypted)

    def clear(self) -> None:
        """Clear all stored credentials."""
        if os.path.exists(self.vault_path):
            os.remove(self.vault_path)
        self._fernet = None
        self._passphrase = None

    def has_credentials(self) -> bool:
        return os.path.exists(self.vault_path) and self.is_unlocked()
