# Rezervační systém – průvodce nastavením

## Co dostaneš

Permanentní aplikace nasazená na Railway, kde každou akci (tripartity, schůzky, zápis…)
vytvoříš jako novou "událost" během minuty. Žádné programování pokaždé znovu.

---

## FÁZE 1 – Supabase (databáze + auth)

### 1.1 Vytvoř projekt

1. Jdi na https://supabase.com → **New project**
2. Název: `rezervace`, region: **eu-central-1** (Frankfurt)
3. Nastav silné heslo (ulož si ho), počkej ~2 minuty na spuštění

### 1.2 Spusť schema

1. V Supabase jdi na **SQL Editor** → **New query**
2. Otevři soubor `supabase/schema.sql` z tohoto projektu
3. Vlož celý obsah a klikni **Run** (nebo Ctrl+Enter)
4. Měl bys vidět: `Success. No rows returned`

### 1.3 Zjisti API klíče

1. Jdi na **Project Settings** → **API**
2. Zkopíruj:
   - `Project URL` → do `.env` jako `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nikdy necommituj!

### 1.4 Nastav Auth (magic link na tvůj e-mail)

1. **Authentication** → **Providers** → Email: zapni **Enable Email Provider**
2. **Authentication** → **URL Configuration**:
   - Site URL: `https://tvoje-app.railway.app` (doplníš po deployi)
   - Redirect URLs: přidej `https://tvoje-app.railway.app/admin`

---

## FÁZE 2 – Resend (odesílání e-mailů)

### 2.1 Vytvoř účet a ověř doménu

1. Jdi na https://resend.com → zaregistruj se
2. **Domains** → **Add Domain** → zadej `zsvilekula.cz`
3. Resend ti ukáže DNS záznamy (TXT + MX) – přidej je do správy domény

### 2.2 Přidej DNS záznamy

Ve správě domény `zsvilekula.cz` (Wedos, Forpsi, nebo kde máš DNS):

```
Typ    Název                        Hodnota
TXT    resend._domainkey.zsvil…     v=DKIM1; k=rsa; p=...
MX     send.zsvilekula.cz           feedback-smtp.eu-west-1.amazonses.com
TXT    send.zsvilekula.cz           v=spf1 include:amazonses.com ~all
```

*(Přesné hodnoty ti Resend vygeneruje – jen je zkopíruj.)*

4. Klikni **Verify** – může trvat až 10–30 minut

### 2.3 Vytvoř API klíč

1. **API Keys** → **Create API Key**
2. Název: `rezervace-app`, Full access
3. Zkopíruj klíč → `RESEND_API_KEY`

---

## FÁZE 3 – GitHub repozitář

```bash
# Lokálně v terminálu:
cd rezervace-app
git init
git add .
git commit -m "init"

# Na GitHub.com: New repository → "rezervace-app" (private)
git remote add origin https://github.com/TVUJ_USERNAME/rezervace-app.git
git push -u origin main
```

**Důležité:** nikdy nepush soubor `.env`! Je v `.gitignore` (ověř).

Přidej `.gitignore`:
```
.env
.env.local
.next/
node_modules/
```

---

## FÁZE 4 – Railway (hosting)

### 4.1 Vytvoř projekt

1. Jdi na https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Vyber repozitář `rezervace-app`
3. Railway automaticky detekuje Next.js a začne buildovat

### 4.2 Nastav environment proměnné

V Railway projektu → **Variables** → přidej postupně:

| Proměnná | Hodnota |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | z Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | z Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | z Supabase |
| `RESEND_API_KEY` | z Resend |
| `RESEND_FROM` | `rezervace@zsvilekula.cz` |
| `NEXT_PUBLIC_APP_URL` | `https://TVOJE-APP.railway.app` |

### 4.3 Nastav doménu

1. Railway → **Settings** → **Domains** → vygeneruj Railway URL
2. Zkopíruj URL a vlož jako `NEXT_PUBLIC_APP_URL` do Variables
3. Volitelně: přidej vlastní doménu `rezervace.zsvilekula.cz`
   - CNAME záznam: `rezervace` → `TVOJE-APP.railway.app`

### 4.4 Dokončení Supabase Auth

Teď, když máš URL, vrať se do Supabase:
- **Authentication** → **URL Configuration**
- Aktualizuj Site URL a Redirect URL na skutečnou Railway URL

---

## FÁZE 5 – První spuštění

### 5.1 Přihlas se

1. Otevři `https://TVOJE-APP.railway.app/admin/login`
2. Zadej svůj e-mail → dorazí magic link → klikni → jsi přihlášen

### 5.2 Vytvoř první událost

1. **+ Nová událost**
2. Vyplň název (slug se vygeneruje automaticky)
3. Přidej termíny – minimálně `label`, ideálně i `začátek` a `konec` pro ICS
4. Zkontroluj pole formuláře (výchozí: Jméno + E-mail)
5. **Vytvořit událost**

### 5.3 Sdílej odkaz

Na stránce události najdeš odkaz:
```
https://TVOJE-APP.railway.app/rezervace/nazev-akce
```
Tento odkaz pošli rodičům / účastníkům.

### 5.4 Sleduj rezervace a exportuj

- V admin detailu události vidíš live přehled rezervací
- **Export CSV** → otevři v Excelu / Google Sheets
- **Export ICS** → importuj do Google Kalendáře (všechny termíny najednou)

---

## Budoucí rozšíření (připraveno v architektuře)

- Zrušení rezervace přes link v e-mailu
- Čekací listina pro obsazené termíny
- Archivace / kopírování události pro opakované akce
- Více adminů (Supabase Auth to zvládne nativně)

---

## Troubleshooting

**Build selhal na Railway**
→ Zkontroluj Variables – nejčastěji chybí `NEXT_PUBLIC_SUPABASE_URL`

**Magic link nepřišel**
→ Zkontroluj spam; ujisti se, že e-mail je v Supabase Auth > Users

**E-maily se neodesílají**
→ Zkontroluj v Resend Dashboard > Logs; ověř, že doména prošla verifikací

**Slot se neaktualizuje v reálném čase**
→ Ověř, že jsi spustil `ALTER PUBLICATION supabase_realtime ADD TABLE slots;` v SQL Editoru
