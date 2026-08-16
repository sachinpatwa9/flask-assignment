/**
 * FlaskEngine Main Client JavaScript
 * Handles REST API interactions, dynamic UI rendering, and dashboard state.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let activeCategory = 'All';
    let activeStatus = 'all';

    // DOM Elements
    const tasksContainer = document.getElementById('tasks-container');
    const categoryFilter = document.getElementById('category-filter');
    const statusTabs = document.querySelectorAll('.tab-btn');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statPending = document.getElementById('stat-pending');
    const statCompletionPct = document.getElementById('stat-completion-pct');
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');

    // Health Check Elements
    const healthStatusBadge = document.getElementById('health-status-badge');
    const healthUptime = document.getElementById('health-uptime');
    const healthTimestamp = document.getElementById('health-timestamp');
    const pingHealthBtn = document.getElementById('ping-health-btn');

    // Modal Elements
    const addTaskModal = document.getElementById('add-task-modal');
    const openAddModalBtn = document.getElementById('open-add-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const addTaskForm = document.getElementById('add-task-form');

    // Container for Toast Notifications
    const toastContainer = document.getElementById('toast-container');

    // --- API Service Calls ---

    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();

            statTotal.textContent = data.total_tasks;
            statCompleted.textContent = data.completed_tasks;
            statPending.textContent = data.pending_tasks;
            statCompletionPct.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${data.completion_rate}%`;
        } catch (err) {
            console.error('Stats error:', err);
        }
    }

    async function fetchTasks() {
        try {
            const url = new URL('/api/tasks', window.location.origin);
            if (activeCategory !== 'All') url.searchParams.append('category', activeCategory);
            if (activeStatus !== 'all') url.searchParams.append('status', activeStatus);

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();

            renderTasks(data.tasks);
        } catch (err) {
            console.error('Tasks fetch error:', err);
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Unable to load tasks from API.</p>
                </div>`;
        }
    }

    async function fetchHealth() {
        try {
            const res = await fetch('/api/health');
            if (!res.ok) throw new Error('Health ping failed');
            const data = await res.json();

            healthStatusBadge.textContent = data.status.toUpperCase();
            healthUptime.textContent = `${data.uptime_seconds}s`;
            healthTimestamp.textContent = new Date(data.timestamp).toLocaleTimeString();
            showToast('API health check passed', 'success');
        } catch (err) {
            healthStatusBadge.textContent = 'OFFLINE';
            healthStatusBadge.className = 'health-val badge-error';
            showToast('API service unreachable', 'error');
        }
    }

    async function addTask(title, category, priority) {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, priority })
            });

            if (!res.ok) throw new Error('Failed to create task');

            showToast('Task created successfully!', 'success');
            closeModal();
            addTaskForm.reset();

            // Refresh UI
            fetchTasks();
            fetchStats();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function toggleTaskStatus(id) {
        try {
            const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to update task');

            const data = await res.json();
            showToast(data.message, 'success');

            fetchTasks();
            fetchStats();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function deleteTask(id) {
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete task');

            showToast('Task deleted', 'success');
            fetchTasks();
            fetchStats();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // --- UI Render Helpers ---

    function renderTasks(tasks) {
        if (!tasks || tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
                    <p>No tasks found matching current filters.</p>
                </div>`;
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <span class="task-title">${escapeHtml(task.title)}</span>
                    <span class="badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
                <div class="task-footer">
                    <div class="task-meta">
                        <span class="badge badge-category">${task.category}</span>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn toggle" title="${task.completed ? 'Mark Pending' : 'Mark Complete'}" onclick="window.appToggleTask(${task.id})">
                            <i class="fa-solid ${task.completed ? 'fa-arrow-rotate-left' : 'fa-check'}"></i>
                        </button>
                        <button class="action-btn delete" title="Delete Task" onclick="window.appDeleteTask(${task.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
        
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    function openModal() {
        addTaskModal.classList.add('active');
    }

    function closeModal() {
        addTaskModal.classList.remove('active');
    }

    // --- Global Handlers for Inline Onclick ---
    window.appToggleTask = (id) => toggleTaskStatus(id);
    window.appDeleteTask = (id) => deleteTask(id);

    // --- Event Listeners ---

    categoryFilter.addEventListener('change', (e) => {
        activeCategory = e.target.value;
        fetchTasks();
    });

    statusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            statusTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeStatus = tab.getAttribute('data-status');
            fetchTasks();
        });
    });

    refreshStatsBtn.addEventListener('click', () => {
        fetchStats();
        fetchTasks();
        showToast('Dashboard data refreshed', 'success');
    });

    pingHealthBtn.addEventListener('click', fetchHealth);

    openAddModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    addTaskModal.addEventListener('click', (e) => {
        if (e.target === addTaskModal) closeModal();
    });

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        addTask(title, category, priority);
    });

    // --- Initial Load ---
    fetchStats();
    fetchTasks();
    fetchHealth();
});
