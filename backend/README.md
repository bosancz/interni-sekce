# Backend interní sekce

- [Migrace](#migrace)
- [Vytvoření administrátorského uživatele](#vytvoření-administrátorského-uživatele)
- [Spuštění vývojového serveru](#spuštění-vývojového-serveru)

## Struktura aplikace

    .
    ├── dist                    # Výstupní kompilované soubory
    ├── node_modules            # NPM balíčky, na kterých je aplikace závislá
    ├── public                  # Veřejné statické soubory
    ├── views                   # HTML šablony pro renderování
    │   ├── layouts             # Rozvržení stránek
    │   └── partials            # Částečné šablony
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
        ├── app.module.ts       # Hlavní modul aplikace
        ├── cli.module.ts       # Modul pro CLI příkazy
        ├── config.ts           # Konfigurace aplikace
        ├── main-cli.ts         # Vstupní bod pro CLI
        ├── main.ts             # Hlavní vstupní bod aplikace
        ├── openapi.ts          # OpenAPI specifikace

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

## Spuštění vývojového serveru

```bash
# spusť vývojový server
npm run dev

# nebo z kořenové složky rovnou i s frontendem
cd .. && npm run dev
```
