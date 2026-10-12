# Aura – MVP platformy pro AI tvůrce

Kurátorská předplatitelská platforma 18+, kde schválení tvůrci provozují **AI persony** – profil, feed, předplatné po úrovních, PPV, nabídky a chat s AI v charakteru persony. Všechny persony i obsah jsou jasně označené jako AI (AI Act, čl. 50).

## Co MVP umí

- **Věková brána 18+** a štítky „AI Creator / AI persona“ všude
- **Objevování** person s filtry a řazením
- **Profil persony** – cover, bio, úrovně předplatného, feed (zdarma / předplatitelé / PPV s rozmazaným náhledem), nabídky (balíček, custom, akce)
- **Chat s AI personou** – stav Odesláno → Doručeno → Přečteno, indikátor „píše…“, odpovědi rozdělené do více zpráv, zpoždění podle délky textu a denního režimu persony (v noci „spí“ a odpoví ráno), rychlejší odpovědi pro VIP, paměť faktů o fanouškovi, PPV nabídky a tipy přímo v chatu. Odpovědi doručuje plánovač i když je fanoušek jinde v aplikaci (počet nepřečtených).
- **Peněženka** – simulovaný kredit, předplatná, historie transakcí
- **Pro tvůrce** – přehled příjmů, karta persony (povaha, styl psaní, hranice, denní režim), obsah, nabídky, žádost o přijetí s prohlášeními
- **Admin** – fronta žádostí, schválit / zamítnout s důvodem / pozastavit, blokace schválení bez KYC

### Iterace 2

- **Paměť AI** – strukturovaná fakta o fanouškovi (jméno, zájmy, práce), panel „Co si o tobě pamatuje“ s mazáním
- **Proaktivní zprávy** – persona se sama ozve po odmlce (36 h, v demo zrychlení 90 s), jen když je podle svého režimu vzhůru
- **Hlasové zprávy** pro VIP (demo: syntéza řeči v prohlížeči, produkce: TTS s vlastním hlasem)
- **Hromadné zprávy** s PPV nebo balíčkem a segmenty (všichni / VIP / neaktivní / bez PPV), měření otevření a nákupů
- **Vault a balíčky** – tvůrce skládá balíčky se slevou, AI je nabízí v chatu
- **Stories na 24 h** s kroužkem neviděných, odpovědí do chatu a stories jen pro předplatitele
- **Custom požadavky** – zadání → záloha 50 % → přijetí / výroba / doručení do chatu s doplatkem, odmítnutí vrací zálohu
- **Cíle tipů a akce platformy** – progress bar na profilu i v chatu, sezónní sleva na balíčky
- **Databáze a účty** – Postgres (Neon / Vercel Postgres), registrace s potvrzením 18+, synchronizace stavu, žádosti tvůrců a admin v DB
- **Statistiky tvůrce** – příjmy podle zdroje, LTV fanoušků, konverze PPV v chatu, výkon hromadných zpráv, nejlepší čas odeslání

### Iterace 3

- **Feed „Pro tebe“** – doporučení podle předplatného, chatu, lajků, nákupů a kategorií, s vysvětlením „proč“
- **Věrnostní program** – body, úrovně Bronz → Platina se slevami, denní série, odznaky (`/rewards`)
- **PWA a notifikace** – instalace jako aplikace, offline shell, upozornění na nové zprávy; web push připravený (VAPID klíče)
- **Moderace** – nahlášení příspěvků, zpráv, profilů a událostí, automatický filtr textu (fanoušek i AI), fronta s prioritou, skrytí obsahu a pozastavení persony
- **Živé události** – skupinový chat s personou, ankety, vstupenky, připomínky (`/live`)
- **Referral** – osobní odkaz a kód, statistiky, odměny pro fanoušky i doporučení tvůrců (`/invite`)
- **Studio účty** – víc person v jednom studiu, tým s rolemi a oprávněními, výplaty podle persony
- **Jazykové verze** – čeština, angličtina, němčina pro fanouškovskou část; AI odpovídá v jazyce fanouška

### Web push

Pro upozornění i při zavřené aplikaci vygeneruj klíče (`npx web-push generate-vapid-keys`) a nastav ve Vercelu `NEXT_PUBLIC_VAPID_PUBLIC_KEY` a `VAPID_PRIVATE_KEY`.

Bez `DATABASE_URL` běží vše v demo režimu v prohlížeči (localStorage), platby jsou simulované.

## Databáze a přihlášení

1. Ve Vercelu: projekt → Storage → Create Database → Neon (Postgres) → připojit k projektu. Tím se nastaví `DATABASE_URL`.
2. Přidej `ADMIN_EMAILS=tvuj@email.cz` (více adres oddělených čárkou).
3. Redeploy. Tabulky se založí samy při prvním požadavku.

## AI chat

Bez klíče chat odpovídá skriptovaně. Pro skutečné LLM odpovědi nastav ve Vercelu proměnné:

```
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-5-5   # volitelné
```

Systémový prompt drží personu v charakteru, zakazuje tvrdit, že je skutečný člověk, domlouvat setkání a explicitní obsah, a při krizi odkazuje na pomoc.

## Vývoj

```
npm install
npm run dev
```

## Další kroky k produkci

Postgres + auth, úložiště médií s moderací, platební brána pro 18+ (CCBill / Segpay), ověření věku (Yoti / Veriff), KYC tvůrců, fronta pro zpožděné odpovědi, ověření podmínek hostingu pro explicitní obsah. Podrobnosti v PRD.
