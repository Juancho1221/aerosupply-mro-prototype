# AeroSupply MRO — Especificación Funcional y Arquitectónica (Mockup Frontend)

## 1. Stack y Diseño
- **Tecnología:** HTML5, CSS3 (`styles.css` compartido), Vanilla JS + `localStorage` (`store.js`). Sin backend ni BD real.
- **Idioma UI:** Inglés técnico aeronáutico. Sin menciones académicas ni códigos internos (`HU-xxx`, `RF-xxx`, `RNF-xxx`).
- **Estilo:** Sidebar oscuro (`#090e1a`), fondo claro (`#f1f5f9`), tarjetas blancas (`#ffffff`), azul primario (`#0284c7`), AOG/Red Tag (`#ef4444`), warning (`#d97706`), conforme (`#16a34a`), fuente `Inter` + `ui-monospace`, reloj `UTC` visible.

## 2. Arquitectura de Archivos por Rol
- `index.html`: Entrada para GitHub Pages; redirige al selector de roles.
- `login.html`: Selector rápido de los 4 roles.
- `mechanic.html` + `app.js`: **Role 1 — Line Mechanic (CYUL Hangar - Canada)**
- `procurement.html` + `procurement.js`: **Role 2 — Procurement Buyer (Bogotá HQ - Colombia)**
- `manager.html` + `manager.js`: **Role 3 — Maintenance Manager (CYUL Hangar - Canada)**
- `warehouse.html` + `warehouse.js`: **Role 4 — Storekeeper / Warehouse (CYUL Hangar - Canada)**
- `store.js`: Estado centralizado en `localStorage` con datos precargados y registro inmutable de auditoría (`{ action, user, role, dateUtc, prev, next }`).

## 3. Reglas de Negocio y Flujos por Rol

### Role 1: Line Mechanic (Menú: `Create Request`, `My Requisitions`)
- **Crear Requerimiento:** Campos: `Tail Number` (`C-GYBF`, `C-GUBP`, `C-FAEN` o `STOCK`), `Urgency` (`Routine` / `AOG` con alerta roja), `Reason` (`Scheduled Maintenance`, `Unscheduled Maintenance`, `Other` con detalle obligatorio) y lista dinámica de partes (`Part Number`, `Description`, `Qty > 0`, notas/links).
- **Validación Modal al Enviar:**
  - Bloqueo estricto si existe solicitud activa (`Pending`, `Quoting`, `Pending Approval`, `Approved`, `Purchased`, `In Transit`) para el mismo `P/N` y `Tail Number`.
  - Advertencia preventiva si ya existe `In Stock` mostrando `Location` (`Bay/Shelf`) y fecha `UTC`, permitiendo continuar o cancelar.
  - Estado inicial al guardar: `Pending` + registro `UTC`.
- **My Requisitions:** Búsqueda en tiempo real, filtros por estado, edición/cancelación con motivo si está `Pending`, y Drawer lateral con detalles, guía `AWB` (si `In Transit`) o ubicación (si `In Stock`).

### Role 2: Procurement Buyer (Menú: `Requisitions & Quotes`, `Purchase Orders & Dispatch`, `Approved Vendors`)
- **Approved Vendors:** Tabla filtrable (`Vendor Code`, `Name`, `Country`, `Category`, `Cert: FAA/TCCA`, `Status: Active / Approved` vs `Suspended`). Bloqueo si se intenta cotizar/comprar con proveedor `Suspended`.
- **Quotes:** Registrar múltiples cotizaciones por `Request ID` (`Vendor`, `Unit Price`, `Estimated Freight`, `Lead Time`, moneda `USD` o `CAD` con tasa `TRM`, `Availability`). Tabla comparativa ordenada por menor costo total o menor tiempo. Al elegir `Selected Quote`: si `Unit Price > $1,500 USD` o `Urgency === 'AOG'`, pasa a `Pending Approval`; de lo contrario pasa a `Quoting`.
- **Purchase Orders:** Modal exige `PO Number`, `Vendor`, fecha automática `UTC`, `Net Total Cost`, `Currency (USD/CAD + TRM)` y `Payment Method` (`Corporate Card`, `Net 30`, `Wire Transfer`). Habilitado solo en `Quoting` o `Approved` (con firma digital del gerente). Simula control de concurrencia (si ya fue emitida, bloquea con `409 Conflict`). Pasa a `Purchased`.
- **Dispatch Tracking:** Solo en `Purchased`. Registra `Carrier` (`FedEx`, `DHL`, `UPS`, `Air Cargo`) y `Tracking Number / AWB`, pasando a `In Transit` con marca `UTC`.

### Role 3: Maintenance Manager (Menú: `Pending Approvals`, `Traceability & Audit Ledger`)
- **Pending Approvals:** Lista solicitudes en `Pending Approval` (> `$1,500 USD` o `AOG`). Muestra detalle técnico, motivo del mecánico y cotización seleccionada. Botón `Approve` (registra firma digital + `UTC` -> `Approved`) y `Reject` (exige `Rejection Reason` obligatorio -> `Rejected`).
- **Traceability & Audit Ledger:** Buscador por `Request ID`, `Tail Number`, `Part Number` o `Serial Number`. Línea de tiempo cronológica `UTC` completa con responsable y cambios de estado. Si una parte instalada está cerrada, muestra candado `Closed & Locked (5-Year Regulatory Retention)`.

### Role 4: Storekeeper / Warehouse (Menú: `Incoming Shipments`, `Active Inventory`, `Quarantine (Red Tag)`)
- **Receiving & 3-Step Quality Control (para estado `In Transit`):**
  1. *Physical Inspection:* Verificar `Part Number`, `Serial Number` y estado del embalaje (`Passed` / `Failed`).
  2. *Airworthiness Certificate:* Tipo (`TCCA Form One`, `FAA Form 8130-3`, `EASA Form 1`), `Certificate Number`, `Issuing Authority` y fecha (`Passed` / `Non-Conforming`).
  3. *Shelf Life / Life Limit:* `Batch/Lot`, `Manufacturing Date`, `Expiration Date` o ciclos/horas remanentes (`Passed` / `Non-Conforming`).
- **Admit to Inventory:** Botón `"Admit to Inventory"` deshabilitado hasta que los 3 controles estén `Passed` y se asigne ubicación (`Location`, ej. `Bay 1 - Shelf A`). Pasa a `In Stock` + `UTC` y notifica al mecánico.
- **Quarantine (Red Tag):** Si algún control falla, bloquea ingreso a stock y exige `Rejection Reason` + clasificación (`Physical Damage`, `Documentation Discrepancy`, `Missing Certification`, `Expired Shelf Life`), pasando a `Quarantined (Red Tag)`, bloqueando despacho y generando `Discrepancy Report` visible para Compras.

## 4. Estados Válidos del Ciclo de Vida
`Pending` -> `Quoting` -> `Pending Approval` -> `Approved` / `Rejected` -> `Purchased` -> `In Transit` -> `Received` -> `In Stock` / `Quarantined`