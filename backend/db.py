import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "shop.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

conn = get_connection()

def init_db():
    """Initializes tables and seeds demo records if they don't already exist."""
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            script = f.read()
        cur = conn.cursor()
        cur.executescript(script)
        conn.commit()

def q(sql: str, args=()) -> list[dict]:
    """Execute a read query and return rows as dictionaries."""
    cur = conn.cursor()
    cur.execute(sql, args)
    return [dict(r) for r in cur.fetchall()]

def run(sql: str, args=()) -> int:
    """Execute a write query, commit, and return last inserted row ID."""
    cur = conn.cursor()
    cur.execute(sql, args)
    conn.commit()
    return cur.lastrowid

def audit(actor: str, action: str, detail=""):
    """Record an audit trail event for security compliance and tracking."""
    run(
        "INSERT INTO audit_logs (actor, action, detail) VALUES (?, ?, ?)",
        (actor, action, str(detail))
    )

# Automatically run initialization on import
init_db()
