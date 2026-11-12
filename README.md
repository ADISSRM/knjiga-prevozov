# Knjiga reševalnih prevozov v2 (Reševalna postaja ZD Brežice)

Interna PWA za iPhone in Android: dispečer (knjiga, pacienti in nalogi, razpored, živo stanje) + voznik/spremljevalec (sprejem in statusi prevozov).

- `NAVODILA.md` – **začni tukaj**: namestitev korak za korakom (Firebase Spark + GitHub Pages, brezplačno).
- `firestore.rules` – varnostna pravila baze (prilepiš v Firebase konzolo).
- `web/` – datoteke za GitHub Pages (`config.js` uredi po koraku 4).
- `src/`, `build.sh`, `build-prod.py` – izvorna koda in gradnja (neobvezno): `bash build.sh && python3 build-prod.py` ustvari `dist/`.

**Pred prvim pravim pacientom** potrebuješ odobritev vodstva in pooblaščenca za varstvo podatkov (glej NAVODILA.md, razdelek 0.2). Do takrat uporabljaj samo izmišljene podatke.

## Spremembe v2_7 (november 2026): preglednejši Dispečer, dializa v Krškem, deset resničnih dni
- **Zaslon Dispečer je skrajšan** (22 prevozov: okoli 2200 namesto 8600 slikovnih točk): zgoraj Objavi razpored, povzetek v eni vrstici, opozorila (združena) in tabela razporeda; pravila razporejanja, predlogi, zemljevid, podrobnosti po posadkah in zaključek prevozov so zloženi (gumb »Razširi vse«).
- **»Dializa KK« = dializni center v Krškem (Nefrodial)** je privzeti cilj dialize (koordinate približne, preveri; izbira v Nastavitve → Dializa). Popravljen tihi zamik »SB Brežice – dializa« → »SB Brežice«.
- **Dializni prevozi so v razporedu vedno prvi** (fiksni termini). Na desetih resničnih dneh (`source/tests/real-eval.js`, anonimizirano) ima razpored aplikacije po isti oceni 5 % manj km in 47 % manj minut zamude kot dispečerjev (dnevi, kjer se njegov razpored v modelu izide); ujemanje parov 74 %.
- Novi cilji in zapisi: DSO Loka, Šmarješke Toplice, Zdravilišče Laško, Terme Čatež, Stomatološka in Dermatološka klinika LJ, Orešje, Gornje Skopice; hitre opombe dodatna dializa, sprejem, ne prej, MRSA.
- Preizkusi: 47 (planer, razpoznava, primerjava z dispečerjem) + 81 v brskalniku.

## Spremembe v2_6 (november 2026): umerjanje po petih resničnih dnevih
- Razpored je primerjan z dispečerjevo razporeditvijo na petih dnevih papirne knjige (5., 6., 9., 10., 11. 11.; v paketu samo anonimizirano, `source/tests/real-days.js`): ujemanje parov prevozov 85 % (prej 79 %). Zagon: `cd source && node tests/real-eval.js`.
- Oddaljeni cilji (Ljubljana, Novo mesto): dodatne različice z razponom ur do 180 min (Nastavitve → Izračun), izbira po km in čakanju pacientov; NN ekipa ostane izven dolgih vožnj; dializa brez ure vzame uro termina (Dop/Pop).
- Novi kraji in kratice: Stara vas, Zakot, Ginekolog LJ, Poliklinika LJ, SB Trbovlje, ZD Sevnica, KT, ITP, Carlos/Spar; hitri vnos: dop/pop, »Vzemi vzorce za IMI«, opombi »javijo uro« in »prej pokliči«.
- Popravek: iz preizkusov in dokumentacije odstranjeni naslovi, ki so bili prepisani iz fotografij.

## Spremembe v2_5 (november 2026): interaktivni zemljevid in delo po papirni knjigi
- **Interaktivni zemljevid** pri »Pot« (podlaga OpenStreetMap, cestna pot, puščice smeri, oštevilčene točke z okni, povečava/povleci/dva prsta, čez cel zaslon, merilo) in **Zemljevid dneva** (vse vožnje, barva po vozilu). Podlaga je izklopljiva; brez nje ostaneta pot in točke (NAVODILA 10.7, 11.8).
- **Hitri vnos** po dispečersko (`Novak Ivan, Dobova 25, OI LJ, 8:00`), razpoznava kratic (OI LJ, SBB, IMI LJ, ZD KK …), način **Vzorci**, hitre opombe, **kopiraj z drugega dne**, **ponovi prevoz**, **natisni knjigo dneva (OBR REŠ 08)**, izbira dializnega centra (NAVODILA 10.8, 10.9).
- Razpored: privzeto čakanje 90 min, NN ekipa praviloma ne vozi daleč od postaje (privzeto 60 km, nastavljivo).
- Preizkusi: 40 (planer, razpoznava) + okoli 80 v brskalniku; primerjava starega in novega planerja na 60 naključnih dneh brez poslabšanj.

