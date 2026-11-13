# Knjiga reševalnih prevozov v2 – navodila korak za korakom

Interna aplikacija Reševalne postaje ZD Brežice: **dispečerski del** (knjiga prevozov, pacienti in nalogi, razpored, živo stanje) in **del za voznike in spremljevalce** (sprejem prevoza, časi, statusi). Deluje kot aplikacija na iPhone in Android (PWA), brez plačila in brez trgovin z aplikacijami.

> **Čas za namestitev:** približno 60–90 minut, če slediš korakom po vrsti. Vse korake narediš v brskalniku na računalniku. Programiranja ni.

---

## 0. Preden začneš – nekaj, kar je treba vedeti

### 0.1 Kaj je brezplačno in kako je zgrajeno

| Del | Storitev | Cena | Kaj dela |
|---|---|---|---|
| Spletna stran (aplikacija) | GitHub Pages | 0 € (javen repozitorij) | Gostuje datoteke aplikacije. **Podatkov o pacientih tam ni.** |
| Prijava in uporabniki | Firebase Authentication (načrt Spark) | 0 € | Uporabniško ime + geslo, vsak uporabnik svoj račun. |
| Skupna baza | Cloud Firestore (načrt Spark) | 0 € do kvote | Knjiga, pacienti, nalogi, razporedi, statusi. Šifrirano pri prenosu in v mirovanju. |
| Dostop po vlogah | `firestore.rules` | 0 € | Strežnik sam zavrne vse, kar vloga ne sme (glej razdelek 9). |
| Cestno usmerjanje | OSRM nad podatki OpenStreetMap (javni strežnik ali lasten) | 0 € | Prave razdalje in časi vožnje po cestah, tudi do Ljubljane in Novega mesta (razdelek 10.2). Strežnik dobi samo koordinate. |
| Podlaga zemljevida | Ploščice OpenStreetMap (javni strežnik ali lasten) | 0 € (zmerna raba) | Interaktivni zemljevid poti in dneva (razdelek 10.7, 11.8). Strežnik ploščic vidi IP naprave, izvor strani in koordinate prikazanega območja, **ne pa podatkov o pacientih**. Izklopljivo; brez podlage ostaneta pot in točke. |
| Iskanje naslovov (ulica + hišna številka) | Nominatim nad podatki OpenStreetMap (javni strežnik ali lasten) | 0 € (zmerna raba: največ 1 zahtevek/s) | Za naslov, kot ga vpišeš (»Cesta prvih borcev 18, Brežice«, »Dobova 25«), najde točko; z njo in cestami OSRM je kilometrina OD → DO točna brez Google Zemljevidov (razdelek 10.3, 11.9). Strežnik dobi samo besedilo naslova. |
| Kilometrina z Googlom (neobvezno) | Google Maps Platform, Routes API | **plačljivo po zahtevku** (preveri trenutni cenik in brezplačno kvoto) | Kilometrina vsakega prevoza OD → DO po najboljši poti kot v Google Zemljevidih (razdelek 10.3). Google dobi samo besedilo naslova OD in DO. Brez ključa deluje aplikacija po cestah OSM ali z oceno. |

Kvote načrta Spark po podatkih na strani firebase.google.com/pricing (preveri tudi sam, ker se lahko spremenijo): Firestore 1 GiB podatkov, **50.000 branj/dan, 20.000 pisanj/dan, 20.000 brisanj/dan**; Authentication 50.000 aktivnih uporabnikov na mesec. Načrt Spark ne zahteva plačilnega sredstva. Moja ocena (ni merjeno): pri 3–5 napravah dispečerja in 6–10 telefonih posadk je dnevna poraba pod 10 % kvote. Porabo vidiš v Firebase konzoli → Firestore Database → zavihek **Usage**.

**Česa na brezplačnem načrtu ni** (zato aplikacija tega ne obljublja):
- **Potisna obvestila (push)** – za pošiljanje potrebuješ strežniško kodo (Cloud Functions), ta pa zahteva plačljiv načrt Blaze. Posadka vidi nov razpored takoj, ko ima aplikacijo odprto; sicer ob naslednjem odprtju. Nujne spremembe dispečer sporoči še po radijski zvezi/telefonu.
- **Samodejne varnostne kopije baze** – zahtevajo Blaze. Namesto tega ima aplikacija gumb **Izvozi podatke** (razdelek 11.2).
- **Slovenska lokacija baze** – Firestore nima lokacije v Sloveniji. Izbereš lokacijo v EU (razdelek 2.3). O tem odloči pooblaščenec za varstvo podatkov (razdelek 0.2).

### 0.2 Pravni in organizacijski pogoj (obvezno pred prvim pravim pacientom)

Aplikacija obdeluje **zdravstvene podatke** (ime, naslov, razlog prevoza, številka naloga). To je posebna vrsta osebnih podatkov (ZVOP-2, GDPR člen 9).

1. Pred uporabo s pravimi podatki to **potrdita vodstvo ZD Brežice in pooblaščenec za varstvo podatkov (DPO)**. Vprašanja zanju: (a) ali je storitev Google Firebase kot podatkovni obdelovalec dovoljena (pogodba o obdelavi podatkov po členu 28 GDPR, Google Cloud Data Processing Addendum); (b) ali je dovoljena lokacija baze v EU, ker v Sloveniji ni na voljo; (c) ali je potrebna ocena učinka na varstvo podatkov (DPIA); (d) kdo je skrbnik aplikacije in kdo odobri račune.
2. Informacijski pooblaščenec RS je v mnenju z dne 17. 10. 2024 izrazil stališče o shranjevanju zdravstvenih zbirk zunaj Slovenije. Zato **do pisne odobritve v aplikacijo vpisuj samo izmišljene podatke** (aplikacija ima gumb »Odstrani vse primere«).
3. ZZZS: nalog za prevoz mora biti popoln, sicer ni veljaven; originale hrani po predpisih (najmanj 2 leti). Aplikacija je **pripomoček za evidenco in opozorila, ne nadomešča papirnatega naloga**.
4. **Cestno usmerjanje pošilja koordinate zunanjemu strežniku** (privzeto javni strežnik OSRM). Ne pošilja imen, naslovov, telefonskih številk ali kakršnihkoli podatkov o pacientih, vendar so koordinate hišnega naslova (če je naslov uvožen iz registra) v načelu povezljive s posameznikom. Zato DPO vprašaj tudi: (a) ali je dovoljeno javno storitev uporabljati s pravimi pacienti, (b) ali naj se namesto nje uporabi lasten strežnik OSRM (razdelek 11.6) ali samo vnaprej izračunana datoteka `razdalje.json`, ki sploh ne zahteva povezave. Cestno usmerjanje lahko kadarkoli izklopiš: **Nastavitve → Izračun → Uporabi dejanske ceste** ali `routing.url: ''` v `config.js`; aplikacija se vrne k oceni po zračni razdalji.
5. **Natančna kilometrina pošilja Googlu besedilo naslova OD in DO** (npr. »Dobova 25« in »UKC Ljubljana«), brez imena, telefona, naloga ali ure. Naslov bivališča pacienta je **osebni podatek**, zato je to ločena odločitev za DPO: (a) ali je dovoljeno Googlu pošiljati naslove brez imen, (b) ali je za to potrebna ocena učinka ali dopolnitev evidence dejavnosti obdelave, (c) ali je sprejemljiv ključ, ki ga hrani vsaka naprava posebej. Dokler odobritve ni, pusti polje za ključ prazno: aplikacija potem Googla **sploh ne kliče** in računa po cestah OpenStreetMap ali z oceno (označeno z ~). Pogojev uporabe Google Maps Platform o shranjevanju rezultatov nisem mogel prebrati (strani Googla v okolju niso bile dosegljive): aplikacija v knjigo shrani samo število kilometrov in vir, poti pa ne; **vprašanje o shranjevanju kilometrine v poslovno evidenco naj preveri vodstvo/DPO**.

6. **Podlaga zemljevida (ploščice OpenStreetMap)**: brskalnik pri strežniku ploščic zahteva slike za prikazano območje. Strežnik vidi IP naslov naprave, izvor strani (brez poti) in koordinate ploščic; imen, naslovov in podatkov o pacientih ne vidi (točke in poti se rišejo v brskalniku). DPO vprašaj, ali je to sprejemljivo ali naj se podlaga izklopi (Nastavitve → Izračun → Zemljevid poti) oziroma uporabi lasten strežnik ploščic (11.8).

Če odobritve ne dobiš, aplikacijo še vedno uporabljaš v **lokalnem načinu** (podatki samo v tvojem brskalniku, brez oblaka) – glej razdelek 12.

### 0.3 Kaj potrebuješ

- Računalnik z brskalnikom (Chrome, Edge, Firefox ali Safari).
- **Službeni** Google račun (ne osebni) za Firebase – priporočeno nov, z vključeno dvostopenjsko prijavo.
- Račun na GitHub (brezplačen) z dvostopenjsko prijavo.
- Mapa `web/` iz tega paketa (datoteke aplikacije) in datoteka `firestore.rules`.
- Logotipa ZD Brežice in NMP kot PNG (od tajništva/komunikacij; ne iskati po spletu).

---

## 1. Korak: Google račun za Firebase

1. Odpri <https://accounts.google.com/signup> in ustvari **nov račun za projekt** (npr. `rp.brezice.aplikacija@gmail.com`). Uporabi dolgo, edinstveno geslo (14+ znakov) in ga shrani v geslovnik, ki ga uporablja ZD.
2. Vključi dvostopenjsko preverjanje: <https://myaccount.google.com/security> → **2-Step Verification** → **Get started** → sledi navodilom (aplikacija za overjanje ali SMS).
3. Zapiši si obnovitveno e-pošto ali telefonsko številko in shrani rezervne kode. **Če izgubiš dostop do tega računa, izgubiš dostop do baze.**

---

## 2. Korak: Firebase projekt, baza in prijava

### 2.1 Ustvari projekt

1. Odpri <https://console.firebase.google.com> (prijavljen z računom iz koraka 1).
2. Klikni **Create a project** (ali **Add project**).
3. Ime projekta: `knjiga-prevozov-zd-brezice` → **Continue**.
4. Google Analytics: **izklopi** stikalo (»Enable Google Analytics for this project«) → **Create project**. Počakaj, da se projekt ustvari → **Continue**.

### 2.2 Prepričaj se, da si na brezplačnem načrtu

1. Levo spodaj v konzoli mora pisati **Spark** (No-cost). Če konzola kdaj zahteva dodajanje kartice ali nadgradnjo na Blaze, **ustavi in ne potrjuj** – za to aplikacijo ni potrebno.

