// URL de la API del servidor backend
const API_URL = 'http://localhost:3000/api/recojos';  // Asegurándonos de que la ruta sea 'recojos'

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los elementos del DOM
    const recojosTable = document.getElementById('recojosTable').getElementsByTagName('tbody')[0];
    const recojoModal = new bootstrap.Modal(document.getElementById('recojoModal'));
    const recojoForm = document.getElementById('recojoForm');
    
    // Referencias a los campos de entrada
    const proveedorNameInput = document.getElementById('proveedorName');
    const clienteNameInput = document.getElementById('clienteName');
    const fechaEntregaInput = document.getElementById('fechaEntrega');
    const cantidadCobrarInput = document.getElementById('cantidadCobrar');
    const metodoPagoInput = document.getElementById('metodoPago');
    const addRecojoBtn = document.getElementById('addRecojoBtn');

    // Cargar los recojos desde la API
    async function loadRecojos() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            // Limpiar la tabla antes de agregar los nuevos recojos
            recojosTable.innerHTML = '';

            data.forEach(recojo => {
                const row = recojosTable.insertRow();

                // Convertir el timestamp de fechaEntregaPedido a una fecha legible
                const fechaEntrega = recojo.fechaEntregaPedido
                ? new Date(recojo.fechaEntregaPedido._seconds * 1000).toLocaleDateString('es-ES') // o el formato que prefieras
                : 'N/A';

                row.innerHTML = `
                    <td>${fechaEntrega}</td>
                    <td>${recojo.proveedorNombre || 'N/A'}</td>
                    <td>${recojo.clienteNombre || 'N/A'}</td>
                    <td>${recojo.clienteTelefono || 'N/A'}</td>
                    <td>${recojo.clienteDistrito || 'N/A'}</td>
                    <td>${recojo.pedidoCantidadCobrar || 'N/A'}</td>
                    <td>${recojo.pedidoMetodoPago || 'N/A'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" id="editButton-${recojo.id}">Editar</button>
                        <button class="btn btn-danger btn-sm" id="deleteButton-${recojo.id}">Eliminar</button>
                    </td>
                `;

                // Asignar el evento de clic a los botones "Editar" y "Eliminar"
                document.getElementById(`editButton-${recojo.id}`).addEventListener('click', function() {
                    editRecojo(recojo.id);
                });

                document.getElementById(`deleteButton-${recojo.id}`).addEventListener('click', function() {
                    // Agregar confirmación antes de eliminar
                    const confirmacion = confirm('¿Estás seguro de que quieres eliminar este recojo? Esta acción no se puede deshacer.');
                    if (confirmacion) {
                        deleteRecojo(recojo.id);
                    } else {
                        console.log('Eliminación cancelada');
                    }
                });
            });
        } catch (error) {
            console.error('Error al cargar los recojos:', error);
        }
    }

    // Mostrar el modal para agregar un nuevo recojo
    document.getElementById('addRecojoBtn').addEventListener('click', function() {
        // Vaciar los campos del formulario antes de mostrar el modal
        resetForm();

        // Mostrar el modal para agregar un nuevo recojo
        recojoModal.show();
    });

    // Función para vaciar los campos del formulario
    function resetForm() {
        // Utiliza el método reset() para limpiar los campos del formulario
        document.getElementById('recojoForm').reset();  // Asegúrate de que el formulario tiene este ID

        // Si hay campos adicionales que no están dentro del formulario y necesitas vaciar, puedes hacerlo manualmente
        document.getElementById('metodoPago').value = '';  // Si es un campo select o input
        document.getElementById('clienteDistrito').value = '';  // Si es un campo select o input
    }

    // Función para generar un ID único basado en la fecha y la hora
    function generateUniqueId() {
        const now = new Date();
        
        const day = String(now.getDate()).padStart(2, '0'); 
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${day}-${month}-${year}-${hours}${minutes}${seconds}`;
    }

    // Agregar un nuevo recojo
    async function addRecojo(event) {
        event.preventDefault();
        const dateValue = new Date().toISOString();
        const formattedDocId = generateUniqueId();
        const proveedorNombre = proveedorName.value.toUpperCase();
        // Función para capitalizar cada palabra del nombre del cliente
        const capitalizeWords = (str) => {
            return str
                .split(' ')  // Divide el string en palabras
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza la primera letra de cada palabra
                .join(' ');  // Vuelve a unir las palabras
        };
        const clienteNombreFormatted = capitalizeWords(clienteName.value);
        // Formatear la cantidad a cobrar para que tenga dos decimales
        const cantidadCobrarFormatted = parseFloat(cantidadCobrar.value).toFixed(2);
        const pedidoSeCobraValor = (cantidadCobrarFormatted === "0.00" || cantidadCobrarFormatted === "0") ? "No" : "Si";
        // Crear el objeto newRecojo con los valores de los campos del formulario
        const newRecojo = {
            id: formattedDocId,
            proveedorNombre: proveedorNombre,
            proveedorTelefono: proveedorTelefono.value,
            proveedorDistrito: proveedorDistrito.value,
            proveedorUbicacion: proveedorUbicacion.value,
            clienteNombre: clienteNombreFormatted,
            clienteTelefono: clienteTelefono.value,
            clienteDistrito: clienteDistrito.value,
            pedidoDireccionFormulario: clienteUbicacion.value,
            pedidoDireccionLink: clienteUbicacion.value,
            pedidoDetalle: pedidoDetalle.value,
            pedidoObservaciones: observaciones.value,
            fechaCreacionPedido: dateValue,
            fechaEntregaPedido: fechaEntrega.value,
            pedidoCantidadCobrar: cantidadCobrarFormatted,
            pedidoSeCobra: pedidoSeCobraValor,
            pedidoMetodoPago: metodoPago.value,
            motorizadoRecojo: "Asignar Recojo",
            motorizadoEntrega: "Asignar Entrega",
            fechaRecojoPedido: null,
            fechaAnulacionPedido: null,
            fechaAsignaciónPedido: null,
            fechaEntregaPedidoMotorizado: null,
            pedidoFotoEntrega: null,
            thumbnailFotoRecojo: null,
            thumbnailFotoEntrega: null,
            comisionTarifa: null,
            pedidoFotoRecojo: null
        };

        try {
            // Enviar el nuevo recojo a la API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newRecojo)
            });

            const result = await response.json();
            console.log('Nuevo recojo agregado:', result);

            // Recargar los recojos
            loadRecojos();

            // Cerrar el modal
            recojoModal.hide();

            // Vaciar los campos del formulario después de agregar el recojo
            resetForm();

        } catch (error) {
            console.error('Error al agregar el recojo:', error);
        }
    }



    // Editar un recojo
    async function editRecojo(id) {
        // Obtener el recojo desde la API para editarlo
        const recojo = await fetch(`${API_URL}/${id}`).then(res => res.json());
        
        // Asignar los valores a los campos del formulario
        document.getElementById('fechaEntrega').value = recojo.fechaEntregaPedido
            ? new Date(recojo.fechaEntregaPedido._seconds * 1000).toISOString().split('T')[0] // Convertir a formato yyyy-mm-dd para el input de fecha
            : ''; // Si no hay fecha, dejar el campo vacío
        document.getElementById('proveedorName').value = recojo.proveedorNombre || '';
        document.getElementById('proveedorTelefono').value = recojo.proveedorTelefono || '';
        document.getElementById('proveedorDistrito').value = recojo.proveedorDistrito || '';
        document.getElementById('proveedorUbicacion').value = recojo.proveedorUbicacion || '';
        document.getElementById('clienteName').value = recojo.clienteNombre || '';
        document.getElementById('clienteTelefono').value = recojo.clienteTelefono || '';
        document.getElementById('clienteDistrito').value = recojo.clienteDistrito || '';
        document.getElementById('clienteUbicacion').value = recojo.pedidoDireccionFormulario || '';
        document.getElementById('pedidoDetalle').value = recojo.pedidoDetallePedido || '';
        document.getElementById('observaciones').value = recojo.pedidoObservaciones || '';
        document.getElementById('cantidadCobrar').value = recojo.pedidoCantidadCobrar || '';
        document.getElementById('metodoPago').value = recojo.pedidoMetodoPago; 

        // Mostrar el modal para editar
        recojoForm.onsubmit = (event) => updateRecojo(event, id);
        recojoModal.show();
    }

    // Función para actualizar un recojo
    async function updateRecojo(event, id) {
        event.preventDefault();

        // Convertir el nombre del proveedor a mayúsculas
        const proveedorNombre = proveedorName.value.toUpperCase();

        // Función para capitalizar cada palabra del nombre del cliente
        const capitalizeWords = (str) => {
            return str
                .split(' ')  // Divide el string en palabras
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza la primera letra de cada palabra
                .join(' ');  // Vuelve a unir las palabras
        };
        const clienteNombreFormatted = capitalizeWords(clienteName.value);

        // Formatear la cantidad a cobrar para que tenga dos decimales
        const cantidadCobrarFormatted = parseFloat(cantidadCobrar.value).toFixed(2);

        const updatedRecojo = {
            fechaEntregaPedido: fechaEntrega.value,
            proveedorNombre: proveedorNombre,  // Proveedor en mayúsculas
            proveedorTelefono: proveedorTelefono.value,
            proveedorDistrito: proveedorDistrito.value,
            proveedorUbicacion: proveedorUbicacion.value,
            clienteNombre: clienteNombreFormatted,  // Cliente con cada palabra capitalizada
            clienteTelefono: clienteTelefono.value,
            clienteDistrito: clienteDistrito.value,
            pedidoDireccionFormulario: clienteUbicacion.value,
            pedidoDetallePedido: pedidoDetalle.value,
            pedidoObservaciones: observaciones.value,
            pedidoCantidadCobrar: cantidadCobrarFormatted,  // Cantidad a cobrar con dos decimales
            pedidoMetodoPago: metodoPago.value
        };

        try {
            // Enviar los datos actualizados a la API
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedRecojo)
            });

            console.log('Recojo actualizado');
            loadRecojos();  // Recargar los recojos
            recojoModal.hide();  // Cerrar el modal
        } catch (error) {
            console.error('Error al actualizar el recojo:', error);
        }
    }


    // Eliminar un recojo
    async function deleteRecojo(id) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            console.log('Recojo eliminado');
            loadRecojos();  // Recargar los recojos
        } catch (error) {
            console.error('Error al eliminar el recojo:', error);
        }
    }

    // Inicializar la carga de recojos
    loadRecojos();

    // Añadir el evento al botón "Agregar Recojo"
    addRecojoBtn.addEventListener('click', () => {
        // Limpiar los campos del formulario
        proveedorNameInput.value = '';
        clienteNameInput.value = '';
        fechaEntregaInput.value = ''; // Asegúrate de que este campo se maneja bien (para una fecha en formato correcto)
        cantidadCobrarInput.value = '';
        metodoPagoInput.value = '';

        // Configurar el formulario para añadir un nuevo recojo (no editar)
        recojoForm.onsubmit = addRecojo;  // Aquí asignamos la función que se ejecutará al enviar el formulario
        recojoModal.show();  // Mostrar el modal
    });

});
