let receivingRequestId = null;

function warehouseActor(action) {
  return { user: "R. Storekeeper", role: "Storekeeper", action: action };
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function switchWarehouseView(viewName) {
  ["Incoming", "Inventory", "Quarantine"].forEach(function (name) {
    document.getElementById("view" + name).classList.toggle("hidden", name !== viewName);
  });
  ["Incoming", "Inventory", "Quarantine"].forEach(function (name) {
    document.getElementById("nav" + name).classList.toggle("active", name === viewName);
  });
  document.getElementById("viewTitle").innerText =
    viewName === "Incoming" ? "Incoming Shipments"
      : viewName === "Inventory" ? "Active Inventory"
        : "Quarantine (Red Tag)";
}

function renderIncoming() {
  const tbody = document.getElementById("incomingTableBody");
  const requests = AeroSupplyStore.getRequests().filter(function (request) {
    return request.status === "In Transit";
  });

  tbody.innerHTML = requests.map(function (request) {
    const part = request.parts[0] || {};
    return "<tr>" +
      "<td class='mono'>" + request.id + "</td>" +
      "<td>" + (request.shipment?.carrier || "--") + "<br><span class='mono'>" + (request.shipment?.awb || "--") + "</span></td>" +
      "<td class='mono'>" + (part.partNumber || "--") + "</td>" +
      "<td>" + (part.qty || 0) + "</td>" +
      "<td><span class='badge-status transit'>In Transit</span></td>" +
      "<td style='text-align:center'><button type='button' class='btn-primary' onclick=\"openReceiving('" + request.id + "')\"><i class='fa-solid fa-clipboard-check'></i> Inspect</button></td></tr>";
  }).join("") || "<tr><td colspan='6' style='text-align:center'>No incoming shipments.</td></tr>";
}

function renderInventory() {
  const tbody = document.getElementById("inventoryTableBody");
  const inventory = AeroSupplyStore.getInventory();
  tbody.innerHTML = inventory.map(function (item) {
    return "<tr>" +
      "<td class='mono'>" + item.id + "</td>" +
      "<td class='mono'>" + item.partNumber + "</td>" +
      "<td>" + item.description + "</td>" +
      "<td>" + item.qty + "</td>" +
      "<td>" + item.location + "</td>" +
      "<td>" + (item.certificate ? item.certificate.type + "<br><span class='mono'>" + item.certificate.number + "</span>" : "--") + "</td></tr>";
  }).join("") || "<tr><td colspan='6' style='text-align:center'>Inventory is empty.</td></tr>";
}

function renderQuarantine() {
  const tbody = document.getElementById("quarantineTableBody");
  const requests = AeroSupplyStore.getRequests().filter(function (request) {
    return request.status === "Quarantined";
  });
  tbody.innerHTML = requests.map(function (request) {
    const part = request.parts[0] || {};
    return "<tr>" +
      "<td class='mono'>" + request.id + "</td>" +
      "<td class='mono'>" + (part.partNumber || "--") + "</td>" +
      "<td>" + (request.quarantineClassification || "--") + "</td>" +
      "<td>" + (request.rejectionReason || "--") + "</td>" +
      "<td><span class='badge-status rejected'>Quarantined (Red Tag)</span></td></tr>";
  }).join("") || "<tr><td colspan='5' style='text-align:center'>No quarantined components.</td></tr>";
}

function openReceiving(requestId) {
  const request = AeroSupplyStore.getRequest(requestId);
  if (!request || request.status !== "In Transit") return;

  receivingRequestId = requestId;
  const part = request.parts[0] || {};
  document.getElementById("receivingReqId").innerText = requestId;
  document.getElementById("qcPartNumber").value = part.partNumber || "";
  document.getElementById("qcSerialNumber").value = "";
  document.getElementById("qcPhysicalStatus").value = "";
  document.getElementById("qcCertificateNumber").value = "";
  document.getElementById("qcAuthority").value = "";
  document.getElementById("qcCertificateStatus").value = "";
  document.getElementById("qcBatchLot").value = "";
  document.getElementById("qcManufacturingDate").value = "";
  document.getElementById("qcExpirationDate").value = "";
  document.getElementById("qcShelfStatus").value = "";
  document.getElementById("qcLocation").value = "";
  document.getElementById("modalReceiving").classList.remove("hidden");
  updateAdmitButton();
}

function collectQc() {
  return {
    physical: {
      partNumber: document.getElementById("qcPartNumber").value.trim(),
      serialNumber: document.getElementById("qcSerialNumber").value.trim(),
      status: document.getElementById("qcPhysicalStatus").value
    },
    certificate: {
      type: document.getElementById("qcCertificateType").value,
      number: document.getElementById("qcCertificateNumber").value.trim(),
      authority: document.getElementById("qcAuthority").value.trim(),
      status: document.getElementById("qcCertificateStatus").value
    },
    shelfLife: {
      batchLot: document.getElementById("qcBatchLot").value.trim(),
      manufacturingDate: document.getElementById("qcManufacturingDate").value,
      expirationDate: document.getElementById("qcExpirationDate").value,
      status: document.getElementById("qcShelfStatus").value
    }
  };
}

function allQcPassed(qc) {
  return qc.physical.status === "Passed" &&
    qc.certificate.status === "Passed" &&
    qc.shelfLife.status === "Passed";
}

function updateAdmitButton() {
  const qc = collectQc();
  const location = document.getElementById("qcLocation").value.trim();
  document.getElementById("btnAdmit").disabled = !(allQcPassed(qc) && location);
}

document.querySelectorAll("#modalReceiving input, #modalReceiving select").forEach(function (control) {
  control.addEventListener("input", updateAdmitButton);
  control.addEventListener("change", updateAdmitButton);
});

function admitToInventory() {
  const request = AeroSupplyStore.getRequest(receivingRequestId);
  if (!request) return;

  const part = request.parts[0] || {};
  const qc = collectQc();
  const location = document.getElementById("qcLocation").value.trim();

  if (qc.physical.partNumber !== part.partNumber) {
    alert("Physical inspection failed: Part Number does not match the requisition.");
    return;
  }
  if (!qc.physical.status || !qc.certificate.status || !qc.shelfLife.status) {
    alert("Complete all three quality controls.");
    return;
  }
  if (!allQcPassed(qc)) {
    alert("Admission is blocked. One or more quality controls did not pass.");
    return;
  }
  if (!qc.physical.serialNumber || !qc.certificate.number || !qc.certificate.authority ||
      !qc.shelfLife.batchLot || !location) {
    alert("Serial Number, certificate, Batch/Lot and Location are required.");
    return;
  }

  const inventoryId = "INV-" + String(Date.now()).slice(-8);
  AeroSupplyStore.addInventoryItem({
    id: inventoryId,
    partNumber: part.partNumber,
    description: part.description,
    qty: part.qty,
    location: location,
    batchLot: qc.shelfLife.batchLot,
    serialNumber: qc.physical.serialNumber,
    manufacturingDateUtc: qc.shelfLife.manufacturingDate || null,
    expirationDateUtc: qc.shelfLife.expirationDate || null,
    certificate: {
      type: qc.certificate.type,
      number: qc.certificate.number,
      authority: qc.certificate.authority
    },
    sourceRequestId: request.id,
    status: "In Stock"
  }, warehouseActor("Inventory item admitted"));

  AeroSupplyStore.updateRequest(request.id, {
    status: "In Stock",
    inventoryLocation: location,
    receiving: qc
  }, warehouseActor("Component admitted to inventory"));

  closeModal("modalReceiving");
  receivingRequestId = null;
  renderIncoming();
  renderInventory();
  alert("Component admitted to inventory.");
}

function openRedTagModal() {
  if (!receivingRequestId) return;
  document.getElementById("redTagReqId").innerText = receivingRequestId;
  document.getElementById("redTagClassification").value = "";
  document.getElementById("redTagReason").value = "";
  document.getElementById("modalRedTag").classList.remove("hidden");
}

function confirmQuarantine() {
  const classification = document.getElementById("redTagClassification").value;
  const reason = document.getElementById("redTagReason").value.trim();
  if (!classification || !reason) {
    alert("Classification and Rejection Reason are required.");
    return;
  }

  const qc = collectQc();
  AeroSupplyStore.updateRequest(receivingRequestId, {
    status: "Quarantined",
    quarantineClassification: classification,
    rejectionReason: reason,
    receiving: qc
  }, warehouseActor("Component quarantined"));

  closeModal("modalRedTag");
  closeModal("modalReceiving");
  receivingRequestId = null;
  renderIncoming();
  renderQuarantine();
  alert("Discrepancy Report created and shipment moved to Red Tag quarantine.");
}

document.getElementById("navIncoming").addEventListener("click", function () {
  renderIncoming();
  switchWarehouseView("Incoming");
});
document.getElementById("navInventory").addEventListener("click", function () {
  renderInventory();
  switchWarehouseView("Inventory");
});
document.getElementById("navQuarantine").addEventListener("click", function () {
  renderQuarantine();
  switchWarehouseView("Quarantine");
});

renderIncoming();
renderInventory();
renderQuarantine();
