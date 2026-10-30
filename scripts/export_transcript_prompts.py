#!/usr/bin/env python3
"""Exporta prompts OBSERVADOS desde los transcripts JSONL de Claude Code (stdlib only).

Respaldo del hook cuando la sesión no cargó `.claude/settings.json` (p.ej. sesión iniciada en otro
directorio). Lee el transcript real de la sesión líder y de sus subagentes y extrae:
  - turnos de usuario de la sesión líder (texto tal cual se recibió),
  - llamadas a Agent/SendMessage/TaskCreate/TaskUpdate (instrucción literal entregada),
  - mensaje final de cada subagente (resultado).
No reconstruye nada: si un dato no está en el transcript, no aparece. Salida append-only:
evidence/prompts/<fecha>/<session>.transcript-export.jsonl  (se omiten entradas ya exportadas por hash).

Uso: python3 scripts/export_transcript_prompts.py <transcript.jsonl> [--subagents-dir DIR] [--bootstrap OUT.md]
"""
import argparse
import glob
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prompt_logger import mask, first_task_id  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPT_TOOLS = {"Agent", "Task", "SendMessage", "TaskCreate", "TaskUpdate"}


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
    return ""


def rows(path, emitter_default):
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            msg = ev.get("message") or {}
            role, content = msg.get("role"), msg.get("content")
            ts, sid = ev.get("timestamp"), ev.get("sessionId")
            if ev.get("type") == "user" and role == "user":
                if isinstance(content, list) and any(isinstance(c, dict) and c.get("type") == "tool_result" for c in content):
                    continue
                t = text_of(content)
                if not t.strip() or t.lstrip().startswith("<system-reminder"):
                    continue
                kind = "harness-notification" if t.lstrip().startswith(("<task-notification", "<cross-session")) else "user-turn"
                yield dict(ts_utc=ts, session_id=sid, event="UserTurn", emitter=kind if emitter_default == "team-lead" else "team-lead(prompt-to-subagent)",
                           receiver=emitter_default, text=t)
            elif ev.get("type") == "assistant" and isinstance(content, list):
                for c in content:
                    if c.get("type") == "tool_use" and c.get("name") in PROMPT_TOOLS:
                        inp = c.get("input") or {}
                        txt = inp.get("prompt") or inp.get("message") or json.dumps(
                            {k: inp.get(k) for k in ("taskId", "subject", "description", "status", "owner", "addBlockedBy") if k in inp}, ensure_ascii=False)
                        yield dict(ts_utc=ts, session_id=sid, event=f"ToolUse:{c['name']}", emitter=emitter_default,
                                   receiver=inp.get("description") or inp.get("to") or inp.get("owner"), model=inp.get("model"),
                                   meta={k: inp.get(k) for k in ("effort", "run_in_background", "subagent_type") if k in inp}, text=txt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("--subagents-dir")
    ap.add_argument("--bootstrap")
    a = ap.parse_args()
    sources = [(a.transcript, "team-lead")]
    if a.subagents_dir:
        for p in sorted(glob.glob(os.path.join(a.subagents_dir, "*.jsonl"))):
            meta = p[:-6] + ".meta.json"
            name = os.path.basename(p)[:-6]
            if os.path.exists(meta):
                try:
                    name = json.load(open(meta)).get("description") or name
                except Exception:
                    pass
            sources.append((p, f"subagent:{name}"))
    out_rows, first_user = [], None
    for path, who in sources:
        for r in rows(path, who):
            if who == "team-lead" and r["event"] == "UserTurn" and first_user is None and r["emitter"] == "user-turn":
                first_user = r
            r["capture"] = "transcript-export"
            r["text"] = mask(r["text"])
            r["task_id"] = first_task_id(r["text"] or "") or first_task_id(str(r.get("receiver") or ""))
            r["sha256"] = hashlib.sha256((r["text"] or "").encode()).hexdigest()
            out_rows.append(r)
    sid = re.sub(r"[^A-Za-z0-9_.-]", "_", os.path.basename(a.transcript)[:-6])
    day = (out_rows[0]["ts_utc"] or "unknown")[:10] if out_rows else "unknown"
    folder = os.path.join(ROOT, "evidence", "prompts", day)
    os.makedirs(folder, exist_ok=True)
    out = os.path.join(folder, sid + ".transcript-export.jsonl")
    seen = set()
    if os.path.exists(out):
        for line in open(out, encoding="utf-8"):
            try:
                j = json.loads(line); seen.add((j.get("ts_utc"), j.get("sha256")))
            except json.JSONDecodeError:
                pass
    n = 0
    with open(out, "a", encoding="utf-8") as fh:
        for r in out_rows:
            if (r["ts_utc"], r["sha256"]) in seen:
                continue
            fh.write(json.dumps(r, ensure_ascii=False) + "\n"); n += 1
    if a.bootstrap and first_user:
        with open(a.bootstrap, "w", encoding="utf-8") as fh:
            fh.write("# BOOTSTRAP PROMPT — registro inicial incorporado manualmente\n\n")
            fh.write("> **Origen:** primer turno de usuario de la sesión líder, copiado textualmente desde el transcript JSONL de Claude Code "
                     f"(`{os.path.basename(a.transcript)}`, {first_user['ts_utc']}). **No** es una captura del hook: los hooks se instalaron después de recibir este mensaje.\n")
            fh.write(f"> SHA-256 del texto: `{first_user['sha256']}`\n\n---\n\n")
            fh.write(first_user["text"])
            fh.write("\n")
    print(f"exported {n} new rows -> {os.path.relpath(out, ROOT)}")


if __name__ == "__main__":
    main()
