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
4. Obrázky dej do stejné složky a odkazuj na ně relativně:
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

Při generování se nejdřív vybere barva (černá, modrá, zelená, červená, oranžová). Ta přepíše
CSS proměnnou `--accent` v šabloně, takže stačí v šabloně používat `var(--accent)`. Hodnota
`--accent` zapsaná přímo v šabloně slouží jen jako výchozí náhled v prohlížeči – při generování
ji nahradí vybraná barva.

## Společný vzhled (`common.css`)

Všechny šablony mají stejné rozvržení stránky, které drží sdílený soubor **`common.css`**
v tomto adresáři (šablona ho načte přes `<link rel="stylesheet" href="../common.css" />`):

- nahoře **název akce** a vpravo od něj **piktogram** (barevný flek se symbolem),
- pod tím **dva sloupce**: vlevo *O akci* (zůstává doma), vpravo *Přihláška* (na odstřižení,
  oddělená svislou čárkovanou linkou s nůžkami),
- **logo šán** vždy v levém dolním rohu, pod informacemi o akci.

Vlastní `<style>` v šabloně pak mění už jen vzhled – výchozí barvu, styl nadpisů sekcí, rámečků apod.
a přidává **dekorace** (vlny, stan, květina…).
Kostru stránky (třídy `page`, `header`, `pictogram`, `columns`, `col about`, `col form`, `sanlogo`)
zachovej, ať vypadají všechny přihlášky stejně – nejjednodušší je zkopírovat některou vzorovou šablonu.

## Piktogram

```html
<span class="pictogram">
	<img class="icon flek" src="../../img/flek-3.svg" alt="" />
	<img class="pictogram-symbol" src="../../img/taborak.svg" alt="táborák" />
</span>
```

Flek má třídu `icon`, takže se obarví vybranou barvou (viz níže), symbol navrch je bílý.
K dispozici jsou fleky `flek-1.svg`–`flek-4.svg` a symboly `taborak.svg`, `stan.svg`, `bota.svg`,
`kajak.svg`, `plachetnice.svg`, `zachranny-kruh.svg`, `pastelka.svg` a `kvetina.svg`, všechny ve
složce `../../img` a oříznuté na velikost kresby. Úzký symbol (pastelka) jde natočit proměnnou
`--pictogram-rotate` v `:root` šablony.

## Ikony (obarví se vybranou barvou)

Obrázek s třídou `icon` se při generování nahradí vloženým SVG obarveným vybranou barvou.
Funguje to jen pro SVG ze složky `../../img`. V prohlížeči se ukáže původní (černý) obrázek,
v PDF už obarvená verze. Obrázek **bez** třídy `icon` (logo šán, symbol piktogramu) zůstane
ve svých původních barvách.

## Dekorace

Dekorace jsou obrázky s třídou `deco`, vložené na konec `.page` – leží pod obsahem (hlavička
i sloupce jsou nad nimi) a pozici a velikost si nastavují vlastní třídou, např.:

```html
<img class="icon deco deco-tent" src="../../img/stan.svg" alt="" />
```

Dekorace musí zůstat **uvnitř stránky** (`bottom`/`right` ne záporné) a nepoužívej na ni
`transform: translate(…)` k posunu – tisk počítá s neposunutým rámečkem a co přečnívá dolů,
vyrobí prázdnou druhou stránku. Na vycentrování stačí `inset: 0; margin: auto;`.
