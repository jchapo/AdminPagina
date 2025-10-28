// auth-manager.js actualizado para Google Authentication
// Gestor de autenticación completo para Ñanpi Courier Frontend con Google Sign-In

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.firebaseAuth = null;
        this.refreshTokenInterval = null;
        this.init();
    }

    async init() {
        console.log('Inicializando AuthManager con Google Sign-In...');
        
        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            if (!window.firebaseApp) {
                window.firebaseApp = initializeApp(window.firebaseConfig);
            }
            
            this.firebaseAuth = getAuth(window.firebaseApp);
            
            // Configurar listener de cambios de autenticación
            onAuthStateChanged(this.firebaseAuth, (user) => {
                this.handleAuthStateChange(user);
            });
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
        }
    }

    async handleAuthStateChange(user) {
        console.log('Estado de autenticación cambió:', user ? 'Autenticado' : 'No autenticado');
        
        if (user) {
            try {
                const token = await user.getIdToken();
                this.token = token;
                localStorage.setItem('authToken', token);
                
                // Guardar información adicional del usuario de Google
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userName', user.displayName);
                localStorage.setItem('userPhoto', user.photoURL);
                localStorage.setItem('userUid', user.uid);
                
                const isValid = await this.verifyTokenWithServer(token);
                
                if (isValid) {
                    console.log('Token verificado exitosamente');
                    this.startTokenRefresh();
                    
                    if (this.isOnLoginPage()) {
                        window.location.href = '/index.html';
                    }
                } else {
                    console.log('Token no válido, cerrando sesión');
                    await this.logout();
                }
                
            } catch (error) {
                console.error('Error manejando estado de auth:', error);
                await this.logout();
            }
        } else {
            this.currentUser = null;
            this.token = null;
            this.clearLocalStorage();
            this.stopTokenRefresh();
            
            if (!this.isOnLoginPage()) {
                this.redirectToLogin();
            }
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhoto');
        localStorage.removeItem('userUid');
    }

    async verifyTokenWithServer(token) {
        try {
            const response = await fetch('/api/verify-auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = {
                    ...data.user,
                    email: localStorage.getItem('userEmail'),
                    displayName: localStorage.getItem('userName'),
                    photoURL: localStorage.getItem('userPhoto'),
                    uid: localStorage.getItem('userUid')
                };
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error verificando token con servidor:', error);
            return false;
        }
    }

    startTokenRefresh() {
        this.stopTokenRefresh();
        
        this.refreshTokenInterval = setInterval(async () => {
            try {
                if (this.firebaseAuth?.currentUser) {
                    const newToken = await this.firebaseAuth.currentUser.getIdToken(true);
                    this.token = newToken;
                    localStorage.setItem('authToken', newToken);
                    console.log('Token renovado automáticamente');
                }
            } catch (error) {
                console.error('Error renovando token:', error);
                await this.logout();
            }
        }, 50 * 60 * 1000);
    }

    stopTokenRefresh() {
        if (this.refreshTokenInterval) {
            clearInterval(this.refreshTokenInterval);
            this.refreshTokenInterval = null;
        }
    }

    isOnLoginPage() {
        return window.location.pathname.includes('login') || 
               window.location.pathname === '/login.html';
    }

    redirectToLogin() {
        if (!this.isOnLoginPage()) {
            console.log('Redirigiendo al login...');
            window.location.href = '/login.html';
        }
    }

    async logout() {
        try {
            console.log('Cerrando sesión...');
            
            if (this.firebaseAuth) {
                const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                await signOut(this.firebaseAuth);
            }
            
            this.currentUser = null;
            this.token = null;
            this.clearLocalStorage();
            this.stopTokenRefresh();
            
            this.redirectToLogin();
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            localStorage.clear();
            window.location.href = '/login.html';
        }
    }

   async checkAuthStatus() {
        try {
            // Si Firebase aún está inicializando, esperar
            if (this.firebaseAuth && this.firebaseAuth.currentUser === undefined) {
                console.log('Firebase aún inicializando, esperando...');
                return new Promise((resolve) => {
                    const unsubscribe = this.firebaseAuth.onAuthStateChanged((user) => {
                        unsubscribe();
                        resolve(user !== null);
                    });
                });
            }

            if (this.currentUser && this.token) {
                return true;
            }

            const storedToken = localStorage.getItem('authToken');
            if (!storedToken) {
                return false;
            }

            const isValid = await this.verifyTokenWithServer(storedToken);
            if (isValid) {
                this.token = storedToken;
                return true;
            } else {
                this.clearLocalStorage();
                return false;
            }
            
        } catch (error) {
            console.error('Error verificando estado de autenticación:', error);
            return false;
        }
    }

    getAuthHeaders() {
        if (!this.token) {
            console.warn('No hay token disponible');
            return {};
        }

        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            throw new Error('No hay sesión activa');
        }

        const headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        try {
            // Usar originalFetch para evitar bucle infinito
            const response = await originalFetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                console.warn('Token expirado o inválido, cerrando sesión');
                await this.logout();
                throw new Error('Sesión expirada');
            }

            if (response.status === 403) {
                throw new Error('No tienes permisos para esta acción');
            }

            return response;
            
        } catch (error) {
            if (error.message === 'Sesión expirada') {
                throw error;
            }
            console.error('Error en petición autenticada:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'Admin';
    }

    isMotorizado() {
        return this.currentUser && this.currentUser.role === 'Motorizado';
    }

    hasPermission(action) {
        if (!this.currentUser) return false;

        const permissions = {
            'delete': ['Admin'],
            'email': ['Admin'],
            'create_provider': ['Admin'],
            'move_to_history': ['Admin'],
            'read': ['Admin', 'Motorizado'],
            'write': ['Admin', 'Motorizado'],
            'view_maps': ['Admin', 'Motorizado'],
            'edit_orders': ['Admin', 'Motorizado']
        };

        const allowedRoles = permissions[action] || [];
        return allowedRoles.includes(this.currentUser.role);
    }

    initializeUI() {
        if (!this.currentUser) return;

        this.updateUserInfo();
        this.addLogoutButton();
        this.hideElementsByPermission();
        this.hideAuthLoader();
    }

    updateUserInfo() {
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            if (this.currentUser) {
                const userPhoto = this.currentUser.photoURL || '';
                const userName = this.currentUser.displayName || this.currentUser.name || this.currentUser.email;
                
                element.innerHTML = `
                    <div class="d-flex align-items-center">
                        ${userPhoto ? `<img src="${userPhoto}" alt="Avatar" class="rounded-circle me-2" style="width: 32px; height: 32px;">` : ''}
                        <div class="d-flex flex-column">
                            <span class="user-name" style="font-size: 0.9rem; font-weight: 500;">${userName}</span>
                            <span class="badge bg-primary" style="font-size: 0.7rem;">${this.currentUser.role}</span>
                        </div>
                    </div>
                `;
            }
        });
    }

    addLogoutButton() {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar && !document.querySelector('.logout-btn')) {
            const logoutItem = document.createElement('li');
            logoutItem.className = 'nav-item ms-2';
            logoutItem.innerHTML = `
                <button class="btn btn-outline-danger btn-sm logout-btn" onclick="authManager.logout()">
                    <i class="fas fa-sign-out-alt me-1"></i>Cerrar Sesión
                </button>
            `;
            navbar.appendChild(logoutItem);
        }
    }

    hideElementsByPermission() {
        if (!this.isAdmin()) {
            const deleteButtons = document.querySelectorAll('.delete-btn, .btn-danger[onclick*="delete"], [id*="delete"]');
            deleteButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            const emailButtons = document.querySelectorAll('.email-btn, #btnCerrarReportar');
            emailButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            const adminOnlyElements = document.querySelectorAll('[data-admin-only="true"]');
            adminOnlyElements.forEach(element => {
                element.style.display = 'none';
            });
        }

        const roleElements = document.querySelectorAll(`[data-role="${this.currentUser.role}"]`);
        roleElements.forEach(element => {
            element.style.display = 'block';
        });
    }

    hideAuthLoader() {
        const authLoader = document.getElementById('authLoader');
        const mainContent = document.getElementById('mainContent');
        
        if (authLoader) {
            authLoader.style.display = 'none';
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }

    showAuthLoader() {
        const authLoader = document.getElementById('authLoader');
        const mainContent = document.getElementById('mainContent');
        
        if (authLoader) {
            authLoader.style.display = 'flex';
        }
        
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }

    // Método específico para Google Sign-In
    async signInWithGoogle() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(this.firebaseAuth, provider);
            return result.user;
            
        } catch (error) {
            console.error('Error en Google Sign-In:', error);
            throw error;
        }
    }
}

