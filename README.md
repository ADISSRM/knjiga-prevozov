# Knjiga reševalnih prevozov v2 (Reševalna postaja ZD Brežice)

Interna PWA za iPhone in Android: dispečer (knjiga, pacienti in nalogi, razpored, živo stanje) + voznik/spremljevalec (sprejem in statusi prevozov).

- `NAVODILA.md` – **začni tukaj**: namestitev korak za korakom (Firebase Spark + GitHub Pages, brezplačno).
- `firestore.rules` – varnostna pravila baze (prilepiš v Firebase konzolo).
- `web/` – datoteke za GitHub Pages (`config.js` uredi po koraku 4).
- `src/`, `build.sh`, `build-prod.py` – izvorna koda in gradnja (neobvezno): `bash build.sh && python3 build-prod.py` ustvari `dist/`.

**Pred prvim pravim pacientom** potrebuješ odobritev vodstva in pooblaščenca za varstvo podatkov (glej NAVODILA.md, razdelek 0.2). Do takrat uporabljaj samo izmišljene podatke.

## Spremembe v2_11 (november 2026): predogled knjige (tudi na telefonu), zanesljiv tisk, hitrejše skeniranje, uvoz zaposlenih
- **Predogled knjige pred tiskom** (Knjiga → mesec → Natisni knjigo): vidiš **eno stran naenkrat, točno takšno, kot se bo natisnila** (A4, rob za vezavo sivo): puščici ◀ ▶, številka strani, **»Skoči na dan«**, povečava. Deluje na **računalniku in telefonu** (na telefonu so možnosti zložene, predogled pa je čez širino zaslona).
- **Tisk, ki ne temelji več na glavnem oknu:** »Natisni knjigo« natisne samostojen dokument v skritem okvirju; **»Odpri za tisk / PDF«** odpre celo knjigo v novem zavihku (širina A4, pinch-zoom), od koder v meniju brskalnika (⋮ ali »Deli«) izbereš **Natisni** ali **Shrani kot PDF**. Na telefonu je to glavna pot.
- **Skeniranje strani knjige je hitrejše in ne obvisi:** program za branje se **prenese enkrat** (ob odprtju okna, v ozadju) in velja za vse strani; prej se je za vsako fotografijo prenašalo ~7 MB znova. Zdaj so vidni **korak, odstotek in pretekli čas**, **»Prekini«**, samodejna prekinitev, če se branje ustavi (75 s brez napredka), in pomanjšana slika za branje.
- **Če branje ne uspe:** fotografija ostane na zaslonu in prevoze **vneseš ročno ob fotografiji** (12 vrstic, ime s seznama bolnikov), ali **poskusiš znova** brez ponovne izbire. V pregledu je tudi **cela fotografija strani** za primerjavo.
- **Uvoz zaposlenih** (Nastavitve → Zaposleni → »Uvozi seznam zaposlenih«): prilepi imena ali izberi besedilno datoteko; sprejme tudi zlepljena imena z začetnico priimka. Seznam imen **ni v aplikaciji ali v mapi `web/`** (GitHub Pages je javen): uvoziš ga enkrat, shrani se v tvojo bazo.
- Preizkusi: 72 (planer, razpoznava, naslovi, kilometrina, skeniranje, tisk, uvoz zaposlenih) + 163 v brskalniku (predogled, tisk, odpiranje v zavihku, telefon, seja branja, prekinitev, zastoj, ročni vnos, uvoz). **Ni preizkušeno:** pravi Tesseract na pravih fotografijah, tiskalnik in iPhone Safari (glej NAVODILA.md, razdelek 14).

