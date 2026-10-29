// Variable para almacenar la fila activa sobre la que se emite la PO
let activeRow = null;

// 1. Abrir Modal de Registro de Orden de Compra (HU-006)
function openPoModal(button) {
  activeRow = button.closest('tr');

  const reqId = activeRow.getAttribute('data-id');
  const pn = activeRow.getAttribute('data-pn');
  const tail = activeRow.getAttribute('data-tail');
  const quote = activeRow.getAttribute('data-quote');

  // Cargar datos de la cotización seleccionada en la modal
  document.getElementById('poSelectedReqId').textContent = reqId;
  document.getElementById('poPartTarget').textContent = `${tail} (${pn})`;
  document.getElementById('poQuotedAmount').textContent = `$${parseFloat(quote).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
  document.getElementById('poVendorName').textContent = 'Textron Aviation Parts (AVL)';
  document.getElementById('poLeadTime').textContent = '5 calendar days';

  // Generar sugerencia de PO consecutiva y limpiar formulario
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('poNumberInput').value = `PO-2026-${randomSuffix}`;
  document.getElementById('poPaymentSelect').value = '';
  document.getElementById('poNotesInput').value = '';

  // Marca temporal UTC actual
  const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  document.getElementById('poTimestampUtc').value = nowUtc;

  // Mostrar modal
  document.getElementById('modalPoRegister').classList.remove('hidden');
}

// 2. Cerrar Modal
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  activeRow = null;
}

// 3. Confirmar y Guardar Orden de Compra (HU-006)
function confirmSavePo() {
  const poNumber = document.getElementById('poNumberInput').value.trim();
  const paymentMethod = document.getElementById('poPaymentSelect').value;
  const notes = document.getElementById('poNotesInput').value.trim();

  // Validación de campos comerciales obligatorios
  if (!poNumber) {
    alert('Please enter a valid Purchase Order (PO) Number.');
    document.getElementById('poNumberInput').focus();
    return;
  }

  if (!paymentMethod) {
    alert('Please select a commercial Payment Method (Corporate Card, Net 30, or Wire Transfer).');
    document.getElementById('poPaymentSelect').focus();
    return;
  }

  if (activeRow) {
    const reqId = activeRow.getAttribute('data-id');

    // Actualizar atributos de la fila
    activeRow.setAttribute('data-status', 'Purchased');
    activeRow.setAttribute('data-po', poNumber);
    if (notes) activeRow.setAttribute('data-notes', notes);

    // Actualizar celda de Estado a 'Purchased'
    const statusCell = activeRow.cells[6];
    statusCell.innerHTML = '<span class="badge-status instock">Purchased</span>';

    // Actualizar celda de Acción: habilitar 'Add Tracking' con clase uniforme
    const actionCell = activeRow.cells[7];
    actionCell.innerHTML = `
      <button type="button" class="btn-table-action btn-action-col" onclick="openDispatchModal(this)">
        <i class="fa-solid fa-truck-fast"></i> Add Tracking
      </button>
    `;

    closeModal('modalPoRegister');
    alert(`Order ${poNumber} successfully issued for ${reqId}.\nStatus updated to Purchased.`);
  }
}

// 4. Abrir Modal de Registro de Despacho y Tracking (HU-007 / RF-012)
function openDispatchModal(button) {
  activeRow = button.closest('tr');

  const reqId = activeRow.getAttribute('data-id');
  const poNumber = activeRow.getAttribute('data-po') || 'PO-2026-8821';

  // Cargar metadatos en la modal
  document.getElementById('dispReqId').textContent = reqId;
  document.getElementById('dispPoNumber').textContent = poNumber;

  // Limpiar campos del formulario
  document.getElementById('dispCarrierSelect').value = '';
  document.getElementById('dispAwbInput').value = '';

  // Mostrar modal
  document.getElementById('modalDispatchRegister').classList.remove('hidden');
}

// 5. Confirmar y Guardar Despacho (HU-007 / RF-012)
function confirmSaveDispatch() {
  const carrier = document.getElementById('dispCarrierSelect').value;
  const awb = document.getElementById('dispAwbInput').value.trim();

  // Validación de obligatoriedad (Criterio HU-007)
  if (!carrier) {
    alert('Please select a shipping carrier (FedEx, DHL, UPS, Air Canada Cargo).');
    document.getElementById('dispCarrierSelect').focus();
    return;
  }

  if (!awb) {
    alert('Please enter a valid Tracking Number / Air Waybill (AWB).');
    document.getElementById('dispAwbInput').focus();
    return;
  }

  if (activeRow) {
    const reqId = activeRow.getAttribute('data-id');
    const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // Actualizar atributos de datos de la fila
    activeRow.setAttribute('data-status', 'In Transit');
    activeRow.setAttribute('data-carrier', carrier);
    activeRow.setAttribute('data-awb', awb);
    activeRow.setAttribute('data-dispatch-utc', nowUtc);

    // Actualizar celda de Estado visualmente a 'In Transit'
    const statusCell = activeRow.cells[6];
    statusCell.innerHTML = '<span class="badge-status in-transit">In Transit</span>';

    // Actualizar celda de Acción: mostrar resumen con ancho consistente
    const actionCell = activeRow.cells[7];
    actionCell.innerHTML = `
      <div class="dispatch-info-box">
        <div><i class="fa-solid fa-plane-arrival"></i> ${carrier.split(' ')[0]}</div>
        <div class="mono" style="color: #64748b; font-size: 0.7rem;">${awb}</div>
      </div>
    `;
    
    closeModal('modalDispatchRegister');
    alert(`Dispatch confirmed for ${reqId}!\nCarrier: ${carrier}\nAWB: ${awb}\nStatus updated to In Transit (UTC: ${nowUtc}).`);
  }
}