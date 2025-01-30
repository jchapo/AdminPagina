document.addEventListener("DOMContentLoaded", function() {
  const API_URL = 'http://localhost:3000/api/recojos';  // Asegurándonos de que la ruta sea 'recojos'
  const recojoForm = document.getElementById('recojoForm');
  
  // Inicializar Select2 para los dropdowns
  const selects = document.querySelectorAll('.select2');
  selects.forEach(select => {
      $(select).select2({
          dropdownParent: $(select).parent()
      });
  });

  function generateUniqueId() {
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0'); 
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number

    return `${day}-${month}-${year}-${hours}${minutes}${seconds}-${random}`;
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
          metodoPago: { validators: { notEmpty: { message: 'Debe seleccionar un método de pago' } } }
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
          instance.on('plugins.message.placed', function(e) {
              if (e.element.parentElement.classList.contains('input-group')) {
                  e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
              }
          });
      }
  });

  // Manejo de Select2 para revalidación
  const select2Elements = document.querySelectorAll('.select2');
  select2Elements.forEach(element => {
      $(element).on('change', function() {
          formValidation.revalidateField(element.id);
      });
  });

  // Capturar el envío con AJAX en lugar del DefaultSubmit
  formValidation.on('core.form.valid', function() {
      const formData = new FormData(recojoForm);
      const dateValue = new Date().toISOString();
      const formattedDocId = generateUniqueId();

      // Format data
      const proveedorNombre = formData.get('proveedorName').toUpperCase();
      const clienteNombreFormatted = capitalizeWords(formData.get('clienteName'));
      const cantidadCobrarFormatted = parseFloat(formData.get('cantidadCobrar')).toFixed(2);
      const pedidoSeCobraValor = (cantidadCobrarFormatted === "0.00" || cantidadCobrarFormatted === "0") ? "No" : "Si";
      const fechaEntrega = formData.get('fechaEntrega'); // Assuming this is in DD-MM-YYYY format
      const [day, month, year] = fechaEntrega.split('-');
      const formattedFechaEntrega = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
      const newRecojo = {
          id: formattedDocId,
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
          fechaCreacionPedido: dateValue,
          fechaEntregaPedido: formattedFechaEntrega,
          pedidoCantidadCobrar: cantidadCobrarFormatted,
          pedidoSeCobra: pedidoSeCobraValor,
          pedidoMetodoPago: formData.get('metodoPago'),
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

      fetch(API_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(newRecojo)
      })
      .then(response => response.json())
        .then(data => {
            console.log('Respuesta:', data);
            alert('Formulario enviado correctamente');
            recojoForm.reset();
            // Reload recojos if needed
            if (typeof loadRecojos === 'function') {
                loadRecojos();
            }
            // Close modal if it exists
            if (typeof recojoModal !== 'undefined' && recojoModal.hide) {
                recojoModal.hide();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema con el envío');
        });
  });
});