## Spremembe v2_10 (november 2026): tisk cele knjige meseca in skeniranje strani papirne knjige
- **Natisni knjigo** (Knjiga → mesec): na koncu meseca natisne **celotno knjigo kot papirno**: naslovnica, kazalo, za vsak dan obrazec **OBR REŠ 08** (prevozi 1–10, 11–24, nadaljevalne strani, posadke, posebnosti), mesečni povzetek. Opravljeni prevozi so vpisani kot v papirni knjigi (ime, od, do, ura, **dejanska ura pobiranja**, **vozilo**, ✓ kdo je opravil, odpovedani prečrtani). **Strani A4 pokonci, oštevilčene, obojestransko** (dan se začne na desni strani, rob za vezavo se menja). Možnosti se zapomnijo v napravi. Stari izpis (ležeče) je ostal kot »Samo seznam«.
- **Skeniraj stran knjige**: fotografija strani (ali PDF; več strani istega dne) → branje **v napravi** → **pregled vsake vrstice s sliko izreza** → vpis v dan. Kar aplikacija ne razume, je **označeno**: **✔ zeleno** prebrano, **⚠ rumeno** preveri (z razlogom in predlogi), **✖ rdeče** popravi (ni izbrano za vpis); povzetek ✔/⚠/✖, »Skoči na naslednje nejasno«, »Samo nejasno«, »Vse je prav«. **Nepotrjeno se vpiše z oznako ⚠ preveri**, ki ostane v dnevu, v opozorilih in v natisnjeni knjigi, dokler je ne potrdiš (**Preverjeno**). Datum s slike je vedno označen za potrditev. Slika se ne shrani.
- Razpoznava: samodejno poravna nagnjeno fotografijo, odstrani črte tabele, najde glavo in stolpce (tudi pokvarjeno glavo), številke polj, naslove, pacienta iz baze (podobna imena), ure in način (leže, utila, vzorci), dializo. `config.js` → `ocr.bookPsm` (neobvezno).
- Preizkusi: 71 (planer, razpoznava, naslovi, kilometrina, skeniranje naloga in strani, tisk) + 136 v brskalniku (tudi tisk meseca v PDF in celoten tok skeniranja z lažnim bralnikom). **Ni preizkušeno:** branje **pravih fotografij papirne knjige** z živim Tesseract.js (hitra ročna pisava je težka: **pričakuj veliko označenih polj**), natis na pravem tiskalniku (poravnava, rob za vezavo) in primerjava s tvojo papirno knjigo, ki je nisem imel v rokah; samo fotografije (NAVODILA.md, razdelek 14).

## Spremembe v2_9_3 (november 2026): računi z drugačnim e-naslovom in »Preveri povezavo«
- `userDomain` v config.js je lahko **ena domena ali seznam** (do 3, npr. `'gmail.com, rp-brezice.example'`): uporabniško ime brez @ se išče kot `ime@domena` po vrsti. Celoten e-naslov se še vedno lahko vpiše. Sporočilo ob napaki našteje poskušene e-naslove.
- Na prijavi je **»Težave s prijavo? → Preveri povezavo«**: preveri config.js, program Firebase, Authentication in bazo Firestore in pove, kje se prijava ustavi.
- Preizkus: `node tests/firebase-login.js` (25 scenarijev).

## Spremembe v2_9_2 (november 2026): natančna sporočila pri prijavi, popravek za dispečerja
- **Prijava pove razlog in ukrep** namesto splošnega »Prijava ni uspela«: kot kateri e-naslov teče prijava (`ime@userDomain`), izklopljena prijava z e-pošto in geslom, API ključ omejen na drug naslov, neznana koda napake, in po uspešni prijavi **manjkajoč ali napačen profil `users/UID`** (sporočilo izpiše UID), zavrnjeno branje profila (pravila baze) ter napačna polja `role` in `active`. Prijavni zaslon pove, kako se uporabniško ime preslika v e-naslov.
- **Popravljena napaka:** dispečer je ob nastavitvah iz starejše izdaje poskusil zapisati nove privzete nastavitve (`settings.tisk`) v `cfg/main`, kar pravila dovolijo samo skrbniku (»Dostop zavrnjen«, shranjevanje obvestil in osebja v istem zapisu je lahko propadlo). Zdaj dispečer v `cfg/main` zapiše samo dovoljene dele.
- Nov preizkus: `node tests/firebase-login.js` (17 scenarijev, nadomestni Firebase SDK v `tests/mock-firebase.js`).

## Spremembe v2_9_1 (november 2026): jasen razlog za lokalni način
- Če aplikacija teče v **lokalnem načinu**, prijavni zaslon in Nastavitve → Varnost zdaj napišeta **zakaj**: prazna ali nadomestna vrednost (apiKey, authDomain, projectId, appId), napaka v zapisu `config.js`, `mode`, manjkajoč `config.js` ali **samostojna predstavitvena stran** (predogled v Claudu), ki `config.js` ne prebere. Skupna baza se vklopi samo, če so vpisane vse štiri vrednosti.
- Samostojna stran se je prej imenovala `source/index.html` (zamenljiva s pravo stranjo): zdaj je `source/predogled.html`; objavlja se samo mapa `web/`. Navodila (korak 4, 5 in odpravljanje težav) to pojasnjujejo. Preizkusi: 65 + 114 v brskalniku + 7 (`tests/config-scenarios.js`).

