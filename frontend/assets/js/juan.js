// Limpiar el formulario cuando se cierra el modal
document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('recojoForm'); // Tu formulario
    const modalCloseButtons = document.querySelectorAll('[data-bs-dismiss="modal"], .btn-close'); // Botones de cerrar y cancelar

    // Función para limpiar el formulario
    function clearForm() {
        modalElement.reset(); // Limpia todos los campos del formulario
    }

    // Evento para el botón de cancelar
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', clearForm);
    });
});

document.getElementById('cantidadCobrar').addEventListener('change', function() {
    console.log("Cambio detectado - Tipo:", typeof this.value, "Valor:", this.value);
  });
  