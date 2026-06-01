# ⏳ FocusTrack – Procrastination Tracker

FocusTrack is a state-of-the-art, fully responsive, and highly interactive study timer and procrastination tracking web application. Built using a premium, dark forest green Material 3 design system, it combines a precision Pomodoro timer, dynamic focus statistics, and a sleek task checklist to help you enter deep flow states and beat procrastination.

---

## ✨ Features

### 1. ⏱️ Dynamic Precision Timer
* **Bidirectional Controls**: Set any duration between `1` and `120` minutes using an interactive range slider or exact numeric inputs (`MM:SS`). Both update the countdown instantly.
* **Animated SVG Circle**: A glowing, responsive circular progress ring drains visual color in real time as the countdown ticks.
* **Breathing Visualizer**: The timer ring features a subtle pulsating animation while running to guide concentration.
* **Quick Presets**: Snaps instantly to popular preset durations like `5m Break`, `15m Break`, `25m Focus`, or `50m Focus`.

### 2. 📝 Interactive Focus Checklist
* **Sleek Sub-Tasks**: Add, track, and complete study goals directly on the dashboard.
* **Dynamic Completion Tracker**: An adaptive status badge (e.g. `2/5 completed`) updates in real time.
* **Seamless Transitions**: Tasks feature glowing custom checkbox toggles, strike-through completion indicators, and smooth slide-out delete actions without page reloads.

### 3. 📊 Premium Stats Analytics
* **Glassmorphic Cards**: Beautiful, semi-transparent data cards showcasing **Time Focused (Hours)**, **Minutes Logged**, and **Average Focus Rating** with dynamic icon highlights.
* **Productivity Self-Rating**: Rate your flow state from `1.0` (procrastinated) to `10.0` (deep focus) on a slider after completing any session to log it into your history.
* **Session History Log**: A clean, responsive list (table on desktop, card feed on mobile) of recent study periods with color-coded intensity tags and deletion options.

### 4. 🔒 Secure Local Accounts
* Multi-account registration and login with secure **password hashing** powered by `werkzeug.security`.
* Responsive Single Page App (SPA) view-switching between auth pages and the dashboard.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5 (Semantic), Tailwind CSS (Forms Plugin), JavaScript (ES6+), Material Symbols, Google Outfit Font.
* **Backend**: Python (Flask framework).
* **Database**: SQLite (built-in SQL database, requiring **zero installations** or background services).

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/vaishnavithorat6852/Focus-Track.git
cd Focus-Track
```

### 2. Install Dependencies
Install the required packages using the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### 3. Run the Application
Launch the Flask development server:
```bash
python app.py
```
*(The local SQLite database file `focustrack.db` will be automatically generated on the first startup).*

### 4. Open in Your Browser
Open your web browser and navigate to:
👉 **`http://127.0.0.1:5001`**

---

## 📁 File Structure

```text
Focus-Track/
├── app.py                  # Flask backend & SQLite API routes
├── requirements.txt        # Python package dependencies
├── focustrack.db           # Local database (generated automatically)
├── templates/
│   └── index.html          # Responsive Single Page App HTML
└── static/
    ├── app.js              # Pomodoro logic, checklist AJAX, and toasts
    └── style.css           # Glassmorphism, animations, and custom inputs
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

@2026-Procastination Tracker and All Rights Reserved
