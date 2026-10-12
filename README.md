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

Data jsou v demo režimu v prohlížeči (localStorage), platby jsou simulované.

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
