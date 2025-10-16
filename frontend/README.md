# Interní sekce bosan.cz

## Instalace

[Viz CONTRIBUTING.md](../CONTRIBUTING.md)

## Vývoj

Interní sekce je psána ve frameworku [Angular](https://angular.dev/). Pokud ho neznáš, doporučuji si nejdřív prostudovat základní tutoriál na https://angular.dev/tutorials/learn-angular.

## Adresářová struktura

    .
    ├── dist                    # Výstupní kompilované soubory - to, co běží v prohlížeči
    ├── node_modules            # NPM balíčky, na kterých je aplikace závislá
    └── src                     # Zdrojové kódy
        ├── app                 # Aplikační zdrojové kódy
        │   ├── config          # Statická nastavení
        │   ├── core            # Modul obsahující součásti kořenové části aplikace
        │   ├── modules         # Moduly jednolivých částí aplikace
        │   ├── schema          # TypeScript schémata datových struktur používaných napříč aplikací
        │   ├── shared          # Modul obsahující součísti sdílené všemi moduly aplikace
        │   └── app.*.*         # Kořenová část aplikace
        ├── assets              # Další zdroje aplikace - obrázky, fonty atd.
        ├── environment         # Nastavení prosteřdí
        ├── styles              # Zdrojové kódy globálních CSS stylů
        ├── index.html          # Zaváděcí soubor HTML
        ├── main.ts             # Zaváděcí soubor programu aplikace
        └── styles.scss         # Zaváděcí soubor globálních stylů
