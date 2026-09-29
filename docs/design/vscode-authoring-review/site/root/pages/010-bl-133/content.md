---
page:
  description: Ett visuellt förslag för att hitta sidor, bilder och inställningar i ett Norna-träd som följer filsystemet.
---

# Sidans filer i VS Code

Detta är den historiska granskningen av BL-133. Filnamn och temaarv i
skisserna har senare ersatts av BL-149 och BL-150. Aktuell filmodell och
temaarv beskrivs i [Site files](https://janga.github.io/norna/reference/site/files/)
och [Theme](https://janga.github.io/norna/reference/configuration/theme/).

**BL-133 VS Code Page Files · Förslag 2 · 20 september 2026**

**Godkänd riktning.** Genomförandet är beställt i
**BL-140 VS Code Page Files Implementation**, inklusive åtkomst till befintliga
filer i `public/`. Bilderna visar den godkända utgångspunkten för implementation.

Norna får en egen ingång i VS Code. Trädet visar läsbara sidnamn, men följer
hur sidorna och deras filer faktiskt lagras. Under varje sida finns dess
bilder, befintliga inställningar och `pages/` med eventuella undersidor.

Skisserna nedan samlar våra beslut för **hela utvecklingsspåret**. De gäller
också kommande arbete med bilder, inställningar och sidstruktur, även när
funktionerna genomförs i senare BL-poster.

> [!NOTE]
> Detta är ett gränssnittsförslag. Den nya rotmodellen finns i Norna, men den
> nya VS Code-vyn är ännu inte implementerad. Bilderna är ritade skisser.
> Engelska kontrolltexter och knapparnas detaljutformning är arbetsförslag.

## Beslutad grund för hela spåret {#beslutad-grund}

- **Egen Norna-ingång** gör sidträdet lätt att hitta i VS Code.
- **Strukturen följer den faktiska filorganisationen.** Sidornas läsbara namn
  ersätter tekniska katalognamn, men inga extra nivåer som ”Page files” införs.
- **Konfigurationsfiler visas under sin ägare, före `pages/`.** Det gäller
  både rotens `config.yaml` och `theme.yaml` och konfiguration längre ned.
- **Sidans bilder och övriga filer ligger under sidan.** Verkliga kataloger
  som `images/` och `pages/` är igenkännbara. Sidans representation i trädet
  är utgångspunkten för redigering.
- **Varje `pages/` erbjuder Add page** för att skapa en sida på just den nivån.
- **Sidor använder samma grundikon**, om de inte har en egen uttrycklig
  presentation.
- **Startsidan är sajtens rot och får ha undersidor.** Texten ligger i
  `site/content.md`, bilder i `site/images/` och undersidor i `site/pages/`.
  Sidordningen i `pages/` utser ingen ny startsida.
- **Startsidan kan ha egna visuella inställningar.** Rotens `theme.yaml`
  styr det gemensamma temat och `page-theme.yaml` bara startsidan. Lokala
  `theme.yaml` längre ned gäller respektive gren och ärvs av undersidor.

Detta är beslutad riktning. Bildernas knappar och detaljutformning återstår
att granska. Nedan visas hur principerna kan fungera tillsammans.

## Förslaget i en bild {#oversikt}

```image-stack
items:
  - image: overview.svg
    alt: VS Code med en egen Norna-ingång. Startsidan Norna innehåller konfiguration, images och pages. Under pages ligger läsbara sidnamn och under What Norna Does ligger dess images med tre bildfiler.
    caption: Ett sammanhängande träd. Markeringarna 1–4 förklaras nedan. N-ikonen är en platshållare.
```

1. **Norna-ingången** finns i ikonraden längst till vänster. VS Code kallar
   den *Activity Bar*. Den vanliga filutforskaren, *Explorer*, finns kvar via
   sin egen ikon.
2. **Norna är startsidan och roten.** Klick på namnet öppnar `site/content.md`.
   Startsidan har samma sidikon som andra sidor. Dess undersidor ligger i
   `site/pages/`.
3. **Befintlig konfiguration ligger före `pages/`.** Filnamnen visas som de
   lagras. Samma ordning används under en sida längre ned.
4. **Varje `pages/` är en verklig katalog med undersidor.** Där ska det finnas
   ett **Add page**-kommando. Plustecknet visar ett förslag till hur kommandot
   kan nås på raden.

Klick på en **sidtitel** öppnar sidans text. Klick på dess **pil** fäller ut
eller ihop innehållet i trädet. En bildfil öppnas i VS Codes vanliga bildvisning.
Alla vanliga sidor använder samma sidikon; kategorier och resurskataloger har
mappikon.

## Det du ser motsvarar det som lagras {#sidans-filer}

Sidtiteln ersätter det tekniska katalognamnet. Exempelvis visas
`010-features` som **What Norna Does**. Katalogens plats i hierarkin ändras
inte, och resursernas faktiska filnamn är synliga.

| I Norna-trädet | Motsvarighet i filsystemet | När du öppnar raden |
| --- | --- | --- |
| Norna | `site/` | Startsidan i `site/content.md` öppnas. |
| Norna → theme.yaml | `site/theme.yaml` | Sajtens gemensamma tema öppnas. |
| Norna → pages/ | `site/pages/` | Katalogens sidor visas. Add page skapar en sida här. |
| pages/ → What Norna Does | `site/pages/010-features/` | Sidans `content.md` öppnas. |
| What Norna Does → images/ | `site/pages/010-features/images/` | Sidans bildfiler visas. |
| What Norna Does → images/ → navigation-single-desktop.png | Filen med samma namn i sidans `images/` | Bilden öppnas i editorn. |

`content.md` får ingen extra rad i detta förslag: **sidraden är vägen till
sidtexten**. Filens namn och plats visas när den öppnas i editorn.
Getting Started och Reference är kategorier i dokumentationen och har därför
mappikon. En kategori har ingen egen `content.md`; dess befintliga
`category.yaml` och `pages/` visas när den fälls ut.

Startsidan utses inte genom sortering. Att flytta en sida högst upp i
`pages/` ändrar sidordningen, men ersätter inte startsidan i `site/content.md`.

## Från sida till bild {#forlopp}

Bläddra genom de tre bilderna. Samma sida och samma delar av VS Code ligger
kvar, så att du kan följa vad varje klick förändrar.

```image-carousel
items:
  - image: open-page.svg
    alt: Steg 1. What Norna Does är markerad under Norna och pages. Sidans content.md är öppen till höger och sidans resurser är hopfällda.
    caption: 1. Klicka på What Norna Does. Sidans text öppnas till höger.
  - image: show-files.svg
    alt: Steg 2. What Norna Does och dess verkliga images-katalog är utfällda. Tre bildfiler visas medan sidtexten ligger kvar i editorn.
    caption: 2. Fäll ut pilen vid sidan och därefter images/. Du ser sidans bilder medan texten ligger kvar.
  - image: open-image.svg
    alt: Steg 3. navigation-single-desktop.png är vald under sidans images och visas i VS Codes bildvisning.
    caption: 3. Klicka på navigation-single-desktop.png. Bilden öppnas utan att sidtexten ändras.
```

Sidan och de tre bildfilerna finns redan i Norna-dokumentationen. Förslaget
ändrar hur du kommer åt dem. Det här steget handlar om att hitta och öppna
filer. Bildimport, borttagning och infogning av bilder i sidtexten kommer i
senare delar av utvecklingsspåret.

## Skapa en sida på rätt nivå {#skapa-sida}

Varje visad `pages/` ska erbjuda **Add page**. Kommandot återanvänder stödet
för att skapa en sida, med den valda katalogen som plats. På rotens `pages/`
skapar du en undersida till startsidan. På en annan sidas `pages/` skapar du
en undersida där.

```image-stack
items:
  - image: add-page.svg
    alt: Rotens pages-rad är markerad. Ett plus på raden har texten Add page, och en förklaring visar var den nya sidan skulle skapas.
    caption: Förslag till kontroll på pages-raden. Placeringen av kommandot är beslutad; plusknappens detaljutformning återstår att granska.
```

**Förslag för den första undersidan:** om en sida ännu saknar `pages/` visas
ingen påhittad katalog. Sidans befintliga kommando för att skapa en undersida
kan användas, och katalogen skapas först när sidan faktiskt skapas. Detta
bevarar kopplingen mellan trädet och filsystemet.

## Öppna rätt inställningar {#installningar}

Inställningarnas plats avgör vilka sidor de påverkar. Det finns tre fall:

| Fil | Påverkan |
| --- | --- |
| `site/theme.yaml` | Sajtens gemensamma visuella inställningar. |
| `site/page-theme.yaml`, om den finns | Bara startsidan. Inställningarna ärvs inte av undersidorna. |
| `theme.yaml` i en underliggande sida eller kategori | Den grenen. Inställningarna ärvs av dess undersidor, som kan ha egna tillåtna överstyrningar. |

:::: tabs

::: tab "Sajtens tema"

```image-stack
items:
  - image: site-theme.svg
    alt: theme.yaml ligger direkt under Norna, före pages, och är öppen i YAML-editorn.
    caption: Den gemensamma temafilen ligger under roten, tillsammans med övrig befintlig konfiguration.
```

Sajtens `config.yaml` och eventuella `sitewide-content.yaml` går också att
öppna här. De får ingen särskild inställningspanel; du använder de vanliga
filredigerarna och befintligt redigeringsstöd.

:::

::: tab "Bara startsidan"

```image-stack
items:
  - image: home-theme.svg
    alt: page-theme.yaml är markerad direkt under Norna. Editorn förklarar att filen påverkar startsidan utan att ärvas av undersidor.
    caption: Illustrativt exempel med page-theme.yaml. Filen visas endast om den finns i den aktuella sajten.
```

Startsidan kan alltså få egna tillåtna visuella inställningar utan att ändra
undersidorna. Filen i denna skiss är ett exempel och har inte lagts till i
dokumentationssajten.

:::

::: tab "En sida och dess undersidor"

```image-stack
items:
  - image: local-theme.svg
    alt: En lokal theme.yaml ligger under What Norna Does, före images, och är öppen i editorn.
    caption: Illustrativt exempel med en lokal temafil. Befintlig konfiguration kommer före images/ och pages/ även längre ned.
```

Sidan What Norna Does har ingen sådan fil i dagens dokumentation. Skissen
visar hur en befintlig lokal temafil skulle presenteras. Att bara öppna eller
fälla ut trädet skapar inga filer. Skapa och ta bort lokala teman hör till
**BL-136 VS Code Local Theme Creation And Removal**.

:::

::::

## Djupa träd och sidor utan extra filer {#kantfall}

:::: tabs

::: tab "En sida med undersidor"

```image-stack
items:
  - image: deep-tree.svg
    alt: Ett illustrativt träd visar Guides med theme.yaml och pages. Under pages finns Installation med egen theme.yaml och pages som i sin tur innehåller macOS.
    caption: Samma mönster upprepas på varje nivå. Guides, Installation och macOS är exempel för att visa djupet.
```

Konfiguration ligger under sin ägare. Undersidor ligger i ägarens `pages/`.
De extra katalognivåerna gör trädet djupare, men motsvarar verkliga platser.
Fäll ihop grenar du inte arbetar med. Ingen separat ruta behöver följa vilken
sida som råkar vara vald.

:::

::: tab "En sida utan extra filer"

```image-stack
items:
  - image: empty-page.svg
    alt: Install Norna är markerad under Getting Started och dess pages. Sidtexten är öppen, men inga påhittade resurskataloger finns under sidan.
    caption: Sidtexten går att öppna även när sidan saknar bilder, lokalt tema och undersidor.
```

En tom katalog som faktiskt finns kan visas som tom. En katalog som saknas
får ingen rad. En sida utan extra filer behöver därför ingen pil eller
texten ”inga filer”; sidraden räcker för att öppna `content.md`.

:::

::::

## Öppna filer i public/ {#gemensamma-filer}

**Beslut: public/ ingår i första versionen.** Där kan du öppna befintliga
logotyper, ikoner och nedladdningar. De tillhör sajten, medan en sidas
innehållsbilder finns under sidans egen `images/`.

```image-stack
items:
  - image: shared-files.svg
    alt: En möjlig public-katalog ligger direkt under Norna, som syskon till pages. En illustrativ logo.svg är vald och visas i editorn.
    caption: public/ ingår i den beslutade omfattningen och motsvarar en verklig katalog. logo.svg är en illustrativ exempelfil.
```

Filerna öppnas på samma sätt som andra befintliga filer. Import och borttagning
kommer i senare steg; öppning flyttar inga filer till en sidas `images/`.

## Ljust, mörkt och mindre fönster {#utseende}

:::: tabs

::: tab "Ljust"

```image-stack
items:
  - image: open-image.svg
    alt: Det beslutade trädupplägget och den vanliga bildvisningen i en ljus VS Code-skiss.
```

:::

::: tab "Mörkt"

```image-stack
items:
  - image: dark.svg
    alt: Samma Norna-träd i mörkt utseende med läsbara sidnamn, verkliga filer och markerad bild.
```

:::

::: tab "Mindre fönster"

```image-stack
items:
  - image: compact.svg
    alt: Norna-trädet och bildvisningen i ett 900 pixlar brett VS Code-fönster, med smalare sidopanel och editor.
    caption: Samma struktur i ett mindre fönster. Långa namn kan förkortas i trädet; den öppna filens namn visas också i editorn.
```

:::

::::

## Nästa steg {#diskussion}

Egen Norna-ingång, filer under sin ägare, konfiguration före `pages/`,
startsidan som rot och åtkomst till `public/` är beslutade. Nu byggs
**BL-140 VS Code Page Files Implementation**. Därefter granskas det fungerande
trädet i den vanliga VS Code-profilen.

Friare publicerade adresser utreds senare i **BL-139 Decoupled Page Addresses**.
Det arbetet är inget beroende för sidträdet: VS Code hämtar adresser från
Norna-motorn och visar den verkliga filstrukturen.

Upplägget använder VS Codes vanliga områden och filredigerare. Dess
[riktlinjer för vyer](https://code.visualstudio.com/api/ux-guidelines/views)
beskriver egna vyer och deras placering. Det konkreta Norna-trädet och
kontrollernas utformning här är vårt designunderlag för Norna.