### 2.3 Ustvari bazo Firestore

1. V levem meniju: **Build** → **Firestore Database** → **Create database**.
2. Izdaja (edition): izberi **Standard**. Database ID pusti `(default)`.
3. **Location**: izberi lokacijo v Evropi, npr. `europe-west3 (Frankfurt)` ali multi-region `eur3 (Europe)`. **Lokacije pozneje ni mogoče spremeniti.** Če za izbrano lokacijo konzola zahteva plačljiv načrt, izberi drugo evropsko lokacijo. Izbiro zapiši (za DPO).
4. Način: **Start in production mode** (zaklenjeno). **Ne izberi »test mode«** – ta bi bazo za 30 dni odprl vsem.
5. **Create**.

### 2.4 Vključi prijavo z geslom

1. **Build** → **Authentication** → **Get started**.
2. Zavihek **Sign-in method** → **Email/Password** → vključi **prvo** stikalo (Enable). Stikala »Email link (passwordless)« **ne vključi** → **Save**.
3. Zavihek **Settings** → razdelek **User actions**: odkljukaj **Enable create (sign-up)**, da si nihče ne more sam ustvariti računa → **Save**. (Če te možnosti v tvoji različici konzole ni, ni težava: pravila baze račune brez vloge zavrnejo.)
4. Če v **Settings** obstaja razdelek **Password policy**, nastavi najmanjšo dolžino 10 znakov in vključi zahtevo po velikih/malih črkah in številkah.

### 2.5 Registriraj spletno aplikacijo in kopiraj nastavitve

1. Klikni ikono zobnika zraven »Project Overview« → **Project settings** → zavihek **General**.
2. Pomakni se do **Your apps** → klikni ikono **`</>`** (Web).
3. App nickname: `knjiga-prevozov`. **Firebase Hosting ne obkljukaj.** → **Register app**.
4. Prikaže se koda `const firebaseConfig = { ... }`. Kopiraj (v Beležnico) **štiri vrednosti**: `apiKey`, `authDomain`, `projectId`, `appId`. Ostalih (`storageBucket`, `messagingSenderId`, `measurementId`) ne potrebuješ. → **Continue to console**.

> Te vrednosti **niso skrivnost** (vidne so v vsaki spletni aplikaciji). Varnost zagotavljata prijava in pravila baze. Gesel in skrivnih ključev nikoli ne vpisuj v datoteke na GitHub.

---

## 3. Korak: Pravila baze (najpomembnejši varnostni korak)

1. **Build** → **Firestore Database** → zavihek **Rules**.
2. **Izbriši vso obstoječo vsebino** urejevalnika.
3. Odpri datoteko `firestore.rules` iz paketa v Beležnici, kopiraj **celotno vsebino** in jo prilepi v urejevalnik.
4. Klikni **Publish**. Počakaj na potrditev.

### 3.1 Preizkus pravil (Rules Playground)

Pravila preizkusiš šele po koraku 7 (ko imaš uporabnike). Takrat v zavihku **Rules** klikni **Rules playground** in izvedi te preizkuse (»Simulation type«: **get**; vklopi **Authenticated**; v polje **Firebase UID** vpiši UID uporabnika):

| # | Pot (Location) | UID uporabnika | Pričakovano |
|---|---|---|---|
| 1 | `/databases/(default)/documents/days/2026-11-07` | voznik | **Denied** |
| 2 | `/databases/(default)/documents/patients/x` | voznik | **Denied** |
| 3 | `/databases/(default)/documents/cfg/main` | voznik | **Denied** |
| 4 | `/databases/(default)/documents/days/2026-11-07` | dispečer | **Allowed** |
| 5 | `/databases/(default)/documents/crew/2026-11-07_<UID voznika>` | voznik | **Allowed** |
| 6 | `/databases/(default)/documents/crew/2026-11-07_<UID dispečerja>` | voznik | **Denied** |
| 7 | `/databases/(default)/documents/users/<UID voznika>` | voznik | **Allowed** (lasten profil) |
| 8 | `/databases/(default)/documents/days/2026-11-07` | Authenticated **izklopljeno** | **Denied** |

Če se kateri rezultat razlikuje, **ne uporabljaj aplikacije s pravimi podatki** in popravi pravila.

---

## 4. Korak: Vpiši nastavitve v `config.js`

1. V paketu odpri `web/config.js` v Beležnici.
2. Zamenjaj štiri vrednosti `VSTAVI-…` z vrednostmi iz koraka 2.5:

```js
window.KP_CONFIG = {
  mode: 'firebase',
  userDomain: 'rp-brezice.example',   // pusti
  sdkVersion: '10.14.1',              // pusti
  offline: true,
  routing: {                          // cestno usmerjanje (razdelek 10.2 in 11.6)
    url: 'https://router.project-osrm.org',
    fallback: ['https://routing.openstreetmap.de/routed-car']
  },
  google: {                           // neobvezno: natančna kilometrina (razdelek 10.3 in 11.7)
    key: ''                           // prazno = Google izklopljen; ključ lahko vpišeš tudi samo v aplikaciji (velja za tisto napravo)
  },
  firebase: {
    apiKey: 'AIza…',                   // tvoja vrednost
    authDomain: 'knjiga-prevozov-zd-brezice.firebaseapp.com',
    projectId: 'knjiga-prevozov-zd-brezice',
    appId: '1:123…:web:abc…'
  }
};
```
3. Shrani datoteko. Če `apiKey` še vsebuje besedo `VSTAVI`, aplikacija **namenoma** teče v lokalnem demo načinu in v oblak ne pošilja ničesar.

> **`routing`**: strežnik za cestno usmerjanje. Pusti kot je, ali zamenjaj z lastnim (11.6). `url: ''` cestno usmerjanje izklopi (ocena po zračni razdalji). Če uporabljaš drug strežnik, ga je treba dovoliti tudi v Content-Security-Policy (`connect-src` v `build-prod.py`, nato ponovna gradnja); javna strežnika sta že dovoljena.

> **`google.key`**: neobvezen ključ za natančno kilometrino. Pusti prazno, dokler ne opraviš 11.7 in dobiš odobritve DPO (0.2, točka 5). Ključ v `config.js` je viden vsakomur, ki odpre stran, zato ga **obvezno omeji na naslov te strani (HTTP referrer) in samo na Routes API** (11.7).

> `userDomain` je namišljena domena: uporabnik »matej« se v Firebase vodi kot `matej@rp-brezice.example`. Prijava je v aplikaciji vedno samo z uporabniškim imenom (`matej`); lahko pa vpišeš tudi celoten e-naslov, če računu daš pravi e-naslov.

---

## 5. Korak: GitHub – objava aplikacije

> **Pomembno:** brezplačni GitHub Pages deluje samo za **javni** repozitorij. Javen repozitorij vsebuje **samo programsko kodo in nastavitve iz koraka 4**. **Podatkov o pacientih, gesel in izvozov podatkov tam ne sme biti nikoli.** Stran vsebuje oznako `noindex`, vendar to ni varovanje: varovanje sta prijava in pravila baze.

1. Odpri <https://github.com/signup> in ustvari račun. Potrdi e-pošto.
2. Vključi dvostopenjsko prijavo: **Settings** (meni pod tvojo sliko desno zgoraj) → **Password and authentication** → **Two-factor authentication** → **Enable**. Shrani obnovitvene kode.
3. Ustvari repozitorij: **+** (desno zgoraj) → **New repository**. Repository name: `knjiga-prevozov`. Izberi **Public**. **Ne** obkljukaj »Add a README file«. → **Create repository**.
4. Na prazni strani repozitorija klikni povezavo **uploading an existing file**.
5. Na računalniku odpri mapo `web/`. **Izberi vse datoteke in mape v njej** (`index.html`, `app.js`, `style.css`, `config.js`, `boot.js`, `sw.js`, `manifest.webmanifest`, mapi `icons` in `logos`) in jih povleci v okno brskalnika. (Povleci vsebino mape, ne same mape `web`.) Počakaj, da se vse naloži.
6. Spodaj klikni **Commit changes**.
7. Preveri v seznamu datotek, da je `index.html` neposredno v korenu repozitorija (ne v podmapi).

### 5.1 Vključi GitHub Pages

1. V repozitoriju: zavihek **Settings** → levo **Pages**.
2. **Build and deployment** → **Source**: **Deploy from a branch**.
3. **Branch**: `main`, mapa `/ (root)` → **Save**.
4. Počakaj 1–3 minute in osveži stran. Na vrhu se prikaže naslov: `https://TVOJE-UPORABNISKO-IME.github.io/knjiga-prevozov/`. **To je naslov aplikacije.**

### 5.2 Dovoli ta naslov v Firebase

1. Firebase konzola → **Authentication** → zavihek **Settings** → **Authorized domains** → **Add domain**.
2. Vpiši `TVOJE-UPORABNISKO-IME.github.io` (brez `https://` in brez poti) → **Add**.

### 5.3 (Priporočeno) Omeji API ključ na tvojo stran

1. Odpri <https://console.cloud.google.com/apis/credentials> (isti Google račun), v zgornji vrstici izberi projekt `knjiga-prevozov-zd-brezice`.
2. Pri **Browser key** (ali ključu z istim začetkom, kot je tvoj `apiKey`) klikni ime.
3. **Application restrictions** → **Websites** → **Add** → vpiši `https://TVOJE-UPORABNISKO-IME.github.io/*` → **Save**. **API restrictions** ne spreminjaj.
4. Počakaj nekaj minut in preizkusi prijavo. Če prijava spodleti, preveri zapis naslova (brez presledkov).

---

## 6. Korak: Prvi skrbnik

Prvega skrbnika ustvariš ročno v konzoli (nihče ga ne more ustvariti sam – to je namerno).

1. Firebase konzola → **Authentication** → zavihek **Users** → **Add user**.
2. Email: `skrbnik@rp-brezice.example` (del pred `@` je uporabniško ime; domena naj bo enaka `userDomain` iz `config.js`). Password: **dolgo geslo (14+ znakov)** → **Add user**.
3. V vrstici uporabnika kopiraj **User UID** (ikona za kopiranje ali označi celotno vrednost).
4. **Build** → **Firestore Database** → zavihek **Data** → **Start collection**.
5. Collection ID: `users` → **Next**.
6. **Document ID**: prilepi **UID** (ne klikaj »Auto-ID«).
7. Dodaj tri polja:
   - `name` – tip **string** – npr. `Ime Priimek`
   - `role` – tip **string** – `skrbnik`
   - `active` – tip **boolean** – `true`
