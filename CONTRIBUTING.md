# Vývoj interní sekce

- [Instalace](#instalace)
  - [Vývojové prostředí](#vývojové-prostředí)
  - [Instalace závislostí](#instalace-závislostí)
  - [Spuštění vývojového prostředí](#spuštění-vývojového-prostředí)
- [Vývoj](#vývoj)
  - [Struktura repozitáře](#struktura-repozitáře)
  - [Migrace databáze](#migrace-databáze)

## Instalace

### Vývojové prostředí

#### Devcontainer (doporučené)

Devcontainer je připraven tak, aby spustil databázi, prohlížeč databáze a otevřel vývojový NodeJS kontejner.

⚠️ Spouštění devcontaineru na Windows a na Macu vyžaduje poměrně dost paměti (doporučuji 16GB RAM).

1. Nainstaluj

   - [Docker](https://www.docker.com/get-started/)
   - [VSCode](https://code.visualstudio.com/) s [rozšířením Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. Otevři si VSCode a v [příkazovém menu](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) zvol `Remote-Containers: Clone Repository in Named Container Volume...`
3. Vyplň:
   - Repository URL: `https://github.com/bosancz/interni-sekce`
   - Select volume: `bosan`
   - Target folder: `interni-sekce`

#### Klasická instalace

1. Nainstaluj

   - [NodeJS](https://nodejs.org/) (verze 22 nebo vyšší)
   - [PostgreSQL](https://www.postgresql.org/download/) (verze 15)
   - Editor dle volby (doporučuji [VSCode](https://code.visualstudio.com/))
   - Správce databáze PostgreSQL dle volby

2. Naklonuj si repozitář

   ```bash
   git clone https://github.com/bosancz/interni-sekce
   ```

3. Vytvoř databázi a uživatele v PostgreSQL
4. Vytvoř soubor `.env` ve složce `backend` a nastav v něm připojení k databázi (můžeš vycházet z `.env.example`). Například:
   ```
   DB_HOST=postgres
   DB_USER=postgres
   DB_PASSWORD=password
   DB_DATABASE=postgres
   DB_SCHEMA=public
   ```
5. Nainstaluj závislosti (viz níže)

### Instalace závislostí

> Tím se spustí skript, který:
>
> - nainstaluje kořenové závislosti
> - nainstaluje závislosti frontendu
> - nainstaluje závislosti backendu
> - spustí migrace databáze

### Spuštění vývojového prostředí

V terminálu v kořenové složce repozitáře spusť:

```bash
npm run dev
```

> Tím se spustí backend na [http://localhost:3000](http://localhost:3000) a frontend na [http://localhost:4200](http://localhost:4200). Oboje ve vývojovém režimu, kdy se při změně kódu stránka automaticky aktualizuje.

> Pokud jsi použil devcontainer, bude ještě na [http://localhost:8081](http://localhost:8081) dostupný pgweb pro prohlížení databáze.

## Vývoj

### Struktura repozitáře

```
interni-sekce/
├── !old/                  # Starý kód interní sekce (ExpressJS + MongoDB)
├── backend/               # Kód backendu (NestJS + PostgreSQL)
├── frontend/               # Kód frontendu (Angular)
├── scripts/               # Skripty pro vývoj a nasazení
└── package.json           # Kořenové NPM skripty a závislosti
```

#### backend/

```
interni-sekce/backend/
├── src/
│   ├── access-control/    # Kontrola přístupu a oprávnění
│   ├── api/               # API endpointy
│   ├── auth/              # Autentizace a autorizace
│   ├── database/          # Konfigurace databáze a migrace
│   ├── helpers/           # Pomocné funkce
│   ├── models/            # Databázové entity a modely
│   └── mongo-import/      # Import dat z MongoDB
├── test/                  # E2E testy
├── .env                   # Konfigurace prostředí (zejména připojení k databázi)
├── .env.template          # Šablona konfigurace prostředí
└── package.json           # NPM skripty a závislosti
```

#### frontend/

```
interni-sekce/frontend/
├── src/
│   ├── app/
│   │   ├── config/             # Statická konfigurace aplikace
│   │   ├── core/               # Kořenové komponenty
│   │   ├── error-handlers/     # Zpracování chyb
│   │   ├── modules/            # Funkční moduly aplikace
│   │   ├── schema/             # Schémata a validace
│   │   ├── services/           # Služby
│   │   ├── shared/             # Sdílené komponenty a moduly
│   │   ├── app.component.ts    # Kořenová komponenta aplikace
│   │   ├── app.component.html  # HTML šablona kořenové komponenty
│   │   ├── app.component.scss  # Styly kořenové komponenty
│   │   └── app.module.ts       # Kořenový modul aplikace
│   ├── assets/                 # Statické soubory (obrázky, ikony, atd.)
│   ├── environments/           # Konfigurační soubory pro prostředí
│   ├── helpers/                # Pomocné funkce a utility
│   ├── sdk/                    # Vygenerované API klienty
│   └── styles/                 # Globální styly
└── package.json                # NPM skripty a závislosti
```

### Migrace databáze

#### Vytvoření nové migrace

Migrace databáze se tvoří pomocí TypeORM. Pro vytvoření nové migrace spusť v terminálu v složce `backend`:

```bash
npm run migrations:generate -- --name nazev-migrace
```

Tím se vytvoří nový soubor s migrací ve složce `backend/src/migrations`. Tento soubor bude obsahovat příkazy, které změní strukturu databáze tak, aby odpovídala aktuálním entitám v kódu.

⚠️ Vygenerovaný kód migrace je potřeba zkontrolovat a případně upravit, protože automatická generace nemusí vždy správně odhadnout všechny změny.

#### Spuštění migrací

Pro spuštění všech neprovedených migrací spusť v terminálu v složce `backend`:

```bash
npm run migrations:run
```

Tím se aplikují všechny migrace, které ještě nebyly provedeny, na aktuální databázi.
