from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import sqlite3

app = Flask(__name__)
app.secret_key = "focustrack_secret_key_change_me_super_secure"

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "focustrack.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            subject TEXT NOT NULL,
            elapsed_seconds INTEGER NOT NULL,
            focus_minutes INTEGER NOT NULL,
            score REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            task_text TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

def get_logged_in_user():
    return session.get("username", None)

def compute_analytics(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT elapsed_seconds, focus_minutes, score FROM sessions
        WHERE username = ?
    ''', (username,))
    
    user_sessions = cursor.fetchall()
    conn.close()

    if not user_sessions:
        return {"total_hours": 0, "total_focus": 0, "avg_score": 0}

    total_elapsed_seconds = sum(s["elapsed_seconds"] for s in user_sessions)
    total_focus_minutes   = sum(s["focus_minutes"] for s in user_sessions)
    total_scores          = sum(s["score"] for s in user_sessions)

    total_hours = round(total_elapsed_seconds / 3600, 2)
    avg_score   = round(total_scores / len(user_sessions), 1)

    return {
        "total_hours" : total_hours,
        "total_focus" : total_focus_minutes,
        "avg_score"   : avg_score,
    }

@app.route("/")
def index():
    username = get_logged_in_user()
    analytics = {"total_hours": 0, "total_focus": 0, "avg_score": 0}
    history = []
    tasks = []

    if username:
        analytics = compute_analytics(username)

        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, subject, elapsed_seconds, focus_minutes, score, created_at FROM sessions
            WHERE username = ?
            ORDER BY datetime(created_at) DESC
            LIMIT 20
        ''', (username,))
        raw_history = cursor.fetchall()
        
        cursor.execute('''
            SELECT id, task_text, completed FROM tasks
            WHERE username = ?
            ORDER BY datetime(created_at) ASC
        ''', (username,))
        raw_tasks = cursor.fetchall()
        
        conn.close()

        for s in raw_history:
            secs  = s["elapsed_seconds"]
            hours = secs // 3600
            mins  = (secs % 3600) // 60
            if hours > 0:
                duration_str = f"{hours}h {mins}m"
            else:
                duration_str = f"{mins}m"

            try:
                date_dt = datetime.strptime(s["created_at"], "%Y-%m-%d %H:%M:%S")
                date_str = date_dt.strftime("%b %d, %Y %H:%M")
            except Exception:
                date_str = s["created_at"]

            history.append({
                "id"       : s["id"],
                "subject"  : s["subject"],
                "duration" : duration_str,
                "focus"    : s["focus_minutes"],
                "score"    : round(s["score"], 1),
                "date"     : date_str,
            })

        for t in raw_tasks:
            tasks.append({
                "id": t["id"],
                "task_text": t["task_text"],
                "completed": t["completed"] == 1
            })

    return render_template(
        "index.html",
        logged_in = username is not None,
        username  = username or "",
        analytics = analytics,
        history   = history,
        tasks     = tasks,
    )

@app.route("/register", methods=["POST"])
def register():
    username = request.form.get("username", "").strip()
    email    = request.form.get("email", "").strip()
    password = request.form.get("password", "")

    if not username or not email or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400

    hashed_pw = generate_password_hash(password)
    created_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "Username already taken."}), 409

        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "Email already registered."}), 409

        cursor.execute('''
            INSERT INTO users (username, email, password, created_at)
            VALUES (?, ?, ?, ?)
        ''', (username, email, hashed_pw, created_at_str))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    conn.close()
    session["username"] = username
    return jsonify({"success": True, "message": "Account created successfully!", "username": username})

@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Please fill in both fields."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"success": False, "message": "Username not found."}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Incorrect password."}), 401

    session["username"] = user["username"]
    return jsonify({"success": True, "message": "Logged in successfully!", "username": user["username"]})

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    return jsonify({"success": True, "message": "Logged out successfully!"})

@app.route("/session/save", methods=["POST"])
def save_session():
    username = get_logged_in_user()
    if not username:
        return jsonify({"success": False, "message": "Unauthorized. Please log in first."}), 401

    subject = request.form.get("subject", "").strip()
    elapsed_seconds_str = request.form.get("elapsed_seconds", "0")
    focus_minutes_str   = request.form.get("focus_minutes", "0")
    score_str           = request.form.get("score", "5")

    if not subject:
        return jsonify({"success": False, "message": "Subject/Task is required."}), 400

    try:
        elapsed_seconds = int(elapsed_seconds_str)
        focus_minutes   = int(focus_minutes_str)
        score           = float(score_str)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid session parameters."}), 400

    created_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO sessions (username, subject, elapsed_seconds, focus_minutes, score, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, subject, elapsed_seconds, focus_minutes, score, created_at_str))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    conn.close()
    return jsonify({"success": True, "message": "Session saved successfully!"})

@app.route("/session/delete/<int:session_id>", methods=["DELETE"])
def delete_session(session_id):
    username = get_logged_in_user()
    if not username:
        return jsonify({"success": False, "message": "Unauthorized."}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM sessions WHERE id = ? AND username = ?", (session_id, username))
    db_session = cursor.fetchone()
    
    if not db_session:
        conn.close()
        return jsonify({"success": False, "message": "Session not found or permission denied."}), 404

    try:
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    conn.close()
    return jsonify({"success": True, "message": "Session deleted successfully!"})

@app.route("/task/add", methods=["POST"])
def add_task():
    username = get_logged_in_user()
    if not username:
        return jsonify({"success": False, "message": "Unauthorized."}), 401
    
    task_text = request.form.get("task_text", "").strip()
    if not task_text:
        return jsonify({"success": False, "message": "Task description cannot be empty."}), 400
        
    created_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO tasks (username, task_text, completed, created_at)
            VALUES (?, ?, 0, ?)
        ''', (username, task_text, created_at_str))
        conn.commit()
        task_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
        
    conn.close()
    return jsonify({"success": True, "message": "Task added successfully!", "task": {
        "id": task_id,
        "task_text": task_text,
        "completed": 0
    }})

@app.route("/task/toggle/<int:task_id>", methods=["POST"])
def toggle_task(task_id):
    username = get_logged_in_user()
    if not username:
        return jsonify({"success": False, "message": "Unauthorized."}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT completed FROM tasks WHERE id = ? AND username = ?", (task_id, username))
    task = cursor.fetchone()
    if not task:
        conn.close()
        return jsonify({"success": False, "message": "Task not found."}), 404
        
    new_completed = 1 if task["completed"] == 0 else 0
    
    try:
        cursor.execute("UPDATE tasks SET completed = ? WHERE id = ?", (new_completed, task_id))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
        
    conn.close()
    return jsonify({"success": True, "message": "Task completion state updated!", "completed": new_completed == 1})

@app.route("/task/delete/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    username = get_logged_in_user()
    if not username:
        return jsonify({"success": False, "message": "Unauthorized."}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM tasks WHERE id = ? AND username = ?", (task_id, username))
    task = cursor.fetchone()
    if not task:
        conn.close()
        return jsonify({"success": False, "message": "Task not found."}), 404
        
    try:
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
        
    conn.close()
    return jsonify({"success": True, "message": "Task deleted successfully!"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)