## Spremembe v2_9 (november 2026): skeniranje naloga in tisk podatkov posadke na papirnat nalog
- **Skeniraj nalog** (Pacienti): fotografija, PDF-sken ali prilepljeno besedilo naloga NLG/05 → aplikacija prebere pacienta, naslov, telefon, številko naloga, izvajalca, zdravnika, relacijo, razlog, veljavnost in opombe → **pregled in popravek** → shrani pacienta in nalog (že znan pacient se prepozna, isti nalog se posodobi). Branje poteka **v tvoji napravi** (izoliran okvir, Tesseract.js); slika se ne pošlje in se ne shrani. Datum rojstva in e-pošta se ne shranita. Rokopisa in polj s kodami ne bere.
- **Natisni v nalog** (nalog pacienta): na **prazen papirnat obrazec** natisne **samo podatke posadke** v tabelo PREVOZI: **datum, čas od–do, reg. št., km, štartnina, spremljevalec, ime voznika**. Pacientovih podatkov ne natisne. Pomni, katere vrstice (1–40 na list) so že natisnjene.
- **Registrske tablice** vozil (Nastavitve → Vozila); posadka in vozilo se izberejo samodejno iz razporeda dneva; če ekipe ni mogoče določiti, tablica ostane prazna (ne ugiba).
- **Nastavitve → Tisk naloga** (skrbnik): štartnina, decimalke km, izvor časa »od«, ime voznika, **poravnava** (premik, raztegnitev, pisava) s preizkusnima stranema (sprednja/hrbtna). **Prvi korak je obvezen: natisni preizkus in poravnaj.**
- Popravljeno med preizkusom: velik PDF (> 125 kB) je sprožil napako »Maximum call stack size exceeded«; okno skeniranja se po shranjevanju ni zaprlo; preizkus iskanja naslovov je bil odvisen od hitrosti omrežja.
- Preizkusi: 63 (planer, razpoznava, naslovi, kilometrina, skeniranje, tisk) + 114 v brskalniku. **Ni preizkušeno:** živ Tesseract.js (jsDelivr + slovenski model), natis na pravem tiskalniku in papirju (predpostavljen A4), rokopis (NAVODILA.md, razdelek 14). Novi razdelki: 0.2 (točka 7), 10.10, 10.11, 11.10.

## Spremembe v2_8 (november 2026): brezplačna točna kilometrina po naslovih (brez Google Zemljevidov)
- **Kilometrina OD → DO po hišnem naslovu je zdaj brezplačna:** aplikacija iz vpisanega naslova (ulica + hišna številka, »Dobova 25«) poišče točko v OpenStreetMap (Nominatim), cestno pot izračuna OSRM. Prej je za naslov brez znane točke vzela središče naselja, zato kilometrina ni bila točna. Google ostane neobvezen (ključ v Nastavitve → Izračun).
- **Natančnost je vidna:** vir »naslov + ceste OSM«, pri naslovu brez hišne številke v OSM oznaka ~ in razlog; aplikacija zavrne zadetek v drugem kraju.
- **Točka na zemljevidu:** gumb pri prevozu odpre zemljevid, dotik postavi pravo točko, »Shrani« jo zapiše kot popravek naslova za vse prevoze z istim naslovom (od včeraj naprej) na vseh napravah.
- Pravila javnega strežnika Nominatim so upoštevana (1 zahtevek/s, vrsta, shranjene točke pri pacientih, brez samodokončanja); pošlje se samo besedilo naslova. **Po posodobitvi prilepi `firestore.rules`** (dispečer sme shraniti popravek točke). Nova razdelka v NAVODILA.md: 10.3 (prenovljen) in 11.9.
- Popravljeno: ročni vnos km se ni smel prepisati z izračunom, ki je tekel med vpisom; množični preračun dneva ročnih vnosov ne prepisuje.
- Preizkusi: 55 (planer, razpoznava, naslovi, kilometrina) + 88 v brskalniku. **Z živim strežnikom Nominatim ni preizkušeno** (glej NAVODILA.md, razdelek 14).

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
