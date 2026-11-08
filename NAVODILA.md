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

**Vrstica »Cestni podatki«** v Dispečerju pove, ali so podatki po cestah (**v redu**), se še nalagajo, ali strežnik ni dosegljiv (**ni povezave**: razpored se vseeno sestavi z oceno, ponovni poskus teče sam; gumb **Poskusi znova**). Pred **Objavi razpored** aplikacija počaka (do 9 s), da prispejo manjkajoči cestni podatki, zato so objavljene ure čim bolj točne. Pri vsaki vožnji gumb **Pot** pokaže pot po cestah (brez podlage zemljevida; podatki © prispevajoči OpenStreetMap). V pogledu **Živo** je pri prevozih v teku ocena prihoda, izračunana iz zadnjega sporočila posadke.

**Točnost – poštena omejitev:** čas vožnje je izračunan iz cestnega omrežja in hitrostnih omejitev, **brez prometa v živo, zapor in zastojev** (po potrebi nastavi popravek časa, npr. 1,15). Naselja so predstavljena s središčno točko, kraji izven občine s središčem mesta; za vožnje do ustanov (UKC, SB Novo mesto …) so koordinate ustanove. Zato so ure prihoda **ocene**, ne jamstva.

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

**Preizkušeno (okoli 80 samodejnih preverjanj v brskalniku):**
- Dispečer objavi razpored, voznik in spremljevalec prejmeta svoj del, koraki (sprejem → na poti → na kraju → v vozilu → na cilju → zaključi, »ni doma«, odklonitev, popravek ure) pridejo do dispečerja; v knjigo se samodejno vpišeta čas in »Kdo je naredil odvoz«.
- Planer: strogo, samodejno, prosto; 6 pacientov v Avto 13 (običajno 4, največ 6); nadure; ležeči brez nosil ostane nerazporejen; izjema pri prevozu v strogem načinu; vse prilagoditve so izpisane.
- Nalogi: izračun veljavnosti, opozorilo na mejnem dnevu (30 dni letni, 7 dni mesečni), podaljšanje utiša opozorilo, samodejno izpolnjevanje iz baze pacientov, predogled za kopiranje.
- Povezava s Firebase: ves koda za prijavo, vloge, sinhronizacijo, objavo in statuse je preizkušena **proti nadomestnemu (lažnemu) Firebase SDK-ju**, vključno s strogim CSP. Preverjeno je, da voznikov brskalnik ne dostopa do `days`, `patients`, `cfg` in `audit`, in da dokumenti ustrezajo pravilom oblike Firestore (npr. brez ugnezdenih tabel).
- Mobilni zasloni (390 px), temni način, PWA in delovanje brez povezave (lupina aplikacije).
- **Cestno usmerjanje in planer** (mapa `source/tests`, zagon `node tests/run.js`): 21 preizkusov proti posnetku OSRM API-ja (oblika zahtev, bloki do 40 + 40 točk, izpad in preklop na drugi strežnik, omejitev hitrosti 429, relacije brez poti, uvoz/izvoz `razdalje.json`, Ljubljana, Novo mesto, več ciljev v eni vožnji, več izhodišč pri odvozu, ležeči, ustrezno vozilo, konflikti pacientov, zaklep prevozov v teku, predlogi, ocena prihoda v živo) ter 24 preverjanj zgrajene aplikacije v brskalniku Chromium (prikaz, ocene ETA, pot na zemljevidu, nastavitve, izklop, izpad in okrevanje, brez klicev razen na cestni strežnik, brez kršitev CSP). Izhodiščni izračun planerja je bil primerjan s prvotnim planerjem na 600 naključnih dneh (dva niza po 300): **enak rezultat**, kadar so cestni podatki in iskanje boljših razporedov izklopljeni.

**NI preizkušeno (v mojem okolju ni bilo dostopa do Googlovih strežnikov):**
- **Povezava z živim strežnikom OSRM (javnim ali lastnim)** – v okolju, kjer je bil paket narejen, je bil dostop do teh strežnikov blokiran. Oblika zahtev in odgovorov sledi dokumentaciji OSRM v5, a **prvi pravi preizkus je gumb »Preveri cestne podatke«** (razdelek 11.6). Ne vem, kako natančno javni strežniki obravnavajo naše število zahtev.
- Točnost časov v primerjavi z resničnimi vožnjami (promet, zapore, hitrost reševalnega vozila) – potrebuje primerjavo na nekaj tednih resničnih prevozov.
- **Prava povezava s tvojim Firebase projektom** – prvi zagon (razdelek 6) je prvi pravi preizkus; samotest in Rules Playground (3.1, 6.1) ti povesta, ali pravila delujejo.
- **Veljavnost `firestore.rules` na pravem strežniku** – pravila nisem mogel zagnati v emulatorju. Napisana so po dokumentaciji; **prilepi jih in izvedi preizkuse iz razdelka 3.1**.
- Uvoz **prave** datoteke GURS z naslovi; namestitev na pravih telefonih iPhone/Android; omejitev API ključa.

**Pravno:** aplikacija sama ne nadomesti odobritve DPO (razdelek 0.2).
