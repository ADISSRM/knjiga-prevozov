/* ============================================================================
   NASTAVITVE POVEZAVE – to datoteko urediš ENKRAT (korak 4 v NAVODILA.md).
   Vrednosti za "firebase" dobiš v Firebase konzoli: Project settings → General →
   Your apps → Web app → SDK setup and configuration → "Config".
   To NISO skrivnosti (so v vsaki spletni aplikaciji vidne); varnost zagotavljajo
   prijava in pravila v firestore.rules. Gesel in skrivnih ključev SEM NE VPISUJ.
   Dokler vrednosti ne vpišeš, aplikacija teče v DEMO načinu (podatki samo v tem brskalniku).
   ============================================================================ */
window.KP_CONFIG = {
  mode: 'firebase',                       // 'firebase' = skupna baza za vse; 'local' = samo preizkus v tem brskalniku
  userDomain: 'rp-brezice.example',       // "uporabniško ime" se v Firebase shrani kot ime@to-domeno (lahko pustiš kot je)
  sdkVersion: '10.14.1',                  // različica Firebase SDK (fiksirana)
  offline: true,                          // brskalnik hrani začasno kopijo za delo brez signala
  // CESTNO USMERJANJE (prave razdalje in časi vožnje po cestnem omrežju OpenStreetMap).
  // Strežniku se pošiljajo SAMO koordinate (brez imen, naslovov, pacientov); piškotkov in glav ne pošiljamo.
  // Privzeto javni strežnik OSRM (brezplačen, brez jamstva). Za redno rabo z resničnimi pacienti priporočamo
  // lasten strežnik (glej NAVODILA.md) – tukaj samo zamenjaš naslov; v CSP (build-prod.py) dodaš njegov izvor.
  //   url: ''  → cestno usmerjanje izklopljeno (aplikacija računa po stari oceni: zračna razdalja × faktor)
  routing: {
    url: 'https://router.project-osrm.org',
    fallback: ['https://routing.openstreetmap.de/routed-car']   // se uporabi, če prvi strežnik ne odgovori
  },
  // NATANČNA KILOMETRINA (Google Zemljevidi, Routes API). Kilometrina prevoza = razdalja OD → DO po najboljši poti.
  // Google dobi SAMO besedilo naslova OD in DO (brez imen, telefonov, nalogov). Naslovi pacientov so osebni podatki:
  // pred uporabo se posvetuj s pooblaščencem za varstvo podatkov (glej NAVODILA.md).
  // Ključ lahko vpišeš tukaj (velja za vse naprave) ali v aplikaciji: Nastavitve → Izračun (velja samo za to napravo).
  // Ključ OBVEZNO omeji na »HTTP referrer« (naslov te strani) in samo na »Routes API«. Prazno = Google izklopljen.
  google: {
    key: ''
  },
  // PODLAGA ZEMLJEVIDA (interaktivni zemljevid poti in dneva). Brskalnik pri strežniku ploščic zahteva slike za prikazano
  // območje (strežnik vidi IP, izvor strani in koordinate ploščic; podatkov o pacientih ne). Javni strežnik OSM je za zmerno rabo
  // (operations.osmfoundation.org/policies/tiles); za redno rabo uporabi lasten strežnik ploščic in njegov izvor dodaj v CSP
  // (build-prod.py, img-src). Pripis (attribution) mora ostati viden.
  //   url: ''  → podlaga izklopljena za vse (ostaneta pot in točke na nevtralni mreži)
  tiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© prispevajoči OpenStreetMap',
    link: 'https://www.openstreetmap.org/copyright',
    maxZoom: 19
  },
  firebase: {
    apiKey: 'VSTAVI-API-KEY',
    authDomain: 'VSTAVI-PROJECT-ID.firebaseapp.com',
    projectId: 'VSTAVI-PROJECT-ID',
    appId: 'VSTAVI-APP-ID'
  }
};
