# Knjiga reševalnih prevozov v2 (Reševalna postaja ZD Brežice)

Interna PWA za iPhone in Android: dispečer (knjiga, pacienti in nalogi, razpored, živo stanje) + voznik/spremljevalec (sprejem in statusi prevozov).

- `NAVODILA.md` – **začni tukaj**: namestitev korak za korakom (Firebase Spark + GitHub Pages, brezplačno).
- `firestore.rules` – varnostna pravila baze (prilepiš v Firebase konzolo).
- `web/` – datoteke za GitHub Pages (`config.js` uredi po koraku 4).
- `src/`, `build.sh`, `build-prod.py` – izvorna koda in gradnja (neobvezno): `bash build.sh && python3 build-prod.py` ustvari `dist/`.

**Pred prvim pravim pacientom** potrebuješ odobritev vodstva in pooblaščenca za varstvo podatkov (glej NAVODILA.md, razdelek 0.2). Do takrat uporabljaj samo izmišljene podatke.
