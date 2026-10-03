#!/usr/bin/env python3
"""Run a shell command through a token-authenticated Jupyter terminal."""

import json
import os
import sys
import time
from urllib.parse import urlparse

import requests
import websocket


base_url = os.environ["JUPYTER_TASK_URL"].rstrip("/")
token = os.environ["JUPYTER_TASK_TOKEN"]
command = sys.stdin.read()
headers = {"Authorization": f"token {token}"}

response = requests.post(f"{base_url}/api/terminals", headers=headers, timeout=15)
response.raise_for_status()
terminal = response.json()
terminal_name = terminal["name"]

parsed = urlparse(base_url)
scheme = "wss" if parsed.scheme == "https" else "ws"
socket_url = f"{scheme}://{parsed.netloc}/terminals/websocket/{terminal_name}"
marker = f"__CODEX_DONE_{time.time_ns()}__"

try:
    socket = websocket.create_connection(
        socket_url,
        header=[f"Authorization: token {token}"],
        timeout=30,
    )
    socket.recv()
    socket.send(json.dumps(["stdin", command + f"\nprintf '\\n{marker}:%s\\n' $?\n"]))
    output = []
    deadline = time.time() + 300
    while time.time() < deadline:
        message = json.loads(socket.recv())
        if message[0] != "stdout":
            continue
        text = message[1]
        output.append(text)
        if "".join(output).count(marker) >= 2:
            break
    rendered = "".join(output)
    rendered = rendered.split(marker, 1)[1]
    rendered = rendered.rsplit(marker, 1)[0]
    sys.stdout.write(rendered)
finally:
    try:
        socket.close()
    except Exception:
        pass
    requests.delete(f"{base_url}/api/terminals/{terminal_name}", headers=headers, timeout=15)
