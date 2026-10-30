#!/usr/bin/env python3
"""Claude Code hook: append-only prompt/delegation logger (stdlib only).

Reads the hook JSON from stdin and appends ONE line to
evidence/prompts/<UTC-date>/<session-id>.jsonl. Never prints to stdout
(UserPromptSubmit stdout would be injected into the conversation) and
always exits 0 so it can never block the session.
"""
import datetime as _dt
import hashlib
import json
import os
import re
import sys

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root, independent of launch cwd
LOG_ROOT = os.path.join(PROJECT, "evidence", "prompts")

# Tools whose input is a prompt/message written for another agent.
PROMPT_TOOLS = {"Agent", "Task", "SendMessage", "TaskCreate", "TaskUpdate", "send_message", "create_session"}
SECRET_PATTERNS = [
    (re.compile(r"sk-[A-Za-z0-9_\-]{16,}"), "sk-***"),
    (re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"), "gh*_***"),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{12,}"), "Bearer ***"),
    (re.compile(r"(?i)(password|passwd|secret|token|api[_-]?key)(\s*[=:]\s*)\S+"), r"\1\2***"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AKIA***"),
]
TASK_RE = re.compile(r"\b(T\d+-[A-Z]+(?:-[A-Z0-9]+)?)\b")


def mask(text):
    if not isinstance(text, str):
        return text
    for pat, rep in SECRET_PATTERNS:
        text = pat.sub(rep, text)
    return text


def first_task_id(text):
    m = TASK_RE.search(text or "")
    return m.group(1) if m else None


def build_entry(data):
    event = data.get("hook_event_name", "unknown")
    tool = data.get("tool_name")
    tin = data.get("tool_input") or {}
    agent_id = data.get("agent_id")
    agent_type = data.get("agent_type")
    # Hooks fired inside a subagent carry agent_id/agent_type; otherwise it is the lead session.
    emitter = agent_type or (f"agent:{agent_id}" if agent_id else "team-lead")
    entry = {
        "ts_utc": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "session_id": data.get("session_id"),
        "event": event,
        "capture": f"hook:{event}" + (f":{tool}" if tool else ""),
        "emitter": emitter,
        "receiver": None,
        "model": tin.get("model") if isinstance(tin, dict) else None,
        "task_id": None,
        "text": None,
        "result_ref": None,
    }
    if event == "UserPromptSubmit":
        text = data.get("prompt", "")
        if text.lstrip().startswith(("<task-notification", "<cross-session-message", "<system-reminder")):
            entry["emitter"] = "harness-notification"
        else:
            # Typed into the lead session; may be a human or an orchestrating tool. Not asserted further.
            entry["emitter"] = "user-turn(UserPromptSubmit)"
        entry["receiver"] = "team-lead"
        entry["text"] = text
    elif event in ("PreToolUse", "PostToolUse") and tool in PROMPT_TOOLS:
        if tool in ("Agent", "Task"):
            entry["receiver"] = tin.get("name") or tin.get("description") or tin.get("subagent_type")
            entry["text"] = tin.get("prompt")
            entry["meta"] = {k: tin.get(k) for k in ("subagent_type", "effort", "run_in_background", "description") if k in tin}
        elif tool in ("SendMessage", "send_message"):
            entry["receiver"] = tin.get("to") or tin.get("session_id")
            entry["text"] = tin.get("message")
        else:
            entry["receiver"] = tin.get("owner")
            entry["text"] = json.dumps({k: tin.get(k) for k in ("taskId", "subject", "description", "status", "owner") if k in tin}, ensure_ascii=False)
        if event == "PostToolUse":
            resp = data.get("tool_response")
            raw = resp if isinstance(resp, str) else json.dumps(resp, ensure_ascii=False, default=str)
            entry["result_ref"] = mask(raw[:600]) if raw else None
            entry["text_sha256_of_input"] = hashlib.sha256((entry["text"] or "").encode()).hexdigest()
            entry["text"] = None  # input already captured in PreToolUse; avoid duplication
    elif event in ("SubagentStart", "SubagentStop", "TeammateIdle", "TaskCompleted", "Stop"):
        entry["receiver"] = agent_type or agent_id
        entry["meta"] = {"agent_id": agent_id, "agent_type": agent_type,
                         "note": "lifecycle event; does not contain the full prompt text"}
        if event == "SubagentStop" and data.get("last_assistant_message"):
            entry["result_ref"] = mask(str(data.get("last_assistant_message"))[:600])
    else:
        entry["capture"] = "uncaptured:" + entry["capture"]
        entry["meta"] = {"reason": "event/tool not in capture scope"}
    entry["text"] = mask(entry["text"])
    entry["task_id"] = first_task_id(entry["text"] or "") or first_task_id(str(entry.get("receiver") or ""))
    entry["sha256"] = hashlib.sha256((entry["text"] or "").encode()).hexdigest() if entry["text"] else None
    return entry


def main():
    try:
        raw = sys.stdin.read()
        try:
            data = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            data = {"hook_event_name": "unparseable"}
        entry = build_entry(data)
        day = entry["ts_utc"][:10]
        sid = re.sub(r"[^A-Za-z0-9_.-]", "_", str(entry["session_id"] or "no-session"))
        folder = os.path.join(LOG_ROOT, day)
        os.makedirs(folder, exist_ok=True)
        line = json.dumps(entry, ensure_ascii=False) + "\n"
        # O_APPEND: atomic appends for single writes; never truncates previous events.
        fd = os.open(os.path.join(folder, sid + ".jsonl"), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        try:
            os.write(fd, line.encode("utf-8"))
        finally:
            os.close(fd)
    except Exception as exc:  # never block Claude Code
        try:
            sys.stderr.write(f"prompt_logger error: {exc}\n")
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
