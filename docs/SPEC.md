# All State Roofing CRM — Specifikimi bazë

> Dokument autoritar. Ndryshimet e ardhshme **nuk duhet t'i prishin** këto rregulla:
> ndarjen e roleve, scheduling me datë + time window/custom time, Clients me
> informacionin kryesor direkt në listë, photos, Google Maps, jobs, expenses,
> payments, balances, commissions dhe profit/reports.
>
> Vendosur nga Amarildo, 31 gusht 2026.

## 1. Workflow-i i kompanisë

```
CLIENT → PHONE CALL/LEAD → INSPECTION → ESTIMATE → APPROVED → SCHEDULED
      → IN PROGRESS → DONE → INVOICE → PAYMENT → EXPENSES → PROFIT → REPORTS
```

Çdo informacion lidhet me klientin dhe me job-in përkatës, që në fund të dimë:
sa klientë, sa punë aktive, sa është shitur, sa është paguar, sa kemi për të
marrë, sa kemi shpenzuar, sa komision i takon salesman-it, sa është fitimi real,
sa punë ka bërë secili salesman, sa punë ka secili worker, dhe çfarë punësh janë
planifikuar për çdo ditë.

## 2. Rolet

`admin` · `secretary` · `manager` · `salesman` · `worker`

Secili sheh vetëm atë që i duhet për punën e vet.

### Admin
Kontroll i plotë. I vetmi me akses të plotë financiar dhe administrativ.
Sheh: Dashboard, Clients, Sales Pipeline, Estimates, Jobs, Schedule, Workers,
Expenses, Invoices, Payments, Reports, Salesmen, Users, Settings.

### Secretary
Telefonatat, klientët, dokumentet, scheduling.

**Mund:** krijon/redakton/kërkon/filtron klientë · ngarkon foto · shton notes dhe
reason for call · krijon dhe redakton estimate · krijon dhe redakton invoice ·
bën schedule dhe ndryshon datë/orë · sheh info klienti dhe info job-i që i duhet
për scheduling.

**Nuk mund:** të caktojë salesman · të menaxhojë ose ndryshojë workers · të shohë
profit · të shohë komisionin e salesman-it · të menaxhojë users ose roles · të
prekë settings financiare.

### Manager
Punët dhe ekipet.

**Mund:** sheh jobs, client info, estimate, schedule · cakton dhe ndryshon
workers · kontrollon dhe ndryshon statusin e job-it · sheh notes dhe photos ·
menaxhon punët aktive dhe të përfunduara · organizon ekipet.

**Nuk mund:** të menaxhojë users · të ndryshojë settings · të shohë
finances/profit · të shohë commissions · **të shohë salesman performance**.

### Salesman
Vetëm klientët dhe punët e caktuara atij.

**Mund:** sheh klientët e vet me kontakte, adresa, notes, photos · sheh estimates ·
ndjek informacionin e shitjes sipas workflow-it · sheh jobs e veta dhe statusin ·
shton notes · bën status update ku lejohet.

**Nuk mund:** të shohë klientët e salesman-ëve të tjerë · komisionin e të tjerëve ·
expenses të kompanisë · profit total · reports financiare · users/settings.

### Worker
Pamja më e thjeshtë. Vetëm jobs ku është caktuar.

**Sheh:** client name, address, phone, date, time, job type, notes, photos, status.
**Mund:** sheh job-in, photos, notes · bën status update kur lejohet · shënon progresin.
**Nuk sheh:** profit, expenses, commission, financial reports, klientë të pacaktuar.

## 3. Clients

Pamja kryesore **nuk** duhet të kërkojë hapjen e klientit për informacionin bazë.
Shfaqet direkt:

```
DATE     TIME     CLIENT       ADDRESS       PHONE      NOTE     REASON
Aug 31   9–11     John Smith   123 Main St   555-1234   Leak     Roof Repair
Aug 31   12:30    Mike Brown   45 Oak Ave    555-5678   Estimate Roof Replacement
Sep 1    11–1     David Lee    88 Main St    555-9999   Attic    Inspection
```

Sipër: 🔎 Search · 📅 Date · 🕐 Time · 👤 Salesman · 📌 Status

