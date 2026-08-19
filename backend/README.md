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

## Naplnění testovacími daty

```bash
npm run cli seed
```

Vytvoří vzorová data v hobitím duchu — uživatele `bilbo` (heslo `gandalf`), tři oddíly (22. oddíl
s trpaslíky, 13. oddíl s nepřáteli a Klub přátel), třináct členů, sedm budoucích akcí různých typů
a jedno album. Příkaz je idempotentní: opakované spuštění
existující záznamy aktualizuje (hledá je podle přezdívky / názvu / loginu), nezakládá je znovu a nemaže
nic ostatního. Datumy akcí jsou relativní ke dni spuštění, takže akce jsou vždy v budoucnu.

### Označení testovací databáze

Aby se testovací data nikdy nedostala do produkce, řídí se seed značkou uloženou **v databázi**:

```sql
-- na testovací databázi (NEXT, lokální vývoj)
ALTER DATABASE <databáze> SET app.environment = 'test';

-- na produkční databázi
ALTER DATABASE <databáze> SET app.environment = 'production';
```

Značka se nastavuje jednou při zřízení databáze a nikam se nekopíruje — `pg_dump` ji nepřenáší,
takže obnova dat z produkčního dumpu do testovací databáze o označení nepřijde. Když aplikace
omylem míří na produkční databázi, seed se nespustí.

Pravidla:

| stav databáze | vývojový build | produkční build (i NEXT) |
| --- | --- | --- |
| `app.environment = 'test'` | seeduje | seeduje |
| bez značky | seeduje | odmítne, pokud nedostane `--force` |
| `app.environment = 'production'` | odmítne vždy | odmítne vždy (ani `--force` nepomůže) |

### Automatické plnění při startu

S `SEED_ON_START=true` se testovací data doplní při každém startu aplikace (tedy i po nasazení
nové verze na NEXT), hned po migracích. Tahle cesta vyžaduje značku `test` vždy — bez ní se seed
jen přeskočí s chybovou hláškou v logu a aplikace naběhne normálně.

## Spuštění vývojového serveru

```bash
# spusť vývojový server
npm run dev

# nebo z kořenové složky rovnou i s frontendem
cd .. && npm run dev
```
