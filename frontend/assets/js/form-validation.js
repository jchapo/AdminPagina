document.addEventListener("DOMContentLoaded", function () {
    const API_URL = 'http://localhost:3000/api/recojos';
    const recojoForm = document.getElementById('recojoForm');
    const recojoModal = new bootstrap.Modal(document.getElementById('backDropModal')); // Inicializar el modal

    // Inicializar Select2 para los dropdowns
    const selects = document.querySelectorAll('.select2');
    selects.forEach(select => {
        $(select).select2({
            dropdownParent: $(select).parent()
        });
    });

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

    function capitalizeWords(str) {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    const formValidation = FormValidation.formValidation(recojoForm, {
        fields: {
            fechaEntrega: {
                validators: {
                    notEmpty: { message: 'La fecha de entrega es requerida' },
                    date: { format: 'DD-MM-YYYY', message: 'La fecha no es válida' }
                }
            },
            proveedorName: {
                validators: {
                    notEmpty: { message: 'El nombre del proveedor es requerido' },
                    stringLength: { min: 3, max: 100, message: 'Debe tener entre 3 y 100 caracteres' }
                }
            },
            proveedorTelefono: {
                validators: {
                    notEmpty: { message: 'El teléfono es requerido' },
                    regexp: { regexp: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                }
            },
            proveedorDistrito: { validators: { notEmpty: { message: 'Debe seleccionar un distrito' } } },
            clienteName: {
                validators: {
                    notEmpty: { message: 'El nombre del cliente es requerido' },
                    stringLength: { min: 3, max: 100, message: 'Debe tener entre 3 y 100 caracteres' }
                }
            },
            clienteTelefono: {
                validators: {
                    notEmpty: { message: 'El teléfono es requerido' },
                    regexp: { regexp: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                }
            },
            clienteDistrito: { validators: { notEmpty: { message: 'Debe seleccionar un distrito' } } },
            clienteUbicacion: {
                validators: {
                    notEmpty: { message: 'La dirección es requerida' },
                    stringLength: { min: 5, max: 200, message: 'Debe tener entre 5 y 200 caracteres' }
                }
            },
            cantidadCobrar: {
                validators: {
                    notEmpty: { message: 'La cantidad a cobrar es requerida' },
                    numeric: { message: 'Debe ser numérico', decimalSeparator: '.' }
                }
            },
            metodoPago: { validators: { notEmpty: { message: 'Debe seleccionar un método de pago' } } },
            comisionTarifa: {
                validators: {
                    notEmpty: { message: 'La comisión de tarifa es requerida' },
                    numeric: { message: 'Debe ser numérico', decimalSeparator: '.' }
                }
            },
            motorizadoRecojo: {
                validators: {
                    notEmpty: { message: 'Debe seleccionar un motorizado para recojo' }
                }
            },
            motorizadoEntrega: {
                validators: {
                    notEmpty: { message: 'Debe seleccionar un motorizado para entrega' }
                }
            }
        },
        plugins: {
            trigger: new FormValidation.plugins.Trigger(),
            bootstrap5: new FormValidation.plugins.Bootstrap5({
                eleValidClass: '',
                rowSelector: '.form-control-validation'
            }),
            submitButton: new FormValidation.plugins.SubmitButton(),
            autoFocus: new FormValidation.plugins.AutoFocus()
        },
        init: instance => {
            instance.on('plugins.message.placed', function (e) {
                if (e.element.parentElement.classList.contains('input-group')) {
                    e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
                }
            });
        }
    });

    // Manejo de Select2 para revalidación
    const select2Elements = document.querySelectorAll('.select2');
    select2Elements.forEach(element => {
        $(element).on('change', function () {
            formValidation.revalidateField(element.id);
        });
    });

    // Función para limpiar el formulario
    function clearForm() {
        recojoForm.reset(); // Limpia todos los campos del formulario
        recojoForm.removeAttribute('data-edit-id'); // Elimina el atributo de edición
        document.getElementById('recojoModalLabel').textContent = 'Nueva Entrega'; // Restaurar título
        document.querySelector('#recojoForm button[type="submit"]').textContent = 'Guardar'; // Restaurar texto del botón
    }


    // Capturar el envío con AJAX en lugar del DefaultSubmit
    formValidation.on('core.form.valid', function () {
        const formData = new FormData(recojoForm);
        const isEdit = recojoForm.hasAttribute('data-edit-id');
        const docId = isEdit ? recojoForm.getAttribute('data-edit-id') : generateUniqueId();
    
        // Obtener el valor de comisionTarifa (puede ser automático o manual)
        const comisionTarifa = parseFloat(document.getElementById('comisionTarifa').value);
    
        // Format data
        const proveedorNombre = formData.get('proveedorName').toUpperCase();
        const clienteNombreFormatted = capitalizeWords(formData.get('clienteName'));
        const cantidadCobrarFormatted = parseFloat(formData.get('cantidadCobrar')).toFixed(2);
        const pedidoSeCobraValor = (cantidadCobrarFormatted === "0.00" || cantidadCobrarFormatted === "0") ? "No" : "Si";
        const fechaEntrega = formData.get('fechaEntrega'); // Assuming this is in DD-MM-YYYY format
        const [day, month, year] = fechaEntrega.split('-');
        const formattedFechaEntrega = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
    
        const newRecojo = {
            id: docId,
            proveedorNombre: proveedorNombre,
            proveedorTelefono: formData.get('proveedorTelefono'),
            proveedorDistrito: formData.get('proveedorDistrito'),
            proveedorUbicacion: formData.get('proveedorUbicacion'),
            clienteNombre: clienteNombreFormatted,
            clienteTelefono: formData.get('clienteTelefono'),
            clienteDistrito: formData.get('clienteDistrito'),
            pedidoDireccionFormulario: formData.get('clienteUbicacion'),
            pedidoDireccionLink: formData.get('clienteUbicacion'),
            pedidoDetalle: formData.get('pedidoDetalle'),
            pedidoObservaciones: formData.get('observaciones'),
            fechaEntregaPedido: formattedFechaEntrega,
            pedidoCantidadCobrar: cantidadCobrarFormatted,
            pedidoSeCobra: pedidoSeCobraValor,
            pedidoMetodoPago: formData.get('metodoPago'),
            motorizadoRecojo: formData.get('motorizadoRecojo'),
            motorizadoEntrega: formData.get('motorizadoEntrega'),
            fechaRecojoPedido: null,
            fechaAnulacionPedido: null,
            fechaAsignaciónPedido: null,
            fechaEntregaPedidoMotorizado: null,
            pedidoFotoEntrega: null,
            thumbnailFotoRecojo: null,
            thumbnailFotoEntrega: null,
            comisionTarifa: comisionTarifa,
            supera30x30: document.getElementById('supera30x30').checked ? 1 : 0,
            pedidoFotoRecojo: null
        };
    
        // Si es una edición, no incluir fechaCreacionPedido
        if (!isEdit) {
            newRecojo.fechaCreacionPedido = new Date().toISOString();
        }
    
        const url = isEdit ? `${API_URL}/${docId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';
    
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecojo)
        })
            .then(response => response.json())
            .then(data => {
                // Limpiar el formulario y cerrar el modal
                document.querySelector('.btn-close[data-bs-dismiss="modal"]').click();
    
                // Recargar la lista de recojos si es necesario
                if (typeof loadRecojos === 'function') {
                    loadRecojos();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un problema con el envío');
            });
    });

    // Función para cargar recojos
    function loadRecojos() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                // Limpiar la tabla actual
                o.clear();

                // Agregar los nuevos datos a la tabla
                o.rows.add(data).draw();

                console.log('Tabla actualizada correctamente');
            })
            .catch(error => {
                console.error('Error al cargar recojos:', error);
            });
    }

    // Event listener para el botón de confirmar eliminación
    document.getElementById('confirmDeleteButton').addEventListener('click', function () {
        // Obtener el ID del registro a eliminar
        const recordId = this.getAttribute('data-id');

        // Llamar a la función para eliminar el registro
        deleteRecord(recordId);

        // Cerrar el modal de confirmación
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
        deleteModal.hide();
    });

    // Función para eliminar el registro
    function deleteRecord(recordId) {
        fetch(`${API_URL}/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                //console.log('Registro eliminado:', data);

                // Recargar la lista de recojos si es necesario
                if (typeof loadRecojos === 'function') {
                    loadRecojos();
                }

                // Mostrar un mensaje de éxito (opcional)
                //alert('Registro eliminado correctamente');
            })
            .catch(error => {
                console.error('Error al eliminar el registro:', error);
                alert('Hubo un problema al eliminar el registro');
            });
    }
});