8. **Save**.
9. Odpri naslov aplikacije iz koraka 5.1 → prijavi se: uporabniško ime `skrbnik`, geslo iz koraka 6.2.
10. Če se prikaže »Račun nima dodeljene vloge ali je onemogočen«, preveri: UID v Document ID se mora ujemati z UID uporabnika, `role` je natančno `skrbnik`, `active` je boolean `true`.

**Prvi vstop – obvezen vrstni red:** skrbnik se mora prijaviti **prvi**, ker aplikacija ob prvi prijavi ustvari dokument z nastavitvami (`cfg/main`). Dispečer tega ne more ustvariti.

### 6.1 Varnostni samotest

1. V aplikaciji: **Nastavitve** → zavihek **Varnost** → **Zaženi preizkus**.
2. Vsi preizkusi morajo biti zeleni. Preizkus preveri tudi, da pravila baze zavračajo nedovoljene dostope tvoje vloge (npr. dispečer ne more spremeniti vloge, nihče ne more spremeniti ali izbrisati revizijske sledi).
3. Ponovi samotest na telefonu z računom voznika (razdelek 7.3).

---

## 7. Korak: Računi za dispečerje, voznike in spremljevalce

### 7.1 Ustvari račun (za vsako osebo)

1. Firebase konzola → **Authentication** → **Users** → **Add user**.
2. Email: `ime.priimek@rp-brezice.example` (uporabniško ime = del pred `@`; brez šumnikov in presledkov, npr. `matej.novak`). Password: začasno geslo (vsaj 10 znakov, npr. 3 naključne besede in številka).
3. Kopiraj **User UID**.
4. V aplikaciji (kot skrbnik): **Nastavitve** → **Uporabniki** → obrazec **Dodeli vlogo računu**: prilepi **UID**, vpiši **Ime in priimek**, izberi **Vlogo** → **Shrani vlogo**.

| Vloga | Kaj vidi in sme |
|---|---|
| **Skrbnik** | Vse; nastavitve, vozila, pravila, uporabniki, revizijska sled, izvoz podatkov. |
| **Dispečer** | Knjiga, pacienti in nalogi, razpored, objava, živo stanje, osebje. Ne more spreminjati vlog, vozil in varnostnih nastavitev. |
| **Voznik** | Samo svoj objavljeni razpored in koraki prevozov. Ne vidi knjige, baze pacientov in nastavitev. |
| **Spremljevalec** | Enako kot voznik. |

### 7.2 Poveži račun z zaposlenim

1. **Nastavitve** → **Zaposleni** → pri zaposlenem v stolpcu **Račun za aplikacijo posadke** izberi njegov račun.
2. Ko dispečer objavi razpored, se zaposleni z računom samodejno prikaže na pravem vozilu na svojem telefonu.

### 7.3 Navodilo za osebo z novim računom

1. Odpri naslov aplikacije na telefonu (razdelek 8), prijavi se z začasnim geslom.
2. Spodaj na zaslonu odpri **Moj račun · spremeni geslo** in nastavi **svoje** geslo (vsaj 10 znakov).
3. Gesla ne deli in ga ne zapiši na papir ob telefonu.

### 7.4 Zaposleni odide ali izgubi telefon

1. Takoj: **Nastavitve** → **Uporabniki** → odkljukaj **Aktiven** pri osebi. Dostop preneha takoj, ker pravila pri vsakem zahtevku preverjajo `active`.
2. Nato: Firebase konzola → **Authentication** → **Users** → ⋮ pri uporabniku → **Disable account** (ali **Delete account**).
3. Če je bil telefon izgubljen, zabeleži datum in uro; revizijska sled (zavihek **Varnost**) kaže prijave.

### 7.5 Pozabljeno geslo

Ker so e-naslovi namišljeni, e-pošta za ponastavitev ne deluje. Postopek: Firebase konzola → **Authentication** → **Users** → izbriši račun → **Add user** (isti e-naslov, novo začasno geslo) → kopiraj **nov UID** → v aplikaciji **Dodeli vlogo računu** z novim UID, staremu UID odkljukaj »Aktiven« → pri zaposlenem ponovno izberi račun. (Če ZD želi ponastavitev po e-pošti, uporabi **prave službene e-naslove** kot uporabniška imena; prijava potem poteka z celotnim e-naslovom.)

---

## 8. Korak: Namestitev na telefon (iPhone in Android)

Aplikacija je PWA: namesti se z začetnega zaslona, brez trgovin Apple/Google (brezplačno).

### 8.1 iPhone (iOS)
1. Odpri naslov aplikacije **v Safariju** (ne v drugem brskalniku).
2. Tapni ikono **Deli** (kvadrat s puščico navzgor, spodaj).
3. Pomakni se in tapni **Dodaj na začetni zaslon** (Add to Home Screen) → **Dodaj**.
4. Aplikacijo od zdaj odpiraj z ikone »Prevozi« na začetnem zaslonu.

### 8.2 Android (Chrome)
1. Odpri naslov aplikacije v Chromu.
2. Tapni meni ⋮ (zgoraj desno) → **Namesti aplikacijo** (Install app) ali **Dodaj na začetni zaslon**.
3. Potrdi. Ikona »Prevozi« se pojavi med aplikacijami.

### 8.3 Navade, ki jih mora posadka poznati
- Ob koncu izmene se **odjavi** (v aplikaciji). Ob odjavi se lokalna kopija podatkov na telefonu izbriše.
- **Zaklep zaslona** (koda ali biometrija) je obvezen.
- Aplikacija naj bo med vožnjo odprta; ob izgubi signala koraki počakajo in se pošljejo, ko se povezava vrne. Zaradi omejitev iOS se osveževanje ustavi, ko aplikacija ni na zaslonu.
- Za pot do pacienta gumb **Navigacija** odpre zemljevid v telefonu (podatek o naslovu gre takrat v aplikacijo zemljevidov – to je odločitev posadke).

---

## 9. Kaj je varovano in kako

| Nevarnost | Ukrep v aplikaciji/projektu |
|---|---|
| Nepovabljen uporabnik | Prijava z geslom; samostojna registracija izklopljena (2.4); račun brez vloge nima dostopa do ničesar. |
| Voznik bere knjigo ali bazo pacientov | Pravila baze: posadka bere samo dokument `crew/{datum}_{svoj uid}` in dogodke svojega vozila. Preizkus: razdelek 3.1 in samotest. |
| Posadka spreminja tuj razpored ali stanje | Posadka lahko samo **doda** dogodek za svoje vozilo, z lastnim `uid`; dogodkov ni mogoče spreminjati ali brisati. |
| Dispečer spreminja vloge, vozila, razdalje | Pravila: samo skrbnik. |
| Brisanje sledi | Revizijska sled je samo za dodajanje; bere jo samo skrbnik. V sled gredo prijave, objave razporeda, odpiranje pacienta, spremembe nalogov, izvozi (samo inicialke, brez polnih imen). |
| Vstavljanje kode (XSS) | Vsi vnosi se pred prikazom pretvorijo; strog Content-Security-Policy dovoli samo kodo iz same aplikacije in Google SDK. |
| Zloraba okvirja (clickjacking) | `boot.js` prepreči vdelavo v tuj okvir. |
| Ugibanje gesel | Najmanj 10 znakov; po 5 napačnih poskusih 30 s zaklep v aplikaciji (Firebase dodatno omejuje poskuse). |
| Odprt telefon | Samodejna odjava po 30 min nedejavnosti; odjava izbriše lokalno kopijo; PWA ne hrani podatkov o pacientih v predpomnilniku datotek. |
| Uhajanje v javni repozitorij | Repozitorij vsebuje samo kodo; podatki so samo v Firestore. |
| Podatki, ki zapustijo aplikacijo zaradi cest | Cestnemu strežniku gredo samo koordinate (brez imen, naslovov, pacientov), brez piškotkov in brez prilagojenih glav; `Referer` se ne pošilja. Hišni naslovi se ne shranjujejo v trajni predpomnilnik poti in se ob odjavi pozabijo. CSP dovoli samo nastavljene cestne strežnike. Možnost popolne izključitve: `razdalje.json` ali izklop (0.2, točka 4). |

**Česa aplikacija NE more zagotoviti** (poštena omejitev): dvostopenjska prijava za račune v aplikaciji ni vključena v brezplačnem načrtu (ni preverjeno, ali jo je mogoče dodati brez Blaze); zato so pomembna dolga gesla, zaklep telefona in hitro onemogočanje računov. GitHub Pages ne omogoča nastavljanja HTTP glav; CSP je zato podan v `index.html` (nekaj glav, npr. `frame-ancestors`, tako ni mogoče nastaviti – nadomešča jih `boot.js`). Če želiš polne glave, lahko isto mapo objaviš na Firebase Hosting (brezplačno na Spark; `firebase.json` z glavami) – to je neobvezna nadgradnja.

---

## 10. Vsakodnevno delo dispečerja

1. **Knjiga / Dan**: vpiši prevoz. Ko začneš tipkati ime pacienta, se ponudijo pacienti iz baze – izbira samodejno izpolni naslov, telefon, način, nalog in cilj. Barva pacienta je trak na levi strani vnosa.
2. **Naslovi** se dopolnjujejo že ob tipkanju (naselja Občine Brežice, ustanove, naslovi iz baze in uvoženi naslovi).
3. **Pacienti**: karton pacienta → **Nov nalog**. Izberi vrsto (**letni**, **mesečni**, **enkratni**, **za čas zdravljenja**); datumi veljavnosti se izpolnijo sami (letni: 1 leto minus 1 dan, mesečni: do konca meseca, enkratni: isti dan, za čas zdravljenja: 27 dni) in jih lahko popraviš. Obvezna polja: številka, naročnik, izvajalec, zdravnik, razlog, relacija (od – do), veljavnost. Nepopoln nalog je označen.
4. **Opozorila o poteku**: letni nalog opozori **30 dni** vnaprej, mesečni in za čas zdravljenja **7 dni** vnaprej (nastavljivo v Nastavitve → Pravila). Če je vpisan nov nalog, ki se začne ob izteku starega, opozorila ni.
5. **Predogled za kopiranje**: gumb pri prevozu ali nalogu odpre predogled (polna oblika, kratka, vrstica za knjigo); klik na vrstico kopira vrstico, »Kopiraj vse« kopira vse.
6. **Razpored**: izberi, kdo je danes na delu, in vozila; aplikacija izračuna posadke, vrstni red, ure odhoda in **ocenjene prihode** (razdelek 10.2). Okvare in servisi so v zavihku **Okvare**.
7. **Objavi razpored**: vsak voznik/spremljevalec prejme svoj del. Spremembe po objavi: ponovno **Objavi**.
8. **Živo**: statusi (dodeljen → sprejet → na poti → na kraju → v vozilu → na cilju → zaključen) in težave (»ni doma«, odklonjen). Ob zaključku se čas in **»Kdo je naredil odvoz«** vpišeta v knjigo sama.

