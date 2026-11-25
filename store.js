(function () {
  "use strict";

  const STORAGE_KEY = "aerosupply.state.v1";
  const SCHEMA_VERSION = 1;

  const requests = [
    {
      id: "REQ-2026-0839",
      tailNumber: "C-GYBF",
      urgency: "AOG",
      reason: "Unscheduled Maintenance",
      status: "In Transit",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "C253001-0101", description: "LOCK ASSY - DOOR L/H", qty: 1 }],
      selectedQuote: { vendorId: "VND-001", unitPrice: 2450, currency: "USD", freight: 0, leadTimeDays: 5 },
      purchaseOrder: { poNumber: "PO-2026-8830", paymentMethod: "Wire Transfer" },
      shipment: { carrier: "FedEx Aviation", awb: "7849-2091-8831", etaUtc: "2026-10-18T00:00:00.000Z" },
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-14T14:20:00.000Z",
      updatedAtUtc: "2026-10-17T09:00:00.000Z"
    },
    {
      id: "REQ-2026-0835",
      tailNumber: "STOCK",
      urgency: "Routine",
      reason: "Scheduled Maintenance",
      status: "Pending",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "AN507-1032R10", description: "MACHINE SCREW", qty: 25 }],
      selectedQuote: null,
      purchaseOrder: null,
      shipment: null,
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-15T09:12:00.000Z",
      updatedAtUtc: "2026-10-15T09:12:00.000Z"
    },
    {
      id: "REQ-2026-0810",
      tailNumber: "C-GYBF",
      urgency: "Routine",
      reason: "Scheduled Maintenance",
      status: "In Stock",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "S3432-A", description: "NUTPLATE", qty: 10 }],
      selectedQuote: null,
      purchaseOrder: null,
      shipment: null,
      receiving: null,
      inventoryLocation: "Bay 2 - Shelf B",
      rejectionReason: null,
      createdAtUtc: "2026-10-04T11:30:00.000Z",
      updatedAtUtc: "2026-10-10T12:00:00.000Z"
    },
    {
      id: "REQ-2026-0774",
      tailNumber: "C-GYBF",
      urgency: "AOG",
      reason: "Unscheduled Maintenance",
      status: "Approved",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "D5400", description: "Aircraft component", qty: 1 }],
      selectedQuote: { vendorId: "VND-001", unitPrice: 2450, currency: "USD", freight: 0, leadTimeDays: 5 },
      purchaseOrder: null,
      shipment: null,
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-12T08:00:00.000Z",
      updatedAtUtc: "2026-10-13T10:00:00.000Z"
    },
    {
      id: "REQ-2026-0812",
      tailNumber: "STOCK",
      urgency: "Routine",
      reason: "Scheduled Maintenance",
      status: "Quoting",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "C156-2", description: "BOOT PITCH BEARING", qty: 2 }],
      selectedQuote: { vendorId: "VND-002", unitPrice: 240, currency: "USD", freight: 0, leadTimeDays: 7 },
      purchaseOrder: null,
      shipment: null,
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-11T08:00:00.000Z",
      updatedAtUtc: "2026-10-12T11:00:00.000Z"
    },
    {
      id: "REQ-2026-0690",
      tailNumber: "STOCK",
      urgency: "Routine",
      reason: "Scheduled Maintenance",
      status: "Purchased",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "MT106-3", description: "TUBE FUEL SAMPLE, GL5", qty: 3 }],
      selectedQuote: { vendorId: "VND-002", unitPrice: 165, currency: "USD", freight: 0, leadTimeDays: 5 },
      purchaseOrder: { poNumber: "PO-2026-8821", paymentMethod: "Net 30" },
      shipment: null,
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-08T08:00:00.000Z",
      updatedAtUtc: "2026-10-10T08:00:00.000Z"
    },
    {
      id: "REQ-2026-0925",
      tailNumber: "C-FAEN",
      urgency: "AOG",
      reason: "Unscheduled Maintenance",
      status: "Pending Approval",
      requestedBy: "Alex Morgan",
      parts: [{ partNumber: "PT6-BLADE", description: "Turbine blade", qty: 1 }],
      selectedQuote: { vendorId: "VND-003", unitPrice: 3850, currency: "USD", freight: 0, leadTimeDays: 3 },
      purchaseOrder: null,
      shipment: null,
      receiving: null,
      inventoryLocation: null,
      rejectionReason: null,
      createdAtUtc: "2026-10-18T08:00:00.000Z",
      updatedAtUtc: "2026-10-19T10:00:00.000Z"
    }
  ];

  const vendors = [
    { id: "VND-001", code: "TEX-001", name: "Textron Aviation Parts", country: "United States", category: "Airframe", certifications: ["FAA"], status: "Active" },
    { id: "VND-002", code: "BOE-014", name: "Boeing Distribution", country: "United States", category: "Consumables", certifications: ["FAA"], status: "Active" },
    { id: "VND-003", code: "PT6-008", name: "Pratt & Whitney Canada", country: "Canada", category: "Engine", certifications: ["TCCA"], status: "Active" },
    { id: "VND-004", code: "SUS-010", name: "Suspended Supplier Demo", country: "Canada", category: "Components", certifications: ["TCCA"], status: "Suspended" }
  ];

  const inventory = [
    {
      id: "INV-001",
      partNumber: "S3432-A",
      description: "NUTPLATE",
      qty: 10,
      location: "Bay 2 - Shelf B",
      batchLot: "LOT-2026-104",
      serialNumber: null,
      expirationDateUtc: null,
      certificate: { type: "TCCA Form One", number: "TCCA-104-882", authority: "TCCA" },
      sourceRequestId: "REQ-2026-0810",
      status: "In Stock"
    }
  ];

  const statusPaths = {
    Pending: ["Pending"],
    Quoting: ["Pending", "Quoting"],
    "Pending Approval": ["Pending", "Quoting", "Pending Approval"],
    Approved: ["Pending", "Quoting", "Pending Approval", "Approved"],
    Rejected: ["Pending", "Quoting", "Pending Approval", "Rejected"],
    Purchased: ["Pending", "Quoting", "Purchased"],
    "In Transit": ["Pending", "Quoting", "Pending Approval", "Approved", "Purchased", "In Transit"],
    Received: ["Pending", "Quoting", "Purchased", "In Transit", "Received"],
    "In Stock": ["Pending", "Quoting", "Purchased", "In Transit", "Received", "In Stock"],
    Quarantined: ["Pending", "Quoting", "Purchased", "In Transit", "Quarantined"]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildSeedAudit(seedRequests) {
    const audit = [];

    seedRequests.forEach(function (request) {
      const path = statusPaths[request.status] || ["Pending", request.status];
      const start = Date.parse(request.createdAtUtc);

      path.forEach(function (status, index) {
        const previousStatus = index === 0 ? null : path[index - 1];
        const role = status === "Approved" || status === "Rejected"
          ? "Maintenance Manager"
          : status === "Purchased" || status === "In Transit"
            ? "Procurement Buyer"
            : status === "Received" || status === "In Stock" || status === "Quarantined"
              ? "Storekeeper"
              : "Line Mechanic";

        audit.push({
          action: index === 0 ? "Request created" : "Status changed",
          user: index === 0 ? request.requestedBy : "AeroSupply Demo",
          role: role,
          dateUtc: new Date(start + index * 3600000).toISOString(),
          prev: previousStatus === null ? null : { id: request.id, status: previousStatus },
          next: { id: request.id, status: status }
        });
      });
    });

    return audit.sort(function (a, b) {
      return a.dateUtc.localeCompare(b.dateUtc);
    });
  }

  function createInitialState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      requests: clone(requests),
      vendors: clone(vendors),
      inventory: clone(inventory),
      audit: buildSeedAudit(requests),
      nextRequestNumber: 926
    };
  }

  function validateState(state) {
    if (
      !state ||
      state.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(state.requests) ||
      !Array.isArray(state.vendors) ||
      !Array.isArray(state.inventory) ||
      !Array.isArray(state.audit)
    ) {
      throw new Error("AeroSupply local data is invalid or uses an unsupported version. Clear the aerosupply.state.v1 entry to reload demo data.");
    }
  }

  function saveState(state) {
    validateState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function readState() {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      const initialState = createInitialState();
      saveState(initialState);
      return initialState;
    }

    const state = JSON.parse(stored);
    validateState(state);
    return state;
  }

  function requireActor(actor) {
    if (!actor || !actor.user || !actor.role) {
      throw new Error("An audit user and role are required for every change.");
    }
  }

  function appendAudit(state, action, actor, prev, next) {
    requireActor(actor);

    state.audit.push({
      action: action || "Record updated",
      user: actor.user,
      role: actor.role,
      dateUtc: new Date().toISOString(),
      prev: prev === undefined ? null : clone(prev),
      next: next === undefined ? null : clone(next)
    });
  }

  function findRecord(collection, id) {
    return collection.find(function (record) {
      return record.id === id;
    });
  }

  function changedValues(record, patch) {
    const prev = { id: record.id };
    const next = { id: record.id };

    Object.keys(patch).forEach(function (key) {
      if (key === "id" || key === "createdAtUtc" || key === "audit") {
        throw new Error("This field cannot be changed through the store API: " + key);
      }

      if (JSON.stringify(record[key]) !== JSON.stringify(patch[key])) {
        prev[key] = record[key] === undefined ? null : clone(record[key]);
        next[key] = clone(patch[key]);
      }
    });

    return { prev: prev, next: next };
  }

  function updateRecord(collectionName, id, patch, actor) {
    requireActor(actor);

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("A record update must be an object.");
    }

    const state = readState();
    const record = findRecord(state[collectionName], id);

    if (!record) {
      throw new Error("Record not found: " + id);
    }

    const changes = changedValues(record, patch);
    if (Object.keys(changes.next).length === 1) {
      return clone(record);
    }

    Object.assign(record, clone(patch));
    if (Object.prototype.hasOwnProperty.call(record, "updatedAtUtc")) {
      record.updatedAtUtc = new Date().toISOString();
    }

    appendAudit(state, actor.action || "Record updated", actor, changes.prev, changes.next);
    saveState(state);
    return clone(record);
  }

  function createRequest(data, actor) {
    requireActor(actor);

    if (!data || !Array.isArray(data.parts) || data.parts.length === 0) {
      throw new Error("A request must include at least one part.");
    }

    const state = readState();
    let id = data.id;

    if (!id) {
      do {
        id = "REQ-2026-" + String(state.nextRequestNumber).padStart(4, "0");
        state.nextRequestNumber += 1;
      } while (findRecord(state.requests, id));
    } else if (findRecord(state.requests, id)) {
      throw new Error("Request ID already exists: " + id);
    }

    const now = new Date().toISOString();
    const request = Object.assign({}, clone(data), {
      id: id,
      status: data.status || "Pending",
      createdAtUtc: now,
      updatedAtUtc: now
    });

    state.requests.push(request);
    appendAudit(state, actor.action || "Request created", actor, null, {
      id: request.id,
      status: request.status,
      tailNumber: request.tailNumber,
      parts: request.parts
    });
    saveState(state);
    return clone(request);
  }

  function updateRequest(id, patch, actor) {
    return updateRecord("requests", id, patch, actor);
  }

  function updateVendor(id, patch, actor) {
    return updateRecord("vendors", id, patch, actor);
  }

  function updateInventoryItem(id, patch, actor) {
    return updateRecord("inventory", id, patch, actor);
  }

  function addInventoryItem(item, actor) {
    requireActor(actor);

    if (!item || !item.id || !item.partNumber) {
      throw new Error("An inventory item must include an ID and Part Number.");
    }

    const state = readState();
    if (findRecord(state.inventory, item.id)) {
      throw new Error("Inventory item already exists: " + item.id);
    }

    const newItem = clone(item);
    state.inventory.push(newItem);
    appendAudit(state, actor.action || "Inventory item added", actor, null, newItem);
    saveState(state);
    return clone(newItem);
  }

  const api = {
    storageKey: STORAGE_KEY,
    getState: function () {
      return clone(readState());
    },
    getRequests: function () {
      return clone(readState().requests);
    },
    getRequest: function (id) {
      const request = findRecord(readState().requests, id);
      return request ? clone(request) : null;
    },
    getVendors: function () {
      return clone(readState().vendors);
    },
    getVendor: function (id) {
      const vendor = findRecord(readState().vendors, id);
      return vendor ? clone(vendor) : null;
    },
    getInventory: function () {
      return clone(readState().inventory);
    },
    getAudit: function (requestId) {
      const audit = readState().audit;
      const filtered = requestId
        ? audit.filter(function (entry) {
            return (entry.prev && entry.prev.id === requestId) ||
              (entry.next && entry.next.id === requestId);
          })
        : audit;

      return clone(filtered).sort(function (a, b) {
        return a.dateUtc.localeCompare(b.dateUtc);
      });
    },
    createRequest: createRequest,
    updateRequest: updateRequest,
    updateVendor: updateVendor,
    updateInventoryItem: updateInventoryItem,
    addInventoryItem: addInventoryItem
  };

  window.AeroSupplyStore = Object.freeze(api);
})();