// Instancia global del gestor de autenticación
const authManager = new AuthManager();

// Función para inicializar la autenticación en cada página
async function initAuth() {
    console.log('Iniciando verificación de autenticación...');
    
    try {
        const isAuthenticated = await authManager.checkAuthStatus();
        
        if (!isAuthenticated) {
            console.log('Usuario no autenticado');
            authManager.redirectToLogin();
            return false;
        }

        console.log('Usuario autenticado:', authManager.getCurrentUser());
        authManager.initializeUI();
        
        return true;
        
    } catch (error) {
        console.error('Error en initAuth:', error);
        authManager.logout();
        return false;
    }
}

// Interceptar todas las peticiones fetch para agregar autenticación automáticamente
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Evitar interceptar si ya tiene headers de autorización (evita bucle infinito)
    if (options.headers && options.headers.Authorization) {
        return originalFetch(url, options);
    }
    
    if (url.startsWith('/api/') || url.startsWith('http://localhost:3000/api/')) {
        return authManager.authenticatedFetch(url, options);
    }
    
    return originalFetch(url, options);
};

// Manejar errores de autenticación globalmente
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (
        event.reason.message === 'Sesión expirada' ||
        event.reason.message === 'No hay sesión activa'
    )) {
        event.preventDefault();
        console.warn('Error de autenticación detectado:', event.reason.message);
    }
});

// Evento para cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, verificando autenticación...');
    
    if (!authManager.isOnLoginPage()) {
        authManager.showAuthLoader();
    }
});

// Función de utilidad para mostrar mensajes
function showAuthMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
            title: type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Información',
            text: message,
            timer: type === 'info' ? 3000 : undefined,
            showConfirmButton: type === 'error'
        });
    }
}

// Hacer disponibles globalmente
window.authManager = authManager;
window.initAuth = initAuth;
window.showAuthMessage = showAuthMessage;

console.log('AuthManager con Google Sign-In cargado correctamente');