### 10.1 Pravila in izjeme (kako aplikacija »upogne« pravila)

Za vsak dan in za vsak prevoz posebej izbereš, kako strogo naj aplikacija ravna:

| Način | Kaj naredi |
|---|---|
| **Strogo** | Samo običajne zmogljivosti vozil (npr. Avto 13: 4 sedeži) in dolžina izmene. Kar ne gre, ostane nerazporejeno z razlogom. |
| **Samodejno** (priporočeno) | Najprej poskusi strogo; če kaj ostane nerazporejeno ali zamuja, poskusi z dovoljenimi prilagoditvami in izbere boljši razpored. |
| **Prosto** | Takoj uporabi vse prilagoditve (tudi največje zmogljivosti vozil, nadure, daljše čakanje in ovinke). |

- **Zmogljivosti:** vsako vozilo ima običajno in največje število mest (Nastavitve → Vozila): npr. Avto 13 običajno 4, največ 6. Če jih uporabi samo »Samodejno« ali »Prosto«, je **v razporedu izpisano: »PRILAGOJENA PRAVILA: 6 pacientov v Avto 13 (običajno 4)«**.
- **Nadure:** pri zaposlenem v razporedu izberi **Nadure** (brez / do 30 min / 1 h / 2 h / 3 h / 4 h) ali pusti odločiti samodejnemu načinu (do največ nastavljenih nadur). Če izmena nima vpisanega konca, aplikacija izmene ne nadzira.
- **Ročna izjema:** pri prevozu obkljukaj **Izjema pravil** (dovoli prilagoditve samo za ta prevoz), ali pri prevozu v razporedu izberi **vozilo** namesto »Samodejno« (prestavi prevoz na izbrano vozilo, tudi v strogem načinu). Prilagoditve so izpisane.
- **Varnost je trda meja:** ležečega pacienta aplikacija **nikoli** ne uvrsti v vozilo brez nosil, tudi v načinu »Prosto«. Takšen prevoz ostane nerazporejen z jasnim razlogom.
- Vse prilagoditve so izpisane (opozorila rumene barve v razporedu in v besedilu razporeda), da dispečer ve, kaj je bilo upognjeno.

---

### 10.2 Cestno usmerjanje in samodejni razpored

**Kaj se zgodi samo od sebe**
- Razdalje in časi vožnje se računajo **po dejanskem cestnem omrežju** (OpenStreetMap, strežnik OSRM), tudi za vožnje do Ljubljane, Novega mesta, Celja, Maribora, Zagreba in drugih krajev (vgrajena je tabela ustanov in 24 mest). Zračna razdalja se uporabi **samo**, če cestnih podatkov za neko relacijo ni (izklop, izpad strežnika, neznan kraj); takšne vrednosti so povsod označene z **~**.
- Pacienti s **sorodnimi cilji** (npr. UKC, Onkološki inštitut in URI Soča v Ljubljani) gredo lahko v **eni vožnji** z več izstopi; vrstni red pobiranja in izstopov je izračunan tako, da nihče ne zamudi in da je pot kratka. Meje nastaviš v Nastavitve → Izračun (največja vožnja med cilji, največ ciljev).
- Za vsakega pacienta je izpisano: ura pobiranja, **predviden prihod na cilj**, **rezerva** do ure preiskave (rdeče, če bi zamudil) in pri odvozu **čakanje**. Vozila se izbirajo glede na kapaciteto in vrsto prevoza (ležeči, sedeči, invalidski voziček); ležeči pacient nikoli ne dobi vozila brez nosil.
- Aplikacija **poišče učinkovitejši razpored**: poleg prvotnega izračuna preizkusi še nekaj različic (združevanje ciljev, primernejša vozila, drugačen vrstni red dodeljevanja) in izbere najboljšo. Ne sprejme razporeda, ki bi imel več nerazporejenih prevozov, in ne takega z več zamudami, razen če zato razporedi več prevozov. Kar je spremenila, je izpisano v kartici **Predlogi**.
- **Prevozi, ki so že v teku** (posadka je sprejela, je na poti ali je pacient v vozilu), se ne prestavljajo na drugo vozilo.

**Kaj aplikacija opozori** (rdeča/rumena opozorila in Predlogi)
- **nerazporejeni prevozi** z razlogom (npr. manjka voznik, ni vozila z nosili) in predlogom, kaj bi pomagalo (zgodnejši začetek izmene, dodaten voznik, prosto vozilo, način »Samodejno«);
- **zamude** in prevoz, ki bi pacienta pripeljal veliko prezgodaj;
- **konflikti**: prekrivajoči se prevozi iste posadke, isto vozilo dvakrat, isti pacient na dveh prevozih hkrati ali z dvema terminoma, ki ju ni mogoče doseči (npr. ob 9:00 v Ljubljani in ob 9:30 v Novem mestu), odvoz, ki je načrtovan manj kot 15 min po terminu preiskave istega pacienta, prevoz, ki je že v teku, pa bi ga razpored dal drugemu vozilu;
- naslov, ki je daleč od najbližje ceste (možna napaka v koordinatah).

**Vrstica »Cestni podatki«** v Dispečerju se pokaže samo, kadar je kaj narobe (da ne moti): pove, da se podatki nalagajo, ali da strežnik ni dosegljiv (**ni povezave**: razpored se vseeno sestavi z oceno, ponovni poskus teče sam; gumb **Poskusi znova**). Pred **Objavi razpored** aplikacija počaka (do 9 s), da prispejo manjkajoči cestni podatki, zato so objavljene ure čim bolj točne. Pri vsaki vožnji gumb **Pot** pokaže pot po cestah (brez podlage zemljevida; podatki © prispevajoči OpenStreetMap). V pogledu **Živo** je pri prevozih v teku ocena prihoda, izračunana iz zadnjega sporočila posadke.

**Točnost – poštena omejitev:** čas vožnje je izračunan iz cestnega omrežja in hitrostnih omejitev, **brez prometa v živo, zapor in zastojev** (po potrebi nastavi popravek časa, npr. 1,15). Naselja so predstavljena s središčno točko, kraji izven občine s središčem mesta; za vožnje do ustanov (UKC, SB Novo mesto …) so koordinate ustanove. Zato so ure prihoda **ocene**, ne jamstva.

---

### 10.3 Kilometrina OD → DO (brezplačno: naslov OSM + ceste OSM; Google je neobvezen)

**Kaj je kilometrina prevoza:** razdalja **OD → DO** po cestah za osebni avto. Če reševalec na cilju **čaka na pregled**, se prišteje še pot nazaj, zato je »skupaj« = tja + nazaj. Vožnja reševalca od postaje do pacienta in nazaj na postajo **ni všteta** (to ni »OD → DO« prevoza). Če knjiga prevozov zahteva drugače, mi povej: to je ena vrstica v izračunu.

**Zakaj je bila kilometrina prej netočna:** cestno omrežje (OSRM) je bilo že pravo, a za naslov brez znane hišne številke je aplikacija vzela **središče naselja**. Pri »Cesta prvih borcev 18, Brežice« je zato razlika med središčem mesta in pravo hišo lahko več kilometrov (v večjih naseljih še več). Pravi popravek je točka naslova, ne drugačna cesta.

**Kako zdaj deluje (brez Googla):**
1. Vpiši **OD** in **DO** (ali izberi pacienta). Ko vnos potrdiš, aplikacija v OpenStreetMap (Nominatim) poišče **točko naslova** (ulica + hišna številka), nato OSRM izračuna **cestno razdaljo OD → DO** (pri čakanju na pregled tudi DO → OD). Ustanove in klinike imajo točko že v aplikaciji (iskanje ni potrebno).
2. Rezultat se zapiše v vpis z virom **naslov + ceste OSM** in **natančnostjo** vsakega konca poti: hišna številka, ustanova, točka na zemljevidu (= natančno); samo ulica, kraj ni potrjen, središče naselja (= približno, **~** pred številko).
3. Pri približnem vpisu je pod vrstico opozorilo, kateri konec je netočen. Rešitev: vpiši hišno številko ali pritisni **Točka na zemljevidu**, dotakni se zemljevida tam, kjer je hiša, in **Shrani točko**. Točka je **ročni popravek naslova**: velja za vse prevoze z istim naslovom od včeraj naprej (pretekli dnevi ostanejo, kot so bili zapisani), na vseh napravah, in ima prednost pred iskanjem. **Odstrani popravek** vrne iskanje.
4. **Točka pacienta se shrani pri pacientu** (polje `gc`): naslov, ki je bil že enkrat najden, se za ponovne prevoze (npr. dializo trikrat na teden) ne išče znova. Če se naslov pacienta spremeni, se išče znova.
5. **Ročni vpis km** (polje »ročno«) ima vedno prednost in ostane, dokler ga ne izbrišeš (tudi če se izračun konča po vpisu). Uporabi ga, ko je dejanska pot drugačna (zapora, ovinek). **Izračunaj znova** na prevozu ga prepiše.
6. **Dan → Več → Preračunaj kilometrino dneva**, mesečni pregled → **Izračunaj manjkajoče**. Ob odprtju dneva (od včeraj do 14 dni naprej) aplikacija sama dopolni prevoze brez km.
7. **Mesečni pregled → Kilometrina**: skupni km meseca, delež natančnih vpisov, km po dnevih in po vozilih, prevozi brez km. **Prenesi CSV** (brez imen pacientov) ali **CSV z imeni pacientov** (samo za notranjo rabo). CSV ima BOM in decimalno vejico, zato se v slovenskem Excelu odpre pravilno. Natisnjen mesec ima stolpec Km.

**Kaj aplikacija zavrne, namesto da bi molče računala narobe:** zadetek, ki je več kot nekaj kilometrov od prepoznanega kraja (npr. ista ulica v drugem kraju), se ne uporabi; naslov brez kraja dobi oznako »kraj ni potrjen«; točka več kot 400 m od ceste je opozorilo. V vseh primerih vidiš ~ in razlog.

