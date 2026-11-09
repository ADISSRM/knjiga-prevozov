# Knjiga reševalnih prevozov v2 (Reševalna postaja ZD Brežice)

Interna PWA za iPhone in Android: dispečer (knjiga, pacienti in nalogi, razpored, živo stanje) + voznik/spremljevalec (sprejem in statusi prevozov).

- `NAVODILA.md` – **začni tukaj**: namestitev korak za korakom (Firebase Spark + GitHub Pages, brezplačno).
- `firestore.rules` – varnostna pravila baze (prilepiš v Firebase konzolo).
- `web/` – datoteke za GitHub Pages (`config.js` uredi po koraku 4).
- `src/`, `build.sh`, `build-prod.py` – izvorna koda in gradnja (neobvezno): `bash build.sh && python3 build-prod.py` ustvari `dist/`.

**Pred prvim pravim pacientom** potrebuješ odobritev vodstva in pooblaščenca za varstvo podatkov (glej NAVODILA.md, razdelek 0.2). Do takrat uporabljaj samo izmišljene podatke.

## Spremembe (november 2026)
- Mesečna knjiga: samo polje »Ostalo« (opomba / kaj je narobe), gumb »Natisni mesec«.
- Vozila: tip (osebno / reševalni kombi / transportni kombi) in namen (vsi prevozi / primarno dializa, drugo po potrebi).
- Nenujna ekipa: voznik + spremljevalec; leže pacient potrebuje 2 reševalca in vozilo z nosili; po potrebi se ekipa razdeli na 2 voznika (Dispečer → Zaposleni na delu).
- Prevozi se lahko označijo kot ODPOVEDANO (rdeče, izven razporeda).
- Hitrosti po ZPrCP: naselje 50, izven naselij 90, hitra cesta 110, avtocesta 130 km/h (Nastavitve → Izračun).
- Barve nalogov: letni (modra), mesečni (vijolična), enkratni (zelena), za čas zdravljenja (oranžna); polje prevoza je celo obarvano, ko je pacient v bazi.