## Spremembe v2_4 (november 2026): kilometrina, čakanje na pregled, dializa, mirnejši vmesnik
- **Mirnejši vmesnik**: vsak prevoz je ena vrstica, odprt je en urejevalnik hkrati, redko rabljeno je pod »Več«, opozorila samo ob težavi.
- **Natančna kilometrina (Google Zemljevidi, neobvezno)**: razdalja OD → DO za vsak prevoz, vir pri vsakem km (Google / ročno / ceste OSM / ocena), ročni vpis, mesečno poročilo in CSV. Brez ključa deluje po cestah OSM. Glej NAVODILA.md 10.3 in 11.7; **naslovi gredo Googlu: pred uporabo DPO (0.2, točka 5)**.
- **Klinike in čakanje na pregled**: seznam klinik za UKC Ljubljana, UKC Maribor, SB Celje, SB Novo mesto idr. (+ lastne); pri prevozu »reševalec počaka na pregled« s časom pregleda, razpored vozilo drži zasedeno in upošteva vrnitev. Naslovi in časi so predlogi za preveritev.
- **Dializa**: izbirnika D1/D2/SaD4 ni več; **Nastavitve → Dializa** (dopoldanska/popoldanska dializa, dnevi, ure terminov). Posadka dializnega prevoza po dializi prevaža tudi sede paciente.
- **Boljša avtomatizacija**: časi nalaganja po načinu (sede/leže/voziček), prosti čas ekipe se zapolni, krajši razpored (na testnih dnevih 82 od 120 boljših, nobeden slabši).
- Logotipa ZD Brežice (čista ponovna izdelava, zamenjaj z uradno datoteko) in NMP sta vključena.

## Spremembe (november 2026, prejšnja izdaja)
- Mesečna knjiga: samo polje »Ostalo« (opomba / kaj je narobe), gumb »Natisni mesec«.
- Vozila: tip (osebno / reševalni kombi / transportni kombi) in namen (vsi prevozi / primarno dializa, drugo po potrebi).
- Nenujna ekipa: voznik + spremljevalec; leže pacient potrebuje 2 reševalca in vozilo z nosili; po potrebi se ekipa razdeli na 2 voznika (Dispečer → Zaposleni na delu).
- Prevozi se lahko označijo kot ODPOVEDANO (rdeče, izven razporeda).
- Hitrosti po ZPrCP: naselje 50, izven naselij 90, hitra cesta 110, avtocesta 130 km/h (Nastavitve → Izračun).
- Barve nalogov: letni (modra), mesečni (vijolična), enkratni (zelena), za čas zdravljenja (oranžna); polje prevoza je celo obarvano, ko je pacient v bazi.
- **Cestno usmerjanje (OpenStreetMap / OSRM)**: razdalje, časi in ure prihoda po dejanskih cestah (tudi Ljubljana, Novo mesto in drugi kraji izven občine) namesto zračne razdalje; ocena (označena z ~) samo, kadar cestnih podatkov ni. Strežniku gredo samo koordinate. Nastavitev: `routing` v `config.js`; neobvezna datoteka `razdalje.json`; glej NAVODILA.md 10.2 in 11.6.
- **Pametnejši samodejni razpored**: več ciljev v eni vožnji, optimalen vrstni red pobiranja, ustrezno vozilo glede na kapaciteto in vrsto prevoza, rezerva/čakanje/zamuda po pacientih, zaznava konfliktov, nerazporejeni prevozi s predlogi, pot na zemljevidu in ocena prihoda v živo. Prvotni algoritem je ohranjen in se uporablja kot osnova (izklop: Nastavitve → Izračun).
- Preizkusi: `cd source && node tests/run.js` (Node 18+, brez omrežja); `tests/browser.js` (neobvezno, potrebuje Playwright).
- Vloge zaposlenih na delu: voznik, spremljevalec, študent, dijak. NN ekipa (2 reševalca) je samodejno voznik + spremljevalec. Leže prevoz vedno potrebuje voznika + spremljevalca in vozilo z nosili; če nobena posadka nima obeh, aplikacija sama združi dva zaposlena v eno posadko.