**Kje se razdalja razlikuje od Google Zemljevidov:** OSRM in Google lahko izbereta nekoliko drugačno pot (običajno razlika nekaj odstotkov), zato pri nekaj prvih vpisih primerjaj z Googlom in po potrebi vpiši ročno. Točnost je vedno omejena z OpenStreetMap: če hišne številke tam ni, je točka na ulici ali v naselju (označeno ~).

**Neobvezno: Google.** Če v Nastavitve → Izračun vpišeš ključ Google (11.7), se za kilometrino uporablja Google (plačljivo po zahtevku). Obstoječi vpisi z OSM ostanejo, dokler jih ne preračunaš. Brez ključa je Google izklopljen in se ne kliče nikoli.

**Kdaj se iskanje naslovov ne kliče:** »Išči točke naslovov« je izklopljeno, »Uporabi dejanske ceste« je izklopljeno, naslov je ustanova ali samo naselje (brez hišne številke), ali je strežnik vrnil napako (429: preveč zahtevkov, 403: zavrnjen zahtevek). Aplikacija nato ne ponavlja zahtevkov v zanki in pokaže razumljivo sporočilo; do ponovne vzpostavitve je kilometrina ocena z oznako ~.

**Zakaj dve poti računanja:** razpored (kdo vozi koga, ob kateri uri) računa po splošnih točkah (naselja, ustanove) in matriki razdalj, ker potrebuje na stotine razdalj; točen naslov iščemo samo za vpisane prevoze (en zahtevek na novi naslov). Točka naslova se po potrditvi uporabi tudi v razporedu namesto središča naselja.

### 10.4 Klinike, ambulante in čakanje na pregled

- **Nastavitve → Klinike**: seznam ustanov in njihovih klinik/ambulant (UKC Ljubljana: očesna klinika, kardiološka ambulanta, nevrološka, kirurška, interna … ; UKC Maribor, SB Celje, SB Novo mesto in druge). Dodaš lahko **kliniko** pod katerokoli ustanovo ali **novo ustanovo** (npr. zasebna ordinacija).
- V polje **DO** vpišeš »UKC Ljubljana – očesna klinika« ali samo »očesna klinika« (predlogi se ponudijo med tipkanjem; prepoznana so tudi druga imena, npr. »oči«, »kardiologija«).
- Pri vsaki kliniki nastaviš **privzet čas pregleda (min)**, **pot do ambulante (min)** in naslov. **Naslovi in časi pregleda v seznamu so le začetni predlogi, ki jih je treba preveriti** (zbrani so bili po spominu, ne iz uradnega vira); pred uporabo jih popravi.
- Ko izbereš kliniko, se pri prevozu pokaže vrstica **»Reševalec počaka na pregled«** s privzetim časom pregleda. Čas lahko spremeniš; če ga spremeniš ročno, ga aplikacija ne prepiše več.
- **Kaj planer naredi:** vozilo pacienta po prihodu počaka (čas pregleda + pot do ambulante), nato ga pelje nazaj; prevoz nazaj se **ne vpisuje posebej**, razpored ga upošteva samodejno in ga pokaže pri vožnji (»čaka na pregled«, ura odhoda nazaj, rezerva). Vozilo in posadka sta za ta čas zasedena. Prevozi, ki imajo čakanje, se združujejo samo v vožnje z istim ciljem.
- Poleg čakanja se nastavi tudi **čas nalaganja po načinu** (sede, leže, voziček): Nastavitve → Izračun → parametri.

### 10.5 Dializa: termini in prevoz sede pacientov po dializi

- Možnosti **D1 / D2 / SaD4 pri podatkih pacienta in pri prevozu ni več**. Namesto tega je **Nastavitve → Dializa**: (1) **časi terminov** (dopoldanska 06:30–10:30 in popoldanska 11:30–15:30 sta privzeta; popravi po resničnih urnikih dializnega centra), (2) **register dializnih pacientov**: pacient (iz baze), termin (dopoldanska/popoldanska) in dnevi v tednu.
- Gumb **Naloži dializne paciente** (Knjiga → Dan → **Več**) vpiše prevoze dializnih pacientov za izbrani dan iz registra (tja ob začetku termina, nazaj ob koncu). Ob prijavi se to ne zgodi samo od sebe; pacient mora biti v bazi pacientov.
- Posadka, ki pelje na dializo, ima **po koncu dialize prosti čas**. Planer ji vanj lahko doda **sede paciente** (npr. iz bolnišnice domov), če to ne ovira odvoza dializnih pacientov ob koncu termina. Dializni pacienti imajo pri razporejanju prednost.
- Registra ni treba vzdrževati ročno vsak dan: spremeniš ga samo, ko se pacientu spremeni termin ali dnevi.

### 10.6 Zakaj je vmesnik zdaj mirnejši
- Vsak prevoz je ena **vrstica** (ura, ime, od → do, oznake, km, vozilo). **Odpre se samo ena** vrstica hkrati; ostalo ostane skrito.
- Redko rabljene stvari so pod gumbom **Več** ali v zložljivih razdelkih (npr. dolg seznam parametrov izračuna).
- Barve so rezervirane za pomen (rdeče = zamuda ali napaka, zeleno = natančen km, rumeno = ocena); barve nalogov so samo ozek trak na levi strani.
- Opozorila se pokažejo samo, kadar je kaj narobe (npr. vrstica »Cestni podatki«).

### 10.7 Interaktivni zemljevid (»Pot« in »Zemljevid dneva«)
- **Pot vožnje**: pri vsaki vožnji v Dispečerju (gumb **Pot na zemljevidu**) se odpre pravi zemljevid s podlago, cestno potjo (geometrija OSRM), puščicami smeri, merilom in oštevilčenimi točkami: kvadrat = postaja ali prejšnji cilj, krog = pobere, poln krog = izstop. **Klik na točko** odpre okno (kdo, kdaj, kje); **klik na postanek v seznamu** vožnje pokaže točko na zemljevidu.
- **Zemljevid dneva** (kartica pod razporedom): vse vožnje vseh vozil na enem zemljevidu, barva = vozilo; gumbi z imeni vozil vklopijo ali izklopijo posamezno vozilo. Poti po cestah se naložijo po eno in sproti zamenjajo črtkano orientacijsko črto. Številke so **št. prevozov v knjigi**.
- **Upravljanje**: povleci (miška ali prst), kolešček ali dva prsta za povečavo, dvojni klik oziroma dvojni dotik, gumba **+ in −**, **cela pot** (⌖), **čez cel zaslon** (⤢, Esc zapre), **podlaga** (vklop/izklop za to napravo). S tipkovnico: puščice, + in −, 0 = cela pot.
- Brez podlage (izklop, brez povezave, blokirano) se prikažeta samo pot in točke na nevtralni mreži; aplikacija ob izpadu to pove v zemljevidu. Črtkana črta pomeni, da cestna geometrija ni na voljo (samo orientacija, ne razdalja).

### 10.8 Hitri vnos, kopiranje, ponavljanje in tisk (delo po papirni knjigi)
Aplikacija posnema način, kako dispečer danes piše v knjigo (razdelek 10.9), vendar brez prepisovanja.
- **Hitri vnos** (vrstica nad seznamom prevozov): piši kot na papir, npr. `Novak Ivan, Dobova 25, OI LJ, 8:00` ali `Pacient 08; Dobova 14 > UKC LJ; ob 9.30; leže`. Pod vrstico vidiš, kaj je razbrala (ime, od, do, ura, način, opomba); **Enter** vpiše prevoz v prvo prosto polje in ostane v vrstici za naslednjega. Prepozna kratice ustanov (OI LJ, O.I. LJ, SBB, UKC LJ, ZD KK, IMI LJ, INT II, dializa …), pacienta po bazi (»Doma« vzame naslov pacienta, prevzame tudi telefon in način), uro (`8:00`, `ob 9.30`, `8h`), način (`leže`, `utila`, `vzorci`) in opombe (`brez spremljevalca`, `kisik` …). Če ustanova stoji pred naslovom (`SBB, Dobova 7`), je to odvoz iz ustanove domov.
- **Vzorci**: način prevoza **Vzorci** (npr. odvoz vzorcev v IMI LJ) ne zasede sedeža in ne potrebuje pacienta; razpored ga prišteje k vožnji v isto mesto.
- **Hitre opombe**: pod poljem Opomba so gumbi (brez spremljevalca, invalidski voziček, kisik, počaka na pregled …): klik doda ali odstrani opombo.
- **Kopiraj prevoze z drugega dne** (Več pri dnevu): izbereš dan (privzeto prejšnji z vpisi), odkljukaš prevoze in kopiraš. Kopirajo se ime, ura, naslova, način, opomba in že izračunan km; opravljeno, stanje in posadka ne. Enaki prevozi, ki so že vpisani, se preskočijo.
- **Ponovi prevoz** (Več pri prevozu): za naslednji delovni dan, do konca tedna ali naslednjih 5 delovnih dni (vikendi in prazniki se preskočijo), npr. za obsevanja.
- **Natisni knjigo dneva (OBR REŠ 08)** (Več pri dnevu): tri strani A4 v obliki papirne knjige: prevozi 1–10, 11–24 (ime, od, do, ura prevoza, ura pobiranja po razporedu, vozilo, opomba; odpovedani prečrtani rdeče), nato posadke po vozilih (voznik, spremljevalec, št. prevozov, začetek) in posebnosti dneva. Oznako obrazca lahko spremeniš v `settings.formCode` (privzeto OBR REŠ 08); številke različice obrazca aplikacija ne pozna.

