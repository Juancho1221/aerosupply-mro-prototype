let activeRequestId = null;

function procurementActor(action) {
  return { user: "M. Buyer", role: "Procurement Buyer", action: action };
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
  if (modalId === "modalPoRegister" || modalId === "modalDispatchRegister") {
    activeRequestId = null;
  }
}

function switchProcurementView(viewName) {
  ["Quotes", "Procurement", "Vendors"].forEach(function (name) {
    document.getElementById("view" + name).classList.toggle("hidden", name !== viewName);
  });
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(function (button) {
    button.classList.remove("active");
  });
  const activeButton = viewName === "Quotes"
    ? document.getElementById("navQuotesBtn")
    : viewName === "Vendors"
      ? document.getElementById("navVendorsBtn")
      : document.getElementById("navOrdersBtn");
  activeButton.classList.add("active");
  document.getElementById("viewTitle").innerText =
    viewName === "Quotes" ? "Requisitions & Quotes"
      : viewName === "Vendors" ? "Approved Vendors"
        : "Purchase Orders & Dispatch";
}

function renderVendors() {
  const query = (document.getElementById("vendorSearch")?.value || "").trim().toLowerCase();
  const tbody = document.getElementById("vendorsTableBody");
  const vendors = AeroSupplyStore.getVendors().filter(function (vendor) {
    return [vendor.code, vendor.name, vendor.country, vendor.category, vendor.status]
      .join(" ").toLowerCase().includes(query);
  });

  tbody.innerHTML = vendors.map(function (vendor) {
    return "<tr>" +
      "<td class='mono'>" + vendor.code + "</td>" +
      "<td><strong>" + vendor.name + "</strong></td>" +
      "<td>" + vendor.country + "</td>" +
      "<td>" + vendor.category + "</td>" +
      "<td>" + vendor.certifications.join(", ") + "</td>" +
      "<td><span class='badge-status " + (vendor.status === "Suspended" ? "rejected" : "approved") + "'>" +
      vendor.status + "</span></td></tr>";
  }).join("");
}

function renderQuotes() {
  const tbody = document.getElementById("quotesTableBody");
  const requests = AeroSupplyStore.getRequests().filter(function (request) {
    return ["Pending", "Quoting", "Pending Approval", "Approved"].includes(request.status);
  });

  tbody.innerHTML = requests.map(function (request) {
    const part = request.parts[0] || {};
    return "<tr>" +
      "<td class='mono'>" + request.id + "</td>" +
      "<td>" + request.tailNumber + "</td>" +
      "<td class='mono'>" + (part.partNumber || "--") + "</td>" +
      "<td><span class='badge-urgency " + (request.urgency === "AOG" ? "aog" : "routine") + "'>" +
      request.urgency + "</span></td>" +
      "<td><span class='badge-status pending'>" + request.status + "</span></td>" +
      "<td style='text-align:center'><button type='button' class='btn-primary btn-action-col' onclick=\"openQuoteModal('" +
      request.id + "')\"><i class='fa-solid fa-file-circle-plus'></i> Add Quote</button></td></tr>";
  }).join("");
}

function openQuoteModal(requestId) {
  const request = AeroSupplyStore.getRequest(requestId);
  if (!request) return;

  activeRequestId = requestId;
  document.getElementById("quoteReqId").innerText = requestId;
  const vendorSelect = document.getElementById("quoteVendorSelect");
  vendorSelect.innerHTML = AeroSupplyStore.getVendors().map(function (vendor) {
    return "<option value='" + vendor.id + "'" + (vendor.status === "Suspended" ? " disabled" : "") +
      ">" + vendor.code + " - " + vendor.name + " (" + vendor.status + ")</option>";
  }).join("");
  document.getElementById("quoteUnitPriceInput").value = "";
  document.getElementById("quoteFreightInput").value = "0";
  document.getElementById("quoteLeadTimeInput").value = "";
  document.getElementById("quoteTrmInput").value = "1";
  document.getElementById("modalQuoteRegister").classList.remove("hidden");
}

