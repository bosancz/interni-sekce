# Backend

- [Migrace](#migrace)
- [Vytvoření administrátorského uživatele](#vytvoření-administrátorského-uživatele)
- [Spuštění vývojového serveru](#spuštění-vývojového-serveru)

## Struktura aplikace

    .
    ├── dist                    # Výstupní kompilované soubory
    ├── node_modules            # NPM balíčky, na kterých je aplikace závislá
    ├── test                    # End-to-end testy
    └── src                     # Zdrojové kódy
        ├── access-control      # Systém řízení přístupu
        │   ├── access-control-lib  # Knihovna pro řízení přístupu
        │   └── schema          # Schémata pro řízení přístupu
        ├── api                 # API endpointy
        │   ├── account         # Správa uživatelských účtů
        │   ├── albums          # Správa alb
        │   ├── events          # Správa akcí
        │   ├── helpers         # Pomocné nástroje pro API
        │   ├── members         # Správa členů
        │   ├── public          # Veřejné API endpointy
        │   ├── root            # Kořenové API endpointy
        │   ├── statistics      # Statistiky
        │   └── users           # Správa uživatelů
        ├── auth                # Autentifikace a autorizace
        │   ├── decorators      # Dekorátory pro autentifikaci
        │   ├── guards          # Ochranné mechanismy
        │   ├── middlewares     # Middleware pro autentifikaci
        │   ├── schema          # Schémata autentifikace
        │   ├── services        # Služby pro autentifikaci
        │   └── types           # Typy pro autentifikaci
        ├── database            # Databázová vrstva
        │   └── migrations      # Databázové migrace
        ├── helpers             # Pomocné nástroje a utility
        ├── models              # Datové modely
        │   ├── albums          # Modely alb
        │   ├── events          # Modely akcí
        │   ├── files           # Modely souborů
        │   ├── google          # Modely pro Google integraci
        │   ├── mail            # Modely pro e-mail
        │   ├── members         # Modely členů
        │   ├── statistics      # Modely statistik
        │   └── users           # Modely uživatelů
        ├── mongo-import        # Import dat z MongoDB
        │   ├── commands        # Příkazy pro import
        │   ├── data            # Importovaná data
        │   ├── models          # Modely pro import
        │   └── services        # Služby pro import
        ├── seed                # Vzorová testovací data
        │   ├── commands        # Příkaz seed
        │   ├── data            # Definice vzorových dat
        │   └── services        # Služba pro naplnění databáze
        ├── app.module.ts       # Hlavní modul aplikace
        ├── cli.module.ts       # Modul pro CLI příkazy
        ├── config.ts           # Konfigurace aplikace
        ├── main-cli.ts         # Vstupní bod pro CLI
        ├── main.ts             # Hlavní vstupní bod aplikace
        ├── openapi.ts          # Nastavení generování OpenAPI specifikace

## Migrace

Po provedení změn v entitách (soubory \*.entity.ts) spusť generování migrace

```bash
npm run migrations:generate -- --name=<název_migrace>
```

Kód migrace zkontroluj v adresáři `src/database/migrations`. Pokud je vše v pořádku, spusť migrace na databázi:

```bash
npm run migrations:run
```

💡 Na produkci se migrace spouští automaticky při startu aplikace.

## Vytvoření administrátorského uživatele

```bash
npm run cli create-admin
```

Login, e-mail a heslo bere z proměnných `ADMIN_LOGIN`, `ADMIN_EMAIL` a `ADMIN_PASSWORD`; na to,
co chybí, se zeptá interaktivně. Bez terminálu (a bez proměnných) skončí chybou, která řekne,
kterou proměnnou nastavit — takže se nikde nezasekne na čekání na vstup.

Když se na heslo jen odklepne prázdný vstup, mimo produkci se vygeneruje náhodné a jednou vypíše;
na produkci je heslo povinné. Zadávané heslo se v terminálu nijak neskrývá.

## Naplnění testovacími daty

```bash
npm run cli seed
```

Vytvoří vzorová data v hobitím duchu — tři oddíly (Trpaslíci, Nepřátelé a Klub přátel), patnáct
členů, sedm budoucích akcí různých typů a jedno album. Akce jsou vždy posazené na skutečné dny
v týdnu — víkend (so–ne), prodloužený víkend (pá–ne), nebo týden (so–so) — a dvě z nich jsou
zatím bez vedoucích. Album má pět fotek — soubory leží v `assets/seed/photos` a seed je uloží
(originál i náhledy) do `DATA_DIR`. Heslo testovacích uživatelů se bere
z proměnné `SEED_PASSWORD`; bez ní příkaz odmítne běžet, aby se nikde nezakládaly účty se
zabudovaným heslem. Všichni uživatelé jsou navázaní na aktivního člena v Klubu přátel, takže mají
roli vedoucího:

| login | člen | role |
| --- | --- | --- |
| `bilbo` | Bilbo | vedoucí + admin |
| `vedouci` | Beorn (vedoucí) | vedoucí |
| `instruktor` | Elrond (instruktor) | vedoucí |
| `program` | Gandalf (správce programu) | vedoucí + správce programu |

Přezdívka člena nese postavu i testovací roli, aby bylo v seznamu členů na první pohled vidět,
kterým účtem se pod kým přihlásit.

Roli vedoucího neukládá databáze — access-control ji přiděluje každému uživateli navázanému na
aktivního člena (viz `AccessControlModule`). Příkaz je idempotentní: opakované spuštění
existující záznamy aktualizuje (hledá je podle přezdívky / názvu / loginu), nezakládá je znovu a nemaže
nic ostatního. Datumy akcí jsou relativní ke dni spuštění, takže akce jsou vždy v budoucnu.

### Označení testovací databáze

Aby se testovací data nikdy nedostala do produkce, řídí se seed značkou uloženou **v databázi**.
Bez ní příkaz odmítne běžet a vypíše, čím ji nastavit, případně lze značku obejít pomocí `--force`:

```sql
-- na testovací databázi (NEXT, lokální vývoj)
ALTER DATABASE <databáze> SET app.environment = 'test';

-- na produkční databázi
ALTER DATABASE <databáze> SET app.environment = 'production';
```

Značka se nastavuje jednou při zřízení databáze a nikam se nekopíruje — `pg_dump` ji nepřenáší,
takže obnova dat z produkčního dumpu do testovací databáze o označení nepřijde. Když aplikace
omylem míří na produkční databázi, seed se nespustí.

Pravidla (stejná pro vývoj i produkční build, takže i lokální databázi je potřeba jednou označit):

| stav databáze | `npm run cli seed` | `SEED_ON_START` |
| --- | --- | --- |
| `app.environment = 'test'` | seeduje | seeduje |
| bez značky | odmítne, dokud nedostane `--force` | přeskočí a zaloguje chybu |
| `app.environment = 'production'` | odmítne vždy (ani `--force` nepomůže) | přeskočí a zaloguje chybu |

Na produkčním buildu (`NODE_ENV=production`, tedy i NEXT) navíc příkaz zaloguje varování, že zakládá
uživatele se známým heslem.

### Vyčištění databáze

```bash
npm run cli reset-db             # zahodí schéma a spustí migrace
npm run cli reset-db -- --seed   # a rovnou naplní testovací data
```

Zahodí celé schéma i s daty (`DROP SCHEMA ... CASCADE`) a znovu spustí všechny migrace od začátku;
s `--seed` navíc naplní testovací data — hodí se, když se v testovací databázi nahromadila stará data nebo
záznamy z dřívějších verzí seedu. Rozšíření (`postgis`, `cube`, `unaccent`), kolaci
`natural_numeric` i konfiguraci fulltextu si migrace vytvářejí samy, takže po resetu nic
nechybí. Značka `app.environment` visí na databázi, ne na schématu, takže reset přežije.

⚠️ Se schématem padnou i rozšíření, která v něm sedí, a `CREATE EXTENSION postgis` smí jen
superuser (`cube` a `unaccent` jsou trusted, `postgis` ne). Příkaz to proto kontroluje předem
a na nesuperuserovém spojení schéma vůbec nezahodí — jinak by databáze zůstala rozbitá
uprostřed migrací.

Řídí se stejnou značkou jako seed — na databázi označené jako produkční příkaz odmítne běžet
i s `--force`.

Na NEXT stačí (kontejner s aplikací):

```bash
docker exec <kontejner> npm run cli reset-db -- --seed
```

### Automatické plnění při startu

S `SEED_ON_START=true` se testovací data doplní při každém startu aplikace (tedy i po nasazení
nové verze na NEXT), hned po migracích. Tahle cesta `--force` nezná — bez značky `test` nebo bez
`SEED_PASSWORD` se seed jen přeskočí s chybovou hláškou v logu a aplikace naběhne normálně.

## Spuštění vývojového serveru

```bash
# spusť vývojový server
npm run dev

# nebo z kořenové složky rovnou i s frontendem
cd .. && npm run dev
```