### 10.9 Kako dispečer dela danes in kaj aplikacija samodejno naredi
Analiza fotografij papirne knjige za deset dni (7., 8., 20., 22. 10. ter 5., 6., 9., 10., 11. in 12. 11. 2026; brez imen, telefonov in hišnih naslovov iz fotografij – v paketu so samo izmišljeni podatki):
| Danes na papirju | V aplikaciji |
|---|---|
| Prevozi se vpisujejo v oštevilčena polja 1–24 (ime, od, do, ura), tudi v kratkih oznakah (OI LJ, SBB, IMI LJ, ZD KK, Doma) | **Hitri vnos** in razpoznava kratic ustanov; št. prevoza je zaporedna številka polja |
| Ura pobiranja se računa na pamet in piše ob robu | Razpored izračuna **uro pobiranja** po cestah in jo pokaže pri prevozu in na izpisu |
| Večino prevozov v isto mesto (npr. Ljubljana) opravi ena ekipa v eni vožnji; nenujna ekipa (NN) vozi lokalno, dializna ekipa dializo in kratke vožnje | Razpored združuje cilje v eno vožnjo, NN ekipo praviloma ne pošlje daleč (**Nastavitve → Izračun → NN ekipa: najdlje od postaje**, privzeto 60 km), vozilo »primarno dializa« ima prednost za dializne in lokalne vožnje |
| Pacienti z istimi dnevi (obsevanja, dializa) se vsak dan prepisujejo | **Kopiraj z drugega dne**, **Ponovi prevoz**, **Naloži dializne paciente** |
| Pacient čaka na pregled, nato vožnja nazaj | **Čakanje na pregled** pri kliniki in samodejna vožnja nazaj |
| Vzorci v laboratorij (»Vzemi vzorce za IMI«) | Način **Vzorci**; hitri vnos razume tudi »Vzemi vzorce za IMI LJ« |
| Pri dializi namesto ure piše »Dop« ali »Pop« | Hitri vnos razume **dop** / **pop**; ura je začetek (tja) oziroma konec (nazaj) termina iz Nastavitve → Dializa |
| Spodaj tabela: vozilo, voznik, prevozi, posebnosti (»ob 6:00«) | **Posadke po vozilih** v razporedu in na izpisu |
| Opombe »brez spremljevalca«, »voziček« … | **Hitre opombe** |
| Kilometrina in ocena poti na pamet | Km po Googlu ali cestah, **zemljevid** poti in dneva |
**Kaj so pokazali dnevi 5., 6. in 11. 11.** (dodani 11. 11., za umerjanje):
- Dispečer v eno vožnjo v Ljubljano združi tudi **8 pacientov z urami preiskav od 7:30 do 11:00**; pacienti na cilju čakajo tudi več ur, ker s tem prihrani cel drug avto. Razpored zato za **oddaljene cilje** (Ljubljana, Novo mesto; več kot 40 min vožnje od postaje) preizkusi tudi različice z razponom ur do **180 min** (Nastavitve → Izračun → »Okno združevanja pri oddaljenih ciljih«). Med različicami izbere tisto z manj kilometri, a čakanje pacientov nad eno uro pred preiskavo šteje v oceno, zato ob dovolj prostih vozilih pacientov ne pusti čakati.
- **NN ekipa v prvih petih dneh ni vozila v Ljubljano**, samo v Novo mesto, v dializo in lokalno. Kazen za dolge vožnje NN ekipe je zato višja (po potrebi še vedno možno, a samo če drugače ne gre). *Dopolnitev v2_7: v dneh 7., 8., 20., 22. 10. in 12. 11. je NN ekipa vozila tudi v Ljubljano in Maribor, kadar je bil pacient ležeč ali na utilah, saj samo ta vozila prevažajo nosila. Kazen zato ostaja mehka, vozilo z nosili pa je za takšne prevoze vedno dovoljeno.*
- Pri dializi je v knjigi samo »Dop« ali »Pop«: razpored zdaj sam vzame uro termina (prej je takšen prevoz razporedil na konec dneva).
- Kraji, ki jih dispečer piše po svoje, so zdaj prepoznani: *Stara vas*, *Zakot* (del Brežic), *Ginekolog LJ*, *Poliklinika LJ*, *SB Trbovlje*, *ZD Sevnica*, *KT*, *ITP* (obe kot SB Brežice), *Carlos/Spar* (prevzemna točka v Brežicah).
- **Ujemanje z dispečerjem** (delež parov prevozov, ki so v razporedu in v resnici v istem ali različnem vozilu): **85 %** na vseh petih dneh (prejšnja različica: 79 %). Dneva 6. in 9. 11. se ujemata v celoti, 5. 11. 92 %, dneva 10. in 11. 11. slabše (62 % in 69 %): tam je dispečer porazdelil vožnje glede na to, katera posadka je prosta za vrnitev iz dialize in za popoldanske vožnje, česar iz knjige ni mogoče razbrati. To je dober pokazatelj, kje razpored še ni natanko kot dispečer; dispečer lahko vedno izbere način »prosto« ali razpored popravi ročno.
- Zagon primerjave: `cd source && node tests/real-eval.js` (novi resnični dan dodaš v `tests/real-days.js`, brez pravih imen).

**Kaj so pokazali dnevi 7., 8., 20., 22. 10. in 12. 11.** (dodani 12. 11. 2026; 14 fotografij, zdaj skupaj deset dni, 14 do 22 prevozov na dan):
- **»Dializa KK« je dializni center v Krškem** (Nefrodial; KK je krška registrska oznaka; pacienti iz bolnišnice se tja vozijo z reševalcem). Privzeti cilj je zato **Dializni center Krško**, ne več SB Brežice. Koordinate so približne: **preveri** in po potrebi izberi drugo ustanovo v Nastavitve → Dializa (»Kje je dializni center?«). Ime »SB Brežice – dializa« je še vedno na voljo kot izbira. Popravljeno tudi: prej je ime »SB Brežice – dializa« tiho postalo »SB Brežice«, zato nastavitev dializnega centra pri takšnih prevozih ni delovala.
- **Dializni prevozi so v razporedu vedno prvi.** Termin dialize je fiksen (ni ga mogoče zamakniti), zato jih razpored zdaj razporedi pred drugimi vožnjami istega vozila. Prej je lahko dializa zaradi daljših vožnj istega vozila zamudila tudi 4–5 ur.
- **Primerjava z dispečerjem po isti oceni** (`tests/real-eval.js`): na sedmih dneh, kjer se dispečerjev razpored v modelu izide (pri ostalih treh bi zahteval vozila ali ekipe, ki jih podatki iz knjige ne pokažejo), ima razpored aplikacije **5 % manj km (6554 proti 6908) in 47 % manj minut zamude (1062 proti 2021)**. Ujemanje parov prevozov na vseh desetih dneh je 74 %: dispečer odloča tudi po tem, kdo je ravno prost za vrnitve in popoldanske vožnje, česar knjiga ne pokaže, zato je merilo kakovosti zdaj predvsem km in zamude, ne enakost.
- Nova imena ciljev: **DSO Loka** (ne več DSO Brežice; domnevno Trubarjev dom upokojencev, Loka pri Zidanem Mostu: **preveri**), **Šmarješke Toplice**, **Zdravilišče Laško**, **Terme Čatež**, **Stomatološka klinika LJ**, **Dermatološka klinika LJ**; naselja z drugačnim zapisom (*Orešje*, *Gornje Skopice*); hitre opombe *dodatna dializa*, *sprejem*, *ne prej*, *MRSA*, *pride pred reševalno*.
- Vozila z nosili (15, 16, 17 in 07) so v teh dneh vozila tako nenujne kot redne ekipe; v preizkusih imajo zato oznako »oboje«. Kapacitete (npr. dva sedeča na utilah v vozilu 17) so ocena iz knjige: popravi jih v Nastavitve → Vozila.
- **Preglednejši zaslon Dispečer** (naloga: »manj zapleteno«): zaslon je bil pri 22 prevozih visok okoli 8600 slikovnih točk, zdaj okoli 2200. Zgoraj je **Objavi razpored**, nato ena vrstica povzetka (prevozi, vozila, km, zamude), opozorila (več enakih o zgodnjem štartu je združenih v eno), **tabela razporeda** (kot spodnja tabela v papirni knjigi) in šele nato podrobnosti: **pravila razporejanja** (z vsemi prilagoditvami pravil), predlogi, zemljevid dneva, **podrobnosti po posadkah** (zložene; gumb *Razširi vse*) in **Zaključek prevozov** (zložen). Nič ni odstranjeno, samo skrito do klika.


---

## 11. Vzdrževanje

### 11.1 Posodobitev aplikacije
1. Nova različica pride kot nova mapa `web/`. V GitHub repozitoriju naloži datoteke čez stare (**Add file → Upload files**; **ne prepiši `config.js`**, razen če se je spremenil) → **Commit changes**.
2. Po 1–3 minutah se aplikacija na napravah posodobi ob naslednjem odprtju (včasih ob drugem odprtju).

### 11.2 Varnostna kopija (enkrat tedensko, skrbnik)
1. **Nastavitve** → **Podatki** → **Izvozi podatke**. Prenese se datoteka `knjiga-prevozov-DATUM.json` s celotno knjigo (vsi dnevi), pacienti in nastavitvami.
2. Datoteka vsebuje zdravstvene podatke: **shrani jo samo v šifrirano mapo ali na šifriran disk ZD**, nikoli v GitHub, e-pošto ali javni oblak.
3. Obnova: **Podatki** → izberi datoteko → **Uvozi podatke** (samo skrbnik).
4. Preizkusi obnovo enkrat na testnem projektu.

### 11.3 Naslovi do hišne številke
Vgrajena so vsa naselja Občine Brežice, ustanove in del ulic v Brežicah. **Popolnega registra ulic in hišnih številk iz tega okolja ni bilo mogoče pridobiti** (zunanje strani so bile blokirane), zato uvoz izvedeš sam:
1. Pridobi seznam naslovov občine Brežice iz **registra prostorskih enot (RPE)** Geodetske uprave RS (e-Prostor, eprostor.gov.si; postopek prenosa se pri GURS občasno spreminja). Datoteko shrani kot CSV.
2. CSV mora imeti stolpce za ulico, hišno številko (in neobvezno dodatek), naselje, ter koordinate: **lat/lon (WGS84)** ali **E/N (D96/TM)**. Stolpec »občina« je neobvezen; naslovi izven Občine Brežice se preskočijo. Število uvoženih in preskočenih vrstic se izpiše.
3. V aplikaciji: **Nastavitve** → **Naslovi in naselja** → izberi CSV.
4. Da bodo naslovi na vseh napravah: klikni **Prenesi naslovi.json**, datoteko naloži v GitHub poleg `index.html` (**Add file → Upload files**). Aplikacija jo naloži sama.
5. Pozor: uvoz s pravo datoteko GURS v tem paketu **ni preizkušen** (preizkušen je bil samo vzorčni CSV).

### 11.4 Logotipa
**V paketu sta logotipa že vključena** (`logos/zd-brezice.png` in `logos/nmp.png`). Logotip ZD Brežice je bil dobljen kot zelo majhna in zamegljena slika, zato je v paketu **čista ponovna izdelava** (znak in napis iz iste slike, črkovno ponovno postavljen): **to ni uradna datoteka**. Za uradni videz ju zamenjaj z originalnima datotekama iz tajništva (korak spodaj).
1. Preimenuj datoteki v `zd-brezice.png` in `nmp.png` (PNG, prosojno ozadje, višina vsaj 120 px).
2. GitHub → mapa `logos` → **Add file → Upload files** → naloži obe datoteki → **Commit changes**.
3. Logotipa se pokažeta v zgornji vrstici in na prijavi. Za preizkus ju lahko naložiš tudi v **Nastavitve → Logotipi** (velja samo za tisto napravo). Uporabi uradni datoteki iz tajništva.
4. Ikona aplikacije na telefonu je splošen znak križa (ni uradni logotip); za lastno ikono zamenjaj datoteke v mapi `icons` (192×192, 512×512, maskable 512×512, 180×180 `apple-touch-icon.png`).

