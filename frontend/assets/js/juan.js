// juan.js actualizado con autenticación
// Este archivo debe reemplazar o complementar el juan.js existente

// Esperar a que la autenticación esté lista antes de inicializar la aplicación
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar 2 segundos para que Firebase se inicialice completamente
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
        // Esperar a que Firebase esté completamente inicializado
        let attempts = 0;
        while ((!window.authManager || !window.authManager.firebaseAuth) && attempts < 10) {
            console.log('Esperando inicialización de Firebase...');
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        const isAuthenticated = await initAuth();
        
        if (!isAuthenticated) {
            console.log('Usuario no autenticado, redirigiendo al login...');
            return;
        }

        console.log('Usuario autenticado:', authManager.getCurrentUser());
        
        // Inicializar la aplicación solo si está autenticado
        initializeApp();
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        authManager.logout();
    }
});

function initializeApp() {
    // Inicializar DataTables si existe la tabla
    if (typeof initializeDataTable === 'function') {
        initializeDataTable();
    }
    
    // Inicializar mapas si existe el contenedor
    if (document.getElementById('map') || document.getElementById('map2')) {
        // Los mapas se inicializarán automáticamente con su script correspondiente
        console.log('Contenedor de mapa encontrado');
    }
    
    // Configurar eventos de formularios
    setupFormEvents();
    
    // Configurar eventos de botones
    setupButtonEvents();
    
    console.log('Aplicación inicializada correctamente');
}

function setupFormEvents() {
    // Configurar formulario de nuevo recojo si existe
    const recojoForm = document.getElementById('recojoForm');
    if (recojoForm) {
        recojoForm.addEventListener('submit', handleRecojoSubmit);
    }
    
    // Configurar otros formularios aquí...
}

function setupButtonEvents() {
    // Configurar botón de cerrar y reportar si el usuario es admin
    const btnCerrarReportar = document.getElementById('btnCerrarReportar');
    if (btnCerrarReportar && authManager.isAdmin()) {
        btnCerrarReportar.addEventListener('click', handleCerrarReportar);
        btnCerrarReportar.style.display = 'block';
    } else if (btnCerrarReportar) {
        btnCerrarReportar.style.display = 'none';
    }
    
    // Configurar otros botones...
}

async function handleRecojoSubmit(event) {
    event.preventDefault();
    
    try {
        // Mostrar loader
        showLoader('Guardando recojo...');
        
        const formData = new FormData(event.target);
        const recojoData = Object.fromEntries(formData);
        
        // Procesar los datos del formulario
        const processedData = processRecojoData(recojoData);
        
        const response = await fetch('/api/recojos', {
            method: 'POST',
            headers: authManager.getAuthHeaders(),
            body: JSON.stringify(processedData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el recojo');
        }
        
        const result = await response.json();
        
        // Mostrar mensaje de éxito
        showSuccessMessage('Recojo guardado exitosamente');
        
        // Cerrar modal y recargar datos
        const modal = bootstrap.Modal.getInstance(document.getElementById('backDropModal'));
        if (modal) {
            modal.hide();
        }
        
        // Recargar la tabla o datos
        if (typeof reloadData === 'function') {
            reloadData();
        }
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al guardar el recojo: ' + error.message);
    } finally {
        hideLoader();
    }
}

function processRecojoData(formData) {
    // Procesar y validar los datos del formulario
    const dateValue = new Date().toISOString();
    const uniqueId = generateUniqueId();
    
    return {
        id: uniqueId,
        fechaCreacionPedido: dateValue,
        // ... resto de los campos del formulario
        ...formData
    };
}

function generateUniqueId() {
    const now = new Date();
    const padToTwoDigits = (num) => num.toString().padStart(2, '0');

    const day = padToTwoDigits(now.getDate());
    const month = padToTwoDigits(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = padToTwoDigits(now.getHours());
    const minutes = padToTwoDigits(now.getMinutes());
    const seconds = padToTwoDigits(now.getSeconds());
    const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    return `${day}-${month}-${year}-${hours}${minutes}${seconds}-${randomId}`;
}

async function handleCerrarReportar() {
    if (!authManager.isAdmin()) {
        showErrorMessage('No tienes permisos para esta acción');
        return;
    }
    
    try {
        showLoader('Generando reporte...');
        
        // Lógica para cerrar y reportar
        // ... implementar según tu lógica existente
        
        showSuccessMessage('Reporte generado exitosamente');
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al generar el reporte');
    } finally {
        hideLoader();
    }
}

// Funciones de UI
function showLoader(message = 'Cargando...') {
    let loader = document.getElementById('full-page-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'full-page-loader';
        loader.className = 'full-page-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">${message}</div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('.loader-text').textContent = message;
    }
    
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('full-page-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showSuccessMessage(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert(message);
    }
}

function showErrorMessage(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    } else {
        alert(message);
    }
}

// Función para recargar datos (implementar según tu lógica)
async function reloadData() {
    // Recargar tabla de recojos
    if (typeof loadRecojos === 'function') {
        loadRecojos();
    }
    
    // Recargar marcadores en mapas
    if (typeof cargarMarcadores === 'function') {
        cargarMarcadores();
    }
}

// Interceptar llamadas a la API existentes para agregar autenticación automáticamente
const originalLoadRecojos = window.loadRecojos;
if (originalLoadRecojos) {
    window.loadRecojos = async function() {
        try {
            const response = await fetch('/api/recojos');
            // ... resto de la lógica existente
        } catch (error) {
            if (error.message.includes('Sesión expirada')) {
                showErrorMessage('Tu sesión ha expirado. Serás redirigido al login.');
                return;
            }
            throw error;
        }
    };
}

// Función para manejar errores de autenticación globalmente
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message === 'Sesión expirada') {
        event.preventDefault();
        authManager.logout();
    }
});

function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        authManager.logout();
    }
}

console.log('Juan.js con autenticación cargado correctamente');