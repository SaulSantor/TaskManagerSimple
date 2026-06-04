(function () {
    const api = window.TaskManagerAPI;
    const ui = window.TaskManagerUI;

    const state = {
        currentUser: null,
        selectedTaskId: null,
        selectedProjectId: null,
        users: api.getUsers(),
        projects: [],
        tasks: []
    };

    function normalizeId(value) {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function getTaskFormData() {
        return {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            projectId: normalizeId(document.getElementById('taskProject').value),
            assignedTo: normalizeId(document.getElementById('taskAssigned').value),
            dueDate: document.getElementById('taskDueDate').value.trim(),
            estimatedHours: Number.parseFloat(document.getElementById('taskHours').value) || 0
        };
    }

    async function refreshProjects() {
        const response = await api.listProjects();
        state.projects = response.projects || [];
        ui.renderUserAndProjectOptions(state.users, state.projects);
        ui.renderProjects(state.projects, selectProject);
    }

    async function refreshTasks() {
        const response = await api.listTasks();
        state.tasks = response.tasks || [];
        ui.renderTasks(state.tasks, state.projects, state.users, selectTask);
        ui.renderStats(state.tasks);
    }

    async function refreshComments(taskId) {
        const response = await api.listComments(taskId);
        ui.renderComments(taskId, response.comments || [], state.users);
    }

    async function refreshHistory(taskId, includeAll = false) {
        const response = await api.listHistory(includeAll ? undefined : taskId);
        ui.renderHistory(taskId, response.history || [], state.users, includeAll);
    }

    async function refreshNotifications() {
        if (!state.currentUser) {
            return;
        }

        const response = await api.listNotifications(state.currentUser.id, true);
        ui.renderNotifications(response.notifications || []);
    }

    async function refreshSearch() {
        const filters = {
            text: document.getElementById('searchText').value.trim().toLowerCase(),
            status: document.getElementById('searchStatus').value,
            priority: document.getElementById('searchPriority').value,
            projectId: normalizeId(document.getElementById('searchProject').value)
        };

        const filtered = state.tasks.filter((task) => {
            const title = (task.title || '').toLowerCase();
            const description = (task.description || '').toLowerCase();

            if (filters.text && !title.includes(filters.text) && !description.includes(filters.text)) {
                return false;
            }

            if (filters.status && task.status !== filters.status) {
                return false;
            }

            if (filters.priority && task.priority !== filters.priority) {
                return false;
            }

            if (filters.projectId > 0 && task.projectId !== filters.projectId) {
                return false;
            }

            return true;
        });

        ui.renderSearchResults(filtered, state.projects);
    }

    function selectTask(id) {
        const task = state.tasks.find((item) => item.id === id);
        if (!task) {
            return;
        }

        state.selectedTaskId = id;
        ui.fillTaskForm(task);
        document.getElementById('commentTaskId').value = String(id);
        document.getElementById('historyTaskId').value = String(id);
    }

    function selectProject(id) {
        const project = state.projects.find((item) => item.id === id);
        if (!project) {
            return;
        }

        state.selectedProjectId = id;
        ui.fillProjectForm(project);
    }

    async function login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            alert('Usuario y contraseña requeridos');
            return;
        }

        try {
            const response = await api.login(username, password);
            state.currentUser = response.user;
            ui.setLoginState(true, state.currentUser.username);
            await refreshProjects();
            await refreshTasks();
            await refreshNotifications();
            showTab('tasks');
        } catch (error) {
            alert(error.message);
        }
    }

    function logout() {
        state.currentUser = null;
        state.selectedTaskId = null;
        state.selectedProjectId = null;
        ui.setLoginState(false, '');
        ui.clearTaskForm();
        document.getElementById('projectName').value = '';
        document.getElementById('projectDescription').value = '';
    }

    function showTab(tabName) {
        ui.setActiveTab(tabName);

        if (tabName === 'tasks') {
            refreshTasks();
        } else if (tabName === 'projects') {
            refreshProjects();
        } else if (tabName === 'comments' && state.selectedTaskId) {
            refreshComments(state.selectedTaskId);
        } else if (tabName === 'history' && state.selectedTaskId) {
            refreshHistory(state.selectedTaskId, false);
        } else if (tabName === 'notifications') {
            refreshNotifications();
        } else if (tabName === 'search') {
            refreshSearch();
        }
    }

    async function addTask() {
        if (!state.currentUser) {
            return;
        }

        const form = getTaskFormData();
        if (!form.title) {
            alert('El título es requerido');
            return;
        }

        try {
            await api.createTask({
                ...form,
                actualHours: 0,
                createdBy: state.currentUser.id
            });

            await Promise.all([refreshTasks(), refreshHistory(0, true), refreshNotifications()]);
            ui.clearTaskForm();
            state.selectedTaskId = null;
            alert('Tarea agregada');
        } catch (error) {
            alert(error.message);
        }
    }

    async function updateTask() {
        if (!state.currentUser) {
            return;
        }

        if (!state.selectedTaskId) {
            alert('Selecciona una tarea');
            return;
        }

        const oldTask = state.tasks.find((item) => item.id === state.selectedTaskId);
        if (!oldTask) {
            alert('Tarea no encontrada');
            return;
        }

        const form = getTaskFormData();
        if (!form.title) {
            alert('El título es requerido');
            return;
        }

        try {
            await api.updateTask(state.selectedTaskId, {
                ...form,
                actualHours: oldTask.actualHours || 0,
                createdBy: oldTask.createdBy,
                createdAt: oldTask.createdAt
            });

            await Promise.all([
                refreshTasks(),
                refreshHistory(state.selectedTaskId, false),
                refreshNotifications()
            ]);

            ui.clearTaskForm();
            state.selectedTaskId = null;
            alert('Tarea actualizada');
        } catch (error) {
            alert(error.message);
        }
    }

    async function deleteTask() {
        if (!state.currentUser) {
            return;
        }

        if (!state.selectedTaskId) {
            alert('Selecciona una tarea');
            return;
        }

        const task = state.tasks.find((item) => item.id === state.selectedTaskId);
        if (!task) {
            return;
        }

        if (!confirm(`¿Eliminar tarea: ${task.title}?`)) {
            return;
        }

        try {
            await api.deleteTask(state.selectedTaskId);
            await Promise.all([refreshTasks(), refreshHistory(0, true)]);
            ui.clearTaskForm();
            state.selectedTaskId = null;
            alert('Tarea eliminada');
        } catch (error) {
            alert(error.message);
        }
    }

    async function addProject() {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) {
            alert('El nombre es requerido');
            return;
        }

        try {
            await api.createProject({ name, description });
            state.selectedProjectId = null;
            await refreshProjects();
            document.getElementById('projectName').value = '';
            document.getElementById('projectDescription').value = '';
            alert('Proyecto agregado');
        } catch (error) {
            alert(error.message);
        }
    }

    async function updateProject() {
        if (!state.selectedProjectId) {
            alert('Selecciona un proyecto de la tabla');
            return;
        }

        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) {
            alert('El nombre es requerido');
            return;
        }

        try {
            await api.updateProject(state.selectedProjectId, { name, description });
            await refreshProjects();
            alert('Proyecto actualizado');
        } catch (error) {
            alert(error.message);
        }
    }

    async function deleteProject() {
        if (!state.selectedProjectId) {
            alert('Selecciona un proyecto de la tabla');
            return;
        }

        const project = state.projects.find((item) => item.id === state.selectedProjectId);
        if (!project) {
            alert('Proyecto no encontrado');
            return;
        }

        if (!confirm(`¿Eliminar proyecto: ${project.name}?`)) {
            return;
        }

        try {
            await api.deleteProject(state.selectedProjectId);
            state.selectedProjectId = null;
            await refreshProjects();
            document.getElementById('projectName').value = '';
            document.getElementById('projectDescription').value = '';
            alert('Proyecto eliminado');
        } catch (error) {
            alert(error.message);
        }
    }

    async function addComment() {
        if (!state.currentUser) {
            return;
        }

        const taskId = normalizeId(document.getElementById('commentTaskId').value);
        const commentText = document.getElementById('commentText').value.trim();

        if (!taskId) {
            alert('ID de tarea requerido');
            return;
        }

        if (!commentText) {
            alert('El comentario no puede estar vacío');
            return;
        }

        try {
            await api.createComment({ taskId, userId: state.currentUser.id, commentText });
            document.getElementById('commentText').value = '';
            await refreshComments(taskId);
            alert('Comentario agregado');
        } catch (error) {
            alert(error.message);
        }
    }

    async function loadComments() {
        const taskId = normalizeId(document.getElementById('commentTaskId').value);
        if (!taskId) {
            document.getElementById('commentsArea').value = 'Ingresa un ID de tarea';
            return;
        }

        await refreshComments(taskId);
    }

    async function loadHistory() {
        const taskId = normalizeId(document.getElementById('historyTaskId').value);
        if (!taskId) {
            document.getElementById('historyArea').value = 'Ingresa un ID de tarea';
            return;
        }

        await refreshHistory(taskId, false);
    }

    async function loadAllHistory() {
        await refreshHistory(0, true);
    }

    async function loadNotifications() {
        await refreshNotifications();
    }

    async function markNotificationsRead() {
        if (!state.currentUser) {
            return;
        }

        try {
            await api.markNotificationsRead(state.currentUser.id);
            await refreshNotifications();
            alert('Notificaciones marcadas como leídas');
        } catch (error) {
            alert(error.message);
        }
    }

    async function searchTasks() {
        await refreshSearch();
    }

    async function generateReport(type) {
        try {
            const response = await api.getReport(type);
            ui.renderReport(response.text || '');
        } catch (error) {
            alert(error.message);
        }
    }

    async function exportCSV() {
        try {
            const response = await api.getReport('csv');
            const blob = new Blob([response.csv || ''], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = response.filename || 'export_tasks.csv';
            anchor.click();
            window.URL.revokeObjectURL(url);
            alert('Exportado a export_tasks.csv');
        } catch (error) {
            alert(error.message);
        }
    }

    function bootstrap() {
        ui.setLoginState(false, '');
        ui.renderUserAndProjectOptions(state.users, state.projects);
    }

    window.login = login;
    window.logout = logout;
    window.showTab = showTab;
    window.addTask = addTask;
    window.updateTask = updateTask;
    window.deleteTask = deleteTask;
    window.clearTaskForm = ui.clearTaskForm;
    window.addProject = addProject;
    window.updateProject = updateProject;
    window.deleteProject = deleteProject;
    window.addComment = addComment;
    window.loadComments = loadComments;
    window.loadHistory = loadHistory;
    window.loadAllHistory = loadAllHistory;
    window.loadNotifications = loadNotifications;
    window.markNotificationsRead = markNotificationsRead;
    window.searchTasks = searchTasks;
    window.generateReport = generateReport;
    window.exportCSV = exportCSV;

    document.addEventListener('DOMContentLoaded', bootstrap);
})();