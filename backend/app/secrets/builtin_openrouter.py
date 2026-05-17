"""Built-in OpenRouter credentials (ciphertext only — no plaintext in repo)."""

from cryptography.fernet import Fernet

# Fernet key used only to protect the embedded provider key (not user secrets).
_FERNET_KEY = b"QkfnyPopL_eFtvFuQ4841VTps4xxjk3zxXJdePU712M="
_CIPHERTEXT = (
    "gAAAAABqCN3XkT94KeFCmN0k8ZMiWiTXWfaKmfkeAJgIwSyLx9B0kmVdh__d7Cc8Wltf-0hOla3jPSK_JLYH-o4VwKzfWrU7mrz8sw8lfWpbTweMnujE8fxdkWI7FGXzAqRUocd4QVpVtNReHfbEyw5mndyvtknYPe60PQk1PW-b04F0pbnK6as="
)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-v3.2"
PROVIDER_NAME = "openrouter"


def get_builtin_openrouter_api_key() -> str:
    return Fernet(_FERNET_KEY).decrypt(_CIPHERTEXT.encode("ascii")).decode("utf-8")
