# uberarkanoid: Arkanoid + Uberpunk

Tavoite on tehdä Arkanoid-peli, joka näyttää ja tuntuu kuin ``uberpong``-tyylinen neon- ja rytmiverkko. Peli rakennetaan staattisena HTML-web-sivuna, jossa kaikki logiikka, grafiikat ja ääni latautuvat selaimeen ilman serveripuolen komponenttia. Tätä suunnitelmaa noudatetaan uuden pelirepon kehityksessä:

1. **Visuaalinen referenssi**
   - Päivitä `uberpong`-repo (`git pull`) ja analysoi `styles/main.css`, `src/game.js`, `config/*` ja äänikonfiguraatiot.
   - Tallenna paletti, fontit, glow-efektit ja UI-ritmit.

2. **Pelisuunnittelu**
   - Määrittele Arkanoidin peruselementit: maila, pallo, tiilimatriisi, elämä ja pisteet.
   - Lisää uber-ominaisuuksia: power-upit, useat pallot, laser-eps, tasorytmit, “Uber-tilat” ja laajenevat taustat.

3. **Tekninen perusta**
   - Kokeile samaa työkalupinoa kuin uberpong (npm, Vite/ESBuild) riippuvuuksineen, mutta varmista, että lopputulos on staattinen HTML-jaettavassa muodossa (Yksi index.html + sisällöt).
   - Rakenna `src`-hakemisto, joka pitää esim. `game.ts/js`, `ui`, `assets` ja `levels` sekä staattinen `index.html`, joka pakkaa kaiken purkkiin.

4. **Mekaniikat ja logiikka**
   - Toteuta pallon liike, mailan hallinta ja törmäykset (kirjataan yksikkö- tai e2e-testejä tarpeen mukaan).
   - Tee tiili- ja power-up-systeemi, johon voidaan liittää (uberöityjä) efektejä ja animaatioita.

5. **Uber-tyylittely**
   - Kopioi neon-paletit ja glow-styling `uberpong`-repoista; käytä dynaamisia gradientteja ja taustaparticleja.
   - Synkronoi animaatio ja musiikki (c.f. `config/music.json`) niin, että UI-ruutu reagoi pallon liikkeeseen.

6. **Lisäominaisuudet**
   - Rakenna moodit (esim. “Ultra”, “Beat Mode”) ja kerrospohjaiset vaikutukset.
   - Tee progress bar, high-score ja jaettavat “uber-löydöt”.

7. **Testit ja julkaisu**
   - Kirjoita testit (esim. `vitest`) pelimekaniikan avainkohtiin.
   - Dokumentoi README, pelin suunnitelma ja tulevat työjonot (tämä plan.md auttaa suuntaamaan kehitystä).

Tarvittaessa tarkennan suunnitelmaa, jos haluat painottaa jotain tiettyä osa-aluetta ennen toteutusta.

## Toteutusstatus
- Staattinen `index.html` ja `styles/main.css` on rakennettu neon-suuntautuneena layoutina, joka kopioi uberpongin paletin, hud-elementit ja canvasalueen.
- `src/game.js` sisältää pelisirun; tässä vaiheessa maila ja pallo piirretään canvasille, pallon törmäykset toimivat ja status/hud päivittyvät, joten rinnakkainen tekninen runko alkaa hahmottua.
- `src/game.js` sisältää nyt tiilimatriisin, Arkanoid-tyyppisen törmäyksen ja Uber-meterin, joten pelimekaniikan ja power-up-idean ensimmäinen versio on käytettävissä.
- Moodivalikko, high-score ja kenttäprogress ovat nyt osa HUDia ja reagoivat `src/game.js`:n moodiasetuksiin, joten visuaalinen rytmityö ja Uber-tyylittely voivat edetä seuraavaan vaiheeseen.
- Power-upit pudottavat pisteboostin, rakenne etenee levelin yli ja moodit säätävät tempoja, joten HUD kertoo kentän etenemisestä, high-scoresta ja seuraavasta levelistä.
- Musiikkivalinta tarjoaa nyt tekno- ja gabber-träkit sekä energisen soittimen (`MusicEngine`), joka pitää tempoa yllä ja päivittää HUDin status-tekstin soitetun tyylin mukaisesti.
- `src/logic.js` ja uudet `vitest`-testit varmistavat pelimekaniikan perusfunktiot (clamp, brick rows ja progress) ennen kuin julkaistaan taustamusiikkia.
- GitHub Actions -workflow (`.github/workflows/build.yml`) ajaa `npm test` ja `npm run build`, joten julkaisun sivun build-prosessi pysyy automaattisena.
