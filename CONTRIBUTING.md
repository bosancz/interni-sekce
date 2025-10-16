# Vývoj interní sekce

## 1. Instalace prostředí

Devcontainer je připraven tak, aby spustil databázi, prohlížeč databáze mongo-express a otevřel vývojový NodeJS kontejner. Díky němu si nemusíš nic instalovat do počítače (záleží na způsobu použití, viz prerekvizity níže) a můžeš rovnou vyvíjet.

1. Otevři si repozitář [bosancz/interni-sekce](https://github.com/bosancz/interni-sekce)
2. V zeleném dropdownu `Code` zvol záložku Codespaces a `Create codespace on master`.
3. Zvolené codespace se ti otevře ve webovém nebo lokálním VSCode podle tvého nastavení.
4. V menu codespace na GitHubu klikni na přejmenovat a zadej tam svojí přezdívku

## 2. Instalace závislostí

V terminálu v kořenové složce repozitáře spusť:

```bash
npm run dev:init
```

> Tím se spustí skript, který:
>
> -   nainstaluje kořenové závislosti
> -   nainstaluje závislosti frontendu
> -   nainstaluje závislosti backendu
> -   spustí migrace databáze
> -   vytvoří výchozího uživatele

## 3. Spuštění vývojového prostředí

V terminálu v kořenové složce repozitáře spusť:

```bash
npm run dev
```

> Tím se spustí backend na [http://localhost:3000](http://localhost:3000) a frontend na [http://localhost:4200](http://localhost:4200). Oboje ve vývojovém režimu, kdy se při změně kódu stránka automaticky aktualizuje.
