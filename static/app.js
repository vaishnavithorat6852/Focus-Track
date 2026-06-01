let timerDurationSeconds = 1500;
let secondsRemaining = 1500;
let timerInterval = null;
let elapsedSeconds = 0;
let sessionRunning = false;
let isPaused = false;
let currentPresetMins = 25;
let currentPresetStatus = "Focus";

document.addEventListener("DOMContentLoaded", () => {
    updateTimerDisplay();
    const rangeSlider = document.getElementById("focus-score-slider");
    if (rangeSlider) {
        updateScoreSlider(rangeSlider.value);
    }
});

function switchAuthTab(tab) {
    const loginBtn = document.getElementById("tab-login-btn");
    const registerBtn = document.getElementById("tab-register-btn");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (tab === "login") {
        loginBtn.classList.add("bg-surface-container-highest", "text-white", "shadow-sm");
        loginBtn.classList.remove("text-on-surface-variant");
        registerBtn.classList.remove("bg-surface-container-highest", "text-white", "shadow-sm");
        registerBtn.classList.add("text-on-surface-variant");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
    } else {
        registerBtn.classList.add("bg-surface-container-highest", "text-white", "shadow-sm");
        registerBtn.classList.remove("text-on-surface-variant");
        loginBtn.classList.remove("bg-surface-container-highest", "text-white", "shadow-sm");
        loginBtn.classList.add("text-on-surface-variant");
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    }
}

function handleAuthSubmit(event, mode) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const url = mode === "login" ? "/login" : "/register";

    fetch(url, {
        method: "POST",
        body: formData
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast(data.message || "An error occurred.", "error");
        }
    })
    .catch((err) => {
        console.error("Auth error:", err);
        showToast("Server connection error. Please try again.", "error");
    });
}

function handleLogout() {
    fetch("/logout", {
        method: "POST"
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast("Failed to logout.", "error");
        }
    })
    .catch((err) => {
        console.error("Logout error:", err);
        showToast("Server connection error.", "error");
    });
}

function setTimerPreset(minutes, statusText) {
    if (sessionRunning) {
        showToast("Please reset or finish the current session first.", "error");
        return;
    }
    currentPresetMins = minutes;
    currentPresetStatus = statusText;
    timerDurationSeconds = minutes * 60;
    secondsRemaining = timerDurationSeconds;
    elapsedSeconds = 0;

    const slider = document.getElementById("duration-range-slider");
    if (slider) slider.value = minutes;

    const minsInput = document.getElementById("config-minutes");
    const secsInput = document.getElementById("config-seconds");
    if (minsInput) minsInput.value = minutes;
    if (secsInput) secsInput.value = "00";

    updateTimerDisplay();
    
    document.getElementById("timer-status-subtext").innerText = statusText;
    document.getElementById("timer-status-subtext").classList.remove("text-primary", "text-secondary", "text-tertiary");
    if (statusText === "Focus") {
        document.getElementById("timer-status-subtext").classList.add("text-primary");
    } else {
        document.getElementById("timer-status-subtext").classList.add("text-secondary");
    }
}

function onDurationSliderInput(val) {
    if (sessionRunning) return;
    const minutes = parseInt(val) || 25;
    const minsInput = document.getElementById("config-minutes");
    const secsInput = document.getElementById("config-seconds");
    if (minsInput) minsInput.value = minutes;
    if (secsInput) secsInput.value = "00";

    timerDurationSeconds = minutes * 60;
    secondsRemaining = timerDurationSeconds;
    elapsedSeconds = 0;
    currentPresetMins = minutes;
    currentPresetStatus = minutes >= 20 ? "Focus" : "Break";

    updateTimerDisplay();
    document.getElementById("timer-status-subtext").innerText = currentPresetStatus;
    document.getElementById("timer-status-subtext").classList.remove("text-primary", "text-secondary", "text-tertiary");
    if (currentPresetStatus === "Focus") {
        document.getElementById("timer-status-subtext").classList.add("text-primary");
    } else {
        document.getElementById("timer-status-subtext").classList.add("text-secondary");
    }
}