### 11.5 Poraba kvote
Firebase konzola → **Firestore Database** → **Usage**. Če se približuješ 50.000 branj na dan, zmanjšaj število hkrati odprtih dispečerskih naprav ali me kontaktiraj za optimizacijo.

### 11.6 Cestni podatki: preverjanje, `razdalje.json` in lasten strežnik
1. **Preveri povezavo** (skrbnik): Nastavitve → Izračun → **Preveri cestne podatke**. Aplikacija vpraša strežnik za pot Brežice → UKC Ljubljana (pričakovano okoli 100 km in 65–75 min) in izpiše rezultat. **To naredi pri prvem zagonu**: v okolju, kjer je bil paket narejen, javni strežniki niso bili dosegljivi, zato je delovanje preizkušeno samo proti posnetku dokumentiranega API-ja (razdelek 14).
2. **Vnaprej pripravljena datoteka `razdalje.json`** (priporočeno, neobvezno): klikni **Predpripravi vse relacije** (aplikacija prenese razdalje med vsemi naselji, ustanovami in mesti; traja od nekaj sekund do minute), nato **Prenesi razdalje.json** in datoteko naloži v GitHub poleg `index.html` (**Add file → Upload files**), kot pri `naslovi.json`. Vse naprave potem poznajo razdalje med splošnimi točkami brez klica strežnika; strežnik je potreben samo še za naslove, ki niso v seznamu. Datoteka vsebuje samo koordinate splošnih točk in številke, nobenih podatkov o pacientih. Ponovi, če spremeniš koordinate naselij.
3. **Lasten strežnik OSRM** (za redno delo s pravimi pacienti): OSRM je prosta programska oprema; za Slovenijo zadošča majhen strežnik. Po dokumentaciji projekta OSRM (github.com/Project-OSRM/osrm-backend) se podatki pripravijo z orodji `osrm-extract`, `osrm-partition`, `osrm-customize` iz izvoza OpenStreetMap za Slovenijo (npr. `slovenia-latest.osm.pbf` pri Geofabrik), strežnik pa zažene `osrm-routed --algorithm mld`. Pogoji: (a) dostop **prek HTTPS** (brskalnik blokira klice na http s strani https), (b) strežnik mora dovoliti zahteve s tvoje strani (CORS), (c) izvor strežnika dodaš v `connect-src` v `build-prod.py` in ponovno zgradiš, (d) naslov vpišeš v `config.js` → `routing.url`. Postopka v tem paketu **nisem preizkusil**; vprašaj ZD-jevo informatiko.
4. **GraphHopper** ni vgrajen. Aplikacija govori jezik OSRM (`/table/v1/driving` za matrike, `/route/v1/driving` za pot). Za GraphHopper bi bil potreben ločen vmesnik; v kodi je cestni del zaprt v datoteki `src/38-routing.js`.
5. Pogoji uporabe javnih strežnikov (omejitve hitrosti, brez jamstva) se lahko spremenijo; preveri jih na straneh projektov OSRM oziroma FOSSGIS. Aplikacija zahteve združuje v pakete, jih redči in ob napaki preklopi na drugi strežnik ali na oceno.
6. **Izbriši predpomnilnik poti** v istem zavihku pozabi vse prenesene razdalje (npr. po večji spremembi cest).

---

### 11.7 Google ključ za kilometrino (neobvezno): nastavitev, stroški, odpravljanje težav
Neobvezno; **brez njega kilometrina deluje brezplačno (10.3, 11.9)**. Najprej 0.2, točka 5 (DPO). Podrobnosti Googlovega vmesnika in cen se spreminjajo, zato **preveri trenutno dokumentacijo (Routes API – Compute Routes) in cenik**; v mojem okolju Googlovih strani ni bilo mogoče prebrati, zato cene in brezplačne kvote **ne navajam**.
1. V **Google Cloud Console** ustvari projekt (lahko s pravnim subjektom ZD) in vklopi **obračun** (Google za Maps Platform zahteva plačilno sredstvo).
2. **APIs & Services** → vklopi **Routes API**.
3. **Credentials** → **Create credentials** → **API key**. Ključ takoj **omeji**: *Application restrictions* → **Websites (HTTP referrers)** → naslov tvoje strani, npr. `https://UPORABNIK.github.io/*`; *API restrictions* → **samo Routes API**.
4. Nastavi **proračunsko opozorilo in dnevno kvoto** (Billing → Budgets & alerts; APIs → Quotas), da te nepričakovana poraba ne preseneti.
5. V aplikaciji: **Nastavitve → Izračun → Google Zemljevidi (neobvezno)** → vpiši ključ → **Shrani** → **Preveri Google**. Pričakovano: »Google deluje: SB Brežice → UKC Ljubljana: … km«. Ključ, vpisan tukaj, velja samo za to napravo; za vse naprave ga vpiši v `config.js` (`google.key`).
6. Če preizkus ne uspe: **403** = ključ ni omejen na pravi naslov ali Routes API ni vklopljen; **429** = prekoračena kvota; **brez povezave** = naprava ali omrežje blokira `routes.googleapis.com`. Aplikacija nato računa po cestah OSM ali z oceno.
7. Možnost **»Upoštevaj promet pri času vožnje«** je privzeto izklopljena (je dražja zahteva in za kilometrino ni potrebna).
8. Ključa nikoli ne pošiljaj po e-pošti in ga ne objavljaj; če je ušel, ga v konzoli **zavrti** (rotate) in vpiši novega.

### 11.8 Podlaga zemljevida: ploščice, pogoji uporabe, lasten strežnik
- Privzeto so ploščice **OpenStreetMap** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) s pripisom »© prispevajoči OpenStreetMap« (ne odstranjuj). Javni strežnik ploščic je namenjen **zmerni rabi** (pogoji: operations.osmfoundation.org/policies/tiles). Za več pisarn ali redno delo uporabi lasten strežnik ploščic ali ponudnika z dogovorom.
- Zamenjava: v `config.js` dodaj `tiles: { url:'https://tvoj-streznik/{z}/{x}/{y}.png', attribution:'© …', link:'https://…', maxZoom:19 }` (`url:''` izklopi podlago za vse). Nato v `source/build-prod.py` v `img-src` dodaj izvor strežnika (CSP drugače blokira slike) in ponovno zgradi (`python3 build-prod.py`).
- Brskalnik pri ploščicah pošlje samo **izvor strani** (ne poti) kot Referer, ker ga pravila OSM zahtevajo; stran sicer ne pošilja Refererja.
- Vsak uporabnik lahko podlago izklopi (Nastavitve → Izračun → Zemljevid poti ali gumb ▦ na zemljevidu); izbira velja za to napravo. Aplikacija v spletnem predpomnilniku brskalnika uporablja običajno shranjevanje ploščic (service worker jih ne prestreza).
- Poti in točke se rišejo v brskalniku; strežnik ploščic ne dobi nobenega podatka o prevozih.

---

### 11.9 Iskanje naslovov (Nominatim): pravila, zasebnost, lasten strežnik, odpravljanje težav
**Kaj se pošlje:** samo besedilo naslova (npr. »Dobova 25«), brez imena pacienta, telefona, naloga ali ure. Strežnik vidi še IP naslov naprave in izvor strani (Referer). Naslovi pacientov so osebni podatki: za redno delo z resničnimi pacienti to vključi v oceno pooblaščenca (0.2, točka 5) ali uporabi lasten strežnik (spodaj).

**Pravila javnega strežnika** (operations.osmfoundation.org/policies/nominatim, preveri tudi sam): največ **1 zahtevek na sekundo**, rezultate je treba shranjevati, ni množičnega iskanja in samodokončanja med tipkanjem, zahtevek mora imeti veljaven Referer ali User-Agent. Aplikacija to upošteva: zahtevki gredo po vrsti z razmikom 1,1 s, iskanje steče šele po potrditvi vnosa, vsak naslov se išče enkrat (pomnilnik seje, točka pri pacientu, ročni popravki). Ob 429 počiva eno minuto, ob 403 deset minut. Referer je samo izvor strani (npr. `https://uporabnik.github.io`), zato aplikacija mora teči prek `https` (odprta kot datoteka `file://` Refererja nima).

**Preizkus:** Nastavitve → Izračun → **Preveri iskanje naslovov** (en zahtevek: Zdravstveni dom Brežice; pričakovano »deluje … m od znane točke postaje«). Če ne uspe: **brez povezave** = omrežje ali brskalnik blokira `nominatim.openstreetmap.org`; **403** = Referer manjka ali je naslov blokiran; **429** = preveč zahtevkov.

**Lasten ali drug strežnik:** `config.js` → `geocode.url` (mora biti `https`, združljiv z Nominatim API `/search`); v `build-prod.py` v `connect-src` dodaj njegov izvor in ponovno zgradi. `geocode.url: ''` iskanje izklopi (km po središču naselja z oznako ~). `geocode.email` je neobvezen stik za vzdrževalce javnega strežnika.

**Popravki točk (`geoFix`)** so del skupnih nastavitev (`cfg/main`); pravila baze (`firestore.rules`) dovolijo zapis tudi dispečerju. **Po posodobitvi pravil v Firebase konzoli** (korak 3) jih vnovič prilepi, sicer dispečer popravka ne more shraniti.

**Podatki:** © prispevajoči OpenStreetMap (ODbL); pripis je viden ob zemljevidu. Če boš za redno delo vseeno želel uradne hišne številke GURS, jih uvoziš po razdelku 11.3 (`naslovi.json`); uvožen naslov ima prednost in ne zahteva iskanja.

## 12. Lokalni (demo) način – brez oblaka

Če v `config.js` pustiš `VSTAVI` ali nastaviš `mode: 'local'`, aplikacija deluje samo v tvojem brskalniku: račun se ustvari ob prvem zagonu, podatki ostanejo na napravi. Namenjen je **preizkušanju z izmišljenimi podatki**. Voznik na svojem telefonu v tem načinu ne vidi razporeda, ker podatkov ne deli nihče.

---

## 13. Odpravljanje težav

