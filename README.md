# AeroSupply — MRO Supply Chain Prototype

Interactive frontend prototype for managing an aircraft maintenance supply chain, from spare-part requests to procurement, shipment, warehouse inspection, and inventory traceability.

**[Open the live demo](https://juancho1221.github.io/aerosupply-mro-prototype/login.html)**

> This is a demonstration prototype. It does not connect to a production backend or database.

## About the project

AeroSupply models the flow of aviation parts through a Maintenance, Repair, and Overhaul (MRO) operation. The prototype brings together four roles and simulates how a part request moves through purchasing, approval, shipping, inspection, and inventory.

## Demo roles

- **Line Mechanic** — creates and tracks part requisitions.
- **Procurement Buyer** — reviews vendors and quotations, creates purchase orders, and records shipment details.
- **Maintenance Manager** — reviews approval requests and checks traceability.
- **Storekeeper / Warehouse** — inspects received parts and admits conforming items to inventory or quarantines non-conforming items.

## Main workflows

- Part requests with aircraft or stock destination and urgency selection.
- Request status tracking and duplicate-request prevention.
- Vendor and quotation workflows, purchase orders, and shipment tracking.
- Manager approval for high-value or AOG requests.
- Receiving inspections, certification and shelf-life checks, and quarantine handling.
- UTC timestamps and an audit/traceability view.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser storage (`localStorage` and `sessionStorage`) for simulated data
- Font Awesome and Google Fonts

## Project structure

| File | Purpose |
| --- | --- |
| `login.html` | Demo role selector |
| `index.html`, `app.js` | Line Mechanic workflow |
| `procurement.html`, `procurement.js` | Procurement workflow |
| `manager.html`, `manager.js` | Approvals and traceability |
| `warehouse.html`, `warehouse.js` | Receiving and inventory workflow |
| `store.js` | Shared demo state and browser storage |
| `styles.css` | Shared visual styles |
| `SPEC.md` | Functional and architectural specification |

## Run locally

Open `login.html` in a modern web browser. The demo is a static frontend and does not require a backend.

## Limitations

This prototype is for portfolio and demonstration purposes. It does not provide production authentication, a shared database, or real purchasing and shipping integrations. Demo data is stored in the visitor's browser.
