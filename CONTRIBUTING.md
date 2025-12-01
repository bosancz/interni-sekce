# Vývoj interní sekce

- [Instalace](#instalace)
  - [Vývojové prostředí](#vývojové-prostředí)
  - [Instalace závislostí](#instalace-závislostí)
  - [Spuštění vývojového prostředí](#spuštění-vývojového-prostředí)
- [Vývoj](#vývoj)
  - [Struktura repozitáře](#struktura-repozitáře)
  - [Sdílení typů mezi frontendem a backendem](#sdílení-typů-mezi-frontendem-a-backendem)
  - [Nastavení oprávnění](#nastavení-oprávnění)
  - [Databázové migrace](#databázové-migrace)

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
│   ├── sdk/                    # Vygenerovaný API klient
│   └── styles/                 # Globální styly
└── package.json                # NPM skripty a závislosti
```

### Sdílení typů mezi frontendem a backendem

Veškeré sdílení typů probíhá pomocí OpenAPI. Backend definuje API pomocí typů a dekorátorů (`@nestjs/swagger`), následně se pomocí nástroje `openapi-generator-cli` vygenerují typy a klient pro frontend. Ten je umístěn ve složce `frontend/src/sdk`.

Pro aktualizaci vygenerovaného SDK musíš mít **spuštěný backend** a následně spusť ve `frontend/` příkaz:

```bash
npm run generate:sdk
```

### Nastavení oprávnění

Oprávnění se definují v backendu ve složkách `acl`. Tato oprávnění se následně přiřadí k metodám v kontrolerech pomocí dekorátoru `@AcLinks(NázevOprávnění)` a uvnitř metody se oprávnění ověří pomocí volání `NázevOprávnění.canOrThrow(user, document)`.

Pomocí dekorátoru `@AcLinks` se frontendu předávají informace o oprávněních, které uživatel nad konkrétnimi dokumenty má, aby se podle toho uživateli zobrazily nebo skryly určité funkce a prvky UI.

Rozdělují se dva typy oprávnění:

- **allowed** - kdo má oprávnění k dané akci (může být `true`, `false` nebo funkce)
- **applicable** - pokud je daná akce relevantní pro daný dokument (může být `true`, `false` nebo funkce)

Vzorové oprávnění:

```typescript
export const EventEditPermission = new Permission({
	linkTo: EventResponse, // připoj informaci o oprávěnní ke každému endpointu, který vrací data typu EventResponse

	allowed: {
		admin: true, // admin má povoleno pro všechny eventy
		program: true, // program má povoleno pro všechny eventy

		// vedoucí má povoleno pro eventy, kde je vedoucím
		// `doc` je typu EventResponse
		// `req` je typu Express.Request
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: ({ doc }) => !doc.deletedAt, // smazané eventy nelze upravovat
});
```

Vzorová metoda:

```typescript
@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsController {
	constructor(private events: EventsRepository) {} // vyžádej si repozitář pro práci s eventy

	@Patch(":id") // endpoint používá HTTP metodu PATCH
	@HttpCode(204) // při úspěchu vrací HTTP status 204 No Content
	@AcLinks(EventEditPermission) // připoj údaje oprávnění k tomuto endpointu
	async updateEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventUpdateBody): Promise<void> {
		// načti event z databáze
		const event = await this.events.getEvent(id, { leaders: true });
		if (!event) throw new NotFoundException();

		// ověř oprávnění
		EventEditPermission.canOrThrow(req, event);

		// proveď aktualizaci eventu
		await this.events.updateEvent(id, body);
	}

	// ...
}
```

Vzorový obsah odpovědi s oprávněními:

```json
{
	"id": 1,
	"name": "Neočekávaný dýchánek",
	// další data eventu...
	"_links": {
		"updateEvent": {
			// název metody v kontroleru
			"href": "https://next.interni.bosan.cz/api/events/10062", // URL endpointu (používáme třeba pro zjištění URL přihlášky)
			"allowed": true, // uživatel má oprávnění volat tento endpoint
			"applicable": true // tento endpoint je relevantní pro tento dokument
		}
		// ...
	}
}
```

### Databázové migrace

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
