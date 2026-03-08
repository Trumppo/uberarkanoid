# uberarkanoid: Arkanoid + Uberpunk

Tavoite on tehdä Arkanoid-peli, joka näyttää ja tuntuu kuin ``uberpong``-tyylinen neon- ja rytmiverkko. Tätä suunnitelmaa noudatetaan uuden pelirepon kehityksessä:

1. **Visuaalinen referenssi**
   - Päivitä `uberpong`-repo (`git pull`) ja analysoi `styles/main.css`, `src/game.js`, `config/*` ja äänikonfiguraatiot.
   - Tallenna paletti, fontit, glow-efektit ja UI-ritmit.

2. **Pelisuunnittelu**
   - Määrittele Arkanoidin peruselementit: maila, pallo, tiilimatriisi, elämä ja pisteet.
   - Lisää uber-ominaisuuksia: power-upit, useat pallot, laser-eps, tasorytmit, “Uber-tilat” ja laajenevat taustat.

3. **Tekninen perusta**
   - Kokeile samaa työkalupinoa kuin uberpong (npm, Vite/ESBuild) riippuvuuksineen.
   - Rakenna `src`-hakemisto, joka pitää esim. `game.ts/js`, `ui`, `assets` ja `levels`.

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
