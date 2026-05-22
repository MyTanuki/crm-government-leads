# Business Context

## Persona — the owner of this project

**Role**: Assistant Director of Technical Presales & Solution Architect

**Responsibilities**:
- Solution Architecture — translating client pain points into scalable
  technical solutions
- Sales Performance Analytics — generating Sales Performance Reports directly
  for the COO
- Pre-sales Leadership — overseeing the technical lifecycle of a deal from
  initial discovery to final system design

**Technical domain expertise**:
- IT Infrastructure & Security — Networking & Connectivity Circuits, Cloud
  Services, Cyber Security (Firewalls, Threat Protection)
- Visual Solutions (AV & Digital Signage) — Interactive Flat Panels,
  Small/Large Scale LED Displays
  - Brands carried: Leyard, Maxhub, Gygar
- Audio & Communication — Professional Audio, Public Address systems
  - Brands carried: iTC, Audac
- Unified Communications & Security — Smart Meeting Room Environments,
  Access Control, CCTV Surveillance
  - Brands carried: Aver, Maxhub

**Current workflow gap**: Manual Excel-based proposal and performance tracking.

**Goal of this CRM**: Replace the Excel workflow with a system that
- Accelerates solution design (automating proposal drafting)
- Enhances data analytics on sales performance
- Optimizes productivity to focus on strategic planning and client engagement

## The four subsystems originally requested

### System 1 — Government Lead Screening
- Checklist on Convert button — system must evaluate project feasibility
  before allowing conversion to deal. Required fields:
  - Org (หน่วยงานราชการ)
  - Project Name
  - Budget
  - Date
  - Contact point
  - Customer Control (degree of access to the customer)
- Questionnaire-based risk scoring — if high risk, block the conversion
- Smart Search for agency name — partial match completes the rest

### System 2 — Sellable Product / Vendor Management
- Module to view what's "ready to sell"
- For each item, check whether the vendor is on the approved Vendor List;
  if not, run a financial/other due-diligence flow
- Store supplier cost with credit terms attached
- Store quotations
- Comparative cost evaluation across multiple suppliers for the same item

### System 3 — Customer Management with Credit Terms
- Credit terms are core to the customer record — must connect to an external
  API for credit data
- Bonus: pull customer financials from กรมบัญชีกลาง (Comptroller General's
  Department) for credit analysis
- Currently the accountant does this check manually based on docs that Sales
  forwards — automate this

### System 4 — Sales Performance Tracking
- Weekly lead-generation count per salesperson
- Ranking system with rewards and follow-up
- Activity search filterable by Deal or Customer

## Control variables (set by owner, non-negotiable)

1. **Intelligence stays on the new CRM** — own the logic so it's controllable;
   sync to other systems only after the fact
2. **Connection and notifications via LINE** as the primary channel

## Clarifying questions asked and answered

These were resolved during the System 1 design conversation:

| Q | Answer |
|---|---|
| Source of agency master data | data.go.th + manual top-up via Admin review |
| Risk weight values | Accept the proposed: Budget 20, Procurement 15, TOR 15, Customer 15, Tech 10, Payment 10, Competition 8, Timeline 7 |
| Manager approval workflow | Tier-based, with Settings icon to reorder tiers and change who approves what |
| LINE OA | Use company's existing OA, not a new one |
| LLM usage | **None**. Use static baseline instead of generative AI commentary |
| Audit retention | Forever (until manual purge by Admin) |

## Implicit context worth knowing

- Thai government procurement methods present in the rubric:
  - เฉพาะเจาะจง (specific method — lowest competitive pressure)
  - คัดเลือก (selective)
  - e-bidding (open electronic bidding)
  - e-market
- Government customers typically have 60–90 day payment terms — anything
  shorter is unusual, anything longer is a credit risk
- TOR (Terms of Reference) lock-in is a real phenomenon — agencies sometimes
  write specs that effectively pre-select one vendor; the rubric scores this
- Customer Control levels reflect actual sales reality:
  - "ไม่มี" — no relationship
  - "รู้จัก" — have a contact but no engagement
  - "เข้าถึงผู้ใช้" — engaged with the end user
  - "เข้าถึงผู้ตัดสินใจ" — engaged with the decision-maker
- The company sells projects ranging from ฿1M (small AV) to ฿30M+ (mega
  display rollouts), which is why the tier approval scales accordingly
