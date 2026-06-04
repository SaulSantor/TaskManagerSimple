(function () {
    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function setLoginState(isLoggedIn, username = '') {
        byId('loginPanel').style.display = isLoggedIn ? 'none' : 'block';
        byId('mainPanel').style.display = isLoggedIn ? 'block' : 'none';
        byId('currentUser').textContent = username;
    }

    function setActiveTab(tabName) {
        document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach((button) => button.classList.remove('active'));

        const tab = byId(`${tabName}Tab`);
        if (tab) {
            tab.classList.add('active');
        }

        const eventTarget = window.event && window.event.target ? window.event.target : null;
        if (eventTarget) {
            eventTarget.classList.add('active');
        }
    }

    function renderUserAndProjectOptions(users, projects) {
        const assigned = byId('taskAssigned');
        assigned.innerHTML = '<option value="0">Sin asignar</option>';
        users.forEach((user) => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            assigned.appendChild(option);
        });

        const taskProject = byId('taskProject');
        const searchProject = byId('searchProject');
        taskProject.innerHTML = '<option value="0">Sin proyecto</option>';
        searchProject.innerHTML = '<option value="0">Todos</option>';

        projects.forEach((project) => {
            const taskOption = document.createElement('option');
            taskOption.value = project.id;
            taskOption.textContent = project.name;
            taskProject.appendChild(taskOption);

            const searchOption = document.createElement('option');
            searchOption.value = project.id;
            searchOption.textContent = project.name;
            searchProject.appendChild(searchOption);
        });
    }

    function renderTasks(tasks, projects, users, onSelectTask) {
        const tbody = byId('tasksTableBody');
        tbody.innerHTML = '';

        tasks.forEach((task) => {
            const project = projects.find((item) => item.id === task.projectId);
            const user = users.find((item) => item.id === task.assignedTo);
            const row = document.createElement('tr');
            row.addEventListener('click', () => onSelectTask(task.id));
            row.innerHTML = `
                <td>${escapeHtml(task.id)}</td>
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.status || 'Pendiente')}</td>
                <td>${escapeHtml(task.priority || 'Media')}</td>
                <td>${escapeHtml(project ? project.name : 'Sin proyecto')}</td>
                <td>${escapeHtml(user ? user.username : 'Sin asignar')}</td>
                <td>${escapeHtml(task.dueDate || 'Sin fecha')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function renderProjects(projects, onSelectProject) {
        const tbody = byId('projectsTableBody');
        tbody.innerHTML = '';

        projects.forEach((project) => {
            const row = document.createElement('tr');
            row.addEventListener('click', () => onSelectProject(project.id));
            row.innerHTML = `
                <td>${escapeHtml(project.id)}</td>
                <td>${escapeHtml(project.name)}</td>
                <td>${escapeHtml(project.description || '')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function renderComments(taskId, comments, users) {
        const area = byId('commentsArea');
        let text = `=== COMENTARIOS TAREA #${taskId} ===\n\n`;

        if (comments.length === 0) {
            text += 'No hay comentarios\n';
        } else {
            comments.forEach((comment) => {
                const user = users.find((item) => item.id === comment.userId);
                text += `[${comment.createdAt}] ${user ? user.username : 'Usuario'}: ${comment.commentText}\n---\n`;
            });
        }

        area.value = text;
    }

    function renderHistory(taskId, history, users, includeAll = false) {
        const area = byId('historyArea');
        let text = includeAll ? '=== HISTORIAL COMPLETO ===\n\n' : `=== HISTORIAL TAREA #${taskId} ===\n\n`;

        if (history.length === 0) {
            text += 'No hay historial\n';
        } else if (includeAll) {
            history.slice(-100).reverse().forEach((entry) => {
                const user = users.find((item) => item.id === entry.userId);
                text += `Tarea #${entry.taskId} - ${entry.action} - ${entry.timestamp}\n`;
                text += `  Usuario: ${user ? user.username : 'Desconocido'}\n`;
                text += `  Antes: ${entry.oldValue || '(vacío)'}\n`;
                text += `  Después: ${entry.newValue || '(vacío)'}\n---\n`;
            });
        } else {
            history.forEach((entry) => {
                const user = users.find((item) => item.id === entry.userId);
                text += `${entry.timestamp} - ${entry.action}\n`;
                text += `  Usuario: ${user ? user.username : 'Desconocido'}\n`;
                text += `  Antes: ${entry.oldValue || '(vacío)'}\n`;
                text += `  Después: ${entry.newValue || '(vacío)'}\n---\n`;
            });
        }

        area.value = text;
    }

    function renderNotifications(notifications) {
        const area = byId('notificationsArea');
        let text = '=== NOTIFICACIONES ===\n\n';

        if (notifications.length === 0) {
            text += 'No hay notificaciones nuevas\n';
        } else {
            notifications.forEach((notification) => {
                text += `• [${notification.type}] ${notification.message} (${notification.createdAt})\n`;
            });
        }

        area.value = text;
    }

    function renderSearchResults(tasks, projects) {
        const tbody = byId('searchTableBody');
        tbody.innerHTML = '';

        tasks.forEach((task) => {
            const project = projects.find((item) => item.id === task.projectId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(task.id)}</td>
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.status || 'Pendiente')}</td>
                <td>${escapeHtml(task.priority || 'Media')}</td>
                <td>${escapeHtml(project ? project.name : 'Sin proyecto')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function renderReport(text) {
        byId('reportsArea').value = text;
    }

    function renderStats(tasks) {
        let completed = 0;
        let pending = 0;
        let highPriority = 0;
        let overdue = 0;

        tasks.forEach((task) => {
            if (task.status === 'Completada') {
                completed += 1;
            } else {
                pending += 1;
            }

            if (task.priority === 'Alta' || task.priority === 'Crítica') {
                highPriority += 1;
            }

            if (task.dueDate && task.status !== 'Completada') {
                const dueDate = new Date(task.dueDate);
                if (dueDate < new Date()) {
                    overdue += 1;
                }
            }
        });

        byId('statsText').textContent = `Total: ${tasks.length} | Completadas: ${completed} | Pendientes: ${pending} | Alta Prioridad: ${highPriority} | Vencidas: ${overdue}`;
    }

    function clearTaskForm() {
        byId('taskTitle').value = '';
        byId('taskDescription').value = '';
        byId('taskStatus').selectedIndex = 0;
        byId('taskPriority').selectedIndex = 1;
        byId('taskProject').selectedIndex = 0;
        byId('taskAssigned').selectedIndex = 0;
        byId('taskDueDate').value = '';
        byId('taskHours').value = '';
    }

    function fillTaskForm(task) {
        byId('taskTitle').value = task.title || '';
        byId('taskDescription').value = task.description || '';
        byId('taskStatus').value = task.status || 'Pendiente';
        byId('taskPriority').value = task.priority || 'Media';
        byId('taskProject').value = String(task.projectId || 0);
        byId('taskAssigned').value = String(task.assignedTo || 0);
        byId('taskDueDate').value = task.dueDate || '';
        byId('taskHours').value = task.estimatedHours || '';
    }

    function fillProjectForm(project) {
        byId('projectName').value = project.name || '';
        byId('projectDescription').value = project.description || '';
    }

    window.TaskManagerUI = {
        byId,
        setLoginState,
        setActiveTab,
        renderUserAndProjectOptions,
        renderTasks,
        renderProjects,
        renderComments,
        renderHistory,
        renderNotifications,
        renderSearchResults,
        renderReport,
        renderStats,
        clearTaskForm,
        fillTaskForm,
        fillProjectForm
    };
})();