**Kjo është kërkesa prioritare** — që office/dispatch të mos hapë 20 klientë një
nga një për të kuptuar ku duhet të shkojë tekniku sot.

**Search:** name, address, phone, email.
**Filters:** date, appointment date, time, salesman, status, job type.

Zgjedhja e një date (p.sh. *September 1*) shfaq vetëm klientët që tekniku duhet
t'i vizitojë atë ditë.

### Client detail
- **Basic:** full name, address, phone, email
- **Sales:** salesman, reason for call, notes, job type, sale price
- **Scheduling:** appointment date, appointment time, time window/custom time, assigned workers
- **Documents:** estimates, invoices, photos, reports

## 4. Scheduling

**Appointment Date** — p.sh. September 1, 2026

**Appointment Time** — time windows standarde:
`9:00–11:00` · `11:00–13:00` · `13:00–15:00` · `15:00–17:00`

Plus **Custom Time** (p.sh. 12:30 PM). Nuk jemi të kufizuar në 2-orëshe.

## 5. Address / Google Maps

Adresa trajtohet si adresë reale. Klikimi hap Google Maps me atë adresë.

## 6. Photos

Lidhen me client ose job. Kategoritë tipike: roof front, roof back, attic,
damage, chimney, existing condition, completed work. Te job detail: **BEFORE ·
DURING · AFTER**.

Upload · view · delete (me permission). Storage: Supabase Storage, bucket `job-photos`.

## 7. Reason for Call

Fushë e veçantë, e dallueshme — jo e fshehur brenda një note.
Vlerat: Roof Leak · Roof Repair · Roof Replacement · Chimney Repair ·
Inspection · Insurance · Estimate · Other.

## 8. Note

Note i lirë. P.sh. *"Customer says water is coming through bedroom ceiling."* ·
*"Call 30 minutes before arrival."*

## 9. Sales Pipeline

```
NEW → INSPECTION → ESTIMATE_SENT → APPROVED → SCHEDULED → IN_PROGRESS → DONE
```

Duhet të dimë menjëherë ku ndodhet çdo klient/job.

## 10. Salesmen

Fushat: name, email, phone, commission %, active/inactive.
Commission default **15%**, por admini e ndryshon për secilin.

**Komisioni llogaritet nga `salesmen.commission_percent`, jo nga numër i
shkruar në kod.**

Shembull: Job $10,000 me shpenzime $4,000 → fitimi $6,000 → komisioni 15% = **$900**
(shih V5 — mbi fitimin, jo mbi shitjen).

## 11. Estimates

Client · job · description · items · price · total · deposit · notes · date · status.
Deposit default **40%**.

Shembull: Total $10,000 → Deposit $4,000 → Balance $6,000.
Duhet të gjenerohet dokument profesional.

## 12. Jobs

Zemra operative e sistemit. Çdo job ka:

- **Client:** name, phone, address, email
- **Sales:** salesman, estimate, total price
- **Status:** New · Inspection · Estimate Sent · Approved · Scheduled · In Progress · Done
- **Scheduling:** date, time, time window, workers
- **Notes:** general, job notes, special instructions
- **Workers:** assigned workers (një job mund të ketë disa)
- **Expenses:** materials, labor, other
- **Photos:** before, during, after
- **Financial:** total price, payments, expenses, commission, profit, balance

## 13. Workers

Name · phone · email · role/type · active/inactive.
Manager/Admin i cakton në job. Një job mund të ketë disa workers.

## 14. Job Expenses

Lidhen me job-in. P.sh. Materials $2,500 · Dumpster $450 · Labor $1,200 ·
Other $300 → **$4,450**.

## 15. Invoices

Lidhet me client, job dhe estimate. Fushat: invoice number, date, client,
address, description, total, amount paid, balance, status. Gjenerohet si PDF.

## 16. Payments

Regjistrohen veçmas.

```
Job total:   $10,000
Payment 1:    $4,000
Payment 2:    $3,000
Paid:         $7,000
Balance:      $3,000
```

Statuset e pagesës duhet të dallohen.

## 17. Balance

```
BALANCE = TOTAL REVENUE − PAID
```
Në nivel job: `Job Total − Payments`. Kurrë numër i shkruar manualisht.

## 18. Profit

```
Job Total − Expenses − Salesman Commission = Net Profit
```

