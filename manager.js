let rejectRequestId = null;

function managerActor(action) {
  return { user: "S. Manager", role: "Maintenance Manager", action: action };
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function switchManagerView(viewName) {
  document.getElementById("viewApprovals").classList.toggle("hidden", viewName !== "Approvals");
  document.getElementById("viewAudit").classList.toggle("hidden", viewName !== "Audit");
  document.getElementById("navApprovals").classList.toggle("active", viewName === "Approvals");
  document.getElementById("navAudit").classList.toggle("active", viewName === "Audit");
  document.getElementById("viewTitle").innerText =
    viewName === "Approvals" ? "Pending Approvals" : "Traceability & Audit Ledger";
}

function renderApprovals() {
  const tbody = document.getElementById("approvalsTableBody");
  const requests = AeroSupplyStore.getRequests().filter(function (request) {
    return request.status === "Pending Approval";
  });

  tbody.innerHTML = requests.map(function (request) {
    const part = request.parts[0] || {};
    const quote = request.selectedQuote;
    const vendor = quote ? AeroSupplyStore.getVendor(quote.vendorId) : null;
    const quoteText = quote
      ? "$" + quote.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " " + quote.currency +
        " - " + (vendor ? vendor.name : "Unknown Vendor")
      : "--";

    return "<tr>" +
      "<td class='mono'>" + request.id + "</td>" +
      "<td>" + request.tailNumber + "</td>" +
      "<td><strong class='mono'>" + (part.partNumber || "--") + "</strong><br><span>" + (part.description || "") + "</span></td>" +
      "<td><span class='badge-urgency " + (request.urgency === "AOG" ? "aog" : "routine") + "'>" + request.urgency + "</span></td>" +
      "<td>" + quoteText + "</td>" +
      "<td style='text-align:center'>" +
      "<button type='button' class='btn-primary' onclick=\"approveRequest('" + request.id + "')\"><i class='fa-solid fa-check'></i> Approve</button> " +
      "<button type='button' class='btn-danger-solid' onclick=\"openReject('" + request.id + "')\"><i class='fa-solid fa-xmark'></i> Reject</button>" +
      "</td></tr>";
  }).join("") || "<tr><td colspan='6' style='text-align:center'>No approvals pending.</td></tr>";
}

function approveRequest(requestId) {
  const request = AeroSupplyStore.getRequest(requestId);
  if (!request || request.status !== "Pending Approval") {
    alert("This request is no longer pending approval.");
    return;
  }

  AeroSupplyStore.updateRequest(requestId, {
    status: "Approved",
    digitalSignature: {
      name: "S. Manager",
      role: "Maintenance Manager",
      signedAtUtc: new Date().toISOString()
    }
  }, managerActor("Request approved"));

  renderApprovals();
  alert("Request " + requestId + " approved.");
}

function openReject(requestId) {
  rejectRequestId = requestId;
  document.getElementById("rejectReqId").innerText = requestId;
  document.getElementById("rejectReasonInput").value = "";
  document.getElementById("modalReject").classList.remove("hidden");
}

function confirmReject() {
  const reason = document.getElementById("rejectReasonInput").value.trim();
  if (!reason) {
    alert("Rejection Reason is required.");
    document.getElementById("rejectReasonInput").focus();
    return;
  }

  const request = AeroSupplyStore.getRequest(rejectRequestId);
  if (!request || request.status !== "Pending Approval") {
    closeModal("modalReject");
    alert("This request is no longer pending approval.");
    return;
  }

  AeroSupplyStore.updateRequest(rejectRequestId, {
    status: "Rejected",
    rejectionReason: reason
  }, managerActor("Request rejected"));

  closeModal("modalReject");
  rejectRequestId = null;
  renderApprovals();
  alert("Request rejected.");
}

function auditMatches(entry, query) {
  if (!query) return true;
  const requestIds = [entry.prev && entry.prev.id, entry.next && entry.next.id].filter(Boolean);
  const text = (requestIds.join(" ") + " " + JSON.stringify(entry.prev || {}) + " " + JSON.stringify(entry.next || {})).toLowerCase();
  if (text.includes(query)) return true;

  return AeroSupplyStore.getRequests().some(function (request) {
    if (!requestIds.includes(request.id)) return false;
    const partNumbers = request.parts.map(function (part) { return part.partNumber; }).join(" ");
    return (request.tailNumber + " " + partNumbers + " " + (request.serialNumber || "")).toLowerCase().includes(query);
  });
}

function renderAudit() {
  const query = document.getElementById("auditSearch").value.trim().toLowerCase();
  const timeline = document.getElementById("auditTimeline");
  const entries = AeroSupplyStore.getAudit().filter(function (entry) {
    return auditMatches(entry, query);
  }).sort(function (a, b) {
    return b.dateUtc.localeCompare(a.dateUtc);
  });

  timeline.innerHTML = entries.map(function (entry) {
    const requestId = entry.next?.id || entry.prev?.id || "--";
    const request = AeroSupplyStore.getRequest(requestId);
    const locked = request && ["In Stock", "Quarantined"].includes(request.status)
      ? "<div class='audit-lock'><i class='fa-solid fa-lock'></i> Closed & Locked (5-Year Regulatory Retention)</div>"
      : "";

    return "<article class='audit-entry'>" +
      "<div class='audit-time mono'>" + entry.dateUtc.slice(0, 19).replace("T", " ") + " UTC</div>" +
      "<div><strong>" + entry.action + "</strong> - " + requestId + "<br>" +
      "<span>" + entry.user + " | " + entry.role + "</span>" +
      "<div class='audit-change mono'>" +
      (entry.prev?.status ? entry.prev.status : "No previous status") + " -> " +
      (entry.next?.status ? entry.next.status : "Updated") + "</div>" + locked + "</div></article>";
  }).join("") || "<p>No audit records found.</p>";
}

document.getElementById("navApprovals").addEventListener("click", function () {
  renderApprovals();
  switchManagerView("Approvals");
});
document.getElementById("navAudit").addEventListener("click", function () {
  renderAudit();
  switchManagerView("Audit");
});

renderApprovals();
