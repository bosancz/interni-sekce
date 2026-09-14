# Šablony přihlášek (registration templates)

Každá podsložka v tomto adresáři = **jedna šablona přihlášky**, která se objeví v nabídce
po kliknutí na tlačítko **Generovat**.

## Jak přidat novou šablonu

1. Vytvoř novou složku, např. `podzimky/`.
2. Dovnitř dej soubor **`template.html`** – obyčejné HTML, jak bys ho napsal pro web.
   Vykresluje se přesně jako v prohlížeči (Chrome), takže si ho můžeš v prohlížeči otevřít
   a uvidíš, jak bude vypadat.
3. (Nepovinně) přidej **`meta.json`** s názvem, který se ukáže v nabídce:
   ```json
   { "name": "Podzimky" }
   ```
   Bez něj se použije název složky.
4. Obrázky/loga dej do stejné složky a odkazuj na ně relativně:
   `<img src="logo.png">` nebo `<img src="images/foto.jpg">`.

## Placeholdery (kam se doplní data akce)

Použij dvojité složené závorky. Dostupné údaje:

| Placeholder | Význam |
|---|---|
| `{{name}}` | název akce |
| `{{place}}` | místo |
| `{{departure}}` | odjezd (datum, čas, místo dohromady) |
| `{{arrival}}` | příjezd (datum, čas, místo dohromady) |
| `{{dateFrom}}` / `{{dateTill}}` | datum od / do |
| `{{{descriptionHtml}}}` | popis akce (psaný v markdownu, vloží se jako HTML – **použij trojité závorky**) |
| `{{{itemListHtml}}}` | co s sebou (psané v markdownu, vloží se jako HTML – **použij trojité závorky**) |
| `{{{noteHtml}}}` | poznámka zadaná při generování (markdown → HTML – **použij trojité závorky**) |
| `{{price}}` | cena i s „Kč" |
| `{{contactsLine}}` | vedoucí a kontakty na jednom řádku |
| `{{#each contacts}} {{name}} {{phone}} {{email}} {{/each}}` | seznam vedoucích pro vlastní formátování |
| `{{accent}}` | vybraná barva (hex), kterou se generuje |

Vše, co placeholderem nenahradíš, zůstane v HTML tak, jak to napíšeš (např. prázdné
linky k vyplnění rukou, rámeček na kartičku pojištěnce apod.).

## Barva přihlášky

Při generování se nejdřív vybere barva (černá, modrá, zelená, červená, žlutá). Ta přepíše
CSS proměnnou `--accent` v šabloně, takže stačí v šabloně používat `var(--accent)`. Hodnota
`--accent` zapsaná přímo v šabloně slouží jen jako výchozí náhled v prohlížeči – při generování
ji nahradí vybraná barva.

## Ikony (obarví se vybranou barvou)

Obrázek s třídou `icon` se při generování nahradí vloženým SVG obarveným vybranou barvou:

```html
<img class="icon" src="../../img/vlny.svg" alt="" />
```

Funguje to jen pro SVG ze složky `../../img`. Soubory jsou pojmenované podle toho, co je na nich:
`vlny.svg`, `plachetnice.svg`, `kajak.svg`, `stan.svg`, `taborak.svg`, `bota.svg`,
`zachranny-kruh.svg`, `pastelka.svg` a barevné fleky `flek-1.svg`–`flek-4.svg`. V prohlížeči
se ukáže původní (černý) obrázek, v PDF už obarvená verze. Velikost nastav přes CSS na `.icon`.

Obrázek **bez** třídy `icon` (např. `<img class="sanlogo" src="../../img/sanlogo-07.svg">`) zůstane
ve svých původních barvách – tak je v šablonách umístěné logo SAN v rohu.

## Barevné „fleky" (chunk + ikona)

Fleky (`flek-1.svg`–`flek-4.svg`) jsou plné kaňky. Daš-li jim třídu `icon`, obarví se vybranou
barvou – a navrch můžeš překrýt tematickou ikonu (obyčejný `<img>` **bez** třídy `icon`, takže
zůstane černá). Vznikne tak barevná skvrna se symbolem uvnitř:

```html
<span class="chunk">
	<img class="icon" src="../../img/flek-3.svg" alt="" />   <!-- kaňka ve vybrané barvě -->
	<img class="chunk-icon" src="../../img/taborak.svg" alt="" />  <!-- symbol navrch -->
</span>
```

Aby byl symbol čitelný i na tmavé kaňce, ve vzorových šablonách ho přebarvujeme na bílo přes CSS
`filter: brightness(0) invert(1)` na `.chunk-icon`.

Vzorové šablony najdeš ve složkách vedle tohoto souboru – nejjednodušší je jednu zkopírovat
a upravit.