Shembull: Sale $10,000 − Expenses $4,000 − Commission $1,500 = **$4,500**

> ⚠️ **Mbivendosur nga V5.** Komisioni llogaritet mbi *fitimin*, jo mbi shitjen.
> Për këtë shembull: fitimi $6,000, komisioni 15% = $900, Net Profit = $5,100.

Të mbrojtura nga rolet: vetëm admini i sheh.

## 19. Dashboard

**Cards:** Revenue · Paid · Balance · Expenses · Net Profit

**Job statistics:** New · Inspections · Estimates sent · Approved · Scheduled ·
In Progress · Done

## 20. Reports

Sipas: **date** (today, this week, this month, custom range) · **salesman** ·
**job status** · **financial**.

**Salesman report** (vetëm admin, jo manager): numri i klientëve, estimates,
approved jobs, completed jobs, total sales, commission.

**Job report:** total jobs, completed, scheduled, cancelled, revenue, expenses, profit.

**Financial report:**
```
TOTAL SALES → TOTAL PAYMENTS → OUTSTANDING BALANCE
→ TOTAL EXPENSES → SALESMAN COMMISSIONS → NET PROFIT
```

## 21. Excel Export

- **Clients:** name, address, phone, email, salesman, appointment date, appointment time, status, reason, notes
- **Jobs:** client, salesman, date, workers, status, total, paid, balance, expenses, commission, profit
- **Financial:** revenue, payments, expenses, commission, profit, balance

## 22. Schedule

Pjesë e veçantë e CRM-së, praktike për dispatch:

```
August 31
9–11    John Smith
11–1    Mike Brown
1–3     David Jones
3–5     Robert Lee
```

## 23. Mobile

Duhet të funksionojë mirë në telefon, sidomos: Clients · Schedule · Jobs ·
Client details · Photos · Address · Phone. Call, Map, Photos dhe job details
duhet të jenë të lehta pa hapur shumë menu.

## 24. Menu / Sidebar

Branding: **All State Roofing** (jo më RoofFlowCRM).

Dashboard · Clients · Estimates · Sales Pipeline · Jobs · Schedule · Workers ·
Expenses · Invoices · Payments · Reports · Salesmen · Users · Settings

**Menuja filtrohet sipas rolit.** P.sh. Worker nuk sheh: Reports, Expenses,
Payments, Salesmen, Users, Settings.

## 25. Branding / Design

Dark sidebar · white main background · gold accent · All State Roofing branding ·
clean professional CRM · large readable text · cards/boxes për informacion ·
mobile responsive.

Te client detail informacioni **nuk** duhet të duket si tekst i zbehtë i
shpërndarë — duhet në kuti të qarta:

```
┌──────────────────────────────┐
│ ADDRESS                      │
│ 123 Main Street              │
│ 📍 Open in Google Maps       │
└──────────────────────────────┘
```

## 26. Database

`clients` · `salesmen` · `workers` · `estimates` · `jobs` · `job_workers` ·
`job_expenses` · `job_photos` · `invoices` · `payments` · `profiles`

## 27. Security / RLS

Permissions **nuk mjafton** të jenë në UI. Nuk mjafton *"e fsheha butonin
Reports"* — përdoruesi nuk duhet të marrë dot të dhënat direkt nga databaza nëse
roli nuk e lejon.

Veçanërisht për: profit, expenses, payments, commission, reports, users.

## 28. Users

Add · Edit · Change Role · Disable · Enable · Filter by Role · Filter Active/Disabled.

**Çaktivizimi nuk fshin historinë.** Nëse një salesman largohet, statusi bëhet
`Disabled` por klientët dhe jobs e tij vazhdojnë të ekzistojnë.

## 29. Shembull i plotë

```
Klienti:      John Smith, 123 Main Street, 555-1234
Reason:       Roof Leak
Note:         Water coming through bedroom ceiling
Appointment:  September 1 — 9–11 AM
Salesman:     Glen
Estimate:     $12,000  → aprovuar
Job:          Scheduled
Workers:      John, Mike, David
Expenses:     Materials $4,000 + Dumpster $500 + Other $300 = $4,800
Payment:      $6,000        Balance: $6,000
Fitimi bruto: $12,000 − $4,800 = $7,200
Commission:   15% e $7,200 → $1,080
Net profit:   $7,200 − $1,080 = $6,120
```