| Težava | Vzrok / rešitev |
|---|---|
| Na prijavi piše »Povezava s Firebase ni uspela« | Preveri `config.js` (štiri vrednosti, brez presledkov, presledki znotraj narekovajev), internet, domeno v **Authorized domains** in omejitev API ključa (5.3). |
| »Račun nima dodeljene vloge ali je onemogočen« | Dokument `users/{UID}` manjka ali ima napačen UID, `role` ali `active` (razdelek 6). |
| »Dostop zavrnjen« pri dispečerju | Skrbnik se ni nikoli prijavil (manjka `cfg/main`), ali račun nima vloge. Skrbnik naj se prijavi. |
| Voznik ne vidi razporeda | Dispečer ni pritisnil **Objavi razpored**; voznik ni povezan z zaposlenim v razporedu; ali nista v isti ekipi/vozilu. Dispečer v **Razpored** preveri, da je račun povezan (7.2). |
| Statusi se ne prikažejo dispečerju | Voznik nima signala (koraki čakajo); preveri, da je aplikacija odprta. |
| Stara različica po posodobitvi | Zapri aplikacijo in jo odpri še enkrat; na iPhonu odstrani ikono in jo ponovno dodaj. |
| Prijava na iPhonu ne ostane | Vključena je samodejna odjava po 30 min; po odjavi se zahteva ponovna prijava. Obkljukaj »Ostani prijavljen« samo na osebnem, zaklenjenem telefonu. |
| Vrstica »Cestni podatki: ni povezave« ali ure so označene z ~ | Strežnik za ceste ni dosegljiv ali ni nastavljen. Razpored deluje z oceno (zračna razdalja × faktor). Klikni **Poskusi znova**; v Nastavitve → Izračun klikni **Preveri cestne podatke**. Če sporoča napako CSP, izvor strežnika ni v `connect-src` (11.6). |
| Čas ali kilometri se ne ujemajo z navigacijo | Aplikacija ne pozna prometa v živo, naselja so predstavljena s središčno točko. Nastavi popravek časa vožnje ali vpiši točnejše koordinate naselja (Nastavitve → Naslovi in naselja). |
| Zapisi se čez dan nenadoma ne shranjujejo | Morda je presežena dnevna kvota Firestore Spark (razdelek 0.1): preveri **Usage** v Firebase konzoli; kvota se ponastavi vsak dan, ali zmanjšaj število hkrati odprtih naprav. |

---

## 14. Kaj je preizkušeno in kaj ne

**Preizkušeno (88 samodejnih preverjanj v brskalniku, 55 preizkusov planerja, razpoznave in kilometrine):**
- Dispečer objavi razpored, voznik in spremljevalec prejmeta svoj del, koraki (sprejem → na poti → na kraju → v vozilu → na cilju → zaključi, »ni doma«, odklonitev, popravek ure) pridejo do dispečerja; v knjigo se samodejno vpišeta čas in »Kdo je naredil odvoz«.
- Planer: strogo, samodejno, prosto; 6 pacientov v Avto 13 (običajno 4, največ 6); nadure; ležeči brez nosil ostane nerazporejen; izjema pri prevozu v strogem načinu; vse prilagoditve so izpisane.
- Nalogi: izračun veljavnosti, opozorilo na mejnem dnevu (30 dni letni, 7 dni mesečni), podaljšanje utiša opozorilo, samodejno izpolnjevanje iz baze pacientov, predogled za kopiranje.
- Povezava s Firebase: ves koda za prijavo, vloge, sinhronizacijo, objavo in statuse je preizkušena **proti nadomestnemu (lažnemu) Firebase SDK-ju**, vključno s strogim CSP. Preverjeno je, da voznikov brskalnik ne dostopa do `days`, `patients`, `cfg` in `audit`, in da dokumenti ustrezajo pravilom oblike Firestore (npr. brez ugnezdenih tabel).
- Mobilni zasloni (390 px), temni način, PWA in delovanje brez povezave (lupina aplikacije).
- **Cestno usmerjanje, kilometrina, klinike, dializa in planer** (mapa `source/tests`, zagon `cd source && node tests/run.js`): 33 preizkusov proti **posnetku (lažnemu) OSRM in Google Routes API-ju**: oblika zahtev, bloki do 40 + 40 točk, izpad in preklop strežnika, omejitev 429 in 403 brez zanke, relacije brez poti, več ciljev v eni vožnji, ležeči, ustrezno vozilo, konflikti, zaklep prevozov v teku, predlogi; **čakanje na pregled** (prevoz nazaj se ne vpisuje posebej, vozilo je zasedeno, združevanje samo z istim ciljem); **klinike** (ime, vzdevki, privzet čas pregleda); **dializa** (termini, dnevi, prosti čas posadke za sede paciente); **kilometrina** (ročni vpis ima prednost, pot nazaj pri čakanju, vir pri vsakem km, mesečno poročilo, CSV z BOM in decimalno vejico); poleg tega 48 preverjanj zgrajene aplikacije v Chromiumu (vrstice prevozov, en odprt urejevalnik, km čip, ročni in Google km, čakanje na pregled, dializa in klinike v nastavitvah, kartica Google s preizkusom, mesečna kilometrina in CSV, brez napak v konzoli, brez kršitev CSP, brez zunanjih klicev razen cestnih strežnikov in Googla ob vpisanem ključu, brez imen pacientov v zahtevkih za Google) ter pregled zaslona na telefonu (390 px, brez vodoravnega drsenja) in v temnem načinu. Izhodiščni izračun planerja je bil primerjan s prvotnim (v2_2) na 120 naključnih dneh: **enak rezultat**, kadar so nove možnosti izklopljene; nov planer v nobenem dnevu ni bil slabši od izhodišča, v 82 od 120 je našel krajši razpored (v povprečju okoli 10 % manj kilometrov po lastni oceni planerja, ne meritev).

- **Iskanje naslovov in kilometrina OSM** (`node tests/run.js`, `tests/browser.js`): oblika zahtevka Nominatim (samo besedilo naslova, omejitev na kraj, Referer samo izvor), vrsta z razmikom in enim zahtevkom naenkrat, pomnilnik, točka pri pacientu, 429/403/izpad, zavrnitev zadetka v drugem kraju, razvrstitev natančnosti, km iz točke naslova in OSRM, pot nazaj, ročni vnos ima prednost (tudi med tekočim izračunom), popravek točke na zemljevidu in preračun, prenos popravkov med napravami, nastavitve. Vse **proti posnetku (lažnemu) Nominatim in OSRM** z izmišljenimi naslovi.

**NI preizkušeno (v mojem okolju ni bilo dostopa do Googlovih strežnikov):**
- **Pravi zemljevid s prvimi ploščicami OpenStreetMap**: v mojem okolju ni bilo dostopa do strežnika ploščic, zato je zemljevid preizkušen s posnetkom strežnika ploščic (postavitev ploščic, povečava, povleci, okna, Referer samo z izvorom, izpad podlage). Videz prave podlage in odziv javnega strežnika (omejitve, glava Referer) preveri ob prvem zagonu.
- **Tisk knjige dneva** je preizkušen kot PDF; poravnavo na pravem tiskalniku preveri (A4, pokončno, brez prilagajanja strani).
- **Razpoznava hitrega vnosa** je preizkušena na primerih iz fotografij (izmišljena imena); resnični zapisi dispečerja bodo pokazali, katere kratice manjkajo (Nastavitve → Klinike in Naslovi).
- Točke **IMI Ljubljana** in **DSO Brežice** imajo približne koordinate in oznako »preveri«.
- **Povezava z živim Nominatim in točnost za tvoje naslove:** v okolju, kjer je bil paket narejen, strežnik Nominatim ni bil dosegljiv, zato **ne vem, koliko hišnih številk v Posavju je v OpenStreetMap** in kako Nominatim razume zapis »naselje + številka« (npr. »Dobova 25«). **Prvi pravi preizkus je gumb »Preveri iskanje naslovov« (11.9)**, nato nekaj pravih naslovov: tam, kjer hišne številke ni, aplikacija pokaže ~ in ponudi točko na zemljevidu. Razdalje primerjaj z Google Zemljevidi na prvih 10 vpisih.
- **Povezava z živim Google Routes API** – vse je preizkušeno samo proti posnetku odgovorov po dokumentaciji, ki je nisem mogel prebrati. **Prvi pravi preizkus je gumb »Preveri Google«** (11.7). Neznanke: ali brskalniški klic (CORS) z vašim ključem in naslovom strani deluje, točen cenik in kvota, ter ali Google naslove tipa »Dobova 25« razume enako kot v aplikaciji Zemljevidi. Če kilometrina odstopa od tistega, kar vidiš v Zemljevidih, jo popravi ročno in mi pošlji primer.
- **Kilometrina po Googlu ni enaka vozniški evidenci:** Google računa pot za osebni avto OD → DO; reševalno vozilo lahko vozi drugače. Kaj natančno šteje v kilometrino po internih in ZZZS pravilih (npr. vožnja od postaje do pacienta), bom uskladil s tvojimi primeri iz knjige.
- **Naslovi, časi pregleda in vzdevki klinik** so začetni predlogi po mojem spominu (ne iz uradnega vira): preveri jih v Nastavitve → Klinike.
- **Hitrost mesečnega kilometrskega poročila** na zelo polni knjigi (več sto prevozov na mesec) na starejših telefonih.
- **Povezava z živim strežnikom OSRM (javnim ali lastnim)** – v okolju, kjer je bil paket narejen, je bil dostop do teh strežnikov blokiran. Oblika zahtev in odgovorov sledi dokumentaciji OSRM v5, a **prvi pravi preizkus je gumb »Preveri cestne podatke«** (razdelek 11.6). Ne vem, kako natančno javni strežniki obravnavajo naše število zahtev.
- Točnost časov v primerjavi z resničnimi vožnjami (promet, zapore, hitrost reševalnega vozila) – potrebuje primerjavo na nekaj tednih resničnih prevozov.
- **Prava povezava s tvojim Firebase projektom** – prvi zagon (razdelek 6) je prvi pravi preizkus; samotest in Rules Playground (3.1, 6.1) ti povesta, ali pravila delujejo.
- **Veljavnost `firestore.rules` na pravem strežniku** – pravila nisem mogel zagnati v emulatorju. Napisana so po dokumentaciji; **prilepi jih in izvedi preizkuse iz razdelka 3.1**.
- Uvoz **prave** datoteke GURS z naslovi; namestitev na pravih telefonih iPhone/Android; omejitev API ključa.

**Pravno:** aplikacija sama ne nadomesti odobritve DPO (razdelek 0.2).
