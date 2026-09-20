---
page:
  description: Ett visuellt förslag för att hitta och öppna sidans bilder och inställningar i VS Code.
---

# Sidans filer i VS Code

**BL-133 VS Code Page Files · Förslag 1 · 20 september 2026**

**Senare beslut:** en egen Norna-ingång och ett träd som följer filsystemet.
Sidans filer och verkliga `pages/` visas under sidan; konfiguration kommer före
`pages/`. Startsidan är nu sajtens rot. Bilderna nedan visar det första
förslaget, före dessa beslut, och ska ritas om innan slutligt godkännande.

Målet är att du ska hitta en sida, se vilka filer som hör till den och öppna
dem direkt. Sidornas namn hjälper dig att orientera dig även när katalogerna
har nummer och tekniska namn.

> [!NOTE]
> Bilderna är skisser av föreslaget beteende. De visar ett diskussionsunderlag;
> den nya vyn är ännu inte implementerad. Engelska etiketter i skisserna är
> arbetsförslag för VS Code-gränssnittet.

## Förslaget i en bild {#oversikt}

Vi har valt **en egen Norna-ingång**. Det första förslaget för filerna var en utfällbar
grupp **Page files** under sidan och en separat grupp **Site settings** för
gemensamma inställningar.

```image-stack
items:
  - image: overview.svg
    alt: Hela VS Code-fönstret med en föreslagen Norna-ikon, sidträdet till vänster och en bild öppen i editorn till höger.
    caption: Förslag A. Markeringarna 1–3 förklaras nedan. Ikonen N är en platshållare i skissen.
```

1. **Norna-ingången** finns i ikonraden längst till vänster. VS Code kallar
   ikonraden *Activity Bar*. Ett klick tar fram Norna-vyn.
2. **Page files** betyder *sidans filer*. Gruppen hör till sidan ovanför och
   kan fällas ut när du behöver en bild eller ett lokalt tema.
3. **Site settings** innehåller inställningar för hela webbplatsen. Där finns
   bland annat webbplatsens `theme.yaml`.

Klick på en sidtitel öppnar fortfarande sidans `content.md`. Den lilla pilen
fäller ut eller ihop innehållet i trädet. Ett klick på en bildfil öppnar bilden
i VS Codes bildvisning.

## Från sida till bild {#forlopp}

Bläddra genom de tre bilderna. Samma sida och samma delar av VS Code ligger
kvar, så att du kan följa vad varje klick förändrar.

```image-carousel
items:
  - image: open-page.svg
    alt: Steg 1. What Norna Does är markerad i sidträdet och sidans Markdown är öppen i editorn.
    caption: 1. Klicka på What Norna Does. Sidans text öppnas till höger. Page files är fortfarande stängd.
  - image: show-files.svg
    alt: Steg 2. Page files och Images är utfällda under What Norna Does och visar tre befintliga bilder.
    caption: 2. Fäll ut Page files och därefter Images. Du ser sidans bilder medan texten ligger kvar i editorn.
  - image: open-image.svg
    alt: Steg 3. navigation-single-desktop.png är vald under sidan och visas i VS Codes bildvisning.
    caption: 3. Klicka på navigation-single-desktop.png. Bilden öppnas. Sidans innehåll har inte ändrats.
```

Sidan och de tre bildfilerna finns redan i Norna-dokumentationen. Bilden som
visas i editorn kommer från sidans befintliga material. Förslaget ändrar hur du
kommer åt filerna.

**Resultat:** du har hittat och öppnat rätt bild genom sidans namn. Att lägga
till en ny bildfil eller infoga bilden i texten kommer i senare steg.

## Var ska Norna-vyn ligga? {#placering}

**Beslut 20 september 2026:** Norna får en egen ingång i ikonraden, eftersom
det gör funktionen lättare att upptäcka. Bilderna visar det valda alternativet
och jämförelsen med *Explorer*, VS Codes vanliga filutforskare.

:::: tabs

::: tab "A · Egen Norna-ingång"

```image-stack
items:
  - image: overview.svg
    alt: Alternativ A. Norna har en egen ikon i ikonraden och sidträdet använder sidopanelens höjd.
    caption: En egen ingång samlar det dagliga sidarbetet. Den vanliga filutforskaren finns kvar via sin ikon.
```

**Valt alternativ.** Du får en tydlig plats för sidarbetet via Norna-ikonen.

:::

::: tab "B · Inne i Explorer"

```image-stack
items:
  - image: explorer.svg
    alt: Alternativ B. Det vanliga filträdet och Norna Site Tree delar samma sidopanel under Explorer.
    caption: Norna-trädet ligger i Explorer, på samma sätt som dagens vy. De två träden delar utrymmet.
```

Du har projektets filer och Norna-trädet nära varandra. Det tar mer av
sidopanelens höjd när båda träden är öppna.

:::

::::