Dashboard duhet ta pasqyrojë automatikisht.

## 30. Struktura finale

```
                    ALL STATE ROOFING CRM
        ┌────────────────────┼────────────────────┐
     SALES              OPERATIONS            FINANCE
     Clients            Jobs                  Invoices
     Salesmen           Schedule              Payments
     Pipeline           Workers               Expenses
     Estimates          Photos                Balance / Profit
                                              Reports

                     USERS / ROLES
       ADMIN · SECRETARY · MANAGER · SALESMAN · WORKER
```

---

# Vendimet e marra

Sqarime nga Amarildo, 31 gusht 2026, mbi pika që specifikimi nuk i mbulonte.

## V1 — Një klient mund të ketë disa takime njëkohësisht

John Smith mund të ketë një takim të hapur për çatinë dhe një tjetër për
oxhakun, të dyja aktive në të njëjtën kohë.

**Pasoja:** takimi nuk mund të rrijë te klienti si fushë e vetme. Data, ora,
arsyeja dhe shënimi i përkasin **vizitës**, jo klientit.

## V2 — Historiku ruhet i plotë, i fundit është në fokus

Kur hapet kartela e klientit, arsyeja dhe shënimi më i fundit shfaqen lart e
qartë; telefonatat e vjetra rrinë poshtë si histori e plotë, jo të fshira.

## V3 — Shitësi caktohet kur caktohet takimi

Klienti nuk ka një shitës të përhershëm. Shitësi i takon **vizitës** — caktohet
ditën që caktohet takimi. I njëjti klient mund të ketë vizita me shitës të
ndryshëm.

## V4 — Manager-i sheh çmimin dhe shpenzimet

| Sheh | Nuk sheh |
|---|---|
| Çmimin e punës | Komisionin e shitësit |
| Shpenzimet (materiale, krahë pune) | Fitimin |
| Klientin, adresën, statusin, ekipin, notes, photos | Pagesat e klientit |

Arsyeja: ai i miraton materialet, ndaj i duhen shpenzimet; performanca e
shitësve dhe fitimi mbeten te admini.

## V5 — Komisioni llogaritet mbi fitimin

**Një mënyrë e vetme, për të gjitha llogaritë:**

```
fitimi bruto = total_price − shpenzimet
komisioni    = fitimi bruto × commission_percent / 100     (default 15%)
Net Profit   = fitimi bruto − komisioni
```

Mënyra alternative "10% e totalit" u hoq — nuk përdoret më askund.

Përqindja ruhet te `salesmen.commission_percent` dhe ndryshon nga admini për
secilin shitës (§10). Nuk shkruhet kurrë si numër fiks në kod.

### Shembull i saktë

Ky zëvendëson shembullin e §29, i cili e llogariste komisionin mbi shitjen:

```
Shitja:         $12,000
Shpenzimet:      $4,800
─────────────────────────
Fitimi bruto:    $7,200
Komisioni 15%:   $1,080     ← 15% e $7,200, jo e $12,000
─────────────────────────
Net Profit:      $6,120
```

## V6 — Fitimi bruto ruhet, neto llogaritet në lexim

`jobs.profit` mban **bruton**: `çmim − shpenzime`.
**Net Profit** dhe komisioni llogariten në momentin e leximit.

Arsyeja: nëse `commission_percent` ndryshon më vonë, një vlerë e ruajtur do të
ngecte e gabuar — i njëjti problem si fitimi i ngecur që u rregullua më parë.
Kolona `profit` mbahet e freskët nga trigger-at ekzistues.

## Modeli që rrjedh nga V1–V3

Çdo telefonatë që çon në një vizitë krijon një **job** që nis te statusi `new`
ose `inspection` dhe mban:

- datën dhe orën e takimit (time window ose orë e lirë)
- arsyen e telefonatës dhe shënimin
- shitësin e caktuar

Prandaj lista kryesore e zyrës është **një rresht për çdo vizitë**, jo një rresht
për çdo klient. Një klient me dy takime shfaqet dy herë — pikërisht ajo që i
duhet dispatch-it. Filtrimi sipas datës tregon vizitat e asaj dite.