function saveQuote() {
  const request = AeroSupplyStore.getRequest(activeRequestId);
  if (!request) return;

  const vendorId = document.getElementById("quoteVendorSelect").value;
  const vendor = AeroSupplyStore.getVendor(vendorId);
  if (!vendor || vendor.status === "Suspended") {
    alert("Blocked: suspended vendors cannot be quoted or purchased.");
    return;
  }

  const unitPrice = Number(document.getElementById("quoteUnitPriceInput").value);
  const freight = Number(document.getElementById("quoteFreightInput").value);
  const leadTimeDays = Number(document.getElementById("quoteLeadTimeInput").value);
  const trm = Number(document.getElementById("quoteTrmInput").value);
  const currency = document.getElementById("quoteCurrencySelect").value;
  const availability = document.getElementById("quoteAvailabilitySelect").value;

  if (!unitPrice || unitPrice <= 0 || !leadTimeDays || leadTimeDays <= 0 || !trm || trm <= 0) {
    alert("Enter a valid unit price, lead time and TRM.");
    return;
  }

  const quote = {
    vendorId: vendorId,
    unitPrice: unitPrice,
    freight: freight,
    leadTimeDays: leadTimeDays,
    currency: currency,
    trm: trm,
    availability: availability,
    dateUtc: new Date().toISOString()
  };
  const quotes = Array.isArray(request.quotes) ? request.quotes.concat([quote]) : [quote];
  const unitPriceUsd = currency === "USD" ? unitPrice : unitPrice / trm;
  const nextStatus = unitPriceUsd > 1500 || request.urgency === "AOG"
    ? "Pending Approval"
    : "Quoting";

  AeroSupplyStore.updateRequest(request.id, {
    quotes: quotes,
    selectedQuote: quote,
    status: nextStatus
  }, procurementActor("Quote selected"));

  closeModal("modalQuoteRegister");
  renderQuotes();
  renderProcurement();
  alert("Quote registered. Request status: " + nextStatus);
}

function renderProcurement() {
  const tbody = document.getElementById("procurementTableBody");
  const requests = AeroSupplyStore.getRequests().filter(function (request) {
    return ["Quoting", "Approved", "Pending Approval", "Purchased", "In Transit"].includes(request.status);
  });

  tbody.innerHTML = requests.map(function (request) {
    const part = request.parts[0] || {};
    const quote = request.selectedQuote;
    let action = "<button type='button' class='btn-action-col' disabled><i class='fa-solid fa-lock'></i> Locked</button>";

    if (request.status === "Quoting" || request.status === "Approved") {
      action = "<button type='button' class='btn-primary btn-action-col' onclick=\"openPoModal('" +
        request.id + "')\"><i class='fa-solid fa-file-invoice-dollar'></i> Emit PO</button>";
    } else if (request.status === "Purchased") {
      action = "<button type='button' class='btn-table-action btn-action-col' onclick=\"openDispatchModal('" +
        request.id + "')\"><i class='fa-solid fa-truck-fast'></i> Add Tracking</button>";
    } else if (request.status === "In Transit") {
      action = "<div class='dispatch-info-box'><strong>" + (request.shipment?.carrier || "--") +
        "</strong><div class='mono'>" + (request.shipment?.awb || "--") + "</div></div>";
    }

    const statusLabel = request.status === "Approved" ? "Approved (MM)"
      : request.status === "Pending Approval" ? "Pending (MM)"
        : request.status;

    return "<tr>" +
      "<td class='col-id'>" + request.id + "</td>" +
      "<td class='col-target'>" + request.tailNumber + "</td>" +
      "<td class='col-pn'>" + (part.partNumber || "--") + "</td>" +
      "<td style='text-align:center'>" + (part.qty || 0) + "</td>" +
      "<td style='text-align:center'><span class='badge-urgency " + (request.urgency === "AOG" ? "aog" : "routine") + "'>" +
      request.urgency + "</span></td>" +
      "<td class='mono'>" + (quote ? "$" + quote.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " " + quote.currency : "--") + "</td>" +
      "<td style='text-align:center'><span class='badge-status pending'>" + statusLabel + "</span></td>" +
      "<td style='text-align:center'>" + action + "</td></tr>";
  }).join("");
}