Nästa val gäller [var sidans filer ska visas](#sidans-filer).

## Var ska sidans filer visas? {#sidans-filer}

Här är Norna-ingången densamma. Det som varierar är hur en sida kopplas till
sina filer.

:::: tabs

::: tab "A · Under sidan"

```image-stack
items:
  - image: show-files.svg
    alt: En utfälld Page files-grupp ligger direkt under What Norna Does med Images och tre bildfiler.
    caption: Filerna finns inuti samma träd som sidan. Sambandet är synligt även när du tittar på en annan sida.
```

**Mitt första förslag:** en grupp som börjar stängd. Du kan ha flera sidors
filer synliga samtidigt. Det tillkommer två nivåer för gruppen och bilderna.

:::

::: tab "B · Egen ruta för vald sida"

```image-stack
items:
  - image: selected-page-pane.svg
    alt: Sidträdet ligger överst och en separat Page files-ruta visar bilderna för What Norna Does nedanför.
    caption: Trädet behåller sin sidstruktur. Rutan nedanför visar tydligt namnet på sidan vars filer den innehåller.
```

Sidträdet blir lugnare. Rutan tar en del av höjden och behöver tydligt visa
vilken sida den följer. När du öppnar en bild ska rutan fortsätta visa den
bildens ägarsida.

:::

::::

**Att diskutera:** föredrar du det direkta sambandet under sidan eller den
separata rutan som håller sidträdet mindre?

## Öppna rätt inställningar {#installningar}

Det finns två olika roller för `theme.yaml`. Filnamnet är detsamma, men
platsen avgör vilka sidor inställningarna påverkar.

:::: tabs

::: tab "Ett lokalt tema"

```image-stack
items:
  - image: local-theme.svg
    alt: En lokal theme.yaml är markerad under What Norna Does och öppnad med YAML-text i editorn.
    caption: Illustration med en extra lokal temafil. Den filen är tillagd i skissen och finns inte på denna sida i dagens dokumentation.
```

En befintlig lokal temafil visas under sin sida. Den gäller sidan och ärvs av
dess undersidor, med hänsyn till eventuella egna inställningar längre ned.
Att öppna filen använder samma YAML-editor och förslag som i dag.

:::

::: tab "Webbplatsens tema"

```image-stack
items:
  - image: site-theme.svg
    alt: Webbplatsens theme.yaml är markerad under Site settings och öppnad i editorn med en förklaring att den gäller hela sajten.
    caption: Site settings visar gemensamma inställningar. Sidans lokala filer och webbplatsens filer ligger i olika grupper.
```

Här öppnas den befintliga temafilen i webbplatsens rot. Gruppen kan även ge
åtkomst till `config.yaml` och den eventuella `sitewide-content.yaml`.

:::

::::

I detta steg öppnar vi befintliga filer. Om ett lokalt tema saknas skapar
vyn ingen tom fil. Skapa och ta bort lokala teman hör till
**BL-136 VS Code Local Theme Creation And Removal**.

## Vilka gemensamma filer behövs? {#gemensamma-filer}

Basförslaget visar sidans bilder och befintliga inställningar. Vi behöver
också ta ställning till logotyper, ikoner och nedladdningar. Sådana filer kan
ligga i webbplatsens `public/` och tillhör inte en enskild sida.

```image-stack
items:
  - image: shared-files.svg
    alt: En möjlig Shared files-grupp under Site settings visar en illustrativ logo.svg i public.
    caption: Möjlig utökning av steg 1. Shared files är en egen grupp för gemensamma filer. logo.svg är ett exempel.
```

**Mitt förslag:** håll grupperna åtskilda och börja med sidans bilder och
inställningar. Ta med öppning av gemensamma filer redan här om de behövs i ditt
vanliga arbete. Bildimport till sidans `images/` är en annan uppgift än att
hantera en logotyp i `public/`.

**Att diskutera:** behöver du komma åt logotyp, ikoner eller nedladdningar
redan i den första versionen?

## Djupa träd och tomma sidor {#kantfall}

:::: tabs

::: tab "En sida med undersidor"

```image-stack
items:
  - image: deep-tree.svg
    alt: Ett illustrativt djupare träd där föräldrasidan Guides har Page files och undersidan Installation på skilda rader.
    caption: Exempel med en föräldrasida. Page files är en filgrupp; Installation är en undersida. Strukturen är illustrativ.
```

Sidans filer måste kunna skiljas från dess undersidor. Om extra nivåer gör
trädet svårt att läsa är den separata rutan ett alternativ att prova.

:::

::: tab "En sida utan sidfiler"

```image-stack
items:
  - image: empty-page.svg
    alt: Install Norna är vald. Raden Page files – none visar att inga bilder eller lokala inställningar finns för sidan.
    caption: En tom sida får en begriplig tomstatus. Att titta på sidan skapar inga kataloger eller inställningsfiler.
```

Sidan går fortfarande att öppna och skriva i. Markeringen gäller dess extra
filer, inte att sidans text saknas.

:::

::::

## Ljust, mörkt och mindre fönster {#utseende}

:::: tabs

::: tab "Ljust"

```image-stack
items:
  - image: open-image.svg
    alt: Den föreslagna Norna-vyn och bildvisningen i en ljus VS Code-skiss.
```

:::

::: tab "Mörkt"

```image-stack
items:
  - image: dark.svg
    alt: Samma Norna-vy i mörkt utseende med läsbara sidnamn, filer och markerad bild.
```

:::

::: tab "Mindre fönster"

```image-stack
items:
  - image: compact.svg
    alt: Norna-vyn i ett 820 pixlar brett VS Code-fönster. Långa filnamn är förkortade och editorn är smalare.
    caption: Ett mindre fönster behöver fortfarande göra sidans namn och filernas tillhörighet tydliga. Långa filnamn visas med förkortning i skissen.
```

:::

::::

## Underlag för vår diskussion {#diskussion}

**Egen Norna-ingång är beslutad.** De två återstående valen är **hur sidans
filer visas** och **vilka gemensamma filer som behövs från början**. Vi kan ta
ett val i taget och ändra skisserna när något är oklart.

Mitt fortsatta förslag är sidfiler under respektive sida och befintliga
gemensamma inställningar i en separat grupp. Dessa delar återstår att
fastställa i BL:n.

Upplägget använder VS Codes etablerade områden och kontroller. VS Codes
[riktlinjer för vyer](https://code.visualstudio.com/api/ux-guidelines/views)
beskriver både egna vyer och placering i Explorer. De konkreta grupperingarna
och arbetsflödena på den här sidan är våra förslag för Norna.
