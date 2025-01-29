document.addEventListener("DOMContentLoaded", function() {
    const recojoForm = document.getElementById('recojoForm');
    
    // Initialize Select2 for dropdowns
    const selects = document.querySelectorAll('.select2');
    selects.forEach(select => {
      $(select).select2({
        dropdownParent: $(select).parent()
      });
    });
  
    const formValidation = FormValidation.formValidation(recojoForm, {
      fields: {
        // Información del Recojo
        fechaEntrega: {
          validators: {
            notEmpty: {
              message: 'La fecha de entrega es requerida'
            },
            date: {
              format: 'YYYY-MM-DD',
              message: 'La fecha no es válida'
            }
          }
        },
        proveedorName: {
          validators: {
            notEmpty: {
              message: 'El nombre del proveedor es requerido'
            },
            stringLength: {
              min: 3,
              max: 100,
              message: 'El nombre debe tener entre 3 y 100 caracteres'
            }
          }
        },
        proveedorTelefono: {
          validators: {
            notEmpty: {
              message: 'El teléfono es requerido'
            },
            regexp: {
              regexp: /^\d{9}$/,
              message: 'El teléfono debe tener 9 dígitos'
            }
          }
        },
        proveedorDistrito: {
          validators: {
            notEmpty: {
              message: 'Debe seleccionar un distrito'
            }
          }
        },
        
        // Información del Cliente
        clienteName: {
          validators: {
            notEmpty: {
              message: 'El nombre del cliente es requerido'
            },
            stringLength: {
              min: 3,
              max: 100,
              message: 'El nombre debe tener entre 3 y 100 caracteres'
            }
          }
        },
        clienteTelefono: {
          validators: {
            notEmpty: {
              message: 'El teléfono es requerido'
            },
            regexp: {
              regexp: /^\d{9}$/,
              message: 'El teléfono debe tener 9 dígitos'
            }
          }
        },
        clienteDistrito: {
          validators: {
            notEmpty: {
              message: 'Debe seleccionar un distrito'
            }
          }
        },
        clienteUbicacion: {
          validators: {
            notEmpty: {
              message: 'La dirección es requerida'
            },
            stringLength: {
              min: 5,
              max: 200,
              message: 'La dirección debe tener entre 5 y 200 caracteres'
            }
          }
        },
        
        // Detalles del Pedido
        cantidadCobrar: {
          validators: {
            notEmpty: {
              message: 'La cantidad a cobrar es requerida'
            },
            numeric: {
              message: 'El valor debe ser numérico',
              decimalSeparator: '.'
            },
            greaterThan: {
              value: 0,
              message: 'La cantidad debe ser mayor a 0'
            }
          }
        },
        metodoPago: {
          validators: {
            notEmpty: {
              message: 'Debe seleccionar un método de pago'
            }
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
        instance.on('plugins.message.placed', function(e) {
          // Move the error message outside of input groups
          if (e.element.parentElement.classList.contains('input-group')) {
            e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
          }
        });
      }
    });
  
    // Handle Select2 validation
    const select2Elements = document.querySelectorAll('.select2');
    select2Elements.forEach(element => {
      $(element).on('change', function() {
        formValidation.revalidateField(element.id);
      });
    });
  
    // Handle form submission
    recojoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      formValidation.validate().then(function(status) {
        if (status === 'Valid') {
          // Add your form submission logic here
          alert('Formulario válido - Enviando datos...');
        }
      });
    });
  });