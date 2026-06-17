# Šablony přihlášek (registration templates)

Každá podsložka v tomto adresáři = **jedna šablona přihlášky**, která se objeví v nabídce
po kliknutí na tlačítko **Generovat**.

## Jak přidat novou šablonu

1. Vytvoř novou složku, např. `letni-tabor/`.
2. Dovnitř dej soubor **`template.html`** – obyčejné HTML, jak bys ho napsal pro web.
   Vykresluje se přesně jako v prohlížeči (Chrome), takže si ho můžeš v prohlížeči otevřít
   a uvidíš, jak bude vypadat.
3. (Nepovinně) přidej **`meta.json`** s názvem, který se ukáže v nabídce:
   ```json
   { "name": "Letní tábor" }
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
<img class="icon" src="../../img/ilustrace_san-155.svg" alt="" />
```

Funguje to jen pro SVG ze složky `../../img` (vlnky, loď, kajak, stan, oheň, bota…). V prohlížeči
se ukáže původní (černý) obrázek, v PDF už obarvená verze. Velikost nastav přes CSS na `.icon`.

Obrázek **bez** třídy `icon` (např. `<img class="sanlogo" src="../../img/sanlogo-07.svg">`) zůstane
ve svých původních barvách – tak je v šablonách umístěné logo SAN v rohu.

Vzorové šablony najdeš ve složkách vedle tohoto souboru – nejjednodušší je jednu zkopírovat
a upravit.