function openPoModal(requestId) {
  const request = AeroSupplyStore.getRequest(requestId);
  if (!request) return;
  if (request.purchaseOrder) {
    alert("409 Conflict: this requisition already has a Purchase Order.");
    return;
  }
  if (!["Quoting", "Approved"].includes(request.status)) {
    alert("PO generation is locked for status: " + request.status);
    return;
  }

  const quote = request.selectedQuote;
  const vendor = quote ? AeroSupplyStore.getVendor(quote.vendorId) : null;
  if (!vendor) {
    alert("No selected quote vendor is available.");
    return;
  }
  if (vendor.status === "Suspended") {
    alert("Blocked: suspended vendors cannot be purchased.");
    return;
  }

  activeRequestId = requestId;
  document.getElementById("poSelectedReqId").innerText = requestId;
  document.getElementById("poPartTarget").innerText =
    request.tailNumber + " (" + (request.parts[0]?.partNumber || "--") + ")";
  document.getElementById("poQuotedAmount").innerText =
    "$" + quote.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " " + quote.currency;
  document.getElementById("poVendorName").innerText = vendor.name;
  document.getElementById("poLeadTime").innerText = quote.leadTimeDays + " calendar days";
  document.getElementById("poNumberInput").value = "PO-2026-" + Math.floor(1000 + Math.random() * 9000);
  document.getElementById("poPaymentSelect").value = "";
  document.getElementById("poTimestampUtc").value = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
  document.getElementById("modalPoRegister").classList.remove("hidden");
}

function confirmSavePo() {
  const request = AeroSupplyStore.getRequest(activeRequestId);
  if (!request) return;
  if (request.purchaseOrder) {
    closeModal("modalPoRegister");
    alert("409 Conflict: this requisition already has a Purchase Order.");
    return;
  }

  const poNumber = document.getElementById("poNumberInput").value.trim();
  const paymentMethod = document.getElementById("poPaymentSelect").value;
  const quote = request.selectedQuote;
  if (!poNumber) {
    alert("Please enter a PO Number.");
    return;
  }
  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }

  AeroSupplyStore.updateRequest(request.id, {
    purchaseOrder: {
      poNumber: poNumber,
      paymentMethod: paymentMethod,
      dateUtc: new Date().toISOString(),
      netTotalCost: (quote.unitPrice * (request.parts[0]?.qty || 1)) + quote.freight,
      currency: quote.currency,
      trm: quote.trm
    },
    status: "Purchased"
  }, procurementActor("Purchase Order issued"));

  closeModal("modalPoRegister");
  renderProcurement();
  alert("PO " + poNumber + " issued for " + request.id + ".");
}

function openDispatchModal(requestId) {
  const request = AeroSupplyStore.getRequest(requestId);
  if (!request) return;
  if (request.status !== "Purchased" || !request.purchaseOrder) {
    alert("Dispatch is available only for Purchased requests.");
    return;
  }
  activeRequestId = requestId;
  document.getElementById("dispReqId").innerText = request.id;
  document.getElementById("dispPoNumber").innerText = request.purchaseOrder.poNumber;
  document.getElementById("dispCarrierSelect").value = "";
  document.getElementById("dispAwbInput").value = "";
  document.getElementById("modalDispatchRegister").classList.remove("hidden");
}

function confirmSaveDispatch() {
  const request = AeroSupplyStore.getRequest(activeRequestId);
  if (!request) return;
  if (request.status !== "Purchased") {
    closeModal("modalDispatchRegister");
    alert("409 Conflict: dispatch state changed and is no longer editable.");
    return;
  }

  const carrier = document.getElementById("dispCarrierSelect").value;
  const awb = document.getElementById("dispAwbInput").value.trim();
  if (!carrier || !awb) {
    alert("Carrier and Tracking Number / AWB are required.");
    return;
  }

  AeroSupplyStore.updateRequest(request.id, {
    shipment: {
      carrier: carrier,
      awb: awb,
      dispatchedAtUtc: new Date().toISOString()
    },
    status: "In Transit"
  }, procurementActor("Shipment dispatched"));

  closeModal("modalDispatchRegister");
  renderProcurement();
  alert("Dispatch registered. Status: In Transit.");
}

document.getElementById("navQuotesBtn").addEventListener("click", function () {
  renderQuotes();
  switchProcurementView("Quotes");
});
document.getElementById("navOrdersBtn").addEventListener("click", function () {
  renderProcurement();
  switchProcurementView("Procurement");
});
document.getElementById("navVendorsBtn").addEventListener("click", function () {
  renderVendors();
  switchProcurementView("Vendors");
});

renderProcurement();
renderQuotes();
renderVendors();
