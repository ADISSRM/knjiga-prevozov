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
  firebase: {
    apiKey: 'VSTAVI-API-KEY',
    authDomain: 'VSTAVI-PROJECT-ID.firebaseapp.com',
    projectId: 'VSTAVI-PROJECT-ID',
    appId: 'VSTAVI-APP-ID'
  }
};