## V7 — Shitjet numërojnë vetëm punët e pranuara

`Total Sales` përfshin vetëm punët nga statusi **Approved** e tutje
(Approved · Scheduled · In Progress · Done).

Ofertat e dërguara e të papërgjigjura nuk hyjnë te shitjet. Ato raportohen
veçmas si **Pipeline** — sa para kemi në pritje.

**Pasoja:** `Outstanding Balance` bëhet numër real — para që presim vërtet të
marrim, jo oferta që mund të mos vijnë kurrë.

## V8 — Depozita është pagesë, jo fitim

Kur klienti paguan depozitën për të filluar puna, ajo regjistrohet si **pagesë e
zakonshme** me llojin `deposit`. Shfaqet te faqja e Pagesave dhe ul balancën.

Nuk është fitim — është para e detyrueshme që të nisë puna. Fitimi llogaritet
gjithnjë nga formula e V6, pavarësisht sa është paguar.

## V9 — Anullimi ruhet

Shtohet statusi **`cancelled`**. Puna e anulluar mbetet në databazë, nuk
numërohet te shitjet, dhe shfaqet te raportet që të dimë sa punë humbasim.

## V10 — Ofertën e bëjnë tre role

Sekretarja, manager-i dhe shitësi — të tre mund të krijojnë dhe redaktojnë
estimate. Worker-i jo.

---

# Propozime të mia

Këto nuk i pyeta se janë të vogla. Korrigjoji nëse ndonjë s'të pëlqen.

| Çështja | Propozimi |
|---|---|
| **Ora e takimit** | Dy fusha: `time_window` (`9-11`, `11-13`, `13-15`, `15-17`) ose `custom_time` për raste si 12:30. Në listë shfaqet njëra ose tjetra. |
| **Sales Pipeline** | Faqe më vete me kolona sipas statusit, ku çdo punë është një kartë. Sheh me një sy ku ka ngecur puna. |
| **Expenses (faqe kryesore)** | Lista e të gjitha shpenzimeve të punëve bashkë, me filtër sipas punës dhe llojit. Shpenzime kompanie (qira, sigurime) **nuk** përfshihen për momentin. |
| **Settings** | Të dhënat e kompanisë (emër, adresë, telefon, logo), komisioni default 15%, depozita default 40%, dhe lista e time windows. |
| **Numri i faturës** | `INV-2026-001` — numërim me radhë brenda vitit. |
| **Excel export** | Butoni te Clients, Jobs dhe Reports. |
| **Google Maps** | Link i thjeshtë që hap Google Maps me adresën — jo hartë brenda faqes. Në telefon hap direkt aplikacionin. |

---

# Çfarë mungon sot në databazë

Verifikuar më 31 gusht 2026 kundrejt projektit real.

**Storage:** nuk ekziston asnjë bucket. Photos janë të pamundura derisa të
krijohet `job-photos` me politikat përkatëse.

| Tabela | Kolonat që mungojnë |
|---|---|
| `jobs` | `reason_for_call`, `job_type`, `appointment_date`, `time_window`, `custom_time`, `cancelled_at`, `cancel_reason` |
| `clients` | — (sipas V1–V3 nuk i duhen fusha takimi) |
| `salesmen` | `active` |
| `workers` | `active`, `email` |
| `invoices` | `invoice_number`, `client_id`, `estimate_id` |
| `job_photos` | `category` (before/during/after), `client_id` |
| `estimates` | `job_id`, `notes` |

**Statuse:** duhet shtuar `cancelled` te lista e lejuar.

---

# Radha e ndërtimit

1. **Skema** — kolonat e mësipërme, statusi `cancelled`, bucket-i i fotove
2. **Clients/Schedule si listë vizitash** — kërkesa prioritare e §3
3. **Rolet** — sidebar i filtruar, RLS sipas roleve, V4 te faqja e punës
4. **Financat** — komisioni mbi shitje (V5), Net Profit (V6), shitjet vetëm të pranuara (V7)
5. **Photos** me kategori dhe Google Maps
6. **Estimates/Invoices** me numër fature dhe PDF
7. **Reports** me filtra dhe Excel export
8. **Sales Pipeline** dhe **Settings**
