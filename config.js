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
  firebase: {
    apiKey: 'VSTAVI-API-KEY',
    authDomain: 'VSTAVI-PROJECT-ID.firebaseapp.com',
    projectId: 'VSTAVI-PROJECT-ID',
    appId: 'VSTAVI-APP-ID'
  }
};