function onDurationNumericInput() {
    if (sessionRunning) return;
    let mins = parseInt(document.getElementById("config-minutes").value);
    let secs = parseInt(document.getElementById("config-seconds").value);

    if (isNaN(mins)) mins = 0;
    if (isNaN(secs)) secs = 0;

    if (mins < 0) mins = 0;
    if (mins > 180) mins = 180;
    if (secs < 0) secs = 0;
    if (secs > 59) secs = 59;

    const slider = document.getElementById("duration-range-slider");
    if (slider) {
        if (mins >= 1 && mins <= 120) {
            slider.value = mins;
        }
    }

    timerDurationSeconds = (mins * 60) + secs;
    secondsRemaining = timerDurationSeconds;
    elapsedSeconds = 0;
    currentPresetMins = mins + (secs / 60);
    currentPresetStatus = mins >= 20 ? "Focus" : "Break";

    updateTimerDisplay();
    document.getElementById("timer-status-subtext").innerText = currentPresetStatus;
    document.getElementById("timer-status-subtext").classList.remove("text-primary", "text-secondary", "text-tertiary");
    if (currentPresetStatus === "Focus") {
        document.getElementById("timer-status-subtext").classList.add("text-primary");
    } else {
        document.getElementById("timer-status-subtext").classList.add("text-secondary");
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const displayStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    document.getElementById("timer-display").innerText = displayStr;

    const circle = document.getElementById("timer-progress-bar");
    if (circle) {
        const totalLength = 691;
        let strokeDashoffset = totalLength;
        if (timerDurationSeconds > 0) {
            const ratio = secondsRemaining / timerDurationSeconds;
            strokeDashoffset = totalLength * ratio;
        }
        circle.style.strokeDasharray = totalLength;
        circle.style.strokeDashoffset = strokeDashoffset;
    }
}

function startTimer() {
    const subjectInput = document.getElementById("subject-input");
    const subject = subjectInput.value.trim();

    if (!subject) {
        subjectInput.classList.add("ring-2", "ring-error", "border-error");
        showToast("Please enter a subject or task name before starting.", "error");
        setTimeout(() => {
            subjectInput.classList.remove("ring-2", "ring-error", "border-error");
        }, 2000);
        return;
    }

    if (timerDurationSeconds <= 0) {
        showToast("Please set a duration greater than 0 seconds.", "error");
        return;
    }

    sessionRunning = true;
    isPaused = false;
    elapsedSeconds = 0;

    document.getElementById("setup-card").classList.add("hidden");
    document.getElementById("timer-config-panel").classList.add("hidden");
    document.getElementById("active-session-label").classList.remove("hidden");
    document.getElementById("current-tracking-subject").innerText = subject;

    document.getElementById("timer-start-btn").classList.add("hidden");
    document.getElementById("timer-pause-btn").classList.remove("hidden");
    document.getElementById("timer-complete-btn").classList.remove("hidden");
    
    document.getElementById("timer-status-subtext").innerText = "Focusing...";
    document.getElementById("timer-status-subtext").classList.remove("text-secondary", "text-tertiary");
    document.getElementById("timer-status-subtext").classList.add("text-primary");

    const circle = document.getElementById("timer-progress-bar");
    if (circle && circle.parentElement) {
        circle.parentElement.classList.add("active-pulse-timer");
    }

    timerInterval = setInterval(() => {
        if (secondsRemaining > 0) {
            secondsRemaining--;
            elapsedSeconds++;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            showToast("Focus period complete! Great job!", "success");
            if (circle && circle.parentElement) {
                circle.parentElement.classList.remove("active-pulse-timer");
            }
            openRatingDialog();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    isPaused = true;
    
    document.getElementById("timer-pause-btn").classList.add("hidden");
    document.getElementById("timer-resume-btn").classList.remove("hidden");
    document.getElementById("timer-status-subtext").innerText = "Paused";

    const circle = document.getElementById("timer-progress-bar");
    if (circle && circle.parentElement) {
        circle.parentElement.classList.remove("active-pulse-timer");
    }
}

function resumeTimer() {
    if (!isPaused) return;
    isPaused = false;

    document.getElementById("timer-resume-btn").classList.add("hidden");
    document.getElementById("timer-pause-btn").classList.remove("hidden");
    document.getElementById("timer-status-subtext").innerText = "Focusing...";

    const circle = document.getElementById("timer-progress-bar");
    if (circle && circle.parentElement) {
        circle.parentElement.classList.add("active-pulse-timer");
    }

    timerInterval = setInterval(() => {
        if (secondsRemaining > 0) {
            secondsRemaining--;
            elapsedSeconds++;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            showToast("Focus period complete! Great job!", "success");
            if (circle && circle.parentElement) {
                circle.parentElement.classList.remove("active-pulse-timer");
            }
            openRatingDialog();
        }
    }, 1000);
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    sessionRunning = false;
    isPaused = false;
    elapsedSeconds = 0;
    secondsRemaining = timerDurationSeconds;

    document.getElementById("setup-card").classList.remove("hidden");
    document.getElementById("timer-config-panel").classList.remove("hidden");
    document.getElementById("active-session-label").classList.add("hidden");

    document.getElementById("timer-start-btn").classList.remove("hidden");
    document.getElementById("timer-pause-btn").classList.add("hidden");
    document.getElementById("timer-resume-btn").classList.add("hidden");
    document.getElementById("timer-complete-btn").classList.add("hidden");

    document.getElementById("timer-status-subtext").innerText = currentPresetStatus;
    
    const circle = document.getElementById("timer-progress-bar");
    if (circle && circle.parentElement) {
        circle.parentElement.classList.remove("active-pulse-timer");
    }

    updateTimerDisplay();
    showToast("Timer reset to original duration.", "info");
}

function openRatingDialog() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    const ratingOverlay = document.getElementById("rating-overlay");
    ratingOverlay.classList.remove("translate-y-full");
    ratingOverlay.classList.add("translate-y-0");
}

function closeRatingDialog() {
    const ratingOverlay = document.getElementById("rating-overlay");
    ratingOverlay.classList.remove("translate-y-0");
    ratingOverlay.classList.add("translate-y-full");

    if (sessionRunning && !isPaused && secondsRemaining > 0) {
        resumeTimer();
    }
}

function updateScoreSlider(val) {
    const textEl = document.getElementById("rating-val-display");
    textEl.innerText = parseFloat(val).toFixed(1);
    
    textEl.classList.remove("text-primary", "text-secondary", "text-error");
    if (val >= 8) {
        textEl.classList.add("text-primary");
    } else if (val >= 5) {
        textEl.classList.add("text-secondary");
    } else {
        textEl.classList.add("text-error");
    }
}

function submitFocusSession() {
    const subject = document.getElementById("subject-input").value.trim();
    const score = document.getElementById("focus-score-slider").value;
    const focusMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("elapsed_seconds", elapsedSeconds);
    formData.append("focus_minutes", focusMinutes);
    formData.append("score", score);

    fetch("/session/save", {
        method: "POST",
        body: formData
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");
            
            const ratingOverlay = document.getElementById("rating-overlay");
            ratingOverlay.classList.remove("translate-y-0");
            ratingOverlay.classList.add("translate-y-full");

            if (timerInterval) clearInterval(timerInterval);
            sessionRunning = false;

            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } else {
            showToast(data.message || "Failed to save session.", "error");
        }
    })
    .catch((err) => {
        console.error("Save session error:", err);
        showToast("Network error: Could not log session.", "error");
    });
}

function deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this study session? This action cannot be undone.")) {
        return;
    }

    fetch(`/session/delete/${sessionId}`, {
        method: "DELETE"
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");
            
            const row = document.getElementById(`history-row-${sessionId}`);
            const card = document.getElementById(`history-mobile-card-${sessionId}`);
            
            if (row) {
                row.classList.add("opacity-0", "scale-95");
                setTimeout(() => row.remove(), 300);
            }
            if (card) {
                card.classList.add("opacity-0", "scale-95");
                setTimeout(() => card.remove(), 300);
            }
            
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } else {
            showToast(data.message || "Failed to delete session.", "error");
        }
    })
    .catch((err) => {
        console.error("Delete session error:", err);
        showToast("Network error: Could not delete record.", "error");
    });
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "flex items-center gap-3 bg-surface-container/95 border border-outline-variant/30 text-sm font-semibold text-white px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md translate-x-full transition-all duration-300 pointer-events-auto opacity-0";
    
    let iconHTML = "";
    if (type === "success") {
        toast.classList.add("border-l-4", "border-l-primary");
        iconHTML = `<span class="material-symbols-outlined text-primary font-bold">check_circle</span>`;
    } else if (type === "error") {
        toast.classList.add("border-l-4", "border-l-error");
        iconHTML = `<span class="material-symbols-outlined text-error font-bold">error</span>`;
    } else {
        toast.classList.add("border-l-4", "border-l-secondary");
        iconHTML = `<span class="material-symbols-outlined text-secondary font-bold">info</span>`;
    }

    toast.innerHTML = `
        ${iconHTML}
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-on-surface-variant hover:text-white transition">
            <span class="material-symbols-outlined text-base">close</span>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("translate-x-full", "opacity-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("translate-x-full", "opacity-0");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

function updateTaskBadge() {
    const listContainer = document.getElementById("tasks-list-container");
    if (!listContainer) return;

    const taskItems = listContainer.querySelectorAll("[id^='task-item-']");
    const total = taskItems.length;

    let completed = 0;
    taskItems.forEach(item => {
        const checkIcon = item.querySelector("[id^='task-check-icon-']");
        if (checkIcon && !checkIcon.classList.contains("hidden")) {
            completed++;
        }
    });

    const badge = document.getElementById("task-completion-badge");
    if (badge) {
        badge.innerText = `${completed}/${total} completed`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateTaskBadge();
});

function handleAddTask(event) {
    event.preventDefault();
    const input = document.getElementById("new-task-input");
    const text = input.value.trim();

    if (!text) {
        showToast("Please type a task description first.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("task_text", text);

    fetch("/task/add", {
        method: "POST",
        body: formData
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");
            input.value = "";

            const emptyState = document.getElementById("tasks-empty-state");
            if (emptyState) emptyState.remove();

            const listContainer = document.getElementById("tasks-list-container");
            const taskDiv = document.createElement("div");
            taskDiv.id = `task-item-${data.task.id}`;
            taskDiv.className = "group flex items-center justify-between bg-background/30 border border-outline-variant/10 rounded-2xl p-3.5 hover:border-outline-variant/35 transition-all opacity-0 scale-95 duration-300";

            taskDiv.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <button onclick="toggleTask(${data.task.id})" class="flex items-center justify-center w-5 h-5 rounded-md border border-outline/40 hover:border-primary text-primary transition-all focus:outline-none" id="task-check-${data.task.id}">
                        <span class="material-symbols-outlined text-sm font-extrabold text-primary hidden" id="task-check-icon-${data.task.id}">check</span>
                    </button>
                    <span id="task-text-${data.task.id}" class="text-xs text-white break-words flex-1 min-w-0">
                        ${escapeHTML(data.task.task_text)}
                    </span>
                </div>
                <button onclick="deleteTask(${data.task.id})" class="p-1.5 bg-error-container/10 hover:bg-error-container/25 text-error rounded-lg border border-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 ml-3" title="Delete task">
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
            `;

            listContainer.appendChild(taskDiv);
            
            setTimeout(() => {
                taskDiv.classList.remove("opacity-0", "scale-95");
            }, 10);

            updateTaskBadge();
        } else {
            showToast(data.message || "Failed to add task.", "error");
        }
    })
    .catch((err) => {
        console.error("Add task error:", err);
        showToast("Server connection error.", "error");
    });
}

