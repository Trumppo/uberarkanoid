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
- Staattinen `index.html` ja `styles/main.css` jatkavat neon-moodia ja HUD-elementtejä, nyt lisättynä tummaan taustaan ja laskettaviin mittareihin, joten näyttö pysyy ytimekkäänä ja neonista.
- `scripts/generate_levels.py` luo deterministisesti 100 geometrisesti erilasta kenttää JSON-muodossa ja `npm run build` ajaa generatorin ennen distin pakkautumista, joten jokainen pelikerta saa säilyvän tiilimaskin.
- Fraktaalimaiset taustaverkot, pulsaattorit ja pyörivät polygonit piirtyvät `src/game.js`:n uuteen `drawBackgroundGrid`-rakenteeseen, joka reagoi beat-pulssiin ja taustapulsseen.
- `src/game.js` lukee uudet kentät `levels/levels.json`-tiedostosta, vie kentänvaihdot `checkLevelCompletion`-tarkistuksen läpi ja vaihtaa automaattisesti musiikin tasoittain, kenttä on selkeästi ennustettava ja jokainen hajoaa aina samaan järjestykseen.
- Power-up-systeemi tuottaa kirjaimilla merkityt kiekot (`score`, `slow`, `multi`, `laser`, `life`, `expand`, `shrink`, `shield`, `pulse`) ja ne animoituvat, antoivat lisäelämän, laajenevan/kutistuvan mailan, shieldin ja beat-pulssin; `activatePowerUp` hoitaa tilat ja `shield` estää elämänmenetyksen.
- Pelilogiikka reagoi päivitettyihin arvoihin: `Space` käynnistää tai pysäyttää pelin ja aloittaa alusta Game Over -tilasta, `F` vie koko ruudulle, Game Over -näyttö coveroi 80 % kentästä Uber-räjähdyksellä ja voimakkailla teksteillä.
- GitHub Actions ajaa `npm test` ja `npm run build` (joka pyörittää generatorin), sekä publishaa `dist`-hakemiston GH Pagesiin ja säilyttää artefaktit. README/plan-sisältö päivitetään vastaamaan tätä tilaa.
