#!/usr/bin/env python3
"""Fail-loud validation for the olchipanel continuity contract."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_SECTIONS = {
    "STATE.md": [
        "Current Goal", "Stage", "Completed", "In Progress",
        "Next Branches", "Approval Status", "Last Updated",
    ],
    "HANDOFF.md": [
        "Commit And Tree", "Current Goal", "Completed", "In Progress",
        "Next Actions", "Blockers And Approval", "Verification Commands",
    ],
    "WORKLOG.md": [],
    "DECISIONS.md": [],
    "LEARNINGS.md": [],
}


def fail(msg: str) -> None:
    print(f"FAIL {msg}")
    fail.count += 1


fail.count = 0


def check_sections() -> None:
    for name, sections in REQUIRED_SECTIONS.items():
        path = ROOT / name
        if not path.is_file():
            fail(f"{name}: missing")
            continue
        text = path.read_text(encoding="utf-8")
        for section in sections:
            if not re.search(rf"^##\s+{re.escape(section)}\s*$", text, re.M):
                fail(f"{name}: missing section '{section}'")


def check_git_contract() -> None:
    handoff = ROOT / "HANDOFF.md"
    if not handoff.is_file():
        return
    text = handoff.read_text(encoding="utf-8")
    match = re.search(r"base_commit:\s*`([0-9a-f]{7,40})`", text)
    if not match:
        fail("HANDOFF.md: base_commit contract missing")
        return
    base = match.group(1)
    merge_base = subprocess.run(
        ["git", "merge-base", "--is-ancestor", base, "HEAD"],
        cwd=ROOT, capture_output=True, text=True,
    )
    if merge_base.returncode != 0:
        fail(f"HANDOFF.md: base_commit {base} is not an ancestor of HEAD")
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.splitlines()
    dirty = [line[3:].strip() for line in status]
    expected = re.search(r"expected dirty paths:(.+?)(?:\n##|\Z)", text, re.S)
    expected_text = expected.group(1) if expected else ""
    unexplained = [
        p for p in dirty
        if Path(p).name not in expected_text and p not in expected_text
    ]
    if unexplained:
        fail(f"git dirty paths not explained in HANDOFF.md: {unexplained}")


def main() -> int:
    check_sections()
    check_git_contract()
    if fail.count:
        print(f"continuity_check: FAIL ({fail.count})")
        return 1
    print("continuity_check: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