function toggleTask(taskId) {
    fetch(`/task/toggle/${taskId}`, {
        method: "POST"
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            const checkIcon = document.getElementById(`task-check-icon-${taskId}`);
            const textEl = document.getElementById(`task-text-${taskId}`);

            if (data.completed) {
                if (checkIcon) checkIcon.classList.remove("hidden");
                if (textEl) textEl.classList.add("line-through", "text-on-surface-variant/50");
                showToast("Task completed!", "success");
            } else {
                if (checkIcon) checkIcon.classList.add("hidden");
                if (textEl) textEl.classList.remove("line-through", "text-on-surface-variant/50");
                showToast("Task marked incomplete.", "info");
            }

            updateTaskBadge();
        } else {
            showToast(data.message || "Failed to update task.", "error");
        }
    })
    .catch((err) => {
        console.error("Toggle task error:", err);
        showToast("Server connection error.", "error");
    });
}

function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    fetch(`/task/delete/${taskId}`, {
        method: "DELETE"
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.success) {
            showToast(data.message, "success");

            const taskItem = document.getElementById(`task-item-${taskId}`);
            if (taskItem) {
                taskItem.classList.add("opacity-0", "scale-95");
                setTimeout(() => {
                    taskItem.remove();
                    
                    const listContainer = document.getElementById("tasks-list-container");
                    if (listContainer && listContainer.querySelectorAll("[id^='task-item-']").length === 0) {
                        listContainer.innerHTML = `
                            <div id="tasks-empty-state" class="py-10 flex flex-col items-center justify-center text-center bg-background/10 rounded-2xl border border-dashed border-outline-variant/10 animate-fadeInUp">
                                <span class="material-symbols-outlined text-3xl text-on-surface-variant/35 mb-2">playlist_add_check</span>
                                <p class="text-[11px] text-on-surface-variant max-w-[200px]">No active tasks. List your study goals to stay focused!</p>
                            </div>
                        `;
                    }
                    updateTaskBadge();
                }, 300);
            }
        } else {
            showToast(data.message || "Failed to delete task.", "error");
        }
    })
    .catch((err) => {
        console.error("Delete task error:", err);
        showToast("Server connection error.", "error");
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}