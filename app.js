'use strict';
/* =====================================================================
   PODATKI: naselja Občine Brežice, ustanove, privzete nastavitve
   Imena naselij: uradni seznam (gov.si, Upravna enota Brežice).
   KOORDINATE SO PRIBLIŽNE (ocena na ~1 km). Popravi jih v Nastavitve > Naselja,
   ali uvozi CSV naslovov (GURS RPE) v Nastavitve > Naslovi.
   ===================================================================== */
const SETTLEMENT_RAW =
'Arnovo selo|45.98|15.54;Artiče|45.94|15.49;Bizeljska vas|46.01|15.70;Bizeljsko|46.02|15.71;Blatno|45.98|15.69;Bojsno|46.03|15.66;Boršt|45.99|15.65;Bračna vas|45.99|15.57;Brezje|45.94|15.57;Brezovica na Bizeljskem|46.03|15.69;'+
'Brežice|45.90|15.59;Brvi|45.98|15.59;Bukošek|45.99|15.62;Bukovje|45.99|15.63;Bušeča vas|45.88|15.57;Cerina|45.95|15.52;Cerklje ob Krki|45.89|15.50;Cirnik|45.92|15.50;Cundrovec|45.93|15.62;Curnovec|45.95|15.64;'+
'Čatež ob Savi|45.89|15.62;Čedem|45.99|15.55;Črešnjice pri Cerkljah|45.88|15.48;Dečno selo|45.86|15.58;Dednja vas|45.86|15.55;Dobeno|45.97|15.65;Dobova|45.90|15.66;Dolenja Pirošica|45.97|15.50;Dolenja vas pri Artičah|45.93|15.48;Dolenje Skopice|45.90|15.54;'+
'Dramlja|45.97|15.53;Drenovec pri Bukovju|45.99|15.62;Dvorce|45.93|15.48;Gabrje|45.94|15.55;Gaj|45.92|15.51;Gazice|45.93|15.57;Globočice|45.91|15.66;Globoko|45.91|15.48;Glogov brod|45.95|15.58;Gorenja Pirošica|45.98|15.49;'+
'Gorenje Skopice|45.91|15.53;Gornji Lenart|45.88|15.58;Gregovce|45.96|15.62;Hrastje|45.92|15.51;Izvir|45.90|15.68;Jereslavec|45.95|15.60;Jesenice|45.86|15.64;Kamence|45.95|15.55;Kapele|45.97|15.61;Koritno|45.97|15.68;'+
'Kraška vas|45.88|15.54;Križe|45.94|15.65;Krška vas|45.88|15.48;Laze|45.99|15.59;Loče|45.99|15.58;Mala Dolina|45.89|15.54;Mali Cirnik|45.92|15.51;Mali Obrež|45.92|15.62;Mali Vrh|45.92|15.53;Mihalovec|45.87|15.62;'+
'Mostec|45.91|15.61;Mrzlava vas|45.88|15.49;Nova vas ob Sotli|46.03|15.75;Nova vas pri Mokricah|45.84|15.63;Obrežje|45.86|15.71;Oklukova gora|45.98|15.47;Orešje na Bizeljskem|46.03|15.68;Pavlova vas|46.02|15.69;Pečice|45.94|15.63;Perišče|45.96|15.58;'+
'Piršenbreg|45.92|15.57;Pišece|46.00|15.46;Podgorje|45.94|15.51;Podgračeno|45.99|15.51;Podvinje|45.95|15.66;Ponikve|45.98|15.64;Poštena vas|45.88|15.67;Prilipe|45.90|15.69;Račja vas|45.88|15.60;Rajec|45.99|15.47;'+
'Rakovec|45.88|15.68;Ribnica|45.95|15.71;Rigonce|45.97|15.58;Sela|45.90|15.63;Silovec|45.98|15.67;Slogonsko|45.90|15.47;Slovenska vas|45.87|15.69;Sobenja vas|45.99|15.68;Spodnja Pohanca|45.91|15.55;Sromlje|45.97|15.52;'+
'Stankovo|45.99|15.69;Stara vas - Bizeljsko|46.00|15.72;Stojanski vrh|45.98|15.70;Trebež|45.88|15.64;Velika Dolina|45.89|15.53;Velike Malence|45.90|15.55;Veliki Obrež|45.91|15.63;Vinji vrh|45.96|15.57;Vitna vas|45.94|15.61;Volčje|45.96|15.55;'+
'Vrhje|45.94|15.55;Vrhovska vas|45.98|15.53;Zasap|45.91|15.66;Zgornja Pohanca|45.92|15.54;Zgornji Obrež|45.92|15.64;Žejno|45.87|15.65;Župeča vas|45.92|15.69;Dolenja vas|45.93|15.50;Župelevec|45.87|15.56';

const SETTLEMENTS = SETTLEMENT_RAW.split(';').map(s => { const p = s.split('|'); return { n: p[0], lat: +p[1], lon: +p[2] }; });

/* Delni seznam ulic v mestu Brežice. Dopolni z uvozom CSV ali pa se naslovi naučijo sami. */
const BREZICE_STREETS = ['Cesta prvih borcev','Trg izgnancev','Cesta bratov Milavcev','Černelčeva cesta','Cesta svobode','Bizeljska cesta','Prešernova ulica','Aškerčeva ulica','Levstikova ulica','Gubčeva ulica','Maistrova ulica','Šolska ulica','Cankarjeva ulica','Dalmatinova ulica','Ulica stare pravde','Kettejev drevored','Pod gradom'];

/* Ustanove (cilji prevozov). Koordinate približne. */
const DIA_DEFAULT = 'Dializni center Krško';   // privzeti dializni center (Nastavitve → Dializa ga lahko spremeni)
const POIS = [
  { n:'SB Brežice – dializa', al:['sb brezice dializa','dializa sb brezice','dializa sbb'],dia:true, lat:45.903, lon:15.590, sub:'Dializni center', home:true, extra:3, gq:'Splošna bolnišnica Brežice, Brežice' },
  { n:'SB Brežice', al:['sb brezice','bolnisnica brezice','splosna bolnisnica brezice','sb brez','sbb','sb b','nbo','interni oddelek','int ii','int i','int 1','int 2','s b b','kt','ct','itp'], lat:45.903, lon:15.590, sub:'Splošna bolnišnica Brežice', home:true, extra:3, gq:'Splošna bolnišnica Brežice, Brežice' },
  /* »Dializa KK« v knjigi = dializni center v Krškem (Nefrodial; KK je krška registrska oznaka). Koordinate približne – preveri. */
  { n:'Dializni center Krško', al:['dializa','dializni center','dializa kk','kk dializa','dializa k k','nefrodial','nefrodial kk','nefrodial krsko','dializa krsko','dializni center krsko'],dia:true, lat:45.9585, lon:15.4905, sub:'Dializni center Krško (Nefrodial)', extra:3, gq:'Nefrodial dializni center Krško' },
  { n:'ZD Brežice', al:['zd brezice','zdravstveni dom brezice','rp brezice','resevalna postaja','zd b'],ex:['zd'], lat:45.905, lon:15.589, sub:'Zdravstveni dom Brežice', home:true, extra:2, gq:'Zdravstveni dom Brežice, Brežice' },
  { n:'ZD Krško', al:['zd krsko','zdravstveni dom krsko','zd kk','zdkk'], lat:45.959, lon:15.492, sub:'Zdravstveni dom Krško', extra:2, gq:'Zdravstveni dom Krško, Krško' },
  { n:'SB Novo mesto', al:['sb novo mesto','bolnisnica novo mesto','sb nm','sbnm'], lat:45.803, lon:15.170, sub:'Splošna bolnišnica Novo mesto', extra:5, gq:'Splošna bolnišnica Novo mesto, Novo mesto' },
  { n:'SB Celje', al:['sb celje','bolnisnica celje'], lat:46.237, lon:15.265, sub:'Splošna bolnišnica Celje', extra:5, gq:'Splošna bolnišnica Celje, Celje' },
  { n:'UKC Ljubljana', al:['ukc ljubljana','ukc lj','ukcl','ukc l','klinicni center','kc ljubljana','kc lj','poliklinika','poliklinika lj','polikl lj'], lat:46.054, lon:14.525, sub:'Univerzitetni klinični center', extra:10, gq:'UKC Ljubljana, Zaloška cesta 2, Ljubljana' },
  { n:'Onkološki inštitut Ljubljana', al:['onkoloski institut','oi ljubljana','oi lj','oil','onkologija','onkolosko','onkoloski','lj onkolosko','lj onkologija','o i lj'], lat:46.064, lon:14.521, sub:'Zaloška cesta, Ljubljana', extra:5, gq:'Onkološki inštitut Ljubljana, Zaloška cesta 2, Ljubljana' },
  { n:'Stomatološka klinika Ljubljana', al:['stomatoloska klinika','stomatoloska klinika lj','stomatoloska lj','stomatoloska','stomatologija lj','zobna klinika lj'], lat:46.0517, lon:14.5129, sub:'Hrvatski trg, Ljubljana (preveri)', extra:5, gq:'Stomatološka klinika, Hrvatski trg 6, Ljubljana' },
  { n:'URI Soča Ljubljana', al:['uri soca','soca','rehabilitacija'], lat:46.062, lon:14.513, sub:'Linhartova, Ljubljana', extra:5, gq:'URI Soča, Linhartova cesta 51, Ljubljana' },
  { n:'IMI Ljubljana', al:['imi lj','imi','imi ljubljana','institut za mikrobiologijo','mikrobiologija ljubljana'], lat:46.0537, lon:14.5230, sub:'Inštitut za mikrobiologijo in imunologijo, Zaloška cesta 4, Ljubljana (preveri)', extra:3, gq:'Inštitut za mikrobiologijo in imunologijo, Zaloška cesta 4, Ljubljana' },
  { n:'SB Trbovlje', al:['sb trbovlje','bolnisnica trbovlje','splosna bolnisnica trbovlje','sb trb'], lat:46.155, lon:15.054, sub:'Splošna bolnišnica Trbovlje (preveri)', extra:5, gq:'Splošna bolnišnica Trbovlje, Trbovlje' },
  { n:'ZD Sevnica', al:['zd sevnica','zdravstveni dom sevnica'], lat:46.009, lon:15.302, sub:'Zdravstveni dom Sevnica (preveri)', extra:2, gq:'Zdravstveni dom Sevnica, Sevnica' },
  { n:'Spar Brežice (Carlos)', al:['carlos','spar','carlos spar','carlos caffe','carlos kavarna','spar brezice'], lat:45.9025, lon:15.5925, sub:'Prevzemna točka pri trgovini Spar (preveri)', home:true, extra:0, gq:'Spar Brežice, Brežice' },
  { n:'DSO Loka', al:['dso loka','loka','trubarjev dom','dom upokojencev loka','dso loka pri zidanem mostu'], lat:46.083, lon:15.277, sub:'Trubarjev dom upokojencev, Loka pri Zidanem Mostu (preveri)', extra:3, gq:'Trubarjev dom upokojencev Loka pri Zidanem Mostu' },
  { n:'Šmarješke Toplice', al:['smarjeske toplice','smarjeske','zdravilisce smarjeske toplice','toplice smarjeske'], lat:45.866, lon:15.222, sub:'Zdravilišče Šmarješke Toplice (preveri)', extra:5, gq:'Zdravilišče Šmarješke Toplice' },
  { n:'Zdravilišče Laško', al:['zdravilisce lasko','terme lasko','lasko zdravilisce'], lat:46.153, lon:15.234, sub:'Zdravilišče Laško (preveri)', extra:5, gq:'Zdravilišče Laško, Zdraviliška cesta 4, Laško' },
  { n:'Terme Čatež', al:['terme catez','catez terme','hotel catez','zdravilisce catez'], lat:45.891, lon:15.619, sub:'Terme Čatež (preveri)', extra:3, gq:'Terme Čatež, Topliška cesta 35, Čatež ob Savi' },
  { n:'DSO Brežice', al:['dso','dom starejsih obcanov','dom starejsih','dom upokojencev brezice'], lat:45.9045, lon:15.5895, sub:'Dom starejših občanov Brežice (preveri naslov)', home:true, extra:2, gq:'Dom starejših občanov Brežice, Brežice' },
  { n:'UKC Maribor', al:['ukc maribor','kc maribor'], lat:46.560, lon:15.635, sub:'Univerzitetni klinični center Maribor', extra:10, gq:'UKC Maribor, Ljubljanska ulica 5, Maribor' },
  { n:'Klinika Golnik', al:['golnik','bolnisnica golnik'], lat:46.349, lon:14.338, sub:'Univerzitetna klinika Golnik', extra:5, gq:'Univerzitetna klinika Golnik, Golnik 36, Golnik' },
  { n:'KBC Zagreb', al:['zagreb','kbc zagreb'], lat:45.820, lon:15.990, sub:'Hrvaška', extra:10, gq:'KBC Zagreb, Kišpatićeva 12, Zagreb, Hrvaška' }
];
/* Klinike in ambulante v bolnišnicah (začetni predlog; seznam v Nastavitve → Ustanove in klinike je mogoče dopolniti in popraviti).
   stay = tipično trajanje pregleda (min), ko reševalec počaka; naslov je predlog in ga preveri (Google ga uporabi za natančen izračun km). */
const CLINIC_SEED = [
  { p:'UKC Ljubljana', n:'Očesna klinika', al:['ocesna','ocna','oci'], addr:'Grablovičeva ulica 46, Ljubljana', stay:45 },
  { p:'UKC Ljubljana', n:'Kardiološka ambulanta', al:['kardiologija','kardioloska amb','kardio','kardioloska'], addr:'Zaloška cesta 7, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Interna klinika', al:['interna'], addr:'Zaloška cesta 7, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Nefrološka ambulanta', al:['nefrologija','nefroloska'], addr:'Zaloška cesta 7, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Kirurška klinika', al:['kirurgija','kirurska'], addr:'Zaloška cesta 7, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Travmatološka klinika', al:['travmatologija','travma'], addr:'Zaloška cesta 7, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Nevrološka klinika', al:['nevrologija','nevroloska'], addr:'Zaloška cesta 2, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'ORL klinika', al:['orl','otorinolaringologija'], addr:'Zaloška cesta 2, Ljubljana', stay:45 },
  { p:'UKC Ljubljana', n:'Dermatovenerološka klinika', al:['dermatologija','derma','dermatoloska','dermatoloska klinika','dermatolog'], addr:'Gradišče 4, Ljubljana', stay:45 },
  { p:'UKC Ljubljana', n:'Pediatrična klinika', al:['pediatrija','pediatricna'], addr:'Bohoričeva ulica 20, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Ginekološka klinika', al:['ginekologija','ginekoloska','ginekolog'], addr:'Šlajmerjeva ulica 3, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Klinika za infekcijske bolezni', al:['infekcijska','infekcije'], addr:'Japljeva ulica 2, Ljubljana', stay:60 },
  { p:'UKC Ljubljana', n:'Urgentni center', al:['uc','urgenca'], addr:'Zaloška cesta 2, Ljubljana', stay:0 },
  { p:'SB Brežice', n:'Kirurška ambulanta', al:['krg amb','krg','kirurska amb','kirurgija','kirurska ambulanta','kir amb'], addr:'', stay:30 },
  { p:'SB Brežice', n:'Interni oddelek', al:['int','int ii','int i','interna'], addr:'', stay:0 },
  { p:'SB Celje', n:'Očesni oddelek', al:['oci','ocesna'], addr:'', stay:45 },
  { p:'SB Celje', n:'Kardiološka ambulanta', al:['kardiologija','kardio'], addr:'', stay:60 },
  { p:'SB Novo mesto', n:'Očesna ambulanta', al:['oci','ocesna','okulist','okulistika','ocesni'], addr:'', stay:45 },
  { p:'SB Novo mesto', n:'Kardiološka ambulanta', al:['kardiologija','kardio'], addr:'', stay:60 },
  { p:'UKC Maribor', n:'Kardiološka ambulanta', al:['kardiologija','kardio'], addr:'', stay:60 },
  { p:'UKC Maribor', n:'Očesna klinika', al:['oci','ocesna'], addr:'', stay:45 }
];
const BASE_POI = POIS.find(p => p.n === 'ZD Brežice');

/* Večja mesta izven Občine Brežice (središče mesta, PRIBLIŽNO). Naslov v teh mestih se usmerja do središča mesta;
   za točen cilj uporabi ustanovo (npr. UKC Ljubljana) ali uvozi naslove. Besedilo naslova se NIKAMOR ne pošilja. */
const TOWNS = [
  { n:'Ljubljana', lat:46.0511, lon:14.5051 }, { n:'Novo mesto', lat:45.8044, lon:15.1689 }, { n:'Krško', lat:45.9592, lon:15.4922 },
  { n:'Brestanica', lat:45.9690, lon:15.4660 }, { n:'Sevnica', lat:46.0097, lon:15.3014 }, { n:'Kostanjevica na Krki', lat:45.8433, lon:15.4439 },
  { n:'Šentjernej', lat:45.8433, lon:15.3375 }, { n:'Trebnje', lat:45.9067, lon:15.0089 }, { n:'Radeče', lat:46.0658, lon:15.1814 },
  { n:'Zidani Most', lat:46.0833, lon:15.1667 }, { n:'Laško', lat:46.1544, lon:15.2347 }, { n:'Celje', lat:46.2300, lon:15.2600 },
  { n:'Velenje', lat:46.3597, lon:15.1100 }, { n:'Maribor', lat:46.5547, lon:15.6459 }, { n:'Ptuj', lat:46.4200, lon:15.8700 },
  { n:'Murska Sobota', lat:46.6625, lon:16.1664 }, { n:'Kranj', lat:46.2389, lon:14.3556 }, { n:'Koper', lat:45.5481, lon:13.7302 },
  { n:'Metlika', lat:45.6475, lon:15.3139 }, { n:'Črnomelj', lat:45.5708, lon:15.1894 }, { n:'Zagreb', lat:45.8150, lon:15.9819 },
  { n:'Samobor', lat:45.8014, lon:15.7106 }, { n:'Jastrebarsko', lat:45.6700, lon:15.6500 }, { n:'Krapina', lat:46.1608, lon:15.8797 }
];

/* Dializa: dopoldanska in popoldanska (čas v Nastavitve → Dializa). Stare skupine (D1, D2, SaD4, D3) se pri nalaganju pretvorijo. */
const DIA_TERMS = { dop:'Dopoldanska', pop:'Popoldanska' };
const diaTermOf = v => (v === 'dop' || v === 'pop') ? v : (v === 'D2' || v === 'SaD4') ? 'pop' : v ? 'dop' : '';
const DOW_LONG = ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'];
const DOW_SHORT = ['ned','pon','tor','sre','čet','pet','sob'];
const MONTHS = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
const MODES = { sede:'Sede', leze:'Leže', utila:'Utila', vzorci:'Vzorci' };   // vzorci = pošiljka brez pacienta (npr. vzorci za IMI Ljubljana): ne zasede sedeža
const PMODES = { sede:'Sede', leze:'Leže', utila:'Utila' };       // načini prevoza pacienta (pacienti, nalogi)
const VEH_VRSTE = { osebno:'Osebno vozilo', resevalni:'Reševalni kombi', transportni:'Transportni kombi' };
const VEH_FN = { vse:'Vsi prevozi', dializa:'Primarno dializa (drugo po potrebi)' };

/* ---------- Vloge, statusi prevoza, barve pacientov ---------- */
const ROLES = { skrbnik:'Skrbnik', dispecer:'Dispečer', voznik:'Voznik', spremljevalec:'Spremljevalec' };
const isCrewRole = r => r === 'voznik' || r === 'spremljevalec';
/* Potek prevoza. Voznik pritisne naslednji korak, čas se zapiše samodejno. */
const STATUSI = {
  nova:{ l:'Vpisan', s:'Vpisan', tone:'' },
  dodeljena:{ l:'Dodeljen posadki', s:'Dodeljen', tone:'info' },
  sprejeta:{ l:'Sprejet', s:'Sprejet', tone:'info' },
  na_poti:{ l:'Na poti do pacienta', s:'Na poti', tone:'warn' },
  na_kraju:{ l:'Na kraju (pri pacientu)', s:'Na kraju', tone:'warn' },
  v_vozilu:{ l:'Pacient v vozilu', s:'V vozilu', tone:'accent' },
  na_cilju:{ l:'Na cilju', s:'Na cilju', tone:'ok' },
  zakljucena:{ l:'Zaključen', s:'Zaključen', tone:'ok' },
  ni_doma:{ l:'Pacienta ni na naslovu', s:'Ni doma', tone:'bad' },
  odklonjena:{ l:'Posadka je odklonila', s:'Odklonjen', tone:'bad' },
  preklicana:{ l:'Preklican', s:'Preklican', tone:'bad' }
};
const STATUS_FLOW = ['dodeljena','sprejeta','na_poti','na_kraju','v_vozilu','na_cilju','zakljucena'];
const STATUS_BTN = { dodeljena:'Sprejmem prevoz', sprejeta:'Krenil sem k pacientu', na_poti:'Sem pri pacientu', na_kraju:'Pacient je v vozilu', v_vozilu:'Prispel na cilj', na_cilju:'Zaključi prevoz' };
const CASI_KLJUC = { sprejeta:'sprejeta', na_poti:'na_poti', na_kraju:'na_kraju', v_vozilu:'v_vozilu', na_cilju:'na_cilju', zakljucena:'zakljucena' };
const NALOG_VRSTE = {
  letna:{ l:'Letni', hint:'Dializa: velja do 1 leto (Navodilo ZZZS, 23. člen)' },
  mesecna:{ l:'Mesečni', hint:'Ponavljajoči prevozi v koledarskem mesecu pri istem izvajalcu' },
  enkratna:{ l:'Enkratni', hint:'Velja za en prevoz' },
  zdravljenje:{ l:'Za čas zdravljenja', hint:'Obsevanje ali kemoterapija: velja za čas zdravljenja' }
};
const ZDRAVNIK_VRSTE = ['osebni','nadomestni','NMP','napotni'];
/* 8 barv pacientov: odtenki so izbrani, da so berljivi na svetli in temni podlagi (glej CSS --pc0..--pc7) */
const PCOLORS = 8;

function defaultState(){
  return {
    v:2,
    settings:{
      speed:45, speedHw:85, lim:{ naselje:50, izven:90, hitra:110, avtocesta:130 }, eff:85, road:1.3, pickMin:4, dropMin:3, buffer:15, window:90, windowFar:180, farMin:40, detour:25, maxRide:120, nnMaxKm:60,
      shift:'06:00', idleMin:30, slots:35, waitTol:10,
      routing:{ on:true, factor:1 },   // cestni podatki (OSRM); faktor = množitelj trajanja vožnje (1 = podatki OSRM)
      optimize:true, destMin:12, maxDests:3, waitMax:90,   // optimizacija razporeda, »sorodni cilji« (največ min med cilji), največ ciljev v eni vožnji, opozorilo za čakanje

      pickLeze:10, dropLeze:8, pickUtila:8, dropUtila:6,   // čas nalaganja in odpuščanja pri leže in utila pacientu (min)
      stayDef:45, extraDef:5,                               // privzet čas pregleda, ko reševalec počaka; privzeta pot od vhoda do ambulante
      diaT:{ dop:{ start:'06:30', end:'10:30' }, pop:{ start:'11:30', end:'15:30' } },   // dializa: dopoldanska in popoldanska
      google:{ on:true, auto:true, traffic:false },         // natančni km prek Google Maps (neobvezno; ključ v config.js ali v tej napravi)
      tisk:{ startnina:'', kmDec:1, voznik:true, od:'v_vozilu', dx:0, dy:0, sx:100, sy:100, fs:9 },   // tisk dopolnil na papirnati nalog (NLG/05)
      geocode:{ on:true, auto:true }                        // brezplačno iskanje naslovov (ulica + hišna številka) v OpenStreetMap; km = točka naslova + cestna pot OSRM
    },
    /* Prilagodljiva pravila: "običajno" velja, "prilagoditev" se uporabi samo, ko je potrebna (ali ko dispečer tako izbere). */
    rules:{
      mode:'samodejno',            // strogo | samodejno | prosto
      enforceShift:true, shiftHours:8, overtimeMax:240,
      bend:{ maxRide:180, detour:45, window:120, buffer:5 },
      opozoriloDni:30, opozoriloKratki:7
    },
    vehicles:[
      { id:'v04', name:'Avto 04', reg:'', tip:'sanitetno', ns:'redna', sede:3, leze:1, utila:0, skupaj:4, sedeMax:3, lezeMax:1, utilaMax:0, skupajMax:4, aktiv:true },
      { id:'v13', name:'Avto 13', reg:'', tip:'sanitetno', ns:'redna', sede:4, leze:0, utila:0, skupaj:4, sedeMax:6, lezeMax:0, utilaMax:0, skupajMax:6, aktiv:true },
      { id:'c1', name:'C1 rdeči', tip:'sanitetno', ns:'oboje', sede:2, leze:0, utila:0, skupaj:2, sedeMax:2, lezeMax:0, utilaMax:0, skupajMax:2, aktiv:true },
      { id:'ost', name:'OSTALO', tip:'ostalo', ns:'oboje', sede:0, leze:0, utila:0, skupaj:0, sedeMax:0, lezeMax:0, utilaMax:0, skupajMax:0, aktiv:true }
    ],
    places:CLINIC_SEED.map((c, i) => ({ id:'k' + i, parent:c.p, n:c.n, al:c.al, addr:c.addr, lat:null, lon:null, stay:c.stay, extra:null })),
    staff:[], patients:[], duty:{}, vehOff:{}, rides:{}, crewBook:{}, notices:[], dayNote:{}, dayRules:{}, published:{}, nadure:{}, audit:[], diaPatients:[], addrBook:[], coordOv:{}, extraSlots:{}
  };
}

/* Dovoljenja po vlogah. Prava pravila varnosti so v firestore.rules; to je samo za vmesnik in lokalni način. */
const PERM = {
  skrbnik:['book','publish','patients','staff','settings','users','audit'],
  dispecer:['book','publish','patients','staff'],
  voznik:['crew'],
  spremljevalec:['crew']
};

/* =====================================================================
   JEDRO: pomočniki, datumi, shramba, uporabniki, geokodiranje, predlogi naslovov
   ===================================================================== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g,'d').toLowerCase().trim();
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');

/* ---------- Seznam zaposlenih iz besedila ----------
   En zaposleni na vrstico (ali ločeno z vejico, podpičjem, tabulatorjem). Sprejme »Ana K.«, »Ana K«, »AnaK« (zlepljeno, kot je napisano na papirnem seznamu)
   in »Ana Kos«: zlepljeno ime se loči (»AnaK« → »Ana K.«), začetnica priimka dobi piko, VELIKE ali male črke se popravijo. Dvojniki (z obstoječimi in znotraj seznama) se preskočijo. */
function parseStaffList(text, existing){
  const seen = new Set((existing || []).map(norm)), add = [], dup = [], bad = [];
  const cap = w => (w.length > 1 && (w === w.toLocaleUpperCase('sl') || w === w.toLocaleLowerCase('sl'))) ? w.charAt(0).toLocaleUpperCase('sl') + w.slice(1).toLocaleLowerCase('sl') : w;
  String(text || '').split(/[\r\n;,\t]+/).forEach(raw => {
    let t = raw.replace(/^\s*(?:\d+\s*[.)]\s+|[-•*]\s+)/, '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    t = t.replace(/(\p{Ll})(\p{Lu})(?=\.|\s|$)/u, '$1 $2');
    if (!/^\p{L}[\p{L} .'’\-]*$/u.test(t) || t.length > 60){ bad.push(raw.trim()); return; }
    const parts = t.split(' ').filter(Boolean).map((w, i, a) => {
      const ini = i === a.length - 1 && i > 0 && /^\p{L}\.?$/u.test(w);
      return ini ? w.charAt(0).toLocaleUpperCase('sl') + '.' : cap(w);
    });
    const name = parts.join(' '), k = norm(name);
    if (seen.has(k)){ dup.push(name); return; }
    seen.add(k); add.push(name);
  });
  return { add, dup, bad };
}

/* ---------- Datumi ---------- */
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); };
const todayStr = () => ymd(new Date());
const dow = s => parseYmd(s).getDay();
const dowName = s => DOW_LONG[dow(s)];
const fmtLong = s => { const d = parseYmd(s); return `${DOW_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = s => { const d = parseYmd(s); return `${DOW_SHORT[d.getDay()]} ${d.getDate()}. ${d.getMonth()+1}.`; };
const daysInMonth = (y, m) => new Date(y, m+1, 0).getDate();

function easter(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
        h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
        mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y, mo-1, da);
}
const HOLI_FIXED = {'01-01':'novo leto','01-02':'novo leto','02-08':'Prešernov dan','04-27':'dan upora proti okupatorju','05-01':'praznik dela','05-02':'praznik dela','06-25':'dan državnosti','08-15':'Marijino vnebovzetje','10-31':'dan reformacije','11-01':'dan spomina na mrtve','12-25':'božič','12-26':'dan samostojnosti in enotnosti'};
function holiday(s){
  const d = parseYmd(s), key = `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if (HOLI_FIXED[key]) return HOLI_FIXED[key];
  const e = easter(d.getFullYear()); const em = new Date(e); em.setDate(e.getDate()+1);
  if (ymd(em) === s) return 'velikonočni ponedeljek';
  return '';
}
/* Vikend in prazniki: pripravljenost (2 zaposlena) */
const isStandby = s => { const w = dow(s); return w === 0 || w === 6 || !!holiday(s); };
/* Dializa: termini (dopoldanska / popoldanska), v katerih ta dan vozi vsaj en pacient iz registra dialize */
const diaTermsFor = s => Object.keys(DIA_TERMS).filter(t => S.patients.some(p => p.dt && p.dt.t === t && (p.dt.d || []).includes(dow(s))));

/* ---------- Čas ---------- */
const toMin = t => { if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null; const [h,m] = t.split(':').map(Number); return h*60+m; };
const fmtT = m => { if (m == null || !isFinite(m)) return '–'; m = Math.round(m); const neg = m < 0; m = Math.abs(m) % 1440; return (neg?'-':'') + pad(Math.floor(m/60)) + ':' + pad(m%60); };
const fmtDur = m => { m = Math.round(m); return m >= 60 ? `${Math.floor(m/60)} h ${pad(m%60)} min` : `${m} min`; };

/* ---------- Shramba (try/catch: brskalnik lahko shranjevanje blokira) ---------- */
const memStore = {};
const store = {
  get(k){ try { const v = localStorage.getItem(k); return v === null ? (memStore[k] ?? null) : v; } catch(e){ return memStore[k] ?? null; } },
  set(k, v){ memStore[k] = v; try { localStorage.setItem(k, v); } catch(e){} },
  del(k){ delete memStore[k]; try { localStorage.removeItem(k); } catch(e){} }
};
const sess = {
  get(k){ try { return sessionStorage.getItem(k); } catch(e){ return memStore['s.'+k] ?? null; } },
  set(k, v){ memStore['s.'+k] = v; try { sessionStorage.setItem(k, v); } catch(e){} },
  del(k){ delete memStore['s.'+k]; try { sessionStorage.removeItem(k); } catch(e){} }
};

let S = null;       // stanje aplikacije (vse, kar uporabnik trenutno vidi)
let USERS = [];     // lokalni uporabniki (samo lokalni način)
let ME = null;      // prijavljen uporabnik {id, name, role, staffId, username}
let rev = 0;        // števec sprememb (za razveljavitev predpomnilnika razporeda)
let flushTimer = null;

function mergeDefaults(target, def){
  for (const k of Object.keys(def)){
    if (target[k] === undefined) target[k] = clone(def[k]);
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object') mergeDefaults(target[k], def[k]);
  }
  return target;
}
function setSaving(busy){
  const el = $('#savepill'); if (!el) return;
  el.classList.toggle('busy', busy);
  el.lastChild.textContent = busy ? ' Shranjujem …' : ' Shranjeno';
}
/* queueFlush: zapiši spremembe v bazo (brez razveljavitve predpomnilnika razporeda) */
function queueFlush(){
  setSaving(true);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(async () => {
    try { await flush(); } catch(e){ console.error(e); toast('Shranjevanje ni uspelo. Preveri povezavo in vlogo.'); }
    setSaving(false);
  }, 350);
}
function save(){ rev++; PLAN_CACHE.clear(); queueFlush(); }
function saveUsers(){ store.set('kp.users', JSON.stringify(USERS)); }
function toast(msg){
  const t = $('#toast'); if (!t) return;
  const d = document.createElement('div'); d.textContent = msg; t.appendChild(d);
  setTimeout(() => d.remove(), 2800);
}
async function copyText(text, ok='Kopirano'){
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch(e){
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(ok); } catch(e2){ toast('Kopiranje ni uspelo. Označi besedilo ročno.'); }
    ta.remove();
  }
}

/* ---------- Gesla (lokalni način, PBKDF2) ---------- */
const b64e = u8 => btoa(String.fromCharCode(...u8));
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPw(pw, saltB64, iter=150000){
  if (!(window.crypto && crypto.subtle)) throw new Error('nosubtle');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:b64d(saltB64), iterations:iter, hash:'SHA-256' }, key, 256);
  return b64e(new Uint8Array(bits));
}
async function makeUser(username, name, role, pw, extra={}){
  const salt = b64e(crypto.getRandomValues(new Uint8Array(16)));
  return { id:uid(), username:username.trim(), name:name.trim() || username.trim(), role, salt, iter:150000, hash: await hashPw(pw, salt, 150000), ...extra };
}
const isAdmin = () => !!(ME && ME.role === 'skrbnik');
const can = a => !!(ME && (PERM[ME.role] || []).includes(a));
const isCrew = () => !!(ME && (ME.role === 'voznik' || ME.role === 'spremljevalec'));
let lastActivity = Date.now();
['click','keydown','input','touchstart'].forEach(ev => document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive:true }));
const idleLimit = () => ((S && S.settings && S.settings.idleMin) || 30) * 60000;
setInterval(() => { if (ME && Date.now() - lastActivity > idleLimit()) logout('Odjava zaradi nedejavnosti.'); }, 30000);

/* ---------- Geokodiranje (naselja, ustanove, uvoženi naslovi) ---------- */
let ADDR = { list:[], map:new Map() };   // uvoženi naslovi: {t, n, lat, lon}
let SHARED_ADDR = [];   // skupna datoteka naslovi.json (v mapi spletne strani): enaka na vseh napravah
async function loadSharedAddr(){
  if (!/^https?:$/.test(location.protocol)) return;
  try { const r = await fetch('naslovi.json', { cache:'no-cache' }); if (!r.ok) return; const a = await r.json(); if (Array.isArray(a)){ SHARED_ADDR = a.filter(x => Array.isArray(x) && typeof x[0] === 'string' && isFinite(x[1]) && isFinite(x[2])).slice(0, 40000); loadAddr(); } } catch(e){}
}
function loadAddr(){
  let raw = []; try { raw = JSON.parse(store.get('kp.addr') || '[]'); } catch(e){ raw = []; }
  raw = SHARED_ADDR.concat(raw);
  ADDR.list = raw.map(r => ({ t:r[0], n:norm(r[0]), lat:r[1], lon:r[2] }));
  ADDR.map = new Map(ADDR.list.map(a => [a.n, a]));
}
/* Kraji, ki jih dispečer piše krajše ali drugače, kot je uradno ime: Stara vas = Stara vas - Bizeljsko (edina v občini), Zakot je del Brežic */
const SET_ALIAS = [['Stara vas', 'Stara vas - Bizeljsko'], ['Zakot', 'Brežice'], ['Orešje', 'Orešje na Bizeljskem'], ['Gornje Skopice', 'Gorenje Skopice'], ['Gornja Pirošica', 'Gorenja Pirošica']];
const SET_IDX = [...SETTLEMENTS, ...SET_ALIAS.map(([a, t]) => { const s = SETTLEMENTS.find(x => x.n === t); return s ? { ...s, alias:a } : null; }).filter(Boolean)]
                           .map(s => { const nm = s.alias || s.n; return { ...s, nn:norm(nm), re:new RegExp('(^|[^a-z0-9])' + norm(nm).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?![a-z0-9])') }; })
                           .sort((a,b) => b.nn.length - a.nn.length);
const TOWN_IDX = TOWNS.map(s => ({ ...s, nn:norm(s.n), re:new RegExp('(^|[^a-z0-9])' + norm(s.n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?![a-z0-9])') }))
                      .sort((a,b) => b.nn.length - a.nn.length);
const BR_STREET_IDX = BREZICE_STREETS.map(x => norm(x).replace(/ (ulica|cesta|drevored)$/, '')).filter(x => x.length >= 5);
const BASE_POINT = { lat:BASE_POI.lat, lon:BASE_POI.lon };
function settlementPoint(s){ const o = S.coordOv[s.n]; return o ? { lat:o[0], lon:o[1] } : { lat:s.lat, lon:s.lon }; }

/* ---------- Ustanove, klinike in lastne ustanove (S.places) ----------
   Klinika je cilj »UKC Ljubljana – Očesna klinika«: enaka točka kot bolnišnica (ali lastna koordinata), svoj ključ, čas pregleda (stay)
   in pot od vhoda do ambulante (extra). Ujemanje: najdaljše ujemajoče ime (bolnišnica + klinika) ima prednost pred samo bolnišnico. */
const sepNorm = t => norm(t).replace(/[–—\-,\/.()]+/g, ' ').replace(/\s+/g, ' ').trim();
let PL = { rev:-1, S:null, all:[], match:[] };
function placeIndex(){
  if (PL.rev === rev && PL.S === S) return PL;
  const num = v => (v != null && v !== '' && isFinite(+v)) ? +v : null;
  const parents = new Map(POIS.map(p => [p.n, p]));
  const all = [];
  ((S && S.places) || []).filter(x => !x.parent && x.n).forEach(x => {   // lastne ustanove
    const la = num(x.lat), lo = num(x.lon);
    const p = { n:x.n, al:[norm(x.n), ...(x.al || []).map(norm)], lat:la ?? BASE_POI.lat, lon:lo ?? BASE_POI.lon, sub:x.addr || 'ustanova', extra:num(x.extra), stay:num(x.stay), gq:x.addr ? x.n + ', ' + x.addr : x.n, custom:true, noCoord:la == null || lo == null, fixed:la != null && lo != null, id:x.id };
    parents.set(p.n, p); all.push(p);
  });
  const clinics = [];
  ((S && S.places) || []).filter(x => x.parent && x.n).forEach(x => {
    const par = parents.get(x.parent); if (!par) return;
    const la = num(x.lat), lo = num(x.lon);
    clinics.push({ n:par.n + ' – ' + x.n, short:x.n, al:(x.al || []).map(norm), parent:par.n, parentAl:[norm(par.n), ...(par.al || [])], clinic:true,
      lat:la ?? par.lat, lon:lo ?? par.lon, sub:x.addr || par.sub, extra:num(x.extra) ?? par.extra ?? null, stay:num(x.stay), gq:[x.n, x.addr || par.gq || par.n].join(', '),
      noCoord:la == null && !!par.noCoord, fixed:la != null && lo != null, id:x.id });
  });
  const match = [], seen = new Map();
  clinics.forEach(c => { const b = sepNorm(c.short); seen.set(b, (seen.get(b) || 0) + 1); });
  clinics.forEach(c => {
    const names = [sepNorm(c.short), ...c.al.map(sepNorm)];
    c.parentAl.forEach(pa => names.filter(Boolean).forEach(cn => match.push({ s:sepNorm(pa) + ' ' + cn, poi:c })));
    if (/ljubljana/.test(norm(c.parent))) names.filter(cn => cn && cn.length >= 5).forEach(cn => { match.push({ s:cn + ' lj', poi:c }); match.push({ s:cn + ' ljubljana', poi:c }); });   // »Ginekolog LJ«, »ORL Ljubljana« brez imena bolnišnice
    const b = sepNorm(c.short); if (b.length >= 10 && seen.get(b) === 1) match.push({ s:b, poi:c });
  });
  all.push(...clinics);
  PL = { rev, S, all, match, customs:all.filter(p => p.custom) };
  return PL;
}
const poiPoint = p => ({ kind:p.noCoord ? 'neznano' : 'poi', poi:p, key:'poi:' + p.n, lat:p.lat, lon:p.lon, label:p.n });
/* Čas čakanja na pregled (min) in pot od vhoda do ambulante za cilj */
const poiExtra = g => (g && g.poi) ? (g.poi.extra != null ? g.poi.extra : (S.settings.extraDef ?? 5)) : 0;
const poiStay = g => (g && g.poi && g.poi.stay != null) ? g.poi.stay : (S.settings.stayDef ?? 45);

/* »Dializa KK« in splošno »dializa« pomenita dializni center, ki je v Nastavitve → Dializa (privzeto Dializni center Krško – »Dializa KK« v knjigi). */
function diaCenterFor(p){
  if (!p || !p.dia) return p;
  const want = S && S.settings && S.settings.diaPlace;
  if (!want || want === p.n) return p;
  return POIS.find(x => x.n === want) || placeIndex().customs.find(x => x.n === want) || p;
}
function geo(text){
  const t = norm(text);
  if (!t) return { kind:'prazno', key:'', lat:BASE_POINT.lat, lon:BASE_POINT.lon, label:'' };
  // 1) klinike (»UKC Ljubljana – Očesna klinika«) in lastne ustanove
  const pi = placeIndex();
  if (pi.all.length){
    const tn = sepNorm(text); let hit = null;
    for (const m of pi.match) if ((tn === m.s || tn.startsWith(m.s + ' ')) && (!hit || m.s.length > hit.s.length)) hit = m;
    if (hit) return poiPoint(hit.poi);
    for (const p of pi.customs){ const nn = [sepNorm(p.n), ...p.al.map(sepNorm)]; if (nn.some(a => a && (tn === a || tn.startsWith(a + ' ')))) return poiPoint(p); }
  }
  // 1b) ustanove (tudi dispečerski žargon: »O.I. LJ«, »UKC LJ.«, »SBB«, »ZD KK«; pike in vezaji se ob primerjavi spremenijo v presledke)
  const tj = sepNorm(text);
  for (const p of POIS){
    const names = [norm(p.n), ...p.al];
    if (names.some(a => t === a || t.startsWith(a + ' ') || t.startsWith(a + ',') || (a.length > 7 && t.includes(a))) ||
        [...names.map(sepNorm), ...(p.ex || [])].some(a => a && (tj === a || (!(p.ex || []).includes(a) && (tj.startsWith(a + ' ') || (a.length > 7 && tj.includes(a))))))){
      const q = diaCenterFor(p);
      return { kind:q.noCoord ? 'neznano' : 'poi', poi:q, key:'poi:'+q.n, lat:q.lat, lon:q.lon, label:q.n };
    }
  }
  // 2) uvoženi naslovi (natančni)
  const ex = ADDR.map.get(t) || ADDR.map.get(t.replace(/,\s*/g, ' ').replace(/\s+/g,' '));
  if (ex) return { kind:'addr', key:'a:'+ex.n, lat:ex.lat, lon:ex.lon, label:ex.t, naselje:'' };
  // 2b) ulica v Brežicah brez imena kraja (»Cankarjeva 5«, »Levstikova 12«): središče Brežic, ne »neznan naslov«
  { const hs = BR_STREET_IDX.find(x => t === x || t.startsWith(x + ' ') || t.startsWith(x + ',')); const sb = hs && SET_IDX.find(x => x.nn === 'brezice');
    if (sb){ const pt = settlementPoint(sb); return { kind:'naselje', key:'n:' + sb.n, lat:pt.lat, lon:pt.lon, label:sb.n, naselje:sb.n }; } }
  // 3) naselje: zadnja omemba v besedilu, najdaljše ime
  let best = null;
  for (const s of SET_IDX){
    const m = s.re.exec(t); if (!m) continue;
    const pos = m.index + m[1].length;
    if (!best || pos > best.pos || (pos === best.pos && s.nn.length > best.s.nn.length)) best = { s, pos };
  }
  if (best){ const pt = settlementPoint(best.s); return { kind:'naselje', key:'n:'+best.s.n, lat:pt.lat, lon:pt.lon, label:best.s.n, naselje:best.s.n }; }
  // 4) večje mesto izven občine (Ljubljana, Novo mesto, Krško …): središče mesta; zadnja omemba v besedilu
  let bt = null;
  for (const s of TOWN_IDX){
    const m = s.re.exec(t); if (!m) continue;
    const pos = m.index + m[1].length;
    if (!bt || pos > bt.pos || (pos === bt.pos && s.nn.length > bt.s.nn.length)) bt = { s, pos };
  }
  if (bt) return { kind:'mesto', key:'t:' + bt.s.n, lat:bt.s.lat, lon:bt.s.lon, label:bt.s.n, naselje:bt.s.n };
  // 5) brez ujemanja: center Brežic (cestnih podatkov za tak naslov ni; razdalja je ocena)
  return { kind:'neznano', key:'?:'+t, lat:BASE_POINT.lat, lon:BASE_POINT.lon, label:text.trim() };
}

/* ---------- Predlogi naslovov ---------- */
const hl = (label, q) => {
  if (!q) return esc(label);
  const i = norm(label).indexOf(q); if (i < 0) return esc(label);
  return esc(label.slice(0,i)) + '<mark>' + esc(label.slice(i, i+q.length)) + '</mark>' + esc(label.slice(i+q.length));
};
function suggestions(kind, raw){
  if (kind === 'patient') return patientSuggestions(raw);
  const q = norm(raw);
  const m = q.match(/^(.*?)(?:\s+(\d+\s?[a-z]?))?$/);
  const base = (m && m[1] ? m[1] : q).trim(), num = m && m[2] ? raw.trim().match(/(\d+\s?[a-zA-Z]?)\s*$/)[1].replace(/\s/g,'') : '';
  const out = [];
  const seen = new Set();
  const push = (label, sub, ins, score) => { if (seen.has(label)) return; seen.add(label); out.push({ label, sub, ins, score }); };
  const scoreOf = s => { const n = norm(s); if (!base) return 3; if (n.startsWith(base)) return 0; if (n.split(/[\s,-]+/).some(w => w.startsWith(base))) return 1; if (n.includes(base)) return 2; return 9; };
  if (!q){
    if (kind === 'to') POIS.slice(0,7).forEach(p => push(p.n, p.sub, p.n, 0));
    else { POIS.filter(p => p.home).forEach(p => push(p.n, 'ustanova v Brežicah', p.n, 0)); S.addrBook.slice(-4).reverse().forEach(a => push(a.t, 'zadnji naslovi', a.t, 1)); }
    return out.slice(0, 8);
  }
  POIS.forEach(p => { const sc = Math.min(scoreOf(p.n), ...p.al.map(scoreOf)); if (sc < 9) push(p.n, p.sub, p.n, sc - (kind==='to'?0.5:0)); });
  placeIndex().all.forEach(p => { const sc = Math.min(scoreOf(p.n), scoreOf(p.short || p.n), ...(p.al || []).map(scoreOf)); if (sc < 9) push(p.n, p.clinic ? 'klinika · ' + (p.sub || '') : p.sub, p.n, sc - (kind==='to'?0.7:0)); });
  S.addrBook.forEach(a => { const sc = scoreOf(a.t); if (sc < 9) push(a.t, 'že vpisan naslov', a.t, sc - 0.2); });
  if (ADDR.list.length){
    let c = 0;
    const toks = base.split(/\s+/).filter(Boolean);
    for (const a of ADDR.list){ if (toks.every(w => a.n.includes(w)) && (!num || a.n.includes(num.toLowerCase()))){ push(a.t, 'naslov (uvoz)', a.t, scoreOf(a.t)); if (++c >= 8) break; } }
  }
  BREZICE_STREETS.forEach(st => { const sc = scoreOf(st); if (sc < 9){ const full = num ? `${st} ${num}, Brežice` : null; if (full) push(full, 'ulica v Brežicah', full, sc); else push(st + ' …', 'ulica v Brežicah · dodaj hišno št.', st + ' ', sc + .1); } });
  SETTLEMENTS.forEach(s => { const sc = scoreOf(s.n); if (sc < 9){ const full = num ? `${s.n} ${num}` : s.n; push(full, 'naselje · Občina Brežice', full, sc + .3); } });
  TOWNS.forEach(s => { const sc = scoreOf(s.n); if (sc < 9){ const full = num ? `${s.n} ${num}` : s.n; push(full, 'mesto izven občine', full, sc + .4); } });
  out.sort((a,b) => a.score - b.score || a.label.length - b.label.length);
  return out.slice(0, 8);
}
let sg = { el:null, items:[], idx:-1, input:null, kind:'from' };
function sgRender(){
  const box = $('#suggest');
  if (!sg.input || !sg.items.length){ box.hidden = true; return; }
  const q = norm(sg.input.value);
  box.innerHTML = sg.items.map((it,i) => `<button type="button" role="option" data-i="${i}" aria-selected="${i===sg.idx}"><b>${hl(it.label, q)}</b><span>${esc(it.sub)}</span></button>`).join('');
  const r = sg.input.getBoundingClientRect();
  box.hidden = false;
  box.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 260)) + 'px';
  box.style.width = Math.max(r.width, 260) + 'px';
  const below = window.innerHeight - r.bottom;
  if (below < 220 && r.top > below){ box.style.top = 'auto'; box.style.bottom = (window.innerHeight - r.top + 4) + 'px'; }
  else { box.style.bottom = 'auto'; box.style.top = (r.bottom + 4) + 'px'; }
}
function sgOpen(input){
  sg.input = input; sg.kind = input.dataset.suggest; sg.items = suggestions(sg.kind, input.value); sg.idx = -1; sgRender();
}
function sgClose(){ sg.input = null; $('#suggest').hidden = true; }
function sgPick(i){
  const it = sg.items[i]; if (!it || !sg.input) return;
  const inp = sg.input;
  if (it.pid){
    const art = inp.closest('[data-ride]');
    if (art){ inp.value = it.ins; sgClose(); applyPatientToRide(art.dataset.date, art.dataset.ride, it.pid); rerender(); return; }
  }
  inp.value = it.ins;
  inp.dispatchEvent(new Event('input', { bubbles:true })); inp.dispatchEvent(new Event('change', { bubbles:true }));
  if (/\s$/.test(it.ins)) { inp.focus(); sgOpen(inp); } else sgClose();
}
/* Naslov, ki ga je dispečer vpisal, se shrani in je naslednjič med predlogi */
function learnAddress(text){
  const t = text.trim(); if (t.length < 4) return;
  const g = geo(t); if (g.kind === 'poi' || g.kind === 'neznano' || g.kind === 'prazno') return;
  if (S.addrBook.some(a => norm(a.t) === norm(t))) return;
  if ((g.kind === 'naselje' || g.kind === 'mesto') && norm(t) === norm(g.label)) return;
  S.addrBook.push({ t, s:g.naselje || '' }); if (S.addrBook.length > 3000) S.addrBook.shift();
}

/* =====================================================================
   PODATKOVNI SLOJ
   Dva načina, ista pot v kodi:
   - "local": podatki v tem brskalniku (demo, preizkus, artifact). Več zavihkov istega brskalnika se sinhronizira.
   - "firebase": skupna baza (Cloud Firestore) in prijava (Firebase Authentication). Za pravo uporabo.
   Dokumenti: cfg/main, days/{datum}, patients/{id}, crew/{datum}_{uid}, runs/{datum}_{vozilo}[/events/{id}], users/{uid}, audit/{id}
   ===================================================================== */
const KPC = window.KP_CONFIG || {};
const fbMissing = () => {   // katere vrednosti v config.js so prazne ali še »VSTAVI…«
  const f = KPC.firebase || {}, bad = k => !f[k] || /VSTAVI|YOUR_/i.test(String(f[k])) || (k === 'apiKey' && /xxxx/i.test(String(f[k])));
  return ['apiKey', 'authDomain', 'projectId', 'appId'].filter(bad);
};
const BACKEND = (KPC.mode === 'firebase' && KPC.firebase && fbMissing().length === 0) ? 'firebase' : 'local';
const CFG_BROKEN = !window.KP_CONFIG && (!!window.__kpCfgErr || (typeof document !== 'undefined' && !!document.querySelector('script[src*="config.js"]')));   // config.js naložen z napako ali manjka
/* Zakaj teče aplikacija v lokalnem načinu (prikaz na prijavi in v Varnost) */
const LOCAL_WHY = (() => {
  if (BACKEND === 'firebase') return '';
  const inDoc = typeof document !== 'undefined', hasCfgTag = inDoc && !!document.querySelector('script[src*="config.js"]');
  if (!window.KP_CONFIG){
    if (window.__kpCfgErr) return 'config.js vsebuje napako v zapisu (' + String(window.__kpCfgErr).slice(0, 90) + '). Odpri ga v Beležnici: pogosto manjka vejica, narekovaj ali zaklepaj.';
    return hasCfgTag ? 'config.js ni bil naložen (datoteke ni poleg index.html ali ima napako).' : 'To je samostojna predstavitvena stran brez config.js (npr. predogled v Claudu ali datoteka predogled.html). Nastavitve Firebase se berejo samo na strani iz mape web/ (index.html skupaj s config.js, objavljena prek GitHub Pages).';
  }
  if (KPC.mode !== 'firebase') return 'V config.js je mode »' + KPC.mode + '« (za skupno bazo mora biti »firebase«).';
  if (!KPC.firebase) return 'V config.js manjka blok »firebase«.';
  const m = fbMissing();
  return m.length ? 'V config.js so še prazne ali nadomestne vrednosti: ' + m.join(', ') + '.' : '';
})();
/* Domene e-naslovov računov: userDomain je ena domena ali seznam (niz z vejicami ali tabela), največ 3; uporabniško ime »ime« se išče kot ime@domena po vrsti */
const FB_USER_DOMAINS = [].concat(KPC.userDomain || 'rp-brezice.example').join(',').split(/[\s,;]+/).map(x => x.replace(/^@/, '').trim().toLowerCase()).filter(Boolean).slice(0, 3);
const FB_USER_DOMAIN = FB_USER_DOMAINS[0] || 'rp-brezice.example';
if (!FB_USER_DOMAINS.length) FB_USER_DOMAINS.push(FB_USER_DOMAIN);
let DB = null;

/* ---------- Pomočniki: razlika in zlivanje dokumentov (polje za poljem) ---------- */
const J = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
function diffDoc(a, b, prefix = '', ops = { set:{}, del:[], n:0 }){
  for (const k of Object.keys(b)){
    const p = prefix ? prefix + '.' + k : k;
    if (!(k in a)){ ops.set[p] = b[k]; ops.n++; }
    else if (isObj(a[k]) && isObj(b[k])) diffDoc(a[k], b[k], p, ops);
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])){ ops.set[p] = b[k]; ops.n++; }
  }
  for (const k of Object.keys(a)) if (!(k in b)){ ops.del.push(prefix ? prefix + '.' + k : k); ops.n++; }
  return ops;
}
function applyOps(doc, ops){
  const d = doc || {};
  for (const [p, v] of Object.entries(ops.set || {})){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1; i++){ if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = J(v);
  }
  for (const p of (ops.del || [])){
    const parts = p.split('.'); let o = d;
    for (let i = 0; i < parts.length - 1 && o; i++) o = o[parts[i]];
    if (o && isObj(o)) delete o[parts[parts.length - 1]];
  }
  return d;
}
const inRange = (id, r) => !r || ((r.from == null || id >= r.from) && (r.to == null || id <= r.to + '\uf8ff'));
const parentOf = p => p.slice(0, p.lastIndexOf('/'));
const idOf = p => p.slice(p.lastIndexOf('/') + 1);
const newId = () => Date.now().toString(36) + uid();

/* ---------- Lokalni adapter ---------- */
function localAdapter(){
  const PFX = 'kp2.d.', mem = new Map(), dW = new Map(), cW = new Map();
  try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith(PFX)){ try { mem.set(k.slice(PFX.length), JSON.parse(localStorage.getItem(k))); } catch(e){} } } } catch(e){}
  const persist = p => { try { if (mem.has(p)) localStorage.setItem(PFX + p, JSON.stringify(mem.get(p))); else localStorage.removeItem(PFX + p); } catch(e){} };
  const cur = p => (mem.has(p) ? clone(mem.get(p)) : null);
  const emit = p => {
    (dW.get(p) || []).forEach(f => f(cur(p)));
    const col = parentOf(p), id = idOf(p);
    (cW.get(col) || []).forEach(w => { if (inRange(id, w.range)) w.cb([{ id, data:cur(p) }], { initial:false }); });
  };
  const listIn = (col, range) => [...mem.keys()].filter(p => parentOf(p) === col && inRange(idOf(p), range)).sort().map(p => ({ id:idOf(p), data:cur(p) }));
  window.addEventListener('storage', e => {
    if (!e.key || !e.key.startsWith(PFX)) return;
    const p = e.key.slice(PFX.length);
    if (e.newValue == null) mem.delete(p); else { try { mem.set(p, JSON.parse(e.newValue)); } catch(_){ return; } }
    emit(p);
  });
  // revizijska sled v lokalnem načinu: obdrži zadnjih 1500
  const au = [...mem.keys()].filter(p => parentOf(p) === 'audit').sort();
  au.slice(0, Math.max(0, au.length - 1500)).forEach(p => { mem.delete(p); persist(p); });
  return {
    kind:'local',
    async get(p){ return cur(p); },
    async set(p, d){ mem.set(p, J(d)); persist(p); emit(p); },
    async patch(p, ops){ mem.set(p, applyOps(mem.has(p) ? clone(mem.get(p)) : {}, ops)); persist(p); emit(p); },
    async add(col, d){ const id = newId(); mem.set(col + '/' + id, { ...J(d), ts:new Date().toISOString() }); persist(col + '/' + id); emit(col + '/' + id); return id; },
    async del(p){ mem.delete(p); persist(p); emit(p); },
    async list(col, range){ return listIn(col, range); },
    watchDoc(p, cb){ const a = dW.get(p) || new Set(); dW.set(p, a); a.add(cb); setTimeout(() => cb(cur(p)), 0); return () => a.delete(cb); },
    watchCol(col, cb, range){ const w = { cb, range }, a = cW.get(col) || new Set(); cW.set(col, a); a.add(w); setTimeout(() => { if (a.has(w)) cb(listIn(col, range), { initial:true }); }, 0); return () => a.delete(w); },
    wipe(){ [...mem.keys()].forEach(p => { mem.delete(p); persist(p); }); },
    async shutdown(){}
  };
}

/* ---------- Firebase adapter (SDK se naloži z Googlovega CDN, fiksna različica) ---------- */
const fromFs = v => {
  if (v && typeof v === 'object'){
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (Array.isArray(v)) return v.map(fromFs);
    const o = {}; for (const k of Object.keys(v)) o[k] = fromFs(v[k]); return o;
  }
  return v;
};
async function firebaseAdapter(){
  const base = `https://www.gstatic.com/firebasejs/${KPC.sdkVersion || '10.14.1'}/`;
  const [A, AU, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const app = A.initializeApp(KPC.firebase);
  const auth = AU.getAuth(app);
  let db;
  try { db = F.initializeFirestore(app, KPC.offline === false ? {} : { localCache:F.persistentLocalCache({ tabManager:F.persistentMultipleTabManager() }) }); }
  catch(e){ db = F.getFirestore(app); }
  const dref = p => F.doc(db, p);
  const mkQuery = (col, range) => {
    let q = F.collection(db, col);
    if (range){ const cs = []; if (range.from != null) cs.push(F.where(F.documentId(), '>=', range.from)); if (range.to != null) cs.push(F.where(F.documentId(), '<=', range.to + '\uf8ff')); if (cs.length) q = F.query(q, ...cs); }
    return q;
  };
  const wErr = (what, cb) => err => { console.warn('Firestore listener', what, err && err.code); if (DB && DB.onError) DB.onError(what, err); if (cb) cb(); };
  return {
    kind:'firebase', auth, AU, F,
    async get(p){ const s = await F.getDoc(dref(p)); return s.exists() ? fromFs(s.data()) : null; },
    async set(p, d){ await F.setDoc(dref(p), J(d)); },
    async patch(p, ops){
      const upd = {}; Object.entries(ops.set).forEach(([k, v]) => { upd[k] = J(v); }); ops.del.forEach(k => { upd[k] = F.deleteField(); });
      try { await F.updateDoc(dref(p), upd); }
      catch(e){ if (e && e.code === 'not-found') await F.setDoc(dref(p), applyOps({}, { set:ops.set, del:[] })); else throw e; }
    },
    async add(col, d){ const r = await F.addDoc(F.collection(db, col), { ...J(d), ts:F.serverTimestamp() }); return r.id; },
    async del(p){ await F.deleteDoc(dref(p)); },
    async list(col, range){ const s = await F.getDocs(mkQuery(col, range)); return s.docs.map(d => ({ id:d.id, data:fromFs(d.data()) })); },
    watchDoc(p, cb){ return F.onSnapshot(dref(p), s => cb(s.exists() ? fromFs(s.data()) : null), wErr(p, () => cb(null))); },
    watchCol(col, cb, range){
      let first = true;
      return F.onSnapshot(mkQuery(col, range), snap => {
        const ch = snap.docChanges().map(c => ({ id:c.doc.id, data:c.type === 'removed' ? null : fromFs(c.doc.data()) }));
        const initial = first; first = false;
        if (ch.length || initial) cb(ch, { initial });
      }, wErr(col, () => { if (first){ first = false; cb([], { initial:true }); } }));
    },
    async shutdown(){ try { await F.terminate(db); await F.clearIndexedDbPersistence(db); } catch(e){} try { await AU.signOut(auth); } catch(e){} }
  };
}

/* ---------- Dokumenti: pretvorba med stanjem aplikacije in zbirkami ---------- */
function normalizeState(){
  S.settings.lim = Object.assign({ naselje:50, izven:90, hitra:110, avtocesta:130 }, S.settings.lim || {});
  if (S.settings.eff == null) S.settings.eff = 85;
  S.vehicles.forEach(v => { if (!v.vrsta) v.vrsta = (+v.leze > 0) ? 'resevalni' : 'osebno'; if (!v.fn) v.fn = 'vse'; });
  S.vehicles.forEach(v => {
    ['sede','leze','utila','skupaj'].forEach(k => { v[k + 'Max'] = Math.max(+v[k] || 0, v[k + 'Max'] == null ? (+v[k] || 0) : +v[k + 'Max']); });
  });
  S.patients = S.patients || [];
  if (S.settings.dia){   // stare dializne skupine → dopoldanska / popoldanska
    const d = S.settings.dia, T = S.settings.diaT = S.settings.diaT || {};
    if (d.D1 && d.D1.start) T.dop = { start:d.D1.start, end:d.D1.end };
    if (d.D2 && d.D2.start) T.pop = { start:d.D2.start, end:d.D2.end };
    delete S.settings.dia;
  }
  if (S.settings.nnMaxKm == null) S.settings.nnMaxKm = 60;
  if (!S.settings.v3){ if (S.settings.window === 60) S.settings.window = 90; S.settings.v3 = 1; }   // dispečer v praksi združuje ure v ~90 min oknu
  S.settings.google = Object.assign({ on:true, auto:true, traffic:false }, S.settings.google || {});
  S.settings.geocode = Object.assign({ on:true, auto:true }, S.settings.geocode || {});
  S.settings.tisk = Object.assign({ startnina:'', kmDec:1, voznik:true, od:'v_vozilu', dx:0, dy:0, sx:100, sy:100, fs:9 }, S.settings.tisk || {});
  S.geoFix = (S.geoFix && typeof S.geoFix === 'object') ? S.geoFix : {};
  S.places = Array.isArray(S.places) ? S.places : defaultState().places;
  if (S.settings.windowFar == null) S.settings.windowFar = 180;   // oddaljeni cilji: skupna vožnja kljub večjemu razponu ur (glej Nastavitve → Izračun)
  if (S.settings.farMin == null) S.settings.farMin = 40;
  if (!S.settings.v4){   // enkratno: kratice, ki jih dispečer uporablja v praksi (npr. »ginekolog«), dodaj tudi v že shranjene klinike
    CLINIC_SEED.forEach(c => { const p = S.places.find(x => x.parent === c.p && x.n === c.n); if (p){ p.al = Array.isArray(p.al) ? p.al : []; (c.al || []).forEach(a => { if (!p.al.includes(a)) p.al.push(a); }); } });
    S.settings.v4 = 1;
  }
  if (S.diaPatients && S.diaPatients.length){
    S.diaPatients.forEach(dp => { if (!S.patients.some(p => norm(p.name) === norm(dp.name))) S.patients.push(migratePatient(blankPatient({ name:dp.name, addr:dp.from, phone:dp.phone, mode:dp.mode, dia:dp.group, demo:dp.demo }))); });
    S.diaPatients = [];
  }
  S.patients.forEach(migratePatient);
}
/* Stara skupina dialize (D1, D2, SaD4, D3) → termin dialize pacienta { t:'dop'|'pop', d:[dnevi v tednu] } */
function migratePatient(p){
  if (p.dia !== undefined){ if (p.dia && !p.dt) p.dt = { t:diaTermOf(p.dia), d:p.dia === 'D3' ? [2, 4, 6] : [1, 3, 5] }; delete p.dia; }
  if (p.dt === undefined) p.dt = null;
  return p;
}
function cfgDoc(){
  return J({ v:2, settings:S.settings, rules:S.rules, vehicles:S.vehicles, staff:S.staff, notices:S.notices, addrBook:S.addrBook, places:S.places,
    coordOv:Object.entries(S.coordOv || {}).map(([n, c]) => ({ n, lat:c[0], lon:c[1] })),
    geoFix:Object.entries(S.geoFix || {}).map(([k, c]) => ({ k, lat:c[0], lon:c[1], at:c[2] || '' })) });
}
function applyCfg(d){
  const def = defaultState();
  S.settings = mergeDefaults(d.settings || {}, def.settings);
  S.rules = mergeDefaults(d.rules || {}, def.rules);
  S.vehicles = d.vehicles || def.vehicles; S.staff = d.staff || []; S.notices = d.notices || []; S.addrBook = d.addrBook || []; S.places = d.places || def.places;
  S.coordOv = {}; (d.coordOv || []).forEach(o => { S.coordOv[o.n] = [o.lat, o.lon]; });
  S.geoFix = {}; (d.geoFix || []).forEach(o => { if (o && o.k && isFinite(o.lat) && isFinite(o.lon)) S.geoFix[o.k] = [o.lat, o.lon, o.at || '']; });
  normalizeState();
}
function dayDoc(date){
  const rides = {};
  (S.rides[date] || []).forEach((r, i) => { if (isFilled(r)) rides[r.id] = { ...r, nr:i + 1 }; });
  const duty = {}; (S.duty[date] || []).forEach((d, i) => { duty[d.id] = { ...d, ord:i }; });
  const out = { rides, duty, vehOff:S.vehOff[date] || [], crewBook:S.crewBook[date] || {}, dayNote:S.dayNote[date] || '', dayRules:S.dayRules[date] || {}, published:S.published[date] || {} };
  return J(out);
}
function applyDay(date, d){
  d = d || {};
  const arr = [];
  Object.values(d.rides || {}).sort((a, b) => (a.nr || 0) - (b.nr || 0)).forEach(r => {
    let nr = Math.max(1, r.nr || 1); while (arr[nr - 1]) nr++;
    const o = { ...blankRide(), ...r }; delete o.nr; arr[nr - 1] = o;
  });
  const len = Math.max(arr.length, S.settings.slots);
  for (let i = 0; i < len; i++) if (!arr[i]) arr[i] = blankRide();
  S.rides[date] = arr;
  const duty = Object.values(d.duty || {}).sort((a, b) => (a.ord || 0) - (b.ord || 0)).map(x => { const o = { ...x }; delete o.ord; return o; });
  if (duty.length) S.duty[date] = duty; else delete S.duty[date];
  if ((d.vehOff || []).length) S.vehOff[date] = d.vehOff; else delete S.vehOff[date];
  if (Object.keys(d.crewBook || {}).length) S.crewBook[date] = d.crewBook; else delete S.crewBook[date];
  if (d.dayNote) S.dayNote[date] = d.dayNote; else delete S.dayNote[date];
  if (Object.keys(d.dayRules || {}).length) S.dayRules[date] = d.dayRules; else delete S.dayRules[date];
  if (Object.keys(d.published || {}).length) S.published[date] = d.published; else delete S.published[date];
}
const allDays = () => [...new Set([...Object.keys(S.rides), ...Object.keys(S.duty), ...Object.keys(S.crewBook), ...Object.keys(S.dayNote), ...Object.keys(S.vehOff), ...Object.keys(S.dayRules), ...Object.keys(S.published)])];

/* ---------- Sinhronizacija ---------- */
const SY = { snap:{}, unsubs:[], runUnsubs:{}, cfgReady:false, patReady:false, dayReady:false, range:null, started:false, onRemote:null };
const CFG_STAFF_KEYS = ['staff', 'notices', 'addrBook', 'coordOv', 'geoFix', 'rules', 'places'];   // enako kot pravila za cfg/main (dispečer)
async function flush(){
  if (!DB || !ME || !isStaffRole() || !SY.started) return;
  const jobs = [];
  const sync = (path, doc) => {
    const old = SY.snap[path];
    if (!old) jobs.push({ path, doc, p:DB.set(path, doc) });
    else {
      let ops = diffDoc(old, doc);
      if (path === 'cfg/main' && ME.role !== 'skrbnik'){   // dispečer sme spremeniti samo ključe, ki jih dovoljajo pravila (firestore.rules); privzete vrednosti nove izdaje (npr. settings.tisk) zapiše skrbnik ob prvi prijavi
        const keep = k => CFG_STAFF_KEYS.includes(String(k).split('.')[0]);
        const set = {}; Object.keys(ops.set).forEach(k => { if (keep(k)) set[k] = ops.set[k]; });
        const del = ops.del.filter(keep);
        ops = { set, del, n:Object.keys(set).length + del.length };
      }
      if (ops.n) jobs.push({ path, doc, p:DB.patch(path, ops) });
    }
  };
  if (SY.cfgReady) sync('cfg/main', cfgDoc());
  if (SY.patReady){
    const ids = new Set();
    S.patients.forEach(p => { ids.add(p.id); sync('patients/' + p.id, J(p)); });
    Object.keys(SY.snap).filter(k => k.startsWith('patients/') && !ids.has(k.slice(9))).forEach(k => { jobs.push({ path:k, doc:null, p:DB.del(k) }); });
  }
  if (SY.dayReady) allDays().forEach(d => { if (dayLoaded(d)) sync('days/' + d, dayDoc(d)); });
  const res = await Promise.allSettled(jobs.map(j => j.p));
  let err = null;
  res.forEach((r, i) => { if (r.status === 'fulfilled'){ if (jobs[i].doc) SY.snap[jobs[i].path] = jobs[i].doc; else delete SY.snap[jobs[i].path]; } else err = err || r.reason; });
  if (err) throw err;
}
const dayLoaded = d => !SY.range || (d >= SY.range.from && d <= SY.range.to);

function mergeRemote(path, remote, localDoc){
  const old = SY.snap[path];
  const pend = old ? diffDoc(old, localDoc) : { set:{}, del:[], n:0 };
  SY.snap[path] = J(remote || {});
  return pend.n ? applyOps(J(remote || {}), pend) : (remote || {});
}
function remoteChanged(){ rev++; PLAN_CACHE.clear(); if (SY.onRemote) SY.onRemote(); }
function onCfgDoc(d){
  if (d){ applyCfg(mergeRemote('cfg/main', d, cfgDoc())); }
  else if (!SY.cfgReady){ normalizeState(); }
  SY.cfgReady = true; remoteChanged();
}
function onPatients(changes, meta){
  changes.forEach(c => {
    const path = 'patients/' + c.id, i = S.patients.findIndex(p => p.id === c.id);
    if (!c.data){ if (i >= 0) S.patients.splice(i, 1); delete SY.snap[path]; return; }
    const merged = mergeRemote(path, c.data, i >= 0 ? J(S.patients[i]) : {});
    const p = migratePatient({ ...blankPatient(), ...merged, id:c.id });
    if (i >= 0) S.patients[i] = p; else S.patients.push(p);
  });
  if (meta && meta.initial) SY.patReady = true;
  remoteChanged();
}
function onDays(changes, meta){
  changes.forEach(c => {
    const path = 'days/' + c.id;
    if (!c.data){ if (SY.snap[path]){ delete SY.snap[path]; applyDay(c.id, {}); } return; }
    applyDay(c.id, mergeRemote(path, c.data, dayDoc(c.id)));
  });
  if (meta && meta.initial) SY.dayReady = true;
  remoteChanged();
}
function watchDays(range){
  SY.dayUnsub && SY.dayUnsub();
  SY.range = range; SY.dayReady = !range ? SY.dayReady : false;
  SY.dayUnsub = DB.watchCol('days', onDays, range);
}
function ensureRange(from, to){
  if (!SY.range || !SY.started) return;
  if (from >= SY.range.from && to <= SY.range.to) return;
  watchDays({ from:from < SY.range.from ? from : SY.range.from, to:to > SY.range.to ? to : SY.range.to });
}
async function startSync(){
  if (SY.started) return;
  SY.started = false; SY.cfgReady = SY.patReady = SY.dayReady = false;
  const waits = [];
  const once = () => { let res; const p = new Promise(r => { res = r; }); return [p, res]; };
  const [pc, rc] = once(), [pp, rp] = once(), [pd, rd] = once();
  const today = todayStr();
  SY.unsubs.push(DB.watchDoc('cfg/main', d => { onCfgDoc(d); rc(); }));
  SY.unsubs.push(DB.watchCol('patients', (c, m) => { onPatients(c, m); if (m && m.initial) rp(); }));
  SY.range = DB.kind === 'local' ? null : { from:addDays(today, -35), to:addDays(today, 70) };
  SY.dayUnsub = DB.watchCol('days', (c, m) => { onDays(c, m); if (m && m.initial) rd(); }, SY.range);
  SY.unsubs.push(() => SY.dayUnsub && SY.dayUnsub());
  SY.unsubs.push(DB.watchCol('runs', (c) => onRuns(c), { from:addDays(today, -2), to:addDays(today, 3) }));
  await Promise.race([Promise.all([pc, pp, pd]), new Promise(r => setTimeout(r, 9000))]);
  SY.started = true;
  if (!S.vehicles.length) S.vehicles = defaultState().vehicles;
  await flush().catch(() => {});
}
function stopSync(){
  SY.unsubs.forEach(u => { try { u(); } catch(e){} }); SY.unsubs = [];
  Object.values(SY.runUnsubs).forEach(u => { try { u(); } catch(e){} }); SY.runUnsubs = {};
  SY.started = false; SY.snap = {};
}

/* ---------- Revizijska sled (samo dodajanje) ---------- */
const AUDIT = [];
function audit(action, detail = {}){
  if (!DB || !ME) return;
  const e = { t:new Date().toISOString(), uid:String(ME.id), who:ME.name, role:ME.role, action, detail:J(detail) || {} };
  AUDIT.unshift(e); if (AUDIT.length > 300) AUDIT.pop();
  DB.add('audit', e).catch(() => {});
}
const initials = n => String(n || '').trim().split(/\s+/).map(w => (w[0] || '').toUpperCase()).join('.').slice(0, 5);

/* =====================================================================
   NASLOVI → TOČKE (brezplačno): ulica in hišna številka iz OpenStreetMap (Nominatim)
   Zakaj: kilometrina OD → DO je točna le, če je točka naslova pravi naslov in ne središče naselja. Za ustanove in klinike so koordinate
   v aplikaciji že znane. Za hišne naslove (»Dobova 25«, »Cesta prvih borcev 18, Brežice«) se tukaj poišče točka, razdaljo po cesti pa
   nato izračuna OSRM (38-routing.js, ROUTE.exact). Tako kilometrina ni več odvisna od Google Zemljevidov.

   Kaj gre ven iz brskalnika: SAMO besedilo naslova (npr. »Dobova 25«), brez imena pacienta, telefona, naloga ali ure. Strežnik vidi še IP naslov
   naprave in izvor strani (Referer), kot zahtevajo pravila javnega strežnika (operations.osmfoundation.org/policies/nominatim).
   Pravila tega strežnika, ki jih aplikacija upošteva: največ 1 zahtevek na sekundo (vrsta, razmik 1,1 s), rezultati se ne iščejo znova
   (pomnilnik seje, polje pacienta gc in ročni popravki S.geoFix), brez samodokončanja med tipkanjem (iskanje šele po potrditvi vnosa).
   Natančnost vsake točke je zapisana (hisna | ulica | naselje | ustanova | rocno) in se pokaže ob kilometrini: ~ pomeni, da OSM za ta naslov
   nima hišne številke. Takrat dispečer točko popravi na zemljevidu (shrani se v S.geoFix in velja za vse naprave).
   Podatki: © prispevajoči k OpenStreetMap (ODbL). Lasten strežnik ali drug Nominatim-združljiv: config.js → geocode.url.
   ===================================================================== */
const GEOC = (() => {
  const GC = (window.KP_CONFIG && window.KP_CONFIG.geocode) || {};
  const DEF_URL = 'https://nominatim.openstreetmap.org';
  const base = () => { const u = GC.url === undefined ? DEF_URL : String(GC.url || ''); return /^https:\/\//.test(u) ? u.replace(/\/+$/, '') : ''; };
  const gs = () => (typeof S !== 'undefined' && S && S.settings && S.settings.geocode) || { on:true, auto:true };
  const enabled = () => !!base() && gs().on !== false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mem = new Map();          // ključ naslova -> rezultat (samo ta seja)
  const inflight = new Map();
  const neg = new Map();           // naslovi, ki jih OSM ne pozna: 10 minut se ne iščejo znova
  const wait = [];
  let running = false, coolUntil = 0, lastCall = 0;
  const R = { status:'idle', err:'', calls:0, errors:0, lastOk:0, minGap:1100, timeoutMs:12000, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const PREC = { hisna:'hišna številka', ulica:'samo ulica', nejasno:'kraj ni potrjen', naselje:'središče naselja', ustanova:'ustanova', rocno:'točka na zemljevidu' };
  const RANK = { rocno:0, ustanova:0, hisna:0, ulica:1, nejasno:1, naselje:2 };
  const exactPrec = p => RANK[p] === 0;
  const worst = (a, b) => (RANK[a] ?? 2) >= (RANK[b] ?? 2) ? a : b;
  const key = t => norm(t).replace(/[,.;]+/g, ' ').replace(/\s+/g, ' ').trim();
  const dkm = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  function setStatus(st, err){ R.status = st; R.err = err || ''; if (R.onUpdate){ try { R.onUpdate('status'); } catch(e){} } }

  /* ---------- Ročni popravki točk (S.geoFix: ključ -> [lat, lon, čas]) in točke pacientov (p.gc) ---------- */
  const fixOf = k => { const f = (typeof S !== 'undefined' && S && S.geoFix) ? S.geoFix[k] : null; return f && isFinite(f[0]) && isFinite(f[1]) ? f : null; };
  const patientHit = k => { const ps = (typeof S !== 'undefined' && S && S.patients) || []; for (const p of ps) if (p.gc && p.gc.k === k && p.addr && key(p.addr) === k && isFinite(p.gc.lat) && isFinite(p.gc.lon)) return p.gc; return null; };
  function remember(k, res){
    mem.set(k, res);
    if (res.src !== 'osm') return;
    let any = false;
    for (const p of ((typeof S !== 'undefined' && S && S.patients) || [])) if (p.addr && key(p.addr) === k){ p.gc = { k, lat:+res.lat.toFixed(6), lon:+res.lon.toFixed(6), prec:res.prec, at:new Date().toISOString() }; any = true; }
    if (any && typeof save === 'function') save();
  }
  function setFix(text, lat, lon){
    const k = key(text); if (!k || !isFinite(lat) || !isFinite(lon)) return false;
    S.geoFix = S.geoFix || {}; S.geoFix[k] = [+(+lat).toFixed(6), +(+lon).toFixed(6), new Date().toISOString()];
    mem.delete(k); for (const p of S.patients || []) if (p.gc && p.gc.k === k) delete p.gc;
    save(); return true;
  }
  function clearFix(text){ const k = key(text); if (S.geoFix && S.geoFix[k]){ delete S.geoFix[k]; mem.delete(k); save(); return true; } return false; }
  const hasFix = text => !!fixOf(key(text));

  /* ---------- Kaj je treba iskati ---------- */
  const HR_TOWN = /(hrva|croat|zagreb|samobor|jastrebarsko|krapina)/i;
  function analyse(text){
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return { mode:'empty', t };
    let g = null; try { g = geo(t); } catch(e){ g = null; }
    if (!g || g.kind === 'prazno') return { mode:'empty', t };
    if (g.kind === 'poi') return { mode:'poi', t, g };
    if (g.kind === 'addr') return { mode:'import', t, g };
    const settl = g.kind === 'naselje' || g.kind === 'mesto';
    if (/\d/.test(t)) return { mode:'search', t, g, cen:settl ? g : null };
    return settl ? { mode:'settlement', t, g } : { mode:'unknown', t, g };
  }
  const isPoint = res => res && isFinite(res.lat) && isFinite(res.lon);

  /* ---------- Nominatim ---------- */
  function classify(x){
    const a = x.address || {};
    if (a.house_number || (+x.place_rank >= 28)) return 'hisna';
    if (x.category === 'highway' || x.class === 'highway' || (+x.place_rank >= 26 && +x.place_rank <= 27)) return 'ulica';
    return 'naselje';
  }
  async function http(path){
    const b = base(); if (!b) throw Object.assign(new Error('Iskanje naslovov ni nastavljeno (config.js → geocode.url).'), { code:'off' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw Object.assign(new Error('Ni povezave z internetom.'), { code:'net' });
    const gap = lastCall + R.minGap - Date.now(); if (gap > 0) await sleep(gap);
    lastCall = Date.now(); R.calls++;
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(() => { if (ac) ac.abort(); }, R.timeoutMs);
    let res;
    try { res = await R.fetch(b + path, { method:'GET', mode:'cors', credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin', signal:ac ? ac.signal : undefined }); }
    catch(e){ clearTimeout(to); throw Object.assign(new Error(e && e.name === 'AbortError' ? 'Strežnik za naslove ne odgovarja (časovna omejitev).' : 'Brez povezave s strežnikom za naslove.'), { code:'net' }); }
    clearTimeout(to);
    if (res.status === 429){ coolUntil = Date.now() + 60000; throw Object.assign(new Error('Strežnik za naslove omejuje število zahtev (429). Počakam minuto.'), { code:'limit' }); }
    if (res.status === 403 || res.status === 401){ coolUntil = Date.now() + 600000; throw Object.assign(new Error('Strežnik za naslove je zavrnil zahtevek (' + res.status + '): preveri, da stran teče na https in da ni blokiran Referer.'), { code:'blocked' }); }
    if (res.status >= 500) throw Object.assign(new Error('Strežnik za naslove ima težavo (' + res.status + ').'), { code:'net' });
    let j = null; try { j = await res.json(); } catch(e){ j = null; }
    if (!Array.isArray(j)) throw Object.assign(new Error('Neveljaven odgovor strežnika za naslove.'), { code:'net' });
    return j;
  }
  function searchPath(q, o = {}){
    const p = ['format=jsonv2', 'addressdetails=1', 'limit=5', 'dedupe=1', 'accept-language=sl', 'countrycodes=' + (o.cc || 'si'), 'q=' + encodeURIComponent(q)];
    if (o.box){ p.push('viewbox=' + o.box.map(x => x.toFixed(5)).join(','), 'bounded=1'); }
    else if (o.bias){ p.push('viewbox=15.10000,46.15000,16.10000,45.70000'); }          // kraj ni naveden: raje zadetek v Posavju (ne omeji)
    if (GC.email) p.push('email=' + encodeURIComponent(GC.email));
    return '/search?' + p.join('&');
  }
  const queue = job => new Promise((res, rej) => { wait.push({ job, res, rej }); pump(); });
  async function pump(){
    if (running) return; running = true;
    try {
      while (wait.length){
        const w = wait.shift();
        try { w.res(await w.job()); } catch(e){ w.rej(e); }
      }
    } finally { running = false; }
  }

  /* Najdi točko za besedilo naslova. Vrne { lat, lon, prec, src, warn? } ali zavrne z napako (code: empty | off | net | limit | blocked | unknown). */
  function resolve(text, o = {}){
    const an = analyse(text), k = key(text);
    if (an.mode === 'empty') return Promise.reject(Object.assign(new Error('Naslov je prazen.'), { code:'empty' }));
    if (an.mode === 'poi'){ const p = an.g; return Promise.resolve({ lat:p.lat, lon:p.lon, prec:'ustanova', src:'poi' }); }
    const fx = fixOf(k); if (fx) return Promise.resolve({ lat:fx[0], lon:fx[1], prec:'rocno', src:'rocno' });
    if (an.mode === 'import') return Promise.resolve({ lat:an.g.lat, lon:an.g.lon, prec:'hisna', src:'uvoz' });
    if (an.mode === 'unknown') return Promise.reject(Object.assign(new Error('Naslov ni prepoznan: dodaj kraj ali hišno številko.'), { code:'unknown' }));
    if (an.mode === 'settlement') return Promise.resolve({ lat:an.g.lat, lon:an.g.lon, prec:'naselje', src:'naselje', warn:'brez hišne številke' });
    if (!o.fresh){
      if (mem.has(k)) return Promise.resolve(mem.get(k));
      const pg = patientHit(k); if (pg) return Promise.resolve({ lat:pg.lat, lon:pg.lon, prec:pg.prec || 'hisna', src:'osm' });
    }
    if (!enabled()) return Promise.reject(Object.assign(new Error('Iskanje naslovov je izklopljeno (Nastavitve → Izračun).'), { code:'off' }));
    if (Date.now() < coolUntil) return Promise.reject(Object.assign(new Error(R.err || 'Iskanje naslovov počiva (omejitev strežnika).'), { code:'limit' }));
    if (inflight.has(k)) return inflight.get(k);
    if ((neg.get(k) || 0) > Date.now() && !o.fresh) return Promise.reject(Object.assign(new Error('Naslova ni mogoče najti v OpenStreetMap: dodaj kraj ali popravi zapis.'), { code:'unknown' }));
    const p = queue(() => lookup(an, k)).catch(e => { if (e.code === 'unknown') neg.set(k, Date.now() + 600000); else { R.errors++; setStatus('error', e.message); } throw e; }).finally(() => inflight.delete(k));
    inflight.set(k, p); return p;
  }
  async function lookup(an, k){
    const cen = an.cen, g = an.g, hr = HR_TOWN.test(an.t) || (g.kind === 'mesto' && HR_TOWN.test(g.label || ''));
    let q = an.t;
    const town = String((cen && cen.label) || '').split(' - ')[0];
    if (cen && town && !norm(q).includes(norm(town))) q += ', ' + town;       // »Cankarjeva 5« brez kraja → naselje, ki ga je app prepoznala
    const o = { cc:hr ? 'hr' : (cen ? 'si' : 'si,hr'), bias:!cen && !hr };
    let list = [];
    if (cen){ const dLon = cen.kind === 'mesto' ? 0.14 : 0.09, dLat = cen.kind === 'mesto' ? 0.1 : 0.065; list = await http(searchPath(q, { ...o, box:[cen.lon - dLon, cen.lat + dLat, cen.lon + dLon, cen.lat - dLat] })); }
    if (!list.length) list = await http(searchPath(q, o));
    const maxOff = cen ? (cen.kind === 'mesto' ? 16 : 9) : 1e9;
    let hit = null;
    for (const x of list){
      const lat = +x.lat, lon = +x.lon; if (!isFinite(lat) || !isFinite(lon)) continue;
      if (cen && dkm(lat, lon, cen.lat, cen.lon) > maxOff) continue;       // zadetek v drugem kraju (npr. isto ime ulice drugje): ne zaupaj
      hit = { lat, lon, prec:classify(x), src:'osm', disp:String(x.display_name || '').slice(0, 160) }; break;
    }
    let res;
    if (hit){
      if (!cen && hit.prec !== 'naselje'){ hit.prec = 'nejasno'; hit.warn = 'kraj ni naveden ali prepoznan: preveri točko na zemljevidu'; }
      else if (hit.prec === 'naselje') hit.warn = 'OSM nima ulice ali hišne številke';
      else if (hit.prec === 'ulica') hit.warn = 'OSM nima te hišne številke (točka je na ulici)';
      res = hit;
    } else if (cen){
      res = { lat:cen.lat, lon:cen.lon, prec:'naselje', src:'naselje', warn:'naslova ni v OSM: uporabljeno središče naselja' };
    } else {
      throw Object.assign(new Error('Naslova ni mogoče najti v OpenStreetMap: dodaj kraj ali popravi zapis.'), { code:'unknown' });
    }
    R.lastOk = Date.now(); setStatus('ok');
    if (res.src === 'osm') remember(k, res); else mem.set(k, res);
    return res;
  }

  /* Preizkus: poišče Zdravstveni dom Brežice in primerja z znano točko postaje (en zahtevek). */
  async function test(){
    const t0 = Date.now();
    if (!base()) return { ok:false, msg:'Iskanje naslovov ni nastavljeno (config.js → geocode.url).' };
    try {
      const list = await queue(() => http(searchPath('Zdravstveni dom Brežice, Brežice', { cc:'si' })));
      const x = list.find(y => isFinite(+y.lat) && isFinite(+y.lon) && dkm(+y.lat, +y.lon, BASE_POI.lat, BASE_POI.lon) < 3);
      if (!x) return { ok:false, ms:Date.now() - t0, msg:'Strežnik je odgovoril, a Zdravstvenega doma Brežice ni našel v bližini postaje.' };
      const d = Math.round(dkm(+x.lat, +x.lon, BASE_POI.lat, BASE_POI.lon) * 1000);
      setStatus('ok'); R.lastOk = Date.now();
      return { ok:true, ms:Date.now() - t0, d, prec:classify(x), msg:'Povezava deluje.' };
    } catch(e){ setStatus('error', e.message); return { ok:false, ms:Date.now() - t0, msg:e.message, code:e.code }; }
  }

  const auto = () => enabled() && gs().auto !== false && Date.now() >= coolUntil;
  function clear(){ mem.clear(); neg.clear(); inflight.clear(); coolUntil = 0; setStatus('idle'); }
  /* Ob odjavi pozabi vse naslove iz pomnilnika (točke pacientov ostanejo samo v njihovem zapisu v bazi). */
  function forget(){ clear(); wait.length = 0; }
  const info = () => ({ configured:!!base(), on:enabled(), auto:auto(), status:R.status, err:R.err, calls:R.calls, errors:R.errors, cached:mem.size, queued:wait.length + (running ? 1 : 0), lastOk:R.lastOk, cooling:Math.max(0, coolUntil - Date.now()), host:(() => { try { return new URL(base()).host; } catch(e){ return ''; } })() });
  Object.assign(R, { enabled, auto, resolve, analyse, classify, setFix, clearFix, hasFix, test, clear, forget, info, key, PREC, RANK, exactPrec, worst, searchPath, isPoint, dkm });
  return R;
})();

/* =====================================================================
   CESTNO USMERJANJE: pravi cestni podatki iz OpenStreetMap (OSRM)
   Razdalja in trajanje vožnje po dejanskem cestnem omrežju (ne zračna črta). Planer (40-planner.js) bere podatke
   SINHRONO iz predpomnilnika; kar manjka, se v ozadju prenese (OSRM »table«) in razpored se nato sam ponovno izračuna.
   Dokler podatkov ni, planer uporabi OCENO (zračna črta × faktor) in to vedno pokaže (»ocena«).

   Kaj gre ven iz brskalnika: SAMO koordinate (lat, lon) točk. Nikoli imena, naslovi kot besedilo, telefoni ali ID-ji.
   Brez piškotkov, brez »Referer« glave. Točke hišnih naslovov (uvoz CSV) so samo v pomnilniku, nikoli v trajnem predpomnilniku.
   Strežnik: config.js → routing.url (privzeto javni OSRM; priporočen lasten strežnik, glej NAVODILA.md).
   Pomoč pri težavah: Nastavitve → Planiranje → »Preveri cestne podatke«.
   Podatki o cestah: © prispevajoči k OpenStreetMap (ODbL).
   ===================================================================== */
const ROUTE = (() => {
  const RC = (window.KP_CONFIG && window.KP_CONFIG.routing) || {};
  const DEF_URLS = ['https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car'];
  const urls = () => (RC.url === undefined ? DEF_URLS : [].concat(RC.url || [], RC.fallback || []))
    .filter(x => typeof x === 'string' && /^https:\/\//.test(x)).map(x => x.replace(/\/+$/, ''));
  const NONE = Object.freeze({ m:-1, s:-1 });                 // OSRM: poti ni
  const cache = new Map();                                    // 'ključ>ključ' -> [metri, sekunde]  (-1 = poti ni)
  const gen = new Set();                                      // ključi splošnih točk (naselje, ustanova, mesto): smejo v trajni predpomnilnik
  const pending = new Map();                                  // točke, za katere manjkajo razdalje
  const snapFar = new Map();                                  // ključ točke -> razdalja do najbližje ceste (m)
  const geoCache = new Map();
  let shared = null;                                          // vnaprej pripravljena matrika razdalje.json
  let timer = null, busy = false, coolUntil = 0, backoff = 0, saveTimer = null, chg = 0, active = 0;
  const R = { version:0, status:'idle', err:'', url:'', lastOk:0, gap:350, timeoutMs:15000, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const key = p => p.lat.toFixed(5) + ',' + p.lon.toFixed(5);
  const enabled = () => urls().length > 0 && !(typeof S !== 'undefined' && S && S.settings && S.settings.routing && S.settings.routing.on === false);
  const routable = p => !!p && isFinite(p.lat) && isFinite(p.lon) && p.kind !== 'neznano' && p.kind !== 'prazno';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function setStatus(st, err){ R.status = st; R.err = err || ''; }
  function notify(kind){ if (R.onUpdate){ try { R.onUpdate(kind); } catch(e){ console.error(e); } } }

  /* ---------- Branje (sinhrono) ---------- */
  function lookup(a, b){
    const ka = key(a), kb = key(b);
    if (ka === kb) return { m:0, s:0 };
    if (shared){
      const i = shared.idx.get(ka), j = shared.idx.get(kb);
      if (i !== undefined && j !== undefined){ const m = shared.d[i * shared.n + j]; if (m >= 0) return { m, s:shared.t[i * shared.n + j] }; }
    }
    const v = cache.get(ka + '>' + kb);
    return v ? (v[0] < 0 ? NONE : { m:v[0], s:v[1] }) : null;
  }
  function want(a, b){
    if (Date.now() < coolUntil) return;
    [a, b].forEach(p => { const k = key(p); if (!pending.has(k)) pending.set(k, { key:k, lat:p.lat, lon:p.lon, gen:p.kind !== 'addr' }); });
    if (!timer && !busy) timer = setTimeout(() => { timer = null; flush(); }, 150);
  }
  /* Vrne { km, min } (min brez faktorja) ali null, če podatka ni (takrat se zahteva prenos in uporabi ocena). */
  function leg(a, b){
    if (!enabled() || !routable(a) || !routable(b)) return null;
    const v = lookup(a, b);
    if (v === NONE) return null;
    if (v) return { km:v.m / 1000, min:v.s / 60 };
    want(a, b); return null;
  }

  /* ---------- Omrežje ---------- */
  async function http(path){
    const list = urls(); if (!list.length) throw new Error('Cestni strežnik ni nastavljen (config.js → routing.url).');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Ni povezave z internetom.');
    let last = null;
    for (let k = 0; k < list.length; k++){
      const base = list[(active + k) % list.length];
      for (let attempt = 0; attempt < 2; attempt++){
        const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const to = setTimeout(() => { if (ac) ac.abort(); }, R.timeoutMs);
        try {
          const res = await R.fetch(base + path, { method:'GET', mode:'cors', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', signal:ac ? ac.signal : undefined });
          clearTimeout(to);
          if (res.status === 429){ last = new Error('Strežnik omejuje število zahtev (429).'); await sleep(attempt ? 0 : 1500); if (attempt) break; continue; }
          let j = null; try { j = await res.json(); } catch(e){}
          if (res.status >= 500){ last = new Error('Strežnik ' + res.status); break; }
          if (!j){ last = new Error('Neveljaven odgovor strežnika (' + res.status + ').'); break; }
          active = (active + k) % list.length; R.url = base;
          return j;
        } catch(e){ clearTimeout(to); last = e && e.name === 'AbortError' ? new Error('Strežnik ne odgovarja (časovna omejitev).') : e; break; }
      }
    }
    throw last || new Error('Cestni strežnik ni dosegljiv.');
  }

  /* Matrika vseh parov med točkami (bloki po 40 koordinat na vsako stran: največ 80 na zahtevek, javni OSRM dovoli 100). */
  async function fetchMatrix(pts, progress){
    const B = 40, blocks = [];
    for (let i0 = 0; i0 < pts.length; i0 += B) for (let j0 = 0; j0 < pts.length; j0 += B) blocks.push([pts.slice(i0, i0 + B), pts.slice(j0, j0 + B)]);
    let done = 0;
    for (const [src, dst] of blocks){
      done++;
      let need = false;
      for (const a of src){ for (const b of dst){ if (a.key !== b.key && !lookup(a, b)){ need = true; break; } } if (need) break; }
      if (!need){ if (progress) progress(done, blocks.length); continue; }
      const coords = [], idx = new Map();
      const add = p => { if (!idx.has(p.key)){ idx.set(p.key, coords.length); coords.push(p); } return idx.get(p.key); };
      const si = src.map(add), di = dst.map(add);
      const path = '/table/v1/driving/' + coords.map(p => p.lon.toFixed(5) + ',' + p.lat.toFixed(5)).join(';') + '?sources=' + si.join(';') + '&destinations=' + di.join(';') + '&annotations=duration,distance';
      const res = await http(path);
      if (res.code !== 'Ok' || !Array.isArray(res.durations) || !Array.isArray(res.distances)) throw new Error('OSRM: ' + (res.code || 'neveljaven odgovor') + (res.message ? ' – ' + res.message : '') + (res.code === 'Ok' ? ' (strežnik ne vrača razdalj)' : ''));
      src.forEach((a, x) => {
        if (res.sources && res.sources[x] && isFinite(res.sources[x].distance)) snapFar.set(a.key, res.sources[x].distance);
        dst.forEach((b, y) => {
          if (a.key === b.key) return;
          const dur = res.durations[x] && res.durations[x][y], dis = res.distances[x] && res.distances[x][y];
          cache.set(a.key + '>' + b.key, (dur == null || dis == null) ? [-1, -1] : [Math.round(dis), Math.round(dur)]);
          if (a.gen) gen.add(a.key); if (b.gen) gen.add(b.key);
          chg++;
        });
      });
      if (cache.size > 45000){ let n = 0; for (const k of cache.keys()){ cache.delete(k); if (++n >= 5000) break; } }
      if (progress) progress(done, blocks.length);
      if (done < blocks.length && R.gap) await sleep(R.gap);
    }
  }

  async function flush(){
    if (busy) return;
    busy = true; setStatus('loading'); chg = 0; notify('status');
    try {
      while (pending.size){
        const pts = [...pending.values()].slice(0, 160); pts.forEach(p => pending.delete(p.key));
        try { await fetchMatrix(pts); } catch(e){ pts.forEach(p => pending.set(p.key, p)); throw e; }
      }
      backoff = 0; coolUntil = 0; R.lastOk = Date.now(); setStatus('ok');
    } catch(e){
      backoff = Math.min(300000, (backoff || 15000) * 2); coolUntil = Date.now() + backoff;
      setStatus('error', String((e && e.message) || e));
      if (!timer) timer = setTimeout(() => { timer = null; if (pending.size) flush(); }, backoff + 50);
    } finally { busy = false; }
    if (chg){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); persistSoon(); }
    notify(chg ? 'data' : 'status');
  }
  /* Počakaj, da se manjkajoči podatki prenesejo (npr. pred objavo razporeda), največ ms. */
  function settle(ms = 9000){
    return new Promise(res => { const t0 = Date.now(); const tick = () => { if ((!busy && !timer && !pending.size) || Date.now() - t0 > ms || Date.now() < coolUntil) return res(); setTimeout(tick, 80); }; tick(); });
  }

  /* ---------- Trajni predpomnilnik: samo splošne točke (naselja, ustanove, mesta) ---------- */
  function persistSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(persist, 1500); }
  function persist(){
    try {
      const pts = [], ix = new Map(), p = []; let n = 0;
      const id = k => { if (!ix.has(k)){ ix.set(k, pts.length); pts.push(k); } return ix.get(k); };
      for (const [pk, v] of cache){ const [ka, kb] = pk.split('>'); if (!gen.has(ka) || !gen.has(kb)) continue; p.push(id(ka), id(kb), v[0], v[1]); if (++n >= 30000) break; }
      store.set('kp.route.v1', JSON.stringify({ v:1, pts, p }));
    } catch(e){}
  }
  function loadLocal(){
    try {
      const o = JSON.parse(store.get('kp.route.v1') || 'null'); if (!o || o.v !== 1 || !Array.isArray(o.p)) return;
      for (let i = 0; i + 3 < o.p.length; i += 4){ const ka = o.pts[o.p[i]], kb = o.pts[o.p[i + 1]]; if (!ka || !kb) continue; cache.set(ka + '>' + kb, [o.p[i + 2], o.p[i + 3]]); gen.add(ka); gen.add(kb); }
    } catch(e){}
  }
  /* Skupna datoteka razdalje.json (v mapi spletne strani, poleg index.html): enaka na vseh napravah, brez klicev strežnika. */
  function setShared(o){
    if (!o || o.v !== 1 || !Array.isArray(o.pts) || !Array.isArray(o.d) || !Array.isArray(o.t)) return false;
    const n = o.pts.length; if (o.d.length !== n * n || o.t.length !== n * n) return false;
    const idx = new Map(); o.pts.forEach((q, i) => idx.set(q[0].toFixed(5) + ',' + q[1].toFixed(5), i));
    shared = { n, idx, d:Int32Array.from(o.d), t:Int32Array.from(o.t), built:o.built || '' };
    return true;
  }
  async function loadShared(){
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return;
    try { const r = await fetch('razdalje.json', { cache:'no-cache' }); if (!r.ok) return; if (setShared(await r.json())){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); notify('data'); } } catch(e){}
  }
  function init(){ loadLocal(); loadShared(); }

  /* ---------- Vse relacije vnaprej (naselja, ustanove, mesta) ---------- */
  function warmPoints(){
    const m = new Map();
    const add = p => { const k = key(p); if (!m.has(k)) m.set(k, { key:k, lat:p.lat, lon:p.lon, gen:true }); };
    SETTLEMENTS.forEach(s => add(S ? settlementPoint(s) : s)); POIS.forEach(add); TOWNS.forEach(add);
    return [...m.values()];
  }
  async function warm(progress){
    if (!enabled()) throw new Error('Cestni podatki so izklopljeni.');
    if (busy) throw new Error('Prenos že poteka.');
    busy = true; setStatus('loading'); chg = 0;
    try { await fetchMatrix(warmPoints(), progress); setStatus('ok'); R.lastOk = Date.now(); }
    catch(e){ setStatus('error', String((e && e.message) || e)); throw e; }
    finally { busy = false; if (chg){ R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); persist(); } notify('data'); }
    return chg;
  }
  function exportShared(){
    const pts = warmPoints(), n = pts.length, d = new Array(n * n), t = new Array(n * n); let missing = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const v = i === j ? { m:0, s:0 } : lookup(pts[i], pts[j]);
      if (v && v !== NONE){ d[i * n + j] = v.m; t[i * n + j] = v.s; } else { d[i * n + j] = -1; t[i * n + j] = -1; missing++; }
    }
    return { v:1, built:new Date().toISOString(), source:'OpenStreetMap / OSRM', pts:pts.map(p => [+p.lat.toFixed(5), +p.lon.toFixed(5)]), d, t, missing };
  }

  /* ---------- Geometrija poti (za prikaz na karti) ---------- */
  async function path(points){
    const pts = points.filter(routable).filter((p, i, a) => !i || key(p) !== key(a[i - 1]));
    if (pts.length < 2) return null;
    const k = pts.map(key).join('|');
    if (geoCache.has(k)) return geoCache.get(k);
    const res = await http('/route/v1/driving/' + pts.map(p => p.lon.toFixed(5) + ',' + p.lat.toFixed(5)).join(';') + '?overview=simplified&geometries=geojson&steps=false');
    if (res.code !== 'Ok' || !res.routes || !res.routes[0]) throw new Error('OSRM: ' + (res.code || 'brez poti'));
    const r0 = res.routes[0];
    const out = { km:r0.distance / 1000, min:r0.duration / 60, coords:(r0.geometry && r0.geometry.coordinates) || [], pts };
    geoCache.set(k, out); if (geoCache.size > 80) geoCache.delete(geoCache.keys().next().value);
    return out;
  }
  const pathCached = points => { const pts = points.filter(routable).filter((p, i, a) => !i || key(p) !== key(a[i - 1])); return geoCache.get(pts.map(key).join('|')) || null; };

  /* ---------- Natančna pot med dvema točkama (kilometrina prevoza OD → DO) ----------
     Neposreden zahtevek /route za ta par točk (ne iz matrike naselij): točki sta lahko hišna naslova. Če sta obe splošni točki in je razdalja že
     v predpomnilniku ali v razdalje.json, se ne kliče strežnik. Zahtevki gredo po vrsti (razmik R.gap), da javni strežnik ni preobremenjen.
     Vrne { km, min, snap:[m, m] }; snap = razdalja od točke do najbližje ceste (velika vrednost pomeni, da točka ni ob cesti). */
  const exactCache = new Map();
  let exactChain = Promise.resolve();
  function exact(a, b){
    if (!enabled()) return Promise.reject(Object.assign(new Error('Cestni podatki so izklopljeni (Nastavitve → Planiranje).'), { code:'off' }));
    if (!routable(a) || !routable(b)) return Promise.reject(Object.assign(new Error('Točka ni znana.'), { code:'point' }));
    const ka = key(a), kb = key(b); if (ka === kb) return Promise.resolve({ km:0, min:0, snap:[0, 0] });
    const ck = ka + '>' + kb; if (exactCache.has(ck)) return Promise.resolve(exactCache.get(ck));
    const v = (a.kind !== 'addr' && b.kind !== 'addr' && !a.exact && !b.exact) ? lookup(a, b) : null;
    if (v && v !== NONE) return Promise.resolve({ km:v.m / 1000, min:v.s / 60, snap:[0, 0] });
    const job = async () => {
      if (exactCache.has(ck)) return exactCache.get(ck);
      const res = await http('/route/v1/driving/' + a.lon.toFixed(5) + ',' + a.lat.toFixed(5) + ';' + b.lon.toFixed(5) + ',' + b.lat.toFixed(5) + '?overview=false&alternatives=false&steps=false');
      if (res.code === 'NoRoute' || (res.code === 'Ok' && !(res.routes && res.routes[0]))) throw Object.assign(new Error('Med naslovoma ni poti po cestah.'), { code:'noroute' });
      if (res.code !== 'Ok' || !res.routes || !res.routes[0]) throw new Error('OSRM: ' + (res.code || 'neveljaven odgovor') + (res.message ? ' – ' + res.message : ''));
      const r0 = res.routes[0], w = res.waypoints || [];
      const out = { km:r0.distance / 1000, min:r0.duration / 60, snap:[(w[0] && w[0].distance) || 0, (w[1] && w[1].distance) || 0] };
      exactCache.set(ck, out); if (exactCache.size > 400) exactCache.delete(exactCache.keys().next().value);
      R.lastOk = Date.now(); setStatus('ok');
      return out;
    };
    const run = exactChain.then(job);
    exactChain = run.catch(() => {}).then(() => (R.gap ? sleep(R.gap) : null));
    return run;
  }

  /* ---------- Preizkus povezave: ZD Brežice → UKC Ljubljana ---------- */
  async function test(){
    const a = BASE_POI, b = POIS.find(p => p.n === 'UKC Ljubljana'), t0 = Date.now();
    const out = { ok:false, ms:0, url:'', km:0, min:0, msg:'' };
    if (!urls().length){ out.msg = 'Cestni strežnik ni nastavljen (config.js → routing.url).'; return out; }
    try {
      const j = await http('/route/v1/driving/' + a.lon.toFixed(5) + ',' + a.lat.toFixed(5) + ';' + b.lon.toFixed(5) + ',' + b.lat.toFixed(5) + '?overview=false');
      out.ms = Date.now() - t0; out.url = R.url;
      if (j.code !== 'Ok' || !j.routes || !j.routes[0]){ out.msg = 'Odgovor strežnika: ' + (j.code || '?') + (j.message ? ' – ' + j.message : ''); return out; }
      out.km = j.routes[0].distance / 1000; out.min = j.routes[0].duration / 60;
      const sane = out.km > 70 && out.km < 160 && out.min > 40 && out.min < 150;
      out.ok = sane; out.msg = sane ? 'Povezava deluje.' : 'Strežnik je odgovoril, a vrednosti so nenavadne (pričakovano ≈ 100 km, ≈ 65 min). Preveri, ali strežnik vsebuje zemljevid Slovenije.';
      setStatus(sane ? 'ok' : R.status, '');
    } catch(e){ out.ms = Date.now() - t0; out.msg = 'Povezava ni uspela: ' + String((e && e.message) || e); setStatus('error', out.msg); }
    return out;
  }

  function clear(){ cache.clear(); gen.clear(); pending.clear(); snapFar.clear(); geoCache.clear(); exactCache.clear(); coolUntil = 0; backoff = 0; store.del('kp.route.v1'); R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear(); notify('data'); }
  /* Ob odjavi: pozabi vse, kar ni splošna točka (npr. hišni naslovi pacientov), in geometrije poti. Splošne točke ostanejo v predpomnilniku. */
  function forget(){
    for (const k of [...cache.keys()]){ const [a, b] = k.split('>'); if (!gen.has(a) || !gen.has(b)) cache.delete(k); }
    for (const k of [...snapFar.keys()]) if (!gen.has(k)) snapFar.delete(k);
    for (const [k, v] of [...pending]) if (!v.gen) pending.delete(k);
    geoCache.clear(); exactCache.clear(); R.version++; if (typeof PLAN_CACHE !== 'undefined') PLAN_CACHE.clear();
  }
  const info = () => ({ on:enabled(), configured:urls().length > 0, urls:urls(), status:R.status, err:R.err, url:R.url, cached:cache.size, shared:shared ? shared.n : 0, sharedBuilt:shared ? shared.built : '', pending:pending.size, busy, cooling:Math.max(0, coolUntil - Date.now()) });

  Object.assign(R, { enabled, routable, key, leg, lookup, exact, init, settle, flush, warm, warmPoints, exportShared, setShared, path, pathCached, test, clear, forget, info, snapFar:p => snapFar.get(key(p)) || 0, fetchMatrix, persist, retry:() => { coolUntil = 0; backoff = 0; if (pending.size) flush(); } });
  return R;
})();

/* =====================================================================
   NATANČNA KILOMETRINA: Google Maps Platform (Routes API, računanje poti OD → DO)
   Za vsak prevoz se razdalja OD → DO izračuna z Googlom (cestna razdalja po najboljši poti za osebni avto, kot v Google Zemljevidih).
   Google vrne tudi natančne koordinate obeh naslovov; planer jih uporabi namesto središča naselja (točnejši čas vožnje, ETA, združevanje).
   Dogovor o podatkih:
   - Google dobi SAMO besedilo naslova OD in DO (npr. »Dobova 25« in »UKC Ljubljana«). Ne dobi imena pacienta, telefona, naloga ali ure.
   - Rezultat (km, vir, koordinati) se shrani v vpis prevoza (knjiga = poslovna evidenca). Predpomnilnik poti je samo v pomnilniku.
   - Brez ključa ali izklopljeno: aplikacija računa po cestah OpenStreetMap (OSRM), brez tega pa oceni. Vir je pri vsakem km označen.
   Ključ API (HTTP referrer omejitev!) je v config.js (google.key) ali samo na tej napravi (Nastavitve → Izračun).
   ===================================================================== */
const GOOGLE = (() => {
  const GC = (window.KP_CONFIG && window.KP_CONFIG.google) || {};
  const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const MASK_TWO = 'routes.distanceMeters,routes.duration,routes.legs.startLocation,routes.legs.endLocation';
  const MASK_MULTI = 'routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration,routes.legs.startLocation,routes.legs.endLocation';
  const cache = new Map();        // 'od>do' (poizvedbi) -> rezultat
  const inflight = new Map();
  const wait = [];
  let active = 0, coolUntil = 0;
  const R = { status:'idle', err:'', lastOk:0, calls:0, errors:0, version:0, concurrency:2, minGap:120, onUpdate:null, fetch:(u, o) => fetch(u, o) };

  const keyVal = () => (store.get('kp.gkey') || GC.key || '').trim();
  const configured = () => /^[A-Za-z0-9_\-]{20,}$/.test(keyVal());
  const gs = () => (typeof S !== 'undefined' && S && S.settings && S.settings.google) || { on:true, auto:true, traffic:false };
  const enabled = () => configured() && gs().on !== false;
  const auto = () => enabled() && gs().auto !== false && Date.now() >= coolUntil;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Besedilo naslova → poizvedba za Google. Ustanova/klinika (brez hišne številke): polno ime in naslov; sicer vpisan naslov + država. */
  const FOREIGN = /(sloveni|hrva|croat|avstri|austri|ital|madzar|hungar)/i;
  const HR_TOWNS = ['Zagreb', 'Samobor', 'Jastrebarsko', 'Krapina'];
  function queryOf(text){
    const t = String(text || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    let g = null; try { g = geo(t); } catch(e){ g = null; }
    if (g && g.kind === 'poi' && g.poi && g.poi.gq && !/\d/.test(t)) return g.poi.gq;
    if (g && g.kind === 'neznano' && g.poi && g.poi.gq && !/\d/.test(t)) return g.poi.gq;
    if (FOREIGN.test(t)) return t;
    return t + ((g && g.kind === 'mesto' && HR_TOWNS.includes(g.label)) ? ', Hrvaška' : ', Slovenija');
  }
  const wp = q => (typeof q === 'string' ? { address:q } : { location:{ latLng:{ latitude:q.lat, longitude:q.lon } } });
  const ll = o => (o && o.latLng && isFinite(o.latLng.latitude) && isFinite(o.latLng.longitude)) ? [+o.latLng.latitude, +o.latLng.longitude] : null;
  const secs = d => { const m = /^(\d+(?:\.\d+)?)s$/.exec(String(d || '')); return m ? +m[1] : null; };

  function setStatus(st, err){ R.status = st; R.err = err || ''; if (R.onUpdate){ try { R.onUpdate('status'); } catch(e){} } }
  function explain(status, httpStatus, msg){
    const m = String(msg || '');
    if (httpStatus === 403 || /PERMISSION_DENIED|API_KEY|referer|not authorized|has not been used|disabled/i.test(status + m)){
      if (/referer|referrer/i.test(m)) return 'Ključ ni dovoljen za ta naslov strani (omejitev HTTP referrer). Dodaj naslov strani v omejitve ključa.';
      if (/has not been used|disabled|not enabled/i.test(m)) return 'Routes API ni vklopljen v projektu (Google Cloud → APIs → Routes API → Enable).';
      return 'Google je zavrnil ključ (preveri ključ, omejitve in da je vklopljen Routes API in obračun).';
    }
    if (httpStatus === 400 && /API key|API_KEY/i.test(m)) return 'Ključ API ni veljaven.';
    if (httpStatus === 400) return 'Google ne razume naslova ali zahtevka' + (m ? ' (' + m.slice(0, 120) + ')' : '') + '.';
    if (httpStatus === 404 || status === 'NOT_FOUND') return 'Google ne najde enega od naslovov.';
    if (httpStatus === 429 || status === 'RESOURCE_EXHAUSTED') return 'Presežena kvota ali preveč zahtevkov (Google). Poskusi pozneje.';
    return 'Napaka Google (' + (httpStatus || 'brez povezave') + ')' + (m ? ': ' + m.slice(0, 120) : '') + '.';
  }
  const AUTH_ERR = e => e && (e.http === 403 || (e.http === 400 && /API key/i.test(e.message || '')));

  async function post(body, mask, tries = 2){
    const key = keyVal(); if (!configured()) throw Object.assign(new Error('Ključ Google ni nastavljen.'), { code:'nokey' });
    let last = null;
    for (let i = 0; i <= tries; i++){
      if (i) await sleep(600 * i);
      let r;
      R.calls++;
      try {
        r = await R.fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Goog-Api-Key':key, 'X-Goog-FieldMask':mask }, body:JSON.stringify(body), credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin' });   // Referer (samo izvor strani) je potreben za omejitev ključa; ostalih povezav to ne spremeni
      } catch(e){ last = Object.assign(new Error('Brez povezave z Google (' + (e && e.message || 'napaka') + ').'), { code:'net' }); continue; }
      let data = null; try { data = await r.json(); } catch(e){ data = null; }
      if (r.status >= 200 && r.status < 300) return data || {};
      const er = (data && data.error) || {};
      last = Object.assign(new Error(explain(er.status, r.status, er.message)), { http:r.status, gstatus:er.status || '', code:'http' });
      if (r.status === 429 || r.status >= 500) continue;
      break;
    }
    throw last || new Error('Napaka Google.');
  }

  /* Izvajanje po vrsti (največ 2 hkrati), da nas ne zaustavi kvota in da je poraba predvidljiva. */
  function run(job){
    return new Promise((res, rej) => { wait.push({ job, res, rej }); pump(); });
  }
  async function pump(){
    while (active < R.concurrency && wait.length){
      const w = wait.shift(); active++;
      (async () => {
        try { const v = await w.job(); w.res(v); }
        catch(e){ w.rej(e); }
        finally { active--; if (R.minGap) await sleep(R.minGap); pump(); }
      })();
    }
  }

  /* Razdalja in čas OD → DO (vozni, brez prometa razen če je vklopljeno). Vrne { km, min, f:[lat,lon], t:[lat,lon], q:{f,t} } */
  function ride(fromText, toText, o = {}){
    const qf = queryOf(fromText), qt = queryOf(toText);
    if (!qf || !qt) return Promise.reject(Object.assign(new Error('Manjka naslov OD ali DO.'), { code:'empty' }));
    if (!enabled()) return Promise.reject(Object.assign(new Error('Google ni vklopljen.'), { code:'off' }));
    const traffic = !!gs().traffic && !!o.departIso;
    const k = qf + '>' + qt + (traffic ? '@' + o.departIso.slice(0, 13) : '');
    if (!o.fresh && cache.has(k)) return Promise.resolve(cache.get(k));
    if (inflight.has(k)) return inflight.get(k);
    const p = run(async () => {
      const body = { origin:wp(qf), destination:wp(qt), travelMode:'DRIVE', routingPreference:traffic ? 'TRAFFIC_AWARE' : 'TRAFFIC_UNAWARE', languageCode:'sl-SI', regionCode:'SI', units:'METRIC' };
      if (traffic) body.departureTime = o.departIso;
      const t0 = Date.now();
      const d = await post(body, MASK_TWO);
      const rt = d && d.routes && d.routes[0];
      if (!rt || !isFinite(rt.distanceMeters)) throw Object.assign(new Error('Google ne najde poti med naslovoma.'), { code:'noroute' });
      const lg = (rt.legs && rt.legs[0]) || {};
      const out = { km:rt.distanceMeters / 1000, min:(secs(rt.duration) || 0) / 60, f:ll(lg.startLocation), t:ll(lg.endLocation), q:{ f:qf, t:qt }, ms:Date.now() - t0, at:new Date().toISOString() };
      cache.set(k, out); R.lastOk = Date.now(); R.version++; setStatus('ok');
      return out;
    }).catch(e => { R.errors++; setStatus('error', e.message); if (AUTH_ERR(e)) coolUntil = Date.now() + 120000; throw e; })
      .finally(() => inflight.delete(k));
    inflight.set(k, p);
    return p;
  }

  /* Vožnja z več postanki (npr. postaja → pacient 1 → pacient 2 → cilj → postaja): skupni km in km po odsekih. points: [{q}|{lat,lon}] */
  async function multi(points){
    if (!enabled()) throw Object.assign(new Error('Google ni vklopljen.'), { code:'off' });
    const wps = points.map(p => wp(p.q ? p.q : p));
    if (wps.length < 2) throw new Error('Premalo točk.');
    const k = 'M:' + JSON.stringify(wps);
    if (cache.has(k)) return cache.get(k);
    return run(async () => {
      const body = { origin:wps[0], destination:wps[wps.length - 1], intermediates:wps.slice(1, -1), travelMode:'DRIVE', routingPreference:'TRAFFIC_UNAWARE', languageCode:'sl-SI', regionCode:'SI', units:'METRIC' };
      const d = await post(body, MASK_MULTI), rt = d && d.routes && d.routes[0];
      if (!rt) throw Object.assign(new Error('Google ne najde poti.'), { code:'noroute' });
      const out = { km:rt.distanceMeters / 1000, min:(secs(rt.duration) || 0) / 60, legs:(rt.legs || []).map(l => ({ km:(l.distanceMeters || 0) / 1000, min:(secs(l.duration) || 0) / 60 })) };
      cache.set(k, out); R.lastOk = Date.now(); setStatus('ok'); return out;
    }).catch(e => { setStatus('error', e.message); throw e; });
  }

  async function test(){
    if (!configured()) return { ok:false, msg:'Ključ Google ni nastavljen (config.js → google.key ali vpiši v polje spodaj).' };
    const t0 = Date.now();
    try {
      const r = await ride('Splošna bolnišnica Brežice, Brežice', 'UKC Ljubljana, Zaloška cesta 2, Ljubljana', { fresh:true });
      const ok = r.km > 80 && r.km < 160;
      return { ok, km:r.km, min:r.min, ms:Date.now() - t0, msg:ok ? 'Povezava z Googlom deluje.' : 'Google je vrnil nenavadno razdaljo (' + r.km.toFixed(1) + ' km). Preveri naslove.' };
    } catch(e){ return { ok:false, msg:e.message, code:e.code }; }
  }
  function clear(){ cache.clear(); inflight.clear(); R.version++; coolUntil = 0; setStatus('idle'); }
  function forget(){ clear(); wait.length = 0; }
  const info = () => ({ configured:configured(), on:enabled(), auto:auto(), traffic:!!gs().traffic, status:R.status, err:R.err, calls:R.calls, errors:R.errors, cached:cache.size, queued:wait.length + active, lastOk:R.lastOk, cooling:Math.max(0, coolUntil - Date.now()), keyTail:keyVal() ? '…' + keyVal().slice(-4) : '' });
  Object.assign(R, { configured, enabled, auto, queryOf, ride, multi, test, clear, forget, info, ENDPOINT });
  return R;
})();

/* =====================================================================
   KILOMETRINA PREVOZA (vpis v knjigi): km OD → DO, vir, natančnost, zastarelost, samodejni izračun
   Dva načina računanja (KM.engine()):
   - 'osm' (BREZPLAČNO, privzeto): točka naslova iz OpenStreetMap (37-geocode.js: ulica + hišna številka) in cestna razdalja OSRM (38-routing.js)
   - 'google' (neobvezno, ko je vnesen ključ): Google Routes API, kot v Google Zemljevidih
   Polja prevoza: km (OD → DO), kmBack (DO → OD, samo ko reševalec počaka na pregled), kmSrc ('osm' | 'google' | 'rocno'), kk (besedilo OD>DO ob izračunu),
   gf / gt (koordinate OD in DO), gp (natančnost točk [OD, DO]: hisna | ulica | nejasno | naselje | ustanova | rocno), kmAt (čas izračuna).
   ===================================================================== */
const KM = (() => {
  const timers = new Map();
  const r1 = x => Math.round(x * 10) / 10;
  const fmtKm = x => (x == null || !isFinite(x)) ? '–' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
  const fresh = r => r.km != null && (r.kmSrc === 'rocno' || r.kk === rideKk(r));
  const needBack = r => +r.stay > 0 && r.kmBack == null && r.kmSrc !== 'rocno';          // čakanje je bilo vklopljeno po izračunu: manjka pot nazaj
  const done = r => fresh(r) && (r.kmSrc === 'rocno' || (r.gf && r.gt)) && !needBack(r);
  const SRC = { osm:'naslov + ceste OSM', google:'Google', rocno:'ročno', osrm:'ceste OSM', ocena:'ocena' };
  /* Način računanja: Google, če je vnesen ključ; sicer brezplačno OSM (iskanje naslova + OSRM). */
  const engine = () => GOOGLE.enabled() ? 'google' : ((GEOC.enabled() && ROUTE.enabled()) ? 'osm' : '');
  const can = () => engine() !== '';
  const autoOn = () => { const e = engine(); return e === 'google' ? GOOGLE.auto() : e === 'osm' ? GEOC.auto() : false; };
  const queued = () => GOOGLE.info().queued + GEOC.info().queued;
  const precOf = r => (r.kmSrc === 'osm' && Array.isArray(r.gp)) ? r.gp : null;
  const precExact = r => { const p = precOf(r); return !p || p.every(x => GEOC.exactPrec(x)); };
  /* Km prevoza za prikaz: shranjeno (Google ali ročno) ali sproti iz cestnih podatkov (OSM) oziroma ocena. */
  function info(r){
    const stay = +r.stay > 0;
    if (r.from && r.to && fresh(r)){
      const back = stay ? (r.kmBack != null ? r.kmBack : r.km) : 0;
      const ex = precExact(r);
      return { km:r.km, back, total:r.km + back, src:r.kmSrc || 'google', exact:ex, backExact:ex && (!stay || r.kmBack != null), prec:precOf(r) };
    }
    if (!(r.from || '').trim() || !(r.to || '').trim()) return { km:null, back:0, total:null, src:'', exact:false };
    const L = makeLeg(S.settings), l = L(ridePt(r, 'from'), ridePt(r, 'to')), src = l.real ? 'osrm' : 'ocena';
    return { km:l.km, back:stay ? l.km : 0, total:l.km * (stay ? 2 : 1), src, exact:false, backExact:false };
  }
  /* Izračun kilometrine za en prevoz (OD → DO in, če počaka, DO → OD): brezplačno z OSM ali z Googlom, če je ključ. Rezultat se zavrže, če se je besedilo medtem spremenilo. */
  async function ensure(date, id, o = {}){
    const hit = rideById(date, id); if (!hit) return null;
    const r0 = hit.r; if (!isFilled(r0) || r0.odpovedano || !(r0.from || '').trim() || !(r0.to || '').trim()) return null;
    const eng = engine(); if (!eng) return null;
    if (!o.force && done(r0)) return null;
    const kk0 = rideKk(r0), departIso = r0.time ? new Date(`${date}T${r0.time}:00`).toISOString() : '';
    let a, b = null, fa = null, ta = null;
    try {
      if (eng === 'google'){
        a = await GOOGLE.ride(r0.from, r0.to, { fresh:!!o.force, departIso });
        if (+r0.stay > 0) b = await GOOGLE.ride(r0.to, r0.from, { fresh:!!o.force, departIso });
      } else {
        fa = await GEOC.resolve(r0.from, { fresh:!!o.force }); ta = await GEOC.resolve(r0.to, { fresh:!!o.force });
        a = await ROUTE.exact(fa, ta);
        if (+r0.stay > 0) b = await ROUTE.exact(ta, fa);
      }
    } catch(e){ if (o.silent !== false && e.code !== 'off') note(id, e.message); return null; }
    const cur = rideById(date, id); if (!cur) return null;
    const r = cur.r; if (rideKk(r) !== kk0) return null;   // naslov se je medtem spremenil
    if (r.kmSrc === 'rocno' && !o.force) return null;      // dispečer je med izračunom vpisal km ročno: ročni vnos ima prednost
    if (eng === 'google'){ r.km = r1(a.km); r.kmBack = b ? r1(b.km) : null; r.kmSrc = 'google'; r.gf = a.f; r.gt = a.t; r.gp = null; r.kmWarn = ''; r.kmAt = a.at; }
    else {
      r.km = r1(a.km); r.kmBack = b ? r1(b.km) : null; r.kmSrc = 'osm'; r.gf = [fa.lat, fa.lon]; r.gt = [ta.lat, ta.lon]; r.gp = [fa.prec, ta.prec]; r.kmAt = new Date().toISOString();
      r.kmWarn = [fa.warn && 'OD: ' + fa.warn, ta.warn && 'DO: ' + ta.warn].filter(Boolean).join(' · ');
      if (Math.max(...a.snap) > 400) r.kmWarn = (r.kmWarn ? r.kmWarn + ' · ' : '') + 'točka je več kot 400 m od ceste';
    }
    r.kk = kk0;
    save(); if (KM.onUpdate) KM.onUpdate(date, id);
    return r;
  }
  const noted = new Map();
  function note(id, msg){ const t = Date.now(); if (noted.get('m') === msg && t - (noted.get('t') || 0) < 60000) return; noted.set('m', msg); noted.set('t', t); if (typeof toast === 'function') toast('Kilometrina: ' + msg); }
  function schedule(date, id){
    if (!autoOn()) return;
    const k = date + '|' + id; clearTimeout(timers.get(k));
    timers.set(k, setTimeout(() => { timers.delete(k); ensure(date, id); }, engine() === 'osm' ? 1500 : 900));   // OSM: iskanje šele, ko vnos mirujejo (pravilo Nominatim: brez samodokončanja)
  }
  /* Dispečer je na zemljevidu popravil točko naslova: vsi prevozi od včeraj naprej s tem naslovom se izračunajo znova (pretekli ostanejo, kot so bili zapisani). */
  function refix(text, from = addDays(todayStr(), -1)){
    const k = GEOC.key(text); let n = 0;
    Object.keys(S.rides || {}).forEach(date => {
      if (date < from) return;
      (S.rides[date] || []).forEach(r => {
        if (!isFilled(r) || r.odpovedano || r.kmSrc === 'rocno') return;
        if (GEOC.key(r.from || '') === k || GEOC.key(r.to || '') === k){ r.kk = ''; n++; schedule(date, r.id); }
      });
    });
    if (n) save();
    return n;
  }
  /* Vsi prevozi dneva brez svežega km (samodejno ob odprtju dneva ali na gumb) */
  function day(date, o = {}){
    const todo = filledRides(date).filter(({ r }) => !r.odpovedano && r.kmSrc !== 'rocno' && (o.force || !done(r))).map(({ r }) => r.id);   // ročni vnos km se pri množičnem preračunu ne prepiše
    return Promise.all(todo.map(id => ensure(date, id, { force:!!o.force, silent:false }))).then(() => todo.length);
  }
  function setManual(date, id, val){
    const hit = rideById(date, id); if (!hit) return;
    const r = hit.r, v = parseFloat(String(val).replace(',', '.'));
    if (!isFinite(v) || v < 0){ r.km = null; r.kmBack = null; r.kmSrc = ''; r.kk = ''; }
    else { r.km = r1(v); r.kmSrc = 'rocno'; r.kk = rideKk(r); r.kmAt = new Date().toISOString(); }
    save();
  }
  /* Poročilo za mesec: prevozi z km in viri; seštevki po dnevih in vozilih */
  function month(y, m){
    const n = daysInMonth(y, m), rows = [], days = [], veh = {};
    let tot = 0, ex = 0, miss = 0;
    for (let d = 1; d <= n; d++){
      const date = `${y}-${pad(m + 1)}-${pad(d)}`, list = filledRides(date).filter(({ r }) => !r.odpovedano);
      if (!list.length) continue;
      const plan = computePlan(date); let dt = 0;
      list.forEach(({ r, nr }) => {
        const i = info(r), a = plan.assign[r.id];
        const vehName = a ? a.veh : '';
        rows.push({ date, nr, r, i, veh:vehName });
        if (i.total != null){ tot += i.total; dt += i.total; if (i.exact) ex += i.total; if (vehName){ veh[vehName] = (veh[vehName] || 0) + i.total; } } else miss++;
      });
      days.push({ date, km:dt, n:list.length, vehKm:plan.totals.km });
    }
    return { rows, days, veh, total:tot, exact:ex, missing:miss };
  }
  const csvCell = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function csv(y, m, withNames = true){
    const rep = month(y, m);
    const head = ['datum', 'št.', 'ura', ...(withNames ? ['pacient'] : []), 'od', 'do', 'način', 'km OD→DO', 'km nazaj', 'km skupaj', 'vir', 'vozilo'];
    const lines = [head.join(';')].concat(rep.rows.map(x => [x.date, x.nr, x.r.time, ...(withNames ? [x.r.name] : []), x.r.from, x.r.to, MODES[x.r.mode] || x.r.mode,
      x.i.km == null ? '' : fmtKm(x.i.km), x.i.back ? fmtKm(x.i.back) : '', x.i.total == null ? '' : fmtKm(x.i.total), SRC[x.i.src] || '', x.veh].map(csvCell).join(';')));
    lines.push(['', '', '', ...(withNames ? [''] : []), '', '', 'SKUPAJ', '', '', fmtKm(rep.total), '', ''].join(';'));
    return '﻿' + lines.join('\r\n');
  }
  return { onUpdate:null, fresh, info, ensure, schedule, refix, day, setManual, month, csv, fmtKm, SRC, r1, engine, can, auto:autoOn, queued };
})();

/* =====================================================================
   RAZPORED: dnevne knjige, dializa, parjenje voznikov in vozil, združevanje in vrstni red prevozov
   Razdalje in časi vožnje: PRAVI CESTNI PODATKI (OpenStreetMap / OSRM, glej 38-routing.js). Samo če jih ni (strežnik se nalaga ali ni
   dosegljiv, naslov brez koordinat), je vožnja OCENA: zračna razdalja × faktor ceste, hitrosti po ZPrCP. Ocenjene relacije so vedno označene.
   Razširitve: vožnje z več cilji (vrstni red izstopov), združevanje sorodnih ciljev, primerjava več razporedov (optimizacija),
   konflikti, ocena prihodov (ETA) in predlogi. Osnovni (»osnovni«) razpored je nespremenjen prvotni algoritem; ostali so izbrani le, če so boljši.
   ===================================================================== */
const PLAN_CACHE = new Map();

/* ---------- Knjiga: polja ---------- */
const blankRide = () => ({ id:uid(), name:'', time:'', from:'', to:'', phone:'', mode:'sede', dia:'', diaKey:'', stay:0, km:null, kmBack:null, kmSrc:'', kk:'', gf:null, gt:null, gp:null, kmWarn:'', kmAt:'', done:false, doneBy:'', doneAt:'', pin:'', demo:false,
  patientId:'', nalogId:'', note:'', exc:false, odpovedano:false, prevStatus:'', status:'nova', times:{}, statusBy:'', runKey:'', chk:'' });
const isFilled = r => !!((r.name||'').trim() || (r.from||'').trim() || (r.to||'').trim());
function ensureDay(date){
  let a = S.rides[date]; if (!a) a = S.rides[date] = [];
  while (a.length < S.settings.slots) a.push(blankRide());
  return a;
}
function addSlots(date, n){ const a = ensureDay(date); for (let i = 0; i < n; i++) a.push(blankRide()); save(); }
function filledRides(date){ return ensureDay(date).map((r,i) => ({ r, nr:i+1 })).filter(x => isFilled(x.r)); }
function rideById(date, id){ const a = ensureDay(date); const i = a.findIndex(r => r.id === id); return i < 0 ? null : { r:a[i], nr:i+1 }; }
const rideKk = r => norm(r.from) + '>' + norm(r.to);
/* Točka vožnje: ustanova/klinika ali naselje. Če je Google za ta naslov že vrnil natančne koordinate (r.gf / r.gt, glej 39-google.js) in se besedilo
   od takrat ni spremenilo, se uporabijo te: hišni naslov je točka (ne središče naselja). Takšne točke se nikoli ne shranijo v trajni predpomnilnik poti. */
function ridePt(r, side){
  const g = geo(r[side] || (r.mode === 'vzorci' && side === 'from' ? 'ZD Brežice' : '')), ll = side === 'from' ? r.gf : r.gt;
  if (!ll || g.kind === 'prazno' || !r.kk || r.kk !== rideKk(r) || !isFinite(ll[0]) || !isFinite(ll[1])) return g;
  if (g.kind === 'poi' && g.poi.fixed) return g;
  if (g.kind === 'poi') return { ...g, lat:ll[0], lon:ll[1], exact:true };
  return { ...g, kind:'addr', key:'g:' + (+ll[0]).toFixed(4) + ',' + (+ll[1]).toFixed(4), lat:ll[0], lon:ll[1], label:(r[side] || '').trim(), exact:true };
}
function rideDir(r){
  const f = geo(r.from), t = geo(r.to);
  if (f.kind === 'poi' && t.kind !== 'poi' && t.kind !== 'prazno') return 'from';
  return 'to';
}

/* ---------- Dializa: register pacientov (Nastavitve → Dializa), termin dopoldanska / popoldanska ----------
   Za vsakega pacienta, ki ta dan dializira, se vpiše prevoz tja (ura = začetek termina) in nazaj (ura = konec termina). */
function loadDialysis(date){
  const terms = diaTermsFor(date); if (!terms.length) return 0;
  const a = ensureDay(date); let added = 0;
  const place = obj => {
    let i = a.findIndex(r => !isFilled(r));
    if (i < 0){ a.push(blankRide()); i = a.length - 1; }
    Object.assign(a[i], blankRide(), obj); added++;
  };
  for (const p of S.patients){
    const dt = p.dt; if (!dt || !terms.includes(dt.t) || !(dt.d || []).includes(dow(date))) continue;
    const g = (S.settings.diaT || {})[dt.t]; if (!g) continue;
    const nl = activeNalog(p, date);
    const base = { name:p.name, phone:p.phone, mode:p.mode, dia:dt.t, demo:!!p.demo, patientId:p.id, nalogId:nl ? nl.id : '' };
    const k1 = p.id + ':tja', k2 = p.id + ':nazaj';
    if (!a.some(r => r.diaKey === k1)) place({ ...base, time:g.start, from:p.addr, to:DIA_DEFAULT, diaKey:k1 });
    if (!a.some(r => r.diaKey === k2)) place({ ...base, time:g.end, from:DIA_DEFAULT, to:p.addr, diaKey:k2 });
  }
  if (added) save();
  return added;
}

/* ---------- Vozila, posebnosti ---------- */
function vehBlocked(date, vid){
  return S.notices.find(n => n.vehicleId === vid && !n.closed && (n.tip === 'okvara' || n.tip === 'servis') && n.from <= date && (!n.to || n.to >= date)) || null;
}
const vehOff = (date, vid) => (S.vehOff[date] || []).includes(vid);
function availableVehicles(date){
  return S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo' && !vehOff(date, v.id) && !vehBlocked(date, v.id));
}
const vehById = id => S.vehicles.find(v => v.id === id);
/* Kapaciteta: običajna (sede/leze/utila/skupaj) in največja dovoljena (…Max). Največja se uporabi samo, ko se pravila prilagajajo. */
const capOf = (v, lvl) => lvl
  ? { sede:Math.max(v.sede, v.sedeMax ?? v.sede), leze:Math.max(v.leze, v.lezeMax ?? v.leze), utila:Math.max(v.utila, v.utilaMax ?? v.utila), skupaj:Math.max(v.skupaj, v.skupajMax ?? v.skupaj) }
  : { sede:v.sede, leze:v.leze, utila:v.utila, skupaj:v.skupaj };
const capText = v => {
  const m = capOf(v, 1), bent = m.skupaj > v.skupaj || m.sede > v.sede || m.leze > v.leze || m.utila > v.utila;
  return `${v.sede} sede · ${v.leze} leže · ${v.utila} utila · skupaj ${v.skupaj}` + (bent ? ` (izjemoma do ${m.skupaj})` : '');
};
const fits = (counts, v, lvl = 0) => { const c = capOf(v, lvl); return counts.sede <= c.sede && counts.leze <= c.leze && counts.utila <= c.utila && (counts.sede + counts.leze + counts.utila) <= c.skupaj; };
const countModes = rides => { const c = { sede:0, leze:0, utila:0, vzorci:0 }; rides.forEach(r => { c[r.mode] = (c[r.mode] || 0) + 1; }); return c; };

/* ---------- Parjenje: kateri zaposleni vozi katero vozilo ---------- */
const isHelperRole = r => r === 'student' || r === 'dijak';
const ROLE_TAG = { spremljevalec:'sp.', student:'štud.', dijak:'dij.' };
/* Posadka = voznik + spremljevalec (NN in pripravljenost: 2 reševalca samodejno). Študent in dijak sta dodatna pomočnika,
   ne vozita in ne nadomestita spremljevalca. Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. */
function pairCrews(date){
  const duty = S.duty[date] || [];
  const split = !!(S.dayRules[date] && S.dayRules[date].split);   // ekipa se razdeli: vsak je voznik v svojem vozilu
  const veh = availableVehicles(date);
  const used = new Set(), crews = [], notes = [];
  const roleMap = new Map(), roleOf = d => roleMap.get(d) || d.role || 'voznik';
  if (!split) ['NN', 'pripravljenost'].forEach(tm => {   // 2 reševalca v ekipi: eden je voznik, drugi spremljevalec
    const V = duty.filter(d => d.team === tm && !isHelperRole(roleOf(d)) && roleOf(d) !== 'spremljevalec');
    const E = duty.filter(d => d.team === tm && roleOf(d) === 'spremljevalec');
    V.slice(Math.ceil((V.length + E.length) / 2)).forEach(d => roleMap.set(d, 'spremljevalec'));
  });
  const helpers = duty.filter(d => isHelperRole(roleOf(d)));
  const drivers = duty.filter(d => !isHelperRole(roleOf(d)) && (split || roleOf(d) !== 'spremljevalec'));
  const escorts = split ? [] : duty.filter(d => roleOf(d) === 'spremljevalec');
  const needLeze = (S.rides[date] || []).some(r => isFilled(r) && !r.done && !r.odpovedano && r.status !== 'preklicana' && r.mode === 'leze');
  const take = (d, v) => {
    used.add(v.id);
    const shift = toMin(d.from) ?? toMin(S.settings.shift) ?? 360;
    const explicit = !!(d.from || d.to);
    let end = null;
    if (explicit && S.rules.enforceShift){ end = d.to ? toMin(d.to) : shift + (S.rules.shiftHours || 8) * 60; if (end != null && end <= shift) end += 1440; }
    crews.push({ id:v.id, vehicle:v, driver:d, escorts:[], helpers:[], team:d.team, shift, end, ot:Math.max(0, +d.ot || 0) });
  };
  drivers.forEach(d => { if (d.vehicleId){ const v = veh.find(x => x.id === d.vehicleId && !used.has(x.id)); if (v) take(d, v); } });
  const rest = drivers.filter(d => !crews.some(c => c.driver === d));
  const hasMate = d => !split && escorts.some(e => e.team === d.team);
  const pickFor = d => {
    const free = veh.filter(v => !used.has(v.id));
    const want = d.team === 'NN' ? ['NN','oboje'] : ['redna','oboje'];
    const lz = needLeze && hasMate(d) ? free.filter(v => v.leze > 0) : [];   // ekipa z dvema: vozilo z nosili, če je leže prevoz
    return lz.find(v => want.includes(v.ns)) || lz[0] || free.find(v => want.includes(v.ns)) || free[0] || null;
  };
  [...rest.filter(d => d.team === 'NN'), ...rest.filter(d => d.team !== 'NN')].forEach(d => { const v = pickFor(d); if (v) take(d, v); });
  const unpaired = rest.filter(d => !crews.some(c => c.driver === d));
  const order = veh.map(v => v.id);
  const sortCrews = () => crews.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  sortCrews();
  const looseEsc = [], looseHelp = [];
  const fewest = () => crews.slice().sort((a, b) => a.escorts.length - b.escorts.length || (needLeze ? (b.vehicle.leze > 0) - (a.vehicle.leze > 0) : 0));
  escorts.forEach(e => { const cand = fewest(), c = cand.find(c => !c.escorts.length && c.team === e.team) || cand.find(c => !c.escorts.length) || cand[0]; if (c) c.escorts.push(e); else looseEsc.push(e); });
  helpers.forEach(h => { const cand = crews.slice().sort((a, b) => a.helpers.length - b.helpers.length), c = cand.find(c => c.team === h.team) || cand[0]; if (c) c.helpers.push(h); else looseHelp.push(h); });
  /* Leže: če nobena posadka nima spremljevalca in vozila z nosili, aplikacija sama sestavi posadko (voznik + spremljevalec) */
  if (needLeze && !split && !crews.some(c => c.escorts.length && c.vehicle.leze > 0)){
    const lezV = veh.filter(v => v.leze > 0), setVeh = (c, v) => { c.vehicle = v; c.id = v.id; };
    const freeLez = () => lezV.find(v => !used.has(v.id));
    let lead = crews.find(c => c.escorts.length) || null;
    if (lead){
      if (lead.vehicle.leze <= 0){
        const f = freeLez();
        if (f){ used.delete(lead.vehicle.id); used.add(f.id); setVeh(lead, f); }
        else { const oth = crews.find(c => c !== lead && c.vehicle.leze > 0); if (oth){ const tv = lead.vehicle; setVeh(lead, oth.vehicle); setVeh(oth, tv); } }
      }
    } else if (crews.length >= 2 && lezV.length){
      lead = crews.find(c => c.vehicle.leze > 0) || crews[0];
      if (lead.vehicle.leze <= 0){ const f = freeLez(); if (f){ used.delete(lead.vehicle.id); used.add(f.id); setVeh(lead, f); } }
      if (lead.vehicle.leze > 0){
        const donor = crews.filter(c => c !== lead).sort((a, b) => (a.team === lead.team ? 0 : 1) - (b.team === lead.team ? 0 : 1) || a.vehicle.skupaj - b.vehicle.skupaj)[0];
        if (donor){
          lead.escorts.push(donor.driver); lead.helpers.push(...donor.helpers);
          crews.splice(crews.indexOf(donor), 1); used.delete(donor.vehicle.id);
          notes.push(`Zaradi prevoza leže sta ${lead.driver.name} (voznik) in ${donor.driver.name} (spremljevalec) združena v eno posadko (${lead.vehicle.name}).`);
        }
      }
    }
    sortCrews();
  }
  crews.forEach(c => { c.solo = c.escorts.length === 0; });   // solo = samo voznik, leže pacienta ne more peljati
  return { crews, unpaired, looseEsc, looseHelp, notes, split };
}

/* ---------- Geometrija in cestni podatki ---------- */
function hav(a, b){
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon);
  const h = Math.sin(dLa/2)**2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/* OCENA (samo če cestnih podatkov ni): zračna razdalja × faktor ceste, hitrosti po ZPrCP. */
function estLeg(a, b, cfg){
  const km = Math.max(hav(a, b) * cfg.road, a.key === b.key ? 1.2 : 0.8);
  /* Omejitve po ZPrCP (46. člen): naselje 50, izven naselij 90, hitra cesta 110, avtocesta 130 km/h.
     Profil poti: prvih 6 km naselje, nato 14 km izven naselij, 15 km hitra cesta, preostanek avtocesta. */
  const L = cfg.lim || {}, e = (cfg.eff || 85) / 100;
  const s1 = Math.min(km, 6), s2 = Math.min(Math.max(km - 6, 0), 14), s3 = Math.min(Math.max(km - 20, 0), 15), s4 = Math.max(km - 35, 0);
  return { km, min: (s1 / (L.naselje || 50) + s2 / (L.izven || 90) + s3 / (L.hitra || 110) + s4 / (L.avtocesta || 130)) / e * 60 + 1, est:true };
}
/* Vožnja med dvema točkama: { km, min, real } po cestah (OSRM), sicer ocena { est:true }.
   wait = cestni podatek za to relacijo se še nalaga ali ga strežnik ni vrnil; local = ista točka (npr. dva naslova v istem naselju). */
function makeLeg(cfg){
  const memo = new Map();
  return (a, b) => {
    const k = a.key + '>' + b.key;
    let v = memo.get(k);
    if (!v){
      const rr = a.key === b.key ? null : ROUTE.leg(a, b);
      if (rr){
        const f = (S.settings.routing && +S.settings.routing.factor) || 1;
        v = { km:Math.max(rr.km, 0.2), min:Math.max(rr.min * f, 0.5) + 1, real:true };   // +1 min: ustavljanje, parkiranje, vstop
      } else {
        v = estLeg(a, b, cfg);
        if (a.key === b.key) v.local = true;
        else if (ROUTE.enabled() && ROUTE.routable(a) && ROUTE.routable(b)) v.wait = true;
      }
      memo.set(k, v);
    }
    return v;
  };
}
function permute(arr, cb){
  const n = arr.length, c = new Array(n).fill(0), a = arr.slice();
  cb(a.slice());
  let i = 0;
  while (i < n){
    if (c[i] < i){ const j = i % 2 === 0 ? 0 : c[i]; [a[j], a[i]] = [a[i], a[j]]; cb(a.slice()); c[i]++; i = 0; }
    else { c[i] = 0; i++; }
  }
}
/* Točke obiska (cilji pri TJA, izhodišča pri ODVOZU) po ključu, v vrstnem redu pojavitve */
function uniqBy(arr, f){
  const m = new Map();
  arr.forEach(x => { const p = f(x); if (!m.has(p.key)) m.set(p.key, { pt:p, rides:[] }); m.get(p.key).rides.push(x); });
  return [...m.values()];
}
/* Vrstni redi obiska točk: do 4 točk vse permutacije, sicer najbližji sosed od začetne točke */
function visitOrders(groups, from, leg){
  if (groups.length <= 1) return [groups];
  if (groups.length <= 4){ const out = []; permute(groups, p => out.push(p)); return out; }
  const left = groups.slice(), seq = []; let cur = from;
  while (left.length){ let bi = 0; left.forEach((g, i) => { if (cur && leg(cur, g.pt).min < leg(cur, left[bi].pt).min) bi = i; }); const g = left.splice(bi, 1)[0]; seq.push(g); cur = g.pt; }
  return [seq];
}
/* Čas nalaganja / odpuščanja glede na način prevoza (leže in utila potrebujejo več časa kot sede) */
const loadOf = (r, cfg, side) => { const k = side === 'pick' ? 'pick' : 'drop', m = r.mode; const v = m === 'leze' ? cfg[k + 'Leze'] : m === 'utila' ? cfg[k + 'Utila'] : cfg[k + 'Min']; return (v != null && isFinite(v)) ? +v : +cfg[k + 'Min']; };
const loadSum = (rides, cfg, side) => rides.reduce((x, r) => x + loadOf(r, cfg, side), 0);
/* Konec vožnje: pri vožnji s čakanjem na pregled (stay) je vrnitev šele, ko je pregled končan (ura pregleda + trajanje + pot od vhoda) */
function retStartOf(ev, start){ return Math.max(start + ev.outDur, ev.readyAbs != null ? ev.readyAbs : -1e9, ev.readyRel != null ? start + ev.readyRel : -1e9); }
const tripEnd = (ev, start) => ev.ret ? retStartOf(ev, start) + ev.ret.dur : start + ev.dur;
const legCount = (l, c) => { if (l.real) c.real++; else if (!l.local){ c.est++; if (l.wait) c.wait++; } };

/* ---------- Ocena poti ene vožnje ----------
   TJA: pobiranje (vrstni red pobiranja) → en ali več ciljev (vrstni red izstopov). ODVOZ: en ali več izhodišč → izstopi doma.
   Pri enem cilju/izhodišču je rezultat enak prvotnemu izračunu. */
function evalTo(order, dest, cfg, leg){
  let t = 0, km = 0, prev = null; const stops = [], ride = {}, cnt = { real:0, est:0, wait:0 };
  for (const r of order){
    if (prev){ const l = leg(prev, r.from); t += l.min; km += l.km; legCount(l, cnt); }
    stops.push({ type:'pu', off:t, pt:r.from, rideId:r.id });
    t += loadOf(r, cfg, 'pick'); ride[r.id] = t; prev = r.from;
  }
  const groups = uniqBy(order, r => r.to), ptOf = g => (dest && g.pt.key === dest.key ? dest : g.pt);
  const ret = order.filter(r => r.stay > 0);
  let best = null;
  for (const seq of visitOrders(groups, prev, leg)){
    let tt = t, kk = km, pv = prev; const dstops = [], arrAt = {}, c2 = { ...cnt };
    for (const g of seq){
      const pt = ptOf(g), l = leg(pv, pt); tt += l.min; kk += l.km; legCount(l, c2);
      dstops.push({ type:'do', off:tt, pt, rideIds:g.rides.map(r => r.id) });
      g.rides.forEach(r => { arrAt[r.id] = tt; });
      tt += loadSum(g.rides, cfg, 'drop'); pv = pt;
    }
    let maxRide = 0; const rideMin = {};
    order.forEach(r => { rideMin[r.id] = arrAt[r.id] - ride[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id]; });
    let dl = null, early = 0;                                   // dl = najmanjša rezerva do ure preiskave (brez varnostne rezerve); pot od vhoda do ambulante (extra) je všteta
    order.forEach(r => { if (r.time != null){ const d = r.time - arrAt[r.id] - (r.extra || 0); if (dl == null || d < dl) dl = d; } });
    if (seq.length > 1 && dl != null) order.forEach(r => { if (r.time != null) early += (r.time - arrAt[r.id] - (r.extra || 0)) - dl; });   // pacienti, ki bi čakali na cilju
    const ev = { order, stops:dstops.length ? stops.concat(dstops) : stops, arr:dstops[0].off, dur:tt, outDur:tt, km:kk, maxRide, rideMin, arrAt, dl, visit:seq.map(ptOf), lastPt:pv, nReal:c2.real, nEst:c2.est, nWait:c2.wait, ret:null, readyAbs:null, readyRel:null, waitNom:0 };
    /* Čakanje na pregled: po izstopu reševalec počaka do konca pregleda, nato pacienta odpelje nazaj na izhodišče (vožnja nazaj je všteta). */
    if (ret.length && seq.length === 1){
      const T0 = dl != null ? dl - cfg.buffer : null;           // nominalni začetek vožnje (prihod točno z rezervo pred pregledom)
      let nomMax = 0;
      ret.forEach(r => {
        if (r.time != null){ const abs = r.time + r.stay + (r.extra || 0); ev.readyAbs = ev.readyAbs == null ? abs : Math.max(ev.readyAbs, abs); nomMax = Math.max(nomMax, abs - (T0 ?? 0)); }
        else { const rel = arrAt[r.id] + loadOf(r, cfg, 'drop') + (r.extra || 0) + r.stay; ev.readyRel = ev.readyRel == null ? rel : Math.max(ev.readyRel, rel); nomMax = Math.max(nomMax, rel); }
      });
      const back = ret.map(r => r.vret || (r.vret = { id:r.id, nr:r.nr, name:r.name, mode:r.mode, from:r.to, to:r.from, time:null, extra:0, stay:0, kind:'from', pid:r.pid }));
      const er = evalFrom(back, pv, cfg, leg);
      ev.ret = { stops:er.stops, dur:er.dur, km:er.km, rideMin:er.rideMin, maxRide:er.maxRide, visit:er.visit, lastPt:er.lastPt };
      ev.waitNom = Math.max(0, nomMax - tt);
      ev.dur = tt + ev.waitNom + er.dur; ev.km = kk + er.km; ev.lastPt = er.lastPt;
      ev.nReal = c2.real + er.nReal; ev.nEst = c2.est + er.nEst; ev.nWait = c2.wait + er.nWait;
      if (er.maxRide > maxRide) ev.maxRide = er.maxRide;
    }
    ev.score = ev.dur + (ev.maxRide > cfg.maxRide ? 1000 : 0) + (seq.length > 1 ? early * 0.3 : 0);
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
function evalFrom(order, origin, cfg, leg){
  const groups = uniqBy(order, r => r.from), ptOf = g => (origin && g.pt.key === origin.key ? origin : g.pt);
  let best = null;
  for (const seq of visitOrders(groups, null, leg)){
    let t = 0, km = 0, prev = null; const stops = [], boarded = {}, pickOff = {}, cnt = { real:0, est:0, wait:0 };
    for (const g of seq){
      const pt = ptOf(g);
      if (prev){ const l = leg(prev, pt); t += l.min; km += l.km; legCount(l, cnt); }
      stops.push({ type:'pu', off:t, pt, rideIds:g.rides.map(r => r.id) });
      g.rides.forEach(r => { pickOff[r.id] = t; });
      t += loadSum(g.rides, cfg, 'pick');
      g.rides.forEach(r => { boarded[r.id] = t; });
      prev = pt;
    }
    let maxRide = 0; const rideMin = {};
    for (const r of order){
      const l = leg(prev, r.to); t += l.min; km += l.km; legCount(l, cnt);
      stops.push({ type:'do', off:t, pt:r.to, rideId:r.id });
      rideMin[r.id] = t - boarded[r.id]; if (rideMin[r.id] > maxRide) maxRide = rideMin[r.id];
      t += loadOf(r, cfg, 'drop'); prev = r.to;
    }
    let rd = null;                                              // najzgodnejši začetek vožnje, da noben pacient ne čaka
    order.forEach(r => { if (r.time != null){ const d = r.time - pickOff[r.id]; if (rd == null || d > rd) rd = d; } });
    const ev = { order, stops, arr:0, dur:t, outDur:t, km, maxRide, rideMin, pickOff, rd, ret:null, readyAbs:null, readyRel:null, visit:seq.map(ptOf), lastPt:prev, nReal:cnt.real, nEst:cnt.est, nWait:cnt.wait,
      score:t + (maxRide > cfg.maxRide ? 1000 : 0) + (seq.length > 1 && rd != null ? rd : 0) };
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
const evalTrip = (kind, order, anchor, cfg, leg) => kind === 'from' ? evalFrom(order, anchor, cfg, leg) : evalTo(order, anchor, cfg, leg);
function bestInsert(kind, order, r, anchor, cfg, leg){
  let best = null;
  for (let i = 0; i <= order.length; i++){
    const o = order.slice(0, i).concat([r], order.slice(i));
    const ev = evalTrip(kind, o, anchor, cfg, leg);
    if (!best || ev.score < best.score) best = ev;
  }
  return best;
}
function bestExact(kind, rides, anchor, cfg, leg){
  if (rides.length > 7 || rides.length < 2) return evalTrip(kind, rides, anchor, cfg, leg);
  let best = null;
  permute(rides, p => { const ev = evalTrip(kind, p, anchor, cfg, leg); if (!best || ev.score < best.score) best = ev; });
  return best;
}

/* ---------- Pravila: stroga in prilagojena ----------
   Stroga pravila = običajne vrednosti (kapaciteta vozila, najdaljša vožnja, okno, rezerva, dolžina izmene).
   Prilagojena pravila = največje dovoljene vrednosti (S.rules.bend, kapaciteta …Max, nadure).
   Način "samodejno": najprej stroga pravila; če bi bil prevoz nerazporejen ali bi zamudil, se pravila prilagodijo samo toliko, kot je treba,
   in vsaka prilagoditev je izpisana. Način "prosto": prilagoditve so vedno dovoljene. Način "strogo": prilagoditev ni (razen ročnih izjem).
   Ročna izjema na prevozu (kljukica "Izjema") ali pripeto vozilo vedno dovoljujeta prilagoditev za ta prevoz. */
const dayMode = date => (S.dayRules[date] && S.dayRules[date].mode) || S.rules.mode || 'samodejno';
const cfgFor = lvl => lvl ? { ...S.settings, ...S.rules.bend } : S.settings;
const EARLY_TOL = 60;   // do toliko minut pred preiskavo čakanje na cilju ni kaznovano
const planProblem = p => p.unassigned.length > 0 || p.totals.late > 0;
const planScore = p => p.unassigned.length * 1000 + p.totals.late * 50 + p.bends.length * 3 + p.totals.km * 0.05;
/* Cilj optimizacije (manj je bolje): nerazporejeno ≫ zamude ≫ konflikti ≫ prilagoditve, nato nadure, čakanje, kilometri in čas voženj */
const planObjective = p => p.unassigned.length * 1000 + p.totals.late * 300 + p.totals.lateMin * 1 + p.conflicts.filter(c => c.pen).length * 200 + p.bends.length * 3
  + p.totals.overtime * 0.3 + p.totals.wait * 0.1 + p.totals.km * 0.1 + p.totals.min * 0.03 + p.totals.waste * 0.3 + p.totals.stretcherUse * 2 + (p.totals.early || 0) * (S.settings.earlyW ?? 0.08);
/* Prevozi, ki so že v teku pri posadki: razpored jih ne prestavlja na drugo vozilo */
const LIVE_LOCK = ['sprejeta', 'na_poti', 'na_kraju', 'v_vozilu', 'na_cilju'];
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const seedOf = (str, k) => { let h = 2166136261; for (const ch of str + '#' + k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/* Različice izračuna. Prva (»osnovni«) je prvotni algoritem; ostale preizkušajo združevanje sorodnih ciljev, primernejša vozila
   in drugačen vrstni red dodeljevanja. Izbrana je različica z najnižjim ciljem (pri enakosti prva). Deterministično (seme iz datuma). */
function variantList(date){
  const v = [{ id:'osnovni' }];
  if (S.settings.optimize === false) return v;
  const n = ensureDay(date).filter(r => isFilled(r) && !r.done && !r.odpovedano && r.status !== 'preklicana').length;
  if (n < 2) return v;
  v.push({ id:'sorodni cilji', cluster:true });
  v.push({ id:'sorodni cilji + primerna vozila', cluster:true, fit:0.6 });
  v.push({ id:'primerna vozila', fit:0.6 });
  v.push({ id:'sorodni cilji, najdaljše prve', cluster:true, order:'dur' });
  v.push({ id:'najdaljše prve + polnjenje vrzeli', gaps:true, cluster:true, order:'dur' });
  v.push({ id:'polnjenje vrzeli', gaps:true });
  v.push({ id:'polnjenje vrzeli + sorodni cilji', gaps:true, cluster:true });
  v.push({ id:'polnjenje vrzeli + sorodni cilji + primerna vozila', gaps:true, cluster:true, fit:0.6 });
  for (let k = 1; k <= 6; k++) v.push({ id:'iskanje ' + k, gaps:true, cluster:true, fit:0.3, jit:40, seed:seedOf(date, k) });
  for (let k = 7; k <= 9; k++) v.push({ id:'iskanje ' + k, jit:40, seed:seedOf(date, k) });
  /* Enake različice še z »oddaljenimi cilji«: ure preiskav v isti vožnji se smejo razlikovati do Nastavitve → windowFar (Ljubljana, Novo mesto). Izbira po cilju (km, čakanje pacientov na cilju). */
  if (+S.settings.windowFar > S.settings.window) v.slice(0, 9).forEach(o => v.push({ ...o, id:o.id + ' + skupne vožnje', far:true }));
  return v;
}
function bestPlan(date, level){
  let best = null, base = null, n = 0;
  for (const opts of variantList(date)){
    const p = planLevel(date, level, opts); n++;
    if (!base) base = p;
    /* Trda pravila: razpored ni sprejet, če ima več nerazporejenih prevozov, ali več zamud, razen če zato razporedi več prevozov */
    const ok = p === base || p.unassigned.length < base.unassigned.length || (p.unassigned.length === base.unassigned.length && p.totals.late <= base.totals.late);
    if (ok && (!best || planObjective(p) < planObjective(best) - 1e-9)) best = p;
  }
  const brief = p => ({ km:p.totals.km, min:p.totals.min, late:p.totals.late, unassigned:p.unassigned.length, vehicles:p.totals.vehicles });
  best.eff = { tried:n, variant:best.opts.id, base:brief(base), saved:{ km:base.totals.km - best.totals.km, min:base.totals.min - best.totals.min, late:base.totals.late - best.totals.late, unassigned:base.unassigned.length - best.unassigned.length } };
  return best;
}

function computePlan(date){
  const mode = dayMode(date);
  const ck = date + '#' + rev + '#' + mode + '#' + ROUTE.version;
  if (PLAN_CACHE.has(ck)) return PLAN_CACHE.get(ck);
  let plan;
  if (mode === 'strogo') plan = bestPlan(date, 0);
  else if (mode === 'prosto') plan = bestPlan(date, 1);
  else {
    const p0 = bestPlan(date, 0);
    if (!planProblem(p0)) plan = p0;
    else { const p1 = bestPlan(date, 1); plan = planScore(p1) < planScore(p0) ? p1 : p0; }
  }
  plan.mode = mode;
  plan.suggestions = suggestFixes(plan, date, mode);
  PLAN_CACHE.set(ck, plan);
  return plan;
}

function planLevel(date, level, opts = {}){
  const cfgS = S.settings, cfgB = cfgFor(1), leg = makeLeg(cfgS);
  const rng = opts.seed ? mulberry(opts.seed) : null;
  const plan = { date, level, opts, crews:[], unassigned:[], warnings:[], bends:[], conflicts:[], assign:{}, totals:{ rides:0, km:0, min:0, late:0, lateMin:0, wait:0, overtime:0, vehicles:0, estLegs:0, waitLegs:0, realLegs:0, waste:0, stretcherUse:0, stayWait:0, early:0 }, pairing:null, standby:isStandby(date), pending:[] };

  // 1) vožnje, ki jih je treba opraviti
  const rides = [];
  ensureDay(date).forEach((r, i) => {
    if (!isFilled(r) || r.done || r.odpovedano || r.status === 'preklicana') return;
    const f = ridePt(r, 'from'), t = ridePt(r, 'to'), kind0 = rideDir(r);
    const lock = LIVE_LOCK.includes(r.status) && r.runKey && r.runKey.startsWith(date + '_') ? r.runKey.slice(date.length + 1) : '';
    /* Dializni prevoz brez ure (v knjigi »Dop« / »Pop«): ura je začetek (tja) oziroma konec (nazaj) termina iz Nastavitve → Dializa */
    const dT = r.dia && !toMin(r.time) ? (S.settings.diaT || {})[diaTermOf(r.dia)] : null, dTime = dT ? (kind0 === 'from' ? dT.end : dT.start) : '';
    rides.push({ id:r.id, nr:i+1, name:(r.name || '').trim() || '(brez imena)', mode:r.mode || 'sede', phone:r.phone || '', time:toMin(r.time) ?? toMin(dTime), timeTxt:r.time || dTime || '',
      from:f, to:t, fromTxt:r.from || '', toTxt:r.to || '', kind:kind0, pin:r.pin || lock, locked:!r.pin && !!lock, exc:!!r.exc, force:!!(r.exc || r.pin), pid:r.patientId || '', dia:r.dia ? diaTermOf(r.dia) : '',
      stay:kind0 === 'to' ? Math.max(0, +r.stay || 0) : 0, extra:kind0 === 'to' ? poiExtra(t) : 0 });
    if (f.kind === 'prazno' || t.kind === 'prazno') plan.warnings.push({ level:'warn', nr:i+1, text:`Prevoz ${i+1}: manjka naslov (${f.kind === 'prazno' ? 'od' : 'do'}). Razdalja je ocenjena iz centra Brežic.` });
  });
  plan.totals.rides = rides.length;
  plan.pending = rides;

  // 2) posadke
  const pr = pairCrews(date); plan.pairing = pr;
  const crews = pr.crews.map(c => ({ ...c, free:c.shift, pos:BASE_POINT_G(), trips:[], km:0, busy:0 }));
  pr.unpaired.forEach(d => plan.warnings.push({ level:'warn', text:`${d.name} je na delu, a ni prostega vozila.` }));
  pr.looseEsc.forEach(d => plan.warnings.push({ level:'info', text:`${d.name} (spremljevalec) nima voznika.` }));
  pr.looseHelp.forEach(d => plan.warnings.push({ level:'info', text:`${d.name} (${d.role === 'dijak' ? 'dijak' : 'študent'}) nima posadke.` }));
  pr.notes.forEach(t => plan.warnings.push({ level:'info', text:t }));
  if (!crews.length && rides.length) plan.warnings.push({ level:'bad', text:'Ni nobene posadke z vozilom. Dodaj zaposlene in razpoložljiva vozila.' });
  if (plan.standby && crews.length > 1) plan.warnings.push({ level:'info', text:'Vikend/praznik: običajno sta v pripravljenosti 2 zaposlena (ena posadka).' });

  // 3) združevanje v vožnje (stroga pravila najprej, prilagojena samo če je treba)
  //    Isti cilj ali (različica »sorodni cilji«) bližnji cilji, npr. UKC in Onkološki inštitut v Ljubljani: ena vožnja z več cilji.
  const maxCaps = crews.length ? crews.map(c => c.vehicle) : availableVehicles(date);
  const capable = (counts, lv) => maxCaps.some(v => fits(counts, v, lv));
  const timed = rides.filter(r => r.time != null).sort((a,b) => a.time - b.time);
  const untimed = rides.filter(r => r.time == null);
  let trips = [];
  const refOf = t => { const ts = t.rides.map(r => r.time).filter(x => x != null); if (!ts.length) return null; return t.kind === 'from' ? Math.max(...ts) : Math.min(...ts); };
  const anchorOf = r => r.kind === 'from' ? r.from : r.to;
  const destMin = cfgS.destMin ?? 12, maxDests = cfgS.maxDests ?? 3;
  const okPt = p => p.kind !== 'neznano' && p.kind !== 'prazno';
  const similar = (a, b) => a.key === b.key || (opts.cluster && okPt(a) && okPt(b) && leg(a, b).min <= destMin && leg(b, a).min <= destMin);
  /* Oddaljeni cilji (Ljubljana, Novo mesto): ena skupna vožnja je smiselna tudi, če se ure preiskav razlikujejo do »windowFar« min (pacienti počakajo na cilju); dispečer to v praksi stalno počne */
  const base0 = BASE_POINT_G(), farMin = cfgS.farMin ?? 40;
  const isFar = p => okPt(p) && leg(base0, p).min >= farMin;
  const winOf = (cf, t) => (opts.far && +cfgS.windowFar > cf.window && t.pts.some(isFar)) ? +cfgS.windowFar : cf.window;
  for (const r of [...timed, ...untimed]){
    const anchor = anchorOf(r);
    const stages = (level === 1 || r.force) ? [0, 1] : [0];
    let best = null, bestStage = 0;
    for (const st of stages){
      const cf = st ? cfgB : cfgS;
      for (const t of trips){
        if (t.kind !== r.kind || t.pin !== r.pin) continue;
        if ((r.stay > 0 || t.rides.some(x => x.stay > 0)) && !t.pts.some(p => p.key === anchor.key)) continue;   // čakanje na pregled: samo isti cilj (reševalec se vrne po pacienta)
        if (!t.pts.some(p => p.key === anchor.key)){
          if (!opts.cluster || t.pts.length >= maxDests || !t.pts.every(p => similar(p, anchor))) continue;
        }
        const ref = refOf(t);
        if (ref != null && r.time != null && Math.abs(ref - r.time) > winOf(cf, t)) continue;
        if (anchor.kind === 'neznano' && !t.pts.some(p => p.key === anchor.key)) continue;
        if (!capable(countModes([...t.rides, r]), st)) continue;
        const ev = bestInsert(r.kind, t.ev.order, r, t.anchor, cf, leg);
        if (ev.maxRide > cf.maxRide) continue;
        const extra = ev.dur - t.ev.dur;
        if (extra > cf.detour) continue;
        if (!best || extra < best.extra) best = { t, ev, extra };
      }
      if (best){ bestStage = st; break; }
    }
    if (best){ best.t.rides.push(r); best.t.ev = best.ev; if (!best.t.pts.some(p => p.key === anchor.key)) best.t.pts.push(anchor); if (bestStage || r.force) best.t.lvl = 1; }
    else trips.push({ id:uid(), kind:r.kind, anchor, pts:[anchor], rides:[r], ev:evalTrip(r.kind, [r], anchor, cfgS, leg), pin:r.pin, lvl:r.force ? 1 : 0, far:isFar(anchor) });
  }
  trips.forEach(t => { t.ev = bestExact(t.kind, t.ev.order, t.anchor, t.lvl ? cfgB : cfgS, leg); });

  // 4) ključni časi vožnje
  const qkey = t => (opts.order === 'dur' ? -t.ev.dur : (t.need ?? 1e6)) + (rng ? (rng() - 0.5) * opts.jit : 0) + (t.rides.some(r => r.dia) ? -1e5 : 0);   // dializni prevozi imajo fiksne ure: najprej njih
  const prep = t => {
    t.ref = refOf(t);
    t.counts = countModes(t.rides);
    const ev = t.ev, vis = ev.visit;
    t.anchor = vis[0];
    t.first = t.kind === 'from' ? vis[0] : ev.order[0].from;
    t.last = ev.lastPt;
    t.rdy = t.kind === 'from' ? ev.rd : null;                 // ODVOZ: najzgodnejši začetek, da noben pacient ne čaka
    if (t.kind === 'to'){ t.latestS = ev.dl == null ? null : ev.dl - cfgS.buffer; t.latestB = ev.dl == null ? null : ev.dl - cfgB.buffer; t.need = t.latestS; }
    else { t.latestS = t.latestB = null; t.need = t.rdy; }
    t.sbReturn = t.kind === 'from' && vis.every(p => p.kind === 'poi' && p.poi.home);
    t.force = t.rides.some(r => r.force);
    t.qk = qkey(t);
  };
  trips.forEach(prep);
  const hasNN = crews.some(c => c.team === 'NN');
  const hasLeze = rides.some(r => r.mode === 'leze');
  const baseG = BASE_POINT_G();

  // 5) razdelitev vožnj med posadke
  const queue = trips.slice().sort((a,b) => a.qk - b.qk);
  const crewFor = pin => crews.filter(c => !pin || c.id === pin);
  /* Mesta v dnevu posadke, kamor se lahko vstavi vožnja. Osnovni razpored: samo na konec (kot prej). Napredni: tudi v vrzeli med vožnjami
     (npr. dializna posadka po koncu dializnih voženj, ali med prevozom tja in nazaj). */
  const slotsOf = c => {
    if (!opts.gaps) return [{ i:c.trips.length, free:c.free, pos:c.pos, next:null }];
    const out = []; let free = c.shift, pos = baseG;
    for (let i = 0; i <= c.trips.length; i++){
      out.push({ i, free, pos, next:c.trips[i] || null });
      if (c.trips[i]){ free = c.trips[i].end; pos = c.trips[i].last; }
    }
    return out;
  };
  const nnLimit = +S.settings.nnMaxKm || 0;
  let guard = 0;
  while (queue.length && guard++ < 800){
    const t = queue.shift();
    let pool = crewFor(t.pin);
    if (t.pin && !crews.some(c => c.id === t.pin)){
      pool = crews;
      const lockedN = t.rides.filter(r => r.locked).map(r => r.nr);
      plan.warnings.push({ level:lockedN.length ? 'bad' : 'info', text:lockedN.length ? `Prevoz ${lockedN.join(', ')} je že v teku pri vozilu, ki ni več v razporedu; izbrano je drugo vozilo. Posadki sporoči spremembo.` : `Pripeto vozilo za prevoz ${t.rides.map(r => r.nr).join(', ')} ni na voljo; izbrano je drugo vozilo.` });
    }
    const stages = (level === 1 || t.force || t.lvl) ? [0, 1] : [0];
    const isDia = t.rides.some(r => r.dia);
    const farKm = nnLimit > 0 ? Math.max(0, ...t.ev.visit.map(p => leg(baseG, p).km), ...t.ev.order.map(r => leg(baseG, r.from).km)) : 0;
    let best = null, capOk = false, shiftBlocked = false, lezNoTeam = false, shiftNeed = null, shiftCrew = null;
    for (const st of stages){
      for (const c of pool){
        if (t.counts.leze > 0 && c.solo){ lezNoTeam = true; continue; }   // leže: 2 reševalca za nošenje
        if (!fits(t.counts, c.vehicle, st)) continue;
        capOk = true;
        const latest = st ? t.latestB : t.latestS;
        for (const sl of slotsOf(c)){
          const d = leg(sl.pos, t.first), arrive = sl.free + d.min;
          let start = arrive, late = 0;
          if (t.kind === 'to' && latest != null){ start = Math.max(arrive, latest); late = Math.max(0, arrive - latest); }
          else if (t.kind === 'from' && t.rdy != null){ start = Math.max(arrive, t.rdy); late = Math.max(0, arrive - t.rdy - cfgS.waitTol); }
          const endT = tripEnd(t.ev, start);
          let detour = 0;
          if (sl.next){   // vstavljanje v vrzel med dvema vožnjama: do naslednje mora biti dovolj časa (naslednja vožnja se ne premakne)
            const ln = leg(t.last, sl.next.first);
            if (endT + ln.min > sl.next.start + 1e-6) continue;
            detour = Math.max(0, ln.min - leg(sl.pos, sl.next.first).min);
          } else {
            const endAbs = endT + leg(t.last, baseG).min;
            if (c.end != null){ const okOt = Math.max(c.ot, st ? (S.rules.overtimeMax || 0) : 0); if (endAbs > c.end + okOt){ shiftBlocked = true; const need = Math.ceil(endAbs - (c.end + okOt)); if (shiftNeed == null || need < shiftNeed){ shiftNeed = need; shiftCrew = c; } continue; } }
          }
          const idle = start - arrive;
          let cost = late * 20 + d.min + detour + idle * 0.05 + c.trips.length * 0.5 + (st ? 25 : 0);
          if (c.vehicle.fn === 'dializa'){
            if (!opts.gaps) cost += isDia ? -15 : 45;   // osnovni razpored: dializno vozilo za druge prevoze samo po potrebi
            else if (isDia) cost -= 30;
            else cost += c.trips.some(x => x.dia) ? (sl.next && sl.next.dia ? 12 : 0) : 6;   // po koncu dializnih voženj je posadka prosta za sede prevoze; med njimi le, če je vrzel dovolj velika
          }
          if (t.sbReturn){ if (c.team === 'NN') cost -= 20; else if (hasNN) cost += 15; }
          if (c.team === 'NN' && nnLimit > 0 && farKm > nnLimit) cost += 200;   // NN ekipa ostane v regiji: dolge vožnje (Ljubljana ...) samo kot skrajna možnost
          if (opts.fit){   // primerno vozilo: ne zasedaj večjega vozila, kot je treba, in ne vozila z nosili, če jih ta dan potrebuje leže pacient
            const cap = capOf(c.vehicle, st), n = t.counts.sede + t.counts.leze + t.counts.utila;
            cost += opts.fit * Math.max(0, cap.skupaj - n);
            if (hasLeze && !t.counts.leze && c.vehicle.leze > 0) cost += 8;
          }
          if (!best || cost < best.cost) best = { c, d, arrive, start, late, cost, st, latest, sl };
        }
      }
    }
    if (!best && lezNoTeam) plan.warnings.push({ level:'bad', text:`Prevoz ${t.rides.map(r => r.nr).join(', ')}: pacient leže potrebuje 2 reševalca (voznik + spremljevalec) in vozilo z nosili.` });
    if (!best){
      if (t.rides.length > 1){
        t.rides.forEach(r => { const a = anchorOf(r); const nt = { id:uid(), kind:r.kind, anchor:a, pts:[a], rides:[r], ev:evalTrip(r.kind,[r],a,cfgS,leg), pin:r.pin, lvl:r.force ? 1 : 0 }; prep(nt); queue.push(nt); });
        queue.sort((a,b) => a.qk - b.qk);
      } else {
        const r = t.rides[0];
        const why = !crews.length ? 'ni posadke z vozilom'
          : !capOk ? `nobeno razpoložljivo vozilo ne sprejme načina prevoza (${MODES[r.mode] || r.mode})`
          : shiftBlocked ? 'izmena posadke se konča prej (vpiši nadure pri zaposlenem ali dovoli prilagoditev pravil)' : 'ni primerne posadke';
        plan.unassigned.push({ ride:r, reason:why, shiftNeed:shiftBlocked ? shiftNeed : null, shiftCrew:shiftBlocked && shiftCrew ? shiftCrew.driver.name : '', shiftVeh:shiftBlocked && shiftCrew ? shiftCrew.vehicle.name : '' });
      }
      continue;
    }
    const { c, d, start, late, sl } = best;
    const trip = { id:t.id, kind:t.kind, far:!!t.far, rides:t.ev.order, ev:t.ev, anchor:t.anchor, dests:t.ev.visit, start, depart:start - d.min, deadKm:d.km, from:sl.pos, first:t.first, last:t.last, dia:isDia, late:Math.round(late), counts:t.counts, ref:t.ref, sbReturn:t.sbReturn, pin:t.pin,
      wait: t.kind === 'from' && t.rdy != null ? Math.max(0, Math.round(best.arrive - t.rdy)) : 0, stage:best.st, forced:t.force,
      latestDepart: best.latest != null ? best.latest - d.min : null, shiftLimited: t.kind === 'to' && best.latest != null && c.trips.length === 0 && late > 0 };
    trip.end = tripEnd(t.ev, start);
    c.trips.splice(sl.i, 0, trip);
    if (!opts.gaps){ c.free = trip.end; c.pos = t.last; }
  }

  // 6) izhod: časi postankov, ETA, skupne vrednosti
  const seen = new Set(), cntAll = { real:0, est:0, wait:0 };
  const countLeg = (a, b) => { const k = a.key + '>' + b.key; if (seen.has(k)) return; seen.add(k); legCount(leg(a, b), cntAll); };
  for (const c of crews){
    c.trips.sort((a,b) => a.start - b.start);
    /* verižen izračun: odhod, prazne vožnje (km), zasedenost; vožnje s čakanjem na pregled imajo konec šele po vrnitvi */
    c.km = 0; c.busy = 0; let prevPt = baseG;
    for (const t of c.trips){
      const ev = t.ev;
      if (ev.ret){ t.retStart = retStartOf(ev, t.start); t.waitMin = Math.max(0, Math.round(t.retStart - (t.start + ev.outDur))); t.end = t.retStart + ev.ret.dur; }
      const dd = leg(prevPt, t.first); t.from = prevPt; t.deadKm = dd.km; t.depart = t.start - dd.min;
      c.km += dd.km + ev.km; c.busy += dd.min + (t.end - t.start); prevPt = t.last;
    }
    c.pos = prevPt;
    const back = leg(c.pos, baseG); if (c.trips.length) c.km += back.km;
    c.rideNrs = [];
    for (const t of c.trips){
      const mk = (s, base, isRet) => { const o = { ...s, t:base + s.off, ret:isRet }; const ids = s.rideIds || [s.rideId]; o.people = ids.map(id => t.rides.find(r => r.id === id)); return o; };
      t.stopsAbs = t.ev.stops.map(s => mk(s, t.start, false)).concat(t.ev.ret ? t.ev.ret.stops.map(s => mk(s, t.retStart, true)) : []);
      t.arrive = t.kind === 'to' ? t.start + t.ev.arr : null;
      // ETA za vsakega pacienta: pobiranje, prihod na cilj, rezerva do ure preiskave oziroma čakanje na odvoz
      t.info = {};
      t.stopsAbs.forEach(s => { (s.rideIds || [s.rideId]).forEach(id => { const o = t.info[id] || (t.info[id] = {}); if (s.ret){ if (s.type === 'pu') o.retPickT = s.t; else o.retDropT = s.t; } else if (s.type === 'pu') o.pickT = s.t; else o.dropT = s.t; }); });
      t.rides.forEach(r => {
        const o = t.info[r.id];
        if (t.kind === 'to' && r.time != null) o.slack = Math.round(r.time - o.dropT - (r.extra || 0));
        if (t.kind === 'from' && r.time != null) o.wait = Math.max(0, Math.round(o.pickT - r.time));
      });
      const sl = t.rides.map(r => t.info[r.id].slack).filter(x => x != null);
      t.slack = t.kind === 'to' && sl.length ? Math.min(...sl) : null;
      let prevPt = t.from; t.stopsAbs.forEach(s => { countLeg(prevPt, s.pt); prevPt = s.pt; });
      t.rides.forEach((r, i) => {
        c.rideNrs.push(r.nr);
        const pu = t.stopsAbs.find(s => s.type === 'pu' && (s.rideId === r.id || (s.rideIds && s.rideIds.includes(r.id))));
        const inf = t.info[r.id];
        plan.assign[r.id] = { crewId:c.id, veh:c.vehicle.name, t:pu ? pu.t : t.start, order:i+1, trip:t.id, late:t.late, rideMin:Math.round(t.ev.rideMin[r.id] || 0),
          pickT:inf.pickT, dropT:inf.dropT, retPickT:inf.retPickT ?? null, retT:inf.retDropT ?? null, stay:r.stay || 0, slack:inf.slack ?? null, wait:inf.wait ?? 0, kind:t.kind };
      });
      if (t.late > 0){
        const nrs = t.rides.map(r => r.nr).join(', ');
        const txt = t.shiftLimited ? `${c.vehicle.name}: za pravočasen prihod (prevoz ${nrs}) bi moral voznik štartati ob ${fmtT(t.latestDepart)}, izmena pa se začne ob ${fmtT(c.shift)}. Nastavi zgodnejši začetek izmene.`
          : t.kind === 'from' ? `${c.vehicle.name}: pri odvozu ${nrs} bo pacient čakal približno ${t.wait} min.`
          : `${c.vehicle.name}: prevoz ${nrs} bo zamudil približno ${t.late} min. Dodaj vozilo ali prerazporedi.`;
        plan.warnings.push({ level:'bad', text:txt });
      }
      if (t.ev.ret && t.waitMin > 0) plan.warnings.push({ level:'info', text:`${c.vehicle.name}: prevoz ${t.rides.map(r => r.nr).join(', ')} počaka na pregled približno ${fmtDur(t.waitMin)} (do ${fmtT(t.retStart)}), nato pacienta odpelje nazaj.` });
      plan.totals.stayWait += t.waitMin || 0;
      if (t.kind === 'to') t.rides.forEach(r => { const s = t.info[r.id].slack; if (s != null && s > EARLY_TOL) plan.totals.early += s - EARLY_TOL; });   // pacient je na cilju precej pred uro preiskave
      plan.totals.late += t.late > 0 ? t.rides.length : 0;
      plan.totals.lateMin += t.late > 0 ? t.late * t.rides.length : 0;
      plan.totals.wait += t.wait || 0;
      /* primernost vozila: neizkoriščena mesta in vozilo z nosili za pacienta, ki leže ne potrebuje (ko ta dan nekdo leže potrebuje nosila) */
      plan.totals.waste += Math.max(0, capOf(c.vehicle, t.stage).skupaj - (t.counts.sede + t.counts.leze + t.counts.utila));
      if (hasLeze && !t.counts.leze && c.vehicle.leze > 0) plan.totals.stretcherUse++;
    }
    if (c.trips.length) countLeg(c.pos, baseG);
    c.rideNrs.sort((a,b) => a - b);
    c.firstDepart = c.trips.length ? Math.min(...c.trips.map(t => t.depart)) : null;
    c.endAbs = c.trips.length ? c.trips[c.trips.length-1].end + back.min : null;
    c.overtime = c.end != null && c.endAbs != null ? Math.max(0, Math.round(c.endAbs - c.end)) : 0;
    if (c.trips.length && c.firstDepart < c.shift - 1) plan.warnings.push({ level:'warn', text:`${c.vehicle.name}: štart ob ${fmtT(c.firstDepart)} je pred začetkom izmene (${fmtT(c.shift)}).` });
    plan.totals.km += c.km; plan.totals.min += c.busy; plan.totals.overtime += c.overtime; if (c.trips.length) plan.totals.vehicles++;
  }
  plan.totals.realLegs = cntAll.real; plan.totals.estLegs = cntAll.est; plan.totals.waitLegs = cntAll.wait;
  plan.crews = crews;
  plan.unassigned.forEach(u => plan.warnings.push({ level:'bad', nr:u.ride.nr, text:`Prevoz ${u.ride.nr} (${u.ride.name}) ni razporejen: ${u.reason}.` }));

  // 7) prilagoditve pravil: vsaka, ki je bila uporabljena, je izpisana
  for (const c of crews){
    for (const t of c.trips){
      const nrs = t.rides.map(r => r.nr).join(', '), n = t.rides.length, std = capOf(c.vehicle, 0), mx = capOf(c.vehicle, 1);
      if (!fits(t.counts, c.vehicle, 0)) plan.bends.push({ k:'kap', text:`${c.vehicle.name}: ${n} pacientov v vozilu (običajno do ${std.skupaj}, izjemoma do ${mx.skupaj}). Prevozi ${nrs}.` });
      const over = t.rides.filter(r => (t.ev.rideMin[r.id] || 0) > cfgS.maxRide);
      if (over.length) plan.bends.push({ k:'voznja', text:`${c.vehicle.name}: pot v vozilu je daljša od običajnih ${cfgS.maxRide} min (prevoz ${over.map(r => r.nr).join(', ')}).` });
      const ts = t.rides.map(r => r.time).filter(x => x != null);
      const wLim = t.far && +cfgS.windowFar > cfgS.window ? +cfgS.windowFar : cfgS.window;
      if (ts.length > 1 && Math.max(...ts) - Math.min(...ts) > wLim) plan.bends.push({ k:'okno', text:`${c.vehicle.name}: ure pacientov se razlikujejo za več kot običajnih ${wLim} min (prevozi ${nrs}).` });
      if (t.kind === 'to' && t.slack != null && t.slack >= 0 && t.slack < cfgS.buffer) plan.bends.push({ k:'rezerva', text:`${c.vehicle.name}: rezerva pred preiskavo je ${t.slack} min (običajno ${cfgS.buffer} min). Prevozi ${nrs}.` });
    }
    if (c.overtime > 0) plan.bends.push({ k:'nadure', text:`${c.driver.name}: nadure približno ${c.overtime} min (izmena se običajno konča ob ${fmtT(c.end)}).` });
  }
  plan.rides = rides;
  rides.filter(r => r.force && plan.assign[r.id]).forEach(r => plan.bends.push({ k:'rocno', text:`Prevoz ${r.nr} (${r.name}): ročna izjema ali pripeto vozilo.` }));
  plan.bends.forEach(b => plan.warnings.push({ level:'bend', text:b.text }));

  analyzeConflicts(plan, cfgS);
  return plan;
}
function BASE_POINT_G(){ return { key:'poi:'+BASE_POI.n, lat:BASE_POINT.lat, lon:BASE_POINT.lon, kind:'poi', label:BASE_POI.n }; }

/* ---------- Konflikti in opozorila o izvedljivosti ----------
   Vsak konflikt je v plan.conflicts (tip, resnost) in v plan.warnings (prikaz). Prekrivanja posadke, istega pacienta v dveh vožnjah hkrati,
   prevozov v teku, ki bi jih razpored prestavil na drugo vozilo, nelogičnih ur odvoza, dolgega čakanja in ocenjenih (ne cestnih) relacij. */
function analyzeConflicts(plan, cfgS){
  const add = (sev, type, text, nrs, pen) => { plan.conflicts.push({ sev, type, text, nrs:nrs || [], pen:!!pen }); plan.warnings.push({ level:sev, text, conflict:type, nr:(nrs || [])[0] }); };
  const nrsOf = t => t.rides.map(r => r.nr);
  // 1) posadka ali vozilo v dveh vožnjah hkrati
  const vehIds = plan.crews.map(c => c.id);
  if (new Set(vehIds).size !== vehIds.length) add('bad', 'vozilo-dvojno', 'Isto vozilo je v razporedu dvakrat.', [], true);
  for (const c of plan.crews){
    for (let i = 1; i < c.trips.length; i++){
      const a = c.trips[i - 1], b = c.trips[i];
      if (b.depart < a.end - 0.5) add('bad', 'prekrivanje', `${c.vehicle.name}: vožnji (prevozi ${nrsOf(a).join(', ')} in ${nrsOf(b).join(', ')}) se časovno prekrivata.`, [...nrsOf(a), ...nrsOf(b)], true);
    }
  }
  // 2) isti pacient v dveh vožnjah hkrati; ura odvoza pred koncem preiskave
  const byP = new Map(), lg = makeLeg(cfgS);
  plan.rides.forEach(r => { const k = r.pid || norm(r.name); if (!k || r.name === '(brez imena)') return; if (!byP.has(k)) byP.set(k, []); byP.get(k).push(r); });
  for (const list of byP.values()){
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){
      const A = list[i], B = list[j], a = plan.assign[A.id], b = plan.assign[B.id];
      if (a && b && a.pickT < b.dropT - 0.5 && b.pickT < a.dropT - 0.5)
        add('bad', 'pacient-dvojno', `${A.name} je hkrati v prevozih ${A.nr} (${fmtT(a.pickT)}–${fmtT(a.dropT)}) in ${B.nr} (${fmtT(b.pickT)}–${fmtT(b.dropT)}). Morebiten dvojni vpis.`, [A.nr, B.nr], true);
      if (A.kind === 'to' && B.kind === 'to' && A.time != null && B.time != null){   // dva termina, ki ju pacient fizično ne more doseči
        const need = A.to.key === B.to.key ? 15 : lg(A.to, B.to).min + cfgS.buffer;
        if (Math.abs(A.time - B.time) < need) add('bad', 'pacient-termina', `${A.name}: prevoza ${A.nr} (${A.to.label}, ${A.timeTxt}) in ${B.nr} (${B.to.label}, ${B.timeTxt}) sta preblizu, da bi ga ena oseba dosegla${A.to.key === B.to.key ? ' (morebiten dvojni vpis)' : ' (vožnja med cilji ~' + Math.round(lg(A.to, B.to).min) + ' min)'}.`, [A.nr, B.nr]);
      }
      const to = A.kind === 'to' ? A : (B.kind === 'to' ? B : null), fr = A.kind === 'from' ? A : (B.kind === 'from' ? B : null);
      if (to && fr && to.time != null && fr.time != null && to.to.key === fr.from.key && fr.time < to.time + 15)
        add('warn', 'cas-odvoza', `${to.name}: odvoz (št. ${fr.nr}) je ob ${fr.timeTxt}, prevoz tja (št. ${to.nr}) pa ob ${to.timeTxt}. Preveri uri.`, [to.nr, fr.nr]);
    }
  }
  // 3) prevozi v teku, ki bi jih razpored prestavil na drugo vozilo
  plan.rides.filter(r => r.locked).forEach(r => {
    const a = plan.assign[r.id];
    if (a && a.crewId !== r.pin){ const v = vehById(r.pin); add('bad', 'zaklep', `Prevoz ${r.nr} (${r.name}) je že v teku pri vozilu ${v ? v.name : r.pin}, razpored ga zdaj dodeljuje vozilu ${a.veh}. Posadki sporoči spremembo.`, [r.nr], true); }
  });
  // 4) pacient bi na cilju dolgo čakal
  const wm = cfgS.waitMax ?? 90;
  for (const c of plan.crews) for (const t of c.trips) if (t.kind === 'to') t.rides.forEach(r => {
    const sl = t.info[r.id].slack, wmT = t.far ? Math.max(wm, +cfgS.windowFar || 0) : wm;   // pri oddaljenih ciljih je dolgo čakanje cena skupne vožnje
    if (sl != null && sl > wmT) add('warn', 'cakanje', `Prevoz ${r.nr} (${r.name}): pacient bo na cilju približno ${sl} min pred uro preiskave. Razmisli o drugem vrstnem redu ali vozilu.`, [r.nr]);
  });
  // 5) cestni podatki: ocenjene relacije in naslovi daleč od ceste
  const rs = ROUTE.info();
  if (rs.on && plan.totals.waitLegs > 0){
    if (rs.status === 'error') add('warn', 'ocena', `Cestni podatki niso dosegljivi (${rs.err || 'napaka'}): ${plan.totals.waitLegs} relacij je ocenjenih (zračna črta × ${cfgS.road}). Časi so lahko netočni.`, []);
    else add('info', 'ocena', `Cestni podatki se nalagajo: ${plan.totals.waitLegs} relacij je za zdaj ocenjenih. Razpored se osveži sam.`, []);
  }
  const far = new Map();
  plan.rides.forEach(r => [r.from, r.to].forEach(p => { if (ROUTE.routable(p) && p.kind !== 'poi'){ const d = ROUTE.snapFar(p); if (d > 2500) far.set(p.key, { p, d, nr:r.nr }); } }));
  far.forEach(({ p, d, nr }) => add('warn', 'cesta-daleč', `Prevoz ${nr}: točka »${p.label}« je ${(d / 1000).toFixed(1)} km od najbližje ceste. Preveri koordinate v Nastavitve → Naslovi.`, [nr]));
}

/* ---------- Predlogi za učinkovitejši razpored ---------- */
function suggestFixes(plan, date, mode){
  const out = [], nrs = a => a.map(x => x.ride ? x.ride.nr : x).join(', ');
  const tot = plan.totals, eff = plan.eff;
  if (eff && eff.tried > 1 && (eff.saved.km > 1 || eff.saved.min > 5 || eff.saved.late > 0 || eff.saved.unassigned > 0)){
    const bits = [];
    if (eff.saved.unassigned > 0) bits.push(`${eff.saved.unassigned} nerazporejenih prevozov manj`);
    if (eff.saved.late > 0) bits.push(`${eff.saved.late} zamud manj`);
    if (eff.saved.km > 1) bits.push(`${Math.round(eff.saved.km)} km manj`);
    if (eff.saved.min > 5) bits.push(`${Math.round(eff.saved.min)} min manj voženj in čakanja`);
    out.push({ k:'opt', tone:'ok', text:`Optimizacija: od ${eff.tried} preizkušenih razporedov je izbran »${eff.variant}« (${bits.join(', ')} kot pri osnovnem razporedu).` });
  }
  const multi = []; plan.crews.forEach(c => c.trips.forEach(t => { if (t.dests && t.dests.length > 1) multi.push({ c, t }); }));
  multi.forEach(({ c, t }) => out.push({ k:'merge', tone:'info', text:`${c.vehicle.name}: prevozi ${t.rides.map(r => r.nr).join(', ')} so v eni vožnji (${tripTitle(t)}), ker so cilji blizu skupaj. Vožnja ${t.kind === 'to' ? 'po vrstnem redu izstopov' : 'po vrstnem redu pobiranja'}: ${t.dests.map(p => p.label).join(' → ')}.` }));
  const un = plan.unassigned;
  if (un.length){
    const sh = un.filter(u => u.shiftNeed != null);
    sh.forEach(u => out.push({ k:'shift', tone:'bad', text:`Prevoz ${u.ride.nr} (${u.ride.name}): podaljšaj izmeno ${u.shiftCrew ? u.shiftCrew + ' (' + u.shiftVeh + ')' : ''} za približno ${u.shiftNeed} min ali dovoli nadure.` }));
    const avail = availableVehicles(date), used = new Set(plan.crews.map(c => c.id)), free = avail.filter(v => !used.has(v.id));
    const need = un.filter(u => u.shiftNeed == null);
    if (need.length && free.length){
      const ok = free.filter(v => need.some(u => fits(countModes([u.ride]), v, 1)));
      if (ok.length) out.push({ k:'veh', tone:'bad', text:`${ok.length > 1 ? 'Prosta vozila' : 'Prosto vozilo'} brez posadke: ${ok.map(v => v.name).join(', ')}. Z dodatnim voznikom bi se rešili prevozi ${nrs(need)}.` });
    }
  }
  if (mode === 'strogo' && plan.level === 0 && planProblem(plan)){
    const alt = bestPlan(date, 1);
    if (planScore(alt) < planScore(plan)) out.push({ k:'bend', tone:'warn', text:`Z načinom »Samodejno« ali »Prosto« (prilagoditev pravil) bi bilo ${alt.unassigned.length} nerazporejenih prevozov in ${alt.totals.late} zamud namesto ${un.length} in ${tot.late}.` });
  }
  plan.crews.forEach(c => c.trips.forEach(t => {
    if (t.late > 0 && t.kind === 'to' && !t.shiftLimited){
      out.push({ k:'late', tone:'bad', text:`${c.vehicle.name}: prevoz ${t.rides.map(r => r.nr).join(', ')} bo zamudil ~${t.late} min. Prestavi uro preiskave za vsaj ${t.late} min, dodaj vozilo ali določi zgodnejši začetek izmene.` });
    }
  }));
  if (ROUTE.enabled() && tot.waitLegs === 0 && tot.realLegs > 0) out.push({ k:'road', tone:'ok', text:`Vse vožnje (${tot.realLegs} relacij) so izračunane po dejanskih cestah (OpenStreetMap).` });
  return out;
}

/* ---------- Opisi vožnje, pot za prikaz in ocena prihoda v živo ---------- */
const tripTitle = t => [...new Set((t.dests && t.dests.length ? t.dests : [t.anchor]).map(p => p.label || (p.poi && p.poi.n) || ''))].filter(Boolean).join(' + ');
function tripWaypoints(t){
  const pts = [t.from, ...t.stopsAbs.map(s => s.pt)];
  return pts.filter((p, i) => !i || p.key !== pts[i - 1].key);
}
const stopDwell = s => { const pp = (s.people || []).filter(Boolean); return pp.length ? loadSum(pp, S.settings, s.type === 'pu' ? 'pick' : 'drop') : (s.type === 'pu' ? S.settings.pickMin : S.settings.dropMin); };
/* ETA glede na dejanski potek: iz časa, ko je posadka sporočila korak (na poti, v vozilu …), naprej po razporedu po cestnih podatkih */
function liveEta(date, r){
  if (!r || !['na_poti', 'na_kraju', 'v_vozilu'].includes(r.status)) return null;
  const plan = computePlan(date), a = plan.assign[r.id]; if (!a) return null;
  const c = plan.crews.find(x => x.id === a.crewId), t = c && c.trips.find(x => x.id === a.trip); if (!t) return null;
  const tm = k => { const iso = r.times && r.times[k]; if (!iso) return null; const d = new Date(iso); return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
  const leg = makeLeg(S.settings), st = t.stopsAbs;
  const has = (s, id) => s.rideId === id || (s.rideIds && s.rideIds.includes(id));
  const iPu = st.findIndex(s => s.type === 'pu' && has(s, r.id)), iDo = st.findIndex(s => s.type === 'do' && has(s, r.id));
  if (iPu < 0 || iDo < 0) return null;
  if (r.status === 'na_poti' && tm('na_poti') != null) return { t:tm('na_poti') + leg(iPu ? st[iPu - 1].pt : t.from, st[iPu].pt).min, what:'prihod k pacientu' };
  if (r.status === 'na_kraju' && tm('na_kraju') != null) return { t:tm('na_kraju') + stopDwell(st[iPu]), what:'odhod s pacientom' };
  if (r.status === 'v_vozilu' && tm('v_vozilu') != null){
    let x = tm('v_vozilu');
    for (let k = iPu + 1; k <= iDo; k++){ x += leg(st[k - 1].pt, st[k].pt).min; if (k < iDo) x += stopDwell(st[k]); }
    return { t:x, what:'prihod na cilj', appt:r.time ? toMin(r.time) : null };
  }
  return null;
}

/* ---------- Knjiga: samodejni vpis posadk v mesečni pregled ---------- */
const shortName = n => n;
function crewLabel(c){ return [c.driver.name, ...c.escorts.map(e => e.name + ' (sp.)'), ...(c.helpers || []).map(h => h.name + ' (' + (ROLE_TAG[h.role] || '') + ')')].join(', '); }
function writeBook(date){
  const duty = S.duty[date] || [];
  const book = S.crewBook[date] || (S.crewBook[date] = {});
  const pr = computePlan(date).pairing;
  const auto = {};
  pr.crews.forEach(c => { auto[c.id] = crewLabel(c); });
  const ost = S.vehicles.find(v => v.tip === 'ostalo');
  if (ost){ const names = [...pr.unpaired.map(d => d.name), ...pr.looseEsc.map(d => d.name)]; if (names.length) auto[ost.id] = names.join(', '); }
  for (const v of S.vehicles){
    const cell = book[v.id] || (book[v.id] = { text:'', manual:false });
    if (cell.manual || v.tip === 'ostalo') continue;   // »Ostalo« je prosto polje za opombe, ga ne prepisujemo
    cell.text = auto[v.id] || '';
  }
  if (!duty.length && !Object.values(book).some(c => c.text || c.manual)) delete S.crewBook[date];
  queueFlush();
}

/* ---------- Opozorila v knjigi ---------- */
function dayWarnings(date){
  const out = []; const rides = filledRides(date);
  const names = {};
  const avail = availableVehicles(date);
  rides.forEach(({ r, nr }) => {
    if (r.odpovedano) return;
    if (r.chk) out.push({ nr, text:`Polje ${nr}: prebrano s fotografije, preveri (${r.chk}) in pritisni »Preverjeno«.` });
    if (!r.name.trim()) out.push({ nr, text:`Polje ${nr}: manjka ime in priimek.` });
    if (!r.time) out.push({ nr, text:`Polje ${nr}: manjka ura preiskave.` });
    if (!r.from.trim() || !r.to.trim()) out.push({ nr, text:`Polje ${nr}: manjka naslov ${!r.from.trim() ? 'od' : 'do'}.` });
    else { const g = geo(r.from); if (g.kind === 'neznano') out.push({ nr, text:`Polje ${nr}: naslova »${r.from}« ni v Občini Brežice. Razdalja bo ocenjena iz centra Brežic.` }); }
    if (!r.phone.trim() && !r.done) out.push({ nr, text:`Polje ${nr}: manjka telefonska številka.` });
    const pt = r.patientId ? patientById(r.patientId) : null;
    if (pt && !r.done){
      const nl = (r.nalogId && (pt.naloge || []).find(x => x.id === r.nalogId)) || activeNalog(pt, date);
      if (!nl) out.push({ nr, text:`Polje ${nr}: pacient ${pt.name} nima veljavnega naloga za ta dan.` });
      else { const s2 = nalogState(nl, date); if (s2.st === 'potekel') out.push({ nr, text:`Polje ${nr}: nalog za prevoz je potekel (${fmtDMY(nl.veljaDo)}).` }); else if (s2.st === 'prihodnji') out.push({ nr, text:`Polje ${nr}: nalog še ne velja (${s2.label}).` }); else if (s2.st === 'kmalu') out.push({ nr, text:`Polje ${nr}: nalog za prevoz ${s2.label} (${fmtDMY(nl.veljaDo)}). Pripravi novega.` }); else if (s2.st === 'nepopoln') out.push({ nr, text:`Polje ${nr}: nalog je nepopoln.` }); }
    }
    const k = norm(r.name) + '|' + (r.dia ? r.diaKey : r.time) + '|' + rideDir(r);
    if (r.name.trim()){ (names[k] = names[k] || []).push(nr); }
    if (r.mode === 'leze'){
      if (avail.length && !avail.some(v => v.leze > 0)) out.push({ nr, text:`Polje ${nr}: pacient leže, razpoložljivo vozilo pa nima nosil.` });
      else if ((S.duty[date] || []).length && !pairCrews(date).crews.some(c => !c.solo && c.vehicle.leze > 0)) out.push({ nr, text:`Polje ${nr}: pacient leže potrebuje voznika in spremljevalca (2 reševalca) ter vozilo z nosili. Vpiši še enega zaposlenega ali izključi razdelitev ekipe.` });
    }
  });
  Object.values(names).filter(a => a.length > 1).forEach(a => out.push({ nr:a[0], text:`Polja ${a.join(' in ')}: ista oseba z isto uro (morebitni dvojni vpis).` }));
  return out;
}

/* ---------- Besedilo razporeda (za kopiranje v Viber/SMS) ---------- */
function planText(date){
  const p = computePlan(date);
  const lines = [`RAZPORED PREVOZOV · ${fmtLong(date)}`];
  const nd = S.dayNote[date]; if (nd) lines.push(`Opomba dneva: ${nd}`);
  if (!p.crews.length) lines.push('Ni posadk z vozilom.');
  p.crews.forEach(c => {
    lines.push('', `${c.vehicle.name} · ${crewLabel(c)}`);
    if (!c.trips.length){ lines.push('  (brez prevozov)'); return; }
    lines.push(`  Štart iz postaje: ${fmtT(c.firstDepart)} · prevozi št. ${c.rideNrs.join(', ')}`);
    c.trips.forEach(t => {
      const est = t.ev.nEst > 0 ? '~' : '';
      t.stopsAbs.forEach(s => {
        const who = (s.people || []).filter(Boolean).map(r => r.name).join(', ');
        const where = s.pt.label || (s.pt.poi && s.pt.poi.n) || '';
        const lbl = s.type === 'pu' ? 'pobere' : 'odpelje';
        const times = s.type === 'do' && t.kind === 'to' ? [...new Set((s.people || []).filter(r => r && r.time != null).map(r => r.timeTxt))] : [];
        lines.push(`  ${est}${fmtT(s.t)} ${lbl}: ${who} (${where})${times.length ? ' · preiskava ' + times.join('/') : ''}`);
      });
      lines.push(`  vožnja: ${t.ev.km.toFixed(0)} km · ${fmtDur(t.ev.dur)}${t.ev.nEst ? ' (ocena)' : ''}`);
    });
    lines.push(`  Skupaj: ${c.km.toFixed(0)} km · konec ob ${fmtT(c.endAbs)}`);
  });
  if (p.bends.length) lines.push('', 'PRILAGOJENA PRAVILA:', ...p.bends.map(b => '  ' + b.text));
  const cf = p.conflicts.filter(x => x.sev !== 'info');
  if (cf.length) lines.push('', 'KONFLIKTI IN OPOZORILA:', ...cf.map(x => '  ' + x.text));
  if (p.unassigned.length) lines.push('', 'NEZARAZPOREJENO: ' + p.unassigned.map(u => `št. ${u.ride.nr} ${u.ride.name}`).join('; '));
  lines.push('', p.totals.waitLegs ? 'Opomba: nekateri časi so ocena (cestni podatki se nalagajo ali niso dosegljivi).' : (p.totals.realLegs ? 'Časi in razdalje: po cestah (OpenStreetMap).' : 'Časi so ocena.'));
  return lines.join('\n');
}

/* =====================================================================
   PACIENTI IN NALOGI ZA PREVOZ
   Baza pacientov (shranjena enkrat, nato se izbere), nalogi: letni, mesečni, enkratni, za čas zdravljenja.
   Veljavnost se računa samodejno, en mesec pred iztekom se prikaže opozorilo.
   Privzete veljavnosti so predlog: pri vsakem nalogu preveri datum na papirnatem/elektronskem nalogu.
   ===================================================================== */
const blankPatient = (extra = {}) => ({ id:uid(), name:'', addr:'', phone:'', mode:'sede', dt:null, color:-1, zzzs:'', note:'', naloge:[], demo:false, created:new Date().toISOString(), ...extra });
const blankNalog = (vrsta = 'letna', from = todayStr()) => ({ id:uid(), vrsta, stevilka:'', narocnik:'', izvajalec:'Reševalna postaja Brežice (ZD Brežice)', zdravnik:'', zdravnikVrsta:'osebni', razlog:'', od:'', do:'', mode:'sede',
  veljaOd:from, veljaDo:defaultValidTo(vrsta, from), dnevi:'', opombe:'', preklican:false, porabljen:'', auto:true, created:new Date().toISOString() });
const patientById = id => S.patients.find(p => p.id === id) || null;
const fmtDMY = s => { if (!s) return '–'; const d = parseYmd(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
function endOfMonthStr(s){ const d = parseYmd(s); return ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
function defaultValidTo(vrsta, from){
  if (!from) return '';
  if (vrsta === 'letna'){ const d = parseYmd(from); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return ymd(d); }
  if (vrsta === 'mesecna') return endOfMonthStr(from);
  if (vrsta === 'enkratna') return from;
  return addDays(from, 27);   // za čas zdravljenja: predlog 4 tedni, vpiši po nalogu
}

/* ---------- Stanje naloga ---------- */
function nalogState(n, onDate = todayStr()){
  /* Letni nalog: opozorilo 30 dni vnaprej (nastavljivo). Mesečni in za čas zdravljenja: krajše okno (7 dni), sicer bi bil opozorjen ves mesec. Enkratni: samo na dan veljavnosti. */
  const warnDays = n.vrsta === 'letna' ? (S.rules.opozoriloDni ?? 30) : n.vrsta === 'enkratna' ? 0 : (S.rules.opozoriloKratki ?? 7);
  if (n.preklican) return { st:'preklican', tone:'', label:'preklican', days:null };
  if (n.vrsta === 'enkratna' && n.porabljen) return { st:'porabljen', tone:'', label:'porabljen ' + fmtDMY(n.porabljen), days:null };
  if (!n.veljaOd || !n.veljaDo) return { st:'nepopoln', tone:'warn', label:'datum veljavnosti manjka', days:null };
  if (onDate < n.veljaOd) return { st:'prihodnji', tone:'info', label:'velja od ' + fmtDMY(n.veljaOd), days:daysBetween(onDate, n.veljaOd) };
  const left = daysBetween(onDate, n.veljaDo);
  if (left < 0) return { st:'potekel', tone:'bad', label:`potekel ${fmtDMY(n.veljaDo)}`, days:left };
  if (left <= warnDays) return { st:'kmalu', tone:'warn', label: left === 0 ? 'poteče danes' : left === 1 ? 'poteče jutri' : `poteče čez ${left} dni`, days:left };
  return { st:'ok', tone:'ok', label:`velja do ${fmtDMY(n.veljaDo)}`, days:left };
}
/* Nalog, ki velja na dani dan (če jih je več, prednost: najkasneje potečejo ne; najprej tisti, ki je bolj specifičen) */
function activeNalog(p, date = todayStr()){
  if (!p) return null;
  const rank = { enkratna:0, zdravljenje:1, mesecna:2, letna:3 };
  const list = (p.naloge || []).filter(n => !n.preklican && !(n.vrsta === 'enkratna' && n.porabljen) && n.veljaOd <= date && n.veljaDo >= date);
  list.sort((a, b) => (rank[a.vrsta] - rank[b.vrsta]) || a.veljaDo.localeCompare(b.veljaDo));
  return list[0] || null;
}
/* Ali je nalog podaljšan z novejšim nalogom? Potem opozorilo ni potrebno. */
function renewed(p, n){
  return (p.naloge || []).some(m => m.id !== n.id && !m.preklican && m.veljaOd <= addDays(n.veljaDo, 1) && m.veljaDo > n.veljaDo);
}
/* Povzetek za seznam pacientov: najpomembnejše stanje na dan */
function patientNalogSummary(p, date = todayStr()){
  const nl = p.naloge || [];
  if (!nl.length) return { st:'brez', tone:'', label:'brez naloga', n:null };
  const act = activeNalog(p, date);
  if (act){ const s = nalogState(act, date); if (s.st === 'kmalu' && renewed(p, act)) return { ...nalogState({ ...act, veljaDo:act.veljaDo }, date), st:'ok', tone:'ok', label:'podaljšan do ' + fmtDMY(nl.filter(m => !m.preklican).reduce((x, m) => m.veljaDo > x ? m.veljaDo : x, act.veljaDo)), n:act }; return { ...s, n:act }; }
  const fut = nl.filter(n => !n.preklican && n.veljaOd > date).sort((a, b) => a.veljaOd.localeCompare(b.veljaOd))[0];
  if (fut) return { ...nalogState(fut, date), n:fut };
  const last = nl.filter(n => !n.preklican).sort((a, b) => b.veljaDo.localeCompare(a.veljaDo))[0];
  if (last) return { ...nalogState(last, date), n:last };
  return { st:'brez', tone:'', label:'brez veljavnega naloga', n:null };
}
/* Opozorila za nadzorno ploščo: vsi pacienti, ki jim nalog kmalu poteče ali je potekel */
let ALERT_CACHE = { rev:-1, day:'', list:[] };
function nalogAlerts(){
  const today = todayStr();
  if (ALERT_CACHE.rev === rev && ALERT_CACHE.day === today) return ALERT_CACHE.list;
  const list = [];
  S.patients.forEach(p => {
    (p.naloge || []).forEach(n => {
      if (n.preklican || (n.vrsta === 'enkratna' && n.porabljen)) return;
      const s = nalogState(n, today);
      if (s.st !== 'kmalu' && s.st !== 'potekel') return;
      if (n.vrsta === 'enkratna') return;   // enkratni nalog se ne spremlja kot potek
      if (renewed(p, n)) return;
      // potekel: samo če je potekel v zadnjih 60 dneh in pacient nima drugega veljavnega naloga
      if (s.st === 'potekel' && (s.days < -60 || activeNalog(p, today))) return;
      list.push({ p, n, s });
    });
  });
  list.sort((a, b) => (a.s.days ?? 0) - (b.s.days ?? 0));
  ALERT_CACHE = { rev, day:today, list };
  return list;
}
function nalogChip(n, date){
  if (!n) return '<span class="chip">brez naloga</span>';
  const s = nalogState(n, date || todayStr());
  const icon = s.tone === 'bad' ? '⚠ ' : s.tone === 'warn' ? '⏳ ' : '';
  return `<span class="chip nt nt-${n.vrsta}" title="${esc(NALOG_VRSTE[n.vrsta].l)} nalog ${esc(n.stevilka || '')}">${esc(NALOG_VRSTE[n.vrsta].l)}</span><span class="chip ${s.tone}">${icon}${esc(s.label)}</span>`;
}

/* ---------- Barve pacientov ---------- */
function nextColor(){
  const use = Array(PCOLORS).fill(0); S.patients.forEach(p => { if (p.color >= 0 && p.color < PCOLORS) use[p.color]++; });
  return use.indexOf(Math.min(...use));
}
const pcOf = pid => { const p = patientById(pid); return p && p.color >= 0 ? p.color : -1; };
const pcClass = pid => { const c = pcOf(pid); return c >= 0 ? `pc${c}` : ''; };
const avatarP = p => `<span class="pav ${p.color >= 0 ? 'pc' + p.color : ''}" aria-hidden="true">${esc(initials(p.name).replace(/\./g, '').slice(0, 2) || '?')}</span>`;

/* ---------- Preverjanje in predogled za kopiranje ---------- */
const NALOG_REQ = [['stevilka', 'številka naloga'], ['narocnik', 'naročnik'], ['izvajalec', 'izvajalec prevoza'], ['zdravnik', 'zdravnik'], ['razlog', 'razlog prevoza'], ['od', 'relacija: od'], ['do', 'relacija: do'], ['veljaOd', 'velja od'], ['veljaDo', 'velja do']];
const missingNalog = n => NALOG_REQ.filter(([k]) => !String(n[k] || '').trim()).map(x => x[1]);
function nalogVariants(p, n){
  const s = nalogState(n);
  const v = NALOG_VRSTE[n.vrsta].l;
  const full = [
    `NALOG ZA PREVOZ · ${v.toUpperCase()}`,
    `Številka naloga: ${n.stevilka || '–'}`,
    `Pacient: ${p.name}${p.addr ? ' · ' + p.addr : ''}${p.phone ? ' · tel. ' + p.phone : ''}${p.zzzs ? ' · št. zavarovane osebe ' + p.zzzs : ''}`,
    `Naročnik: ${n.narocnik || '–'}`,
    `Izvajalec prevoza: ${n.izvajalec || '–'}`,
    `Zdravnik: ${n.zdravnik || '–'}${n.zdravnikVrsta ? ' (' + n.zdravnikVrsta + ')' : ''}`,
    `Razlog prevoza: ${n.razlog || '–'}`,
    `Relacija: ${n.od || '–'} → ${n.do || '–'}${n.dnevi ? ' · ' + n.dnevi : ''}`,
    `Način prevoza: ${MODES[n.mode] || n.mode}`,
    `Veljavnost: ${fmtDMY(n.veljaOd)} – ${fmtDMY(n.veljaDo)} (${s.label})`,
    n.opombe ? `Opombe: ${n.opombe}` : ''
  ].filter(Boolean).join('\n');
  const short = `${p.name} · ${v} nalog št. ${n.stevilka || '–'} · ${n.od || '–'} → ${n.do || '–'} · ${MODES[n.mode] || n.mode} · velja do ${fmtDMY(n.veljaDo)}`;
  const book = `${p.name}; ${n.od || ''} → ${n.do || ''}; ${MODES[n.mode] || n.mode}; ${p.phone || ''}; nalog ${n.stevilka || ''} (${v}, do ${fmtDMY(n.veljaDo)})`;
  return [{ key:'full', label:'Celoten nalog', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }, { key:'book', label:'Vrstica za knjigo', text:book }];
}
function rideVariants(date, r, nr){
  const p = patientById(r.patientId), n = p ? (p.naloge || []).find(x => x.id === r.nalogId) : null;
  const dir = rideDir(r) === 'from' ? 'ODVOZ' : 'PREVOZ TJA';
  const full = [
    `${dir} št. ${nr} · ${fmtLong(date)}`,
    `Pacient: ${r.name || '–'}${r.phone ? ' · tel. ' + r.phone : ''}`,
    `Ura: ${r.time || '–'}`,
    `Od: ${r.from || '–'}`,
    `Do: ${r.to || '–'}`,
    `Način prevoza: ${MODES[r.mode] || r.mode}${r.dia ? ' · dializa (' + (DIA_TERMS[diaTermOf(r.dia)] || '').toLowerCase() + ')' : ''}`,
    n ? `Nalog: ${NALOG_VRSTE[n.vrsta].l}, št. ${n.stevilka || '–'}, velja do ${fmtDMY(n.veljaDo)}` : '',
    r.note ? `Opomba: ${r.note}` : ''
  ].filter(Boolean).join('\n');
  const short = `${r.time || ''} ${r.name || ''}: ${r.from || ''} → ${r.to || ''} (${MODES[r.mode] || r.mode})${r.phone ? ', ' + r.phone : ''}`.trim();
  return [{ key:'full', label:'Celoten prevoz', text:full }, { key:'short', label:'Kratko (Viber / SMS)', text:short }];
}

/* ---------- Povezava pacienta in prevoza ---------- */
function applyPatientToRide(date, rideId, pid, opts = {}){
  const hit = rideById(date, rideId), p = patientById(pid); if (!hit || !p) return false;
  const r = hit.r, nl = activeNalog(p, date);
  r.patientId = p.id; r.name = p.name;
  if (!r.phone || opts.overwrite) r.phone = p.phone;
  if (!opts.keepMode) r.mode = nl ? nl.mode || p.mode : p.mode;
  r.nalogId = nl ? nl.id : '';
  const homeFrom = nl && nl.od && !/^SB |UKC|ZD /i.test(nl.od) ? nl.od : p.addr;
  if (!r.from.trim()) r.from = homeFrom || p.addr;
  if (!r.to.trim()) r.to = nl && nl.do ? nl.do : '';
  save(); KM.schedule(date, rideId); return true;
}
function patientSuggestions(raw){
  const q = norm(raw); if (q.length < 2) return [];
  const today = todayStr();
  return S.patients.filter(p => norm([p.name, p.phone, p.addr].join(' ')).includes(q))
    .sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1) || a.name.localeCompare(b.name)).slice(0, 6)
    .map(p => { const s = patientNalogSummary(p, today); return { label:p.name, sub:`${p.addr || 'brez naslova'} · ${s.n ? NALOG_VRSTE[s.n.vrsta].l + ' nalog, ' + s.label : 'brez naloga'}`, ins:p.name, pid:p.id, score:norm(p.name).startsWith(q) ? 0 : 1 }; });
}
function savePatientFromRide(date, rideId){
  const hit = rideById(date, rideId); if (!hit) return null;
  const r = hit.r; if (!r.name.trim()) return null;
  let p = S.patients.find(x => norm(x.name) === norm(r.name));
  if (!p){ p = blankPatient({ name:r.name.trim(), addr:rideDir(r) === 'from' ? r.to : r.from, phone:r.phone, mode:r.mode, color:nextColor() }); S.patients.push(p); audit('pacient.dodan', { id:p.id, kdo:initials(p.name) }); }
  r.patientId = p.id; save(); return p;
}
function removePatient(id){
  const p = patientById(id); if (!p) return;
  S.patients = S.patients.filter(x => x.id !== id);
  Object.values(S.rides).forEach(a => a.forEach(r => { if (r.patientId === id){ r.patientId = ''; r.nalogId = ''; } }));
  audit('pacient.izbrisan', { id, kdo:initials(p.name) }); save();
}
const lastOpened = {};
function logPatientOpen(id){ const t = Date.now(); if (lastOpened[id] && t - lastOpened[id] < 300000) return; lastOpened[id] = t; const p = patientById(id); audit('pacient.ogled', { id, kdo:p ? initials(p.name) : '' }); }

/* =====================================================================
   SKENIRANJE NALOGA ZA PREVOZ (Obr. NLG/05) → samodejno izpolnjevanje podatkov pacienta in naloga
   Tri poti do besedila (vse na napravi, brez pošiljanja slike nikamor):
     1) prilepljeno besedilo (iPhone: Kamera → »Skeniraj besedilo«, Android: Google Lens → kopiraj; ali besedilo iz PDF),
     2) slika (fotografija) ali PDF-sken: razpoznava besedila (OCR) v ločenem, izoliranem okvirju ocr/ocr.html,
     3) PDF, ki je samo slika (iPhone Zapiski, Google Drive …): slika se izvleče iz PDF (JPEG ali Flate), nato OCR.
   Razčlenjevalec (parse) je čista funkcija: pozna razporeditev obrazca (vrednost je NAD oznako), prenese šum OCR, nikoli ne ugiba brez opore
   in vsako polje pokaže v pregledu, kjer ga dispečer popravi pred shranjevanjem. Slika in besedilo se NE shranita; shrani se samo potrjeno.
   ===================================================================== */
const NSCAN = (() => {
  const S_ = v => String(v ?? '');
  const N = s => norm(s);
  const NOISE_STOP = /(razlog|obravnave|vrsta|prevoza|nujni|nenujni|sanitetni|helikopterski|bolezen|poskodba|poklicna|transplant|doplacila|zavarovan|zavarovalnic|policej?|veljavnost|enkratna|napotnic|zdravnik|izvajal|dejavnost|stevilka|datum|rojstva|telefonska|kontaktna|opombe|relacija|dializa|nepokretnost|skodljivost|javnega|spremstvo|tuji|brez)/;
  const title = s => S_(s).toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\s+/g, ' ').trim();
  const lines = text => S_(text).replace(/\r/g, '').split('\n').map(l => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean);

  /* Popravek najpogostejših napak OCR v številkah (O→0, l→1 …), samo v besedah, ki so večinoma števke */
  function fixTok(t){
    const d = (t.match(/\d/g) || []).length;
    if (t.length < 2 || d < t.length * 0.5) return t;
    return t.replace(/[OoQ]/g, '0').replace(/[Il|]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
  }
  const fixDigits = line => S_(line).split(' ').map(fixTok).join(' ');

  /* ---------- Vzorci ---------- */
  const RE_DATE = /(\d{1,2})\s*[.,/]\s*(\d{1,2})\s*[.,/]\s*((?:19|20)\d{2})/g;
  const RE_MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const RE_PHONE = /(?:\+|00)?\s*(?:386)?[\s(-]*0?\d{1,2}[\s)\-/.]*\d{3}[\s\-/.]*\d{3}\b/;
  function dates(line){
    const out = []; let m; RE_DATE.lastIndex = 0;
    while ((m = RE_DATE.exec(line))){
      const d = +m[1], mo = +m[2], y = +m[3];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
      out.push({ iso:`${y}-${pad(mo)}-${pad(d)}`, y, text:m[0], at:m.index });
    }
    return out;
  }
  /* 9-mestna številka zavarovane osebe (tudi razdeljena na skupine po 3 ali brez presledkov) */
  function zzzsIn(line){
    if (/\b(?:tel|gsm|mob)/i.test(N(line))) return '';   // vrstica s telefonom ni številka zavarovane osebe
    const f = fixDigits(line).replace(RE_DATE, ' ');
    const m = /(?:^|[^\d])(\d{3}[ .]?\d{3}[ .]?\d{3})(?!\d)/.exec(f);
    return m ? m[1].replace(/\D/g, '') : '';
  }
  const phoneIn = line => {
    const f = fixDigits(line).replace(RE_DATE, ' ').replace(RE_MAIL, ' ');
    const m = RE_PHONE.exec(f); if (!m) return '';
    return m[0].replace(/\s+/g, ' ').trim();
  };
  const isLabel = l => /^\(/.test(l);
  /* desni stolpci obrazca (npr. »03 -POKLICNA BOLEZEN 01 3- SANITETNI«) se odrežejo: leva vrednost je pred prvo oznako »številka -« */
  function cutRight(l){
    const m = /\s\d{1,2}\s*[-–—=]+\s*\S/.exec(' ' + l);
    return (m ? l.slice(0, Math.max(0, m.index - 1)) : l).trim();
  }
  const cleanText = s => S_(s).replace(/[^\p{L}\p{N}@.,;:'’()+/&\-–\s]/gu, ' ').replace(/\s+/g, ' ').replace(/(\s+[^\p{L}\p{N}\s]{0,2}){1,2}$/u, m => (/^[\s\p{L}\p{N}]*$/u.test(m) && m.trim().length > 2) ? m : '').trim();
  /* odstrani odvečne kratke ostanke OCR na koncu (npr. »… Krsko 3«, »… Primer Ne«) */
  const trimTail = s => S_(s).replace(/(?:\s+(?:[^\p{L}\d]{1,3}|\p{L}{1,2}[.,;:]?|\d))+$/u, '').trim();
  const stripNoise = s => S_(s).replace(/^[^\p{L}\d]*(\p{L}{1,2})\s+(?=\p{Lu})/u, (m, tok) => /^(zd|sb|ob|dh|um|zz)$/i.test(tok) ? m.replace(/^[^\p{L}\d]*/u, '') : '');
  const nameVal = c => {
    const t = trimTail(cleanText(cutRight(c).split(/[;|}{\\,]/)[0]).replace(/[^\p{L}\s'’\-]/gu, ' ').replace(/\s+/g, ' ').trim());
    if (t.length < 2 || t.length > 40 || t.split(' ').length > 3 || NOISE_STOP.test(N(t))) return '';
    if (!/\p{L}{2}/u.test(t)) return '';
    return t;
  };
  const streetVal = c => {
    const t = cleanText(cutRight(c)); const n = N(t);
    if (t.length < 3 || !/\p{L}{2}/u.test(t) || NOISE_STOP.test(n) || RE_MAIL.test(t)) return '';
    return t;
  };

  /* ---------- Razčlenjevanje ---------- */
  function parse(text){
    const L0 = lines(text), L = L0;
    const f = {}, src = {}, notes = [];
    const set = (k, v, how) => { if (v != null && String(v).trim() !== '' && !f[k]){ f[k] = String(v).trim(); src[k] = how || 'oznaka'; } };
    const now = new Date(), yNow = now.getFullYear();

    /* 0) številka naloga: 7-mestna številka v glavi (zgoraj desno) */
    for (let i = 0; i < Math.min(8, L.length); i++){
      const m = /(?:^|[^\d])(\d{7})(?!\d)/.exec(fixDigits(L[i]));
      if (m){ set('stevilka', m[1], 'glava'); break; }
    }

    /* 1) zavarovana oseba: vrednost je NAD oznako; sidro = vrstica s številko zavarovane osebe */
    let iA = L.findIndex((l, i) => zzzsIn(l) && (dates(fixDigits(l)).length || /zavarovane|rojstva/.test(N(L[i + 1] || ''))));
    if (iA < 0) iA = L.findIndex(l => zzzsIn(l));
    if (iA < 0){
      const k = L.findIndex(l => /zavarovane\s+osebe\)|datum\s+rojstva/.test(N(l)));
      if (k > 0) iA = k - 1;
    }
    let stop = L.length;
    if (iA >= 0){
      const z = zzzsIn(L[iA]); if (z) set('zzzs', z, 'vzorec');
      const dd = dates(fixDigits(L[iA])).filter(d => d.y < yNow + 1)[0]; if (dd) set('dob', dd.iso, 'vzorec');
      for (let i = iA + 1; i < L.length; i++){ if (/kontaktna\s+podatka|^\s*12\s*[-–—=.]|relacija\s+prevoza/.test(N(L[i]))){ stop = i; break; } }
      const seq = []; let cand = [];
      for (let i = iA + 1; i < stop; i++){
        if (isLabel(L[i])){ seq.push({ lab:N(L[i]), cand }); cand = []; } else cand.push(L[i]);
      }
      const KEY = [['zzzs', /zavarovane|rojstva|datum/], ['priimek', /pr?[il1]*[mn]?[ie]k|priim|primek|prlm/], ['ime', /^\(?\s*[il1|]me\s*\)?\*?$/], ['ulica', /ulic|hi[sgz]na|\bst\./], ['posta', /po[sš5]t|posin|kraj|krai|\bhl\b/], ['tel', /telef/], ['mail', /po[sš]ta|mail/]];
      const ORDER = ['zzzs', 'priimek', 'ime', 'ulica', 'posta', 'tel', 'mail'];
      let next = 0; const byField = {};
      seq.forEach(s => {
        let key = (KEY.find(([, re]) => re.test(s.lab)) || [])[0];
        if (!key) key = ORDER[Math.min(next, ORDER.length - 1)];
        next = Math.max(next, ORDER.indexOf(key)) + 1;
        if (!byField[key]) byField[key] = s.cand;
      });
      const last = list => list && list.length ? list : [];
      const pickLast = (list, fn) => { for (let i = list.length - 1; i >= 0; i--){ const v = fn(list[i]); if (v) return v; } return ''; };
      set('priimek', title(pickLast(last(byField.priimek), nameVal)), 'oznaka');
      set('ime', title(pickLast(last(byField.ime), nameVal)), 'oznaka');
      set('ulica', pickLast(last(byField.ulica), streetVal), 'oznaka');
      const pk = last(byField.posta);
      for (let i = pk.length - 1; i >= 0; i--){
        const m = /^(\d{4})\s*(.*)$/.exec(fixDigits(cleanText(cutRight(pk[i]))));
        if (m){ set('posta', m[1], 'oznaka'); const k = trimTail(m[2].replace(/[^\p{L}\s\-]/gu, ' ').replace(/\s+/g, ' ')); if (k) set('kraj', title(k), 'oznaka'); break; }
      }
      if (!f.posta){ const lone = pk.map(x => /^\s*(\d{4})\s*$/.exec(fixDigits(x))).filter(Boolean).pop(); if (lone) set('posta', lone[1], 'oznaka'); }
      if (!f.kraj){ const k = pickLast(pk.filter(x => !/\d{4}/.test(fixDigits(x))), nameVal); if (k) set('kraj', title(k), 'oznaka'); }
    }
    /* telefon in e-pošta: vzorec, kjerkoli v bloku zavarovane osebe (oznaka je pogosto pokvarjena) */
    const zoneEnd = stop < L.length ? stop : Math.min(L.length, (iA >= 0 ? iA : 0) + 30);
    for (let i = Math.max(0, iA); i < zoneEnd && i >= 0; i++){
      if (!f.mail){ const m = RE_MAIL.exec(L[i]); if (m) set('mail', m[0].toLowerCase(), 'vzorec'); }
      if (!f.phone && i !== iA){ const p = phoneIn(L[i]); if (p && !/\d{4}\s*(?:19|20)\d{2}/.test(p)) set('phone', p, 'vzorec'); }
    }
    if (!f.mail){ const m = RE_MAIL.exec(S_(text)); if (m) set('mail', m[0].toLowerCase(), 'vzorec'); }

    /* 2) izvajalec (naročnik) in zdravnik: samo ko je jasno; sicer prazno */
    const zi = L.findIndex(l => /\bdr\.?\s+[\p{Lu}]/u.test(l) || /\b(?:prim|asist|doc)\.?\s+dr\.?/i.test(l));
    if (zi >= 0){
      const m = /\b((?:prim\.?\s*|asist\.?\s*|doc\.?\s*)?dr\.?(?:\s*med\.?)?\s+[\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+)?)/u.exec(L[zi]);
      if (m) set('zdravnik', m[1].replace(/\s+/g, ' ').trim(), 'vzorec');
      const before = stripNoise(m ? L[zi].slice(0, m.index) : L[zi]);
      if (/(\bzd\b|zdravstven|bolnisnic|ambulant|klinik|ordinacij|zavod|d\.o\.o|\bsb\b|ukc|center|dom\b)/.test(N(before))) set('narocnik', trimTail(cleanText(before)).slice(0, 80), 'vzorec');
    }
    if (!f.narocnik){
      const k = L.findIndex(l => /(\bzd\b|zdravstven\w*\s+(?:dom|postaj|center)|splosna\s+bolnisnica|zdravstveni\s+dom)/.test(N(l)) && !/\d{5,}/.test(l) && !/reseval/.test(N(l)));
      if (k >= 0 && k < (iA >= 0 ? iA : L.length)) set('narocnik', trimTail(cleanText(stripNoise(cutRight(L[k])))).slice(0, 80), 'vzorec');
    }

    /* 3) relacija in opombe: besedilo za naslovom »12 – RELACIJA PREVOZA« in »13 – OPOMBE« */
    const iRel = L.findIndex(l => /(^|\s)12\s*[-–—=.]?\s*rela|relacija\s+prevoza/.test(N(l)));
    const iOp = L.findIndex((l, i) => i > Math.max(iRel, -1) && /(^|\s)13\s*[-–—=.]?\s*opomb|^\s*opombe/.test(N(l)));
    const endOp = (() => { const k = L.findIndex((l, i) => i > Math.max(iOp, iRel) && (/^\s*(?:\p{L}+\s+)?kraj\b.*\bdne\b|\bdne\b.*\bzig\b|podpis\s+zdravnika|^\s*datum\s+cas/u.test(N(l)) || /(^|\s)kraj\s+(?:dne|\d)/.test(N(l)))); return k < 0 ? L.length : k; })();
    if (iRel >= 0){
      const rel = [], head = L[iRel].replace(/^.*?relacija\s+prevoza\s*/i, '').trim();
      if (head) rel.push(head);
      for (let i = iRel + 1; i < (iOp > iRel ? iOp : endOp); i++) rel.push(L[i]);
      const raw = trimTail(cleanText(rel.join(' ').replace(/\\|\|/g, ' ')));
      if (raw){
        f.relacija = raw;
        const m = /^(.*?)\s+(?:[-–—>]+|=>|→)\s+(.+)$/.exec(raw) || /^(.*?)\s+do\s+(.+)$/i.exec(raw);
        if (m){ set('od', m[1].trim(), 'vzorec'); set('do', m[2].trim(), 'vzorec'); }
        src.relacija = 'oznaka';
      }
    }
    if (iOp >= 0){
      const op = [], head = L[iOp].replace(/^.*?opombe\s*/i, '').trim();
      if (head) op.push(head);
      for (let i = iOp + 1; i < endOp; i++) op.push(L[i]);
      const raw = op.map(x => trimTail(cleanText(x))).filter(x => x.length > 1).join('; ');
      if (raw){ f.opombe = raw; src.opombe = 'oznaka'; }
    }

    /* 4) datumi: veljavnost »2 – DO«, datum izdaje (pri »dne«); rojstni datum je že znan */
    const all = []; L.forEach((l, i) => dates(fixDigits(l)).forEach(d => all.push({ ...d, i, line:l })));
    const dne = all.slice().reverse().find(d => /\bdne\b|\bkraj\b/.test(N(d.line)) && d.iso !== f.dob);
    const doo = all.find(d => /(?:^|\s|\()2\s*[-–—=]\s*(?:do|d0|oo|00)\b/.test(N(d.line.slice(0, d.at + 1))) && d.iso !== f.dob) || all.find(d => d.i < (iA >= 0 ? iA : 99) && d.iso !== f.dob && d.y >= yNow - 1);
    if (dne) set('izdan', dne.iso, 'vzorec');
    if (doo && (!dne || doo.iso !== dne.iso)) set('veljaDo', doo.iso, 'vzorec');
    if (!f.izdan){ const x = all.filter(d => d.iso !== f.dob && d.iso !== f.veljaDo).pop(); if (x) set('izdan', x.iso, 'vzorec'); }

    /* 5) iz vsebine: razlog, način prevoza in vrsta naloga (predlog; pregled to prikaže kot izbiro) */
    const body = N([f.relacija, f.opombe].filter(Boolean).join(' '));
    if (/dializ|nefrodial|hemodial/.test(body)){ set('razlog', 'Dializa', 'besedilo'); }
    else if (/obseva|radioterap/.test(body)) set('razlog', 'Obsevanje', 'besedilo');
    else if (/kemoterap|kemo\b/.test(body)) set('razlog', 'Kemoterapija', 'besedilo');
    else if (/rehabilit/.test(body)) set('razlog', 'Rehabilitacija', 'besedilo');
    set('mode', /leze|lezec|nosil/.test(body) ? 'leze' : /utila/.test(body) ? 'utila' : 'sede', /leze|lezec|nosil|utila/.test(body) ? 'besedilo' : 'privzeto');
    const from = f.izdan || '';
    if (f.veljaDo && from){
      const span = Math.round((parseYmd(f.veljaDo) - parseYmd(from)) / 86400000);
      f.vrsta = span >= 300 ? 'letna' : span >= 25 && span <= 62 ? 'mesecna' : span > 0 && span < 25 ? 'zdravljenje' : 'enkratna';
    } else f.vrsta = f.razlog === 'Dializa' ? 'letna' : 'enkratna';
    src.vrsta = f.veljaDo ? 'datumi' : 'predlog';

    /* naslov za aplikacijo: »ulica, kraj« (kraj se izpusti, če je že v ulici: »Dobova 25«) */
    if (f.ulica){
      const sameTown = f.kraj && N(f.ulica).startsWith(N(f.kraj));
      f.addr = f.kraj && !sameTown ? `${f.ulica}, ${f.kraj}` : f.ulica;
    } else if (f.kraj) f.addr = f.kraj;
    if (f.ime || f.priimek) f.name = [f.ime, f.priimek].filter(Boolean).join(' ');

    const key = ['name', 'zzzs', 'addr', 'stevilka', 'relacija'];
    const found = key.filter(k => f[k]).length;
    if (!f.name) notes.push('Imena ni bilo mogoče prebrati.');
    if (!f.addr) notes.push('Naslova ni bilo mogoče prebrati.');
    if (!f.relacija) notes.push('Relacija prevoza ni prebrana.');
    return { fields:f, src, notes, found, total:key.length, lines:L0.length };
  }

  /* ---------- Povezava z bazo pacientov ---------- */
  const digitsOnly = s => S_(s).replace(/\D/g, '');
  function matchPatient(f){
    const z = digitsOnly(f.zzzs);
    if (z.length === 9){ const p = S.patients.find(x => digitsOnly(x.zzzs) === z); if (p) return { p, how:'številka zavarovane osebe' }; }
    const a = N([f.ime, f.priimek].filter(Boolean).join(' ')).split(' ').filter(Boolean).sort().join(' ');
    if (a){ const p = S.patients.find(x => N(x.name).split(' ').filter(Boolean).sort().join(' ') === a); if (p) return { p, how:'ime in priimek' }; }
    return null;
  }
  /* Shrani potrjene podatke: pacient (nov ali obstoječ: izpolni samo prazna polja) + nalog (novega, ali posodobi istega s številko) */
  function apply(f, o = {}){
    let p = o.pid ? patientById(o.pid) : null, created = false;
    const name = S_(f.name || [f.ime, f.priimek].filter(Boolean).join(' ')).trim();
    if (!p){
      p = blankPatient({ name, addr:f.addr || '', phone:f.phone || '', mode:f.mode || 'sede', zzzs:digitsOnly(f.zzzs), color:nextColor() });
      S.patients.push(p); created = true; audit('pacient.dodan', { id:p.id, kdo:initials(p.name), vir:'skeniran nalog' });
    } else {
      if (!p.addr && f.addr) p.addr = f.addr;
      if (!p.phone && f.phone) p.phone = f.phone;
      if (!p.zzzs && f.zzzs) p.zzzs = digitsOnly(f.zzzs);
    }
    p.naloge = p.naloge || [];
    const from = f.veljaOd || f.izdan || todayStr();
    let n = f.stevilka ? p.naloge.find(x => S_(x.stevilka).trim() === S_(f.stevilka).trim()) : null, updated = !!n;
    if (!n){ n = blankNalog(f.vrsta || 'enkratna', from); p.naloge.push(n); }
    const set = (k, v) => { if (v != null && S_(v).trim() !== '') n[k] = S_(v).trim(); };
    set('stevilka', f.stevilka); set('narocnik', f.narocnik); set('zdravnik', f.zdravnik); set('razlog', f.razlog); set('mode', f.mode);
    set('od', f.od || p.addr); set('do', f.do); set('opombe', f.opombe);
    n.vrsta = f.vrsta || n.vrsta; n.veljaOd = from;
    if (f.veljaDo){ n.veljaDo = f.veljaDo; n.auto = false; } else if (!updated){ n.veljaDo = defaultValidTo(n.vrsta, from); n.auto = true; }
    if (f.mail){ /* e-pošte ne hranimo: ni potrebna za prevoz */ }
    audit('nalog.skeniran', { pid:p.id, nov:created, posodobljen:updated });
    save();
    return { p, n, created, updated };
  }

  /* ---------- Slika iz PDF (JPEG ali Flate, kot ga ustvarijo telefoni) ---------- */
  const inflate = async (u8) => {
    if (typeof DecompressionStream === 'undefined') throw new Error('Brskalnik ne podpira branja tega PDF. Naredi fotografijo ali izvozi stran kot sliko.');
    const ds = new DecompressionStream('deflate'), w = ds.writable.getWriter(); w.write(u8); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  };
  function unpredict(raw, colors, columns, pred){
    if (pred < 10) return raw;
    const bpp = colors, rowLen = columns * colors;
    const rows = Math.floor(raw.length / (rowLen + 1)), res = new Uint8Array(rows * rowLen);
    for (let r = 0; r < rows; r++){
      const ft = raw[r * (rowLen + 1)], src = r * (rowLen + 1) + 1, dst = r * rowLen, up = dst - rowLen;
      for (let i = 0; i < rowLen; i++){
        const x = raw[src + i], a = i >= bpp ? res[dst + i - bpp] : 0, b = r ? res[up + i] : 0, c = (r && i >= bpp) ? res[up + i - bpp] : 0;
        let v;
        if (ft === 0) v = x; else if (ft === 1) v = x + a; else if (ft === 2) v = x + b; else if (ft === 3) v = x + ((a + b) >> 1);
        else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
        res[dst + i] = v & 255;
      }
    }
    return res;
  }
  /* vrne [{ kind:'jpeg', bytes }, { kind:'raw', w, h, comps, data }] po vrstnem redu v datoteki; slike, manjše od 300 px, preskoči */
  async function pdfImages(buf){
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf), out = [];
    let str = ''; const CH = 8192; for (let i = 0; i < u8.length; i += CH) str += String.fromCharCode.apply(null, u8.subarray(i, Math.min(u8.length, i + CH)));
    let from = 0;
    for (;;){
      const at = str.indexOf('/Subtype', from); if (at < 0) break; from = at + 8;
      if (!/^\s*\/Image\b/.test(str.slice(at + 8, at + 24))) continue;
      const st = str.lastIndexOf(' obj', at), ds = st < 0 ? Math.max(0, at - 400) : st, sIdx = str.indexOf('stream', at); if (sIdx < 0) break;
      const dict = str.slice(ds, sIdx);
      if (/\/ImageMask\s+true/.test(dict)) continue;
      const w = +(/\/Width\s+(\d+)/.exec(dict) || [])[1], h = +(/\/Height\s+(\d+)/.exec(dict) || [])[1];
      if (!(w >= 300 && h >= 300)) continue;
      let p = sIdx + 6; if (str[p] === '\r' && str[p + 1] === '\n') p += 2; else if (str[p] === '\n' || str[p] === '\r') p += 1;
      let len = (/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict) || [])[1]; len = len ? +len : 0;
      let end = len && str.startsWith('endstream', p + len) || str.startsWith('\nendstream', p + len) || str.startsWith('\r\nendstream', p + len) ? p + len : str.indexOf('endstream', p);
      if (end < 0) continue; if (!len) { while (end > p && (str[end - 1] === '\n' || str[end - 1] === '\r')) end--; }
      const data = u8.subarray(p, end);
      from = Math.max(from, end);
      const filt = /\/Filter\s*(?:\[\s*)?\/(\w+)/.exec(dict); const f = filt ? filt[1] : '';
      if (f === 'DCTDecode'){ out.push({ kind:'jpeg', bytes:data, w, h }); continue; }
      if (f === 'FlateDecode'){
        let raw = await inflate(data);
        const pr = /\/Predictor\s+(\d+)/.exec(dict), pred = pr ? +pr[1] : 1;
        const comps = /DeviceGray|\/N\s+1\b/.test(dict) && !/DeviceRGB/.test(dict) ? 1 : 0;
        const col = /\/Colors\s+(\d+)/.exec(dict);
        let c = comps || (col ? +col[1] : 0);
        if (pred >= 10){ c = c || 3; raw = unpredict(raw, c, w, pred); }
        if (!c) c = raw.length === w * h ? 1 : raw.length === w * h * 3 ? 3 : 0;
        if (!(c === 1 || c === 3) || raw.length < w * h * c || !/\/BitsPerComponent\s+8\b/.test(dict)) continue;
        out.push({ kind:'raw', w, h, comps:c, data:raw });
      }
    }
    return out;
  }

  /* ---------- Priprava slike in OCR (samo v brskalniku) ---------- */
  const MAXSIDE = 2600;
  async function toCanvas(src, max = MAXSIDE){
    let cv, w, h;
    if (src.kind === 'raw'){
      w = src.w; h = src.h; cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), d = im.data, s = src.data;
      if (src.comps === 3) for (let i = 0, j = 0, n = w * h; i < n; i++, j += 3){ d[i * 4] = s[j]; d[i * 4 + 1] = s[j + 1]; d[i * 4 + 2] = s[j + 2]; d[i * 4 + 3] = 255; }
      else for (let i = 0, n = w * h; i < n; i++){ d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = s[i]; d[i * 4 + 3] = 255; }
      ctx.putImageData(im, 0, 0);
    } else {
      const bmp = await createImageBitmap(src.kind === 'jpeg' ? new Blob([src.bytes], { type:'image/jpeg' }) : src.blob);
      w = bmp.width; h = bmp.height; cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(bmp, 0, 0); if (bmp.close) bmp.close();
    }
    const k = Math.min(1, max / Math.max(w, h));
    if (k < 1){ const c2 = document.createElement('canvas'); c2.width = Math.round(w * k); c2.height = Math.round(h * k); const x = c2.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, c2.width, c2.height); cv = c2; }
    return cv;
  }
  /* sivine + raztegnitev kontrasta (2.–98. percentil): zeleni okvirji obrazca ne motijo OCR */
  function enhance(cv){
    const ctx = cv.getContext('2d'), im = ctx.getImageData(0, 0, cv.width, cv.height), d = im.data, hist = new Uint32Array(256), n = cv.width * cv.height;
    for (let i = 0; i < n; i++){ const g = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0; d[i * 4] = g; hist[g]++; }
    let acc = 0, lo = 0, hi = 255; for (let v = 0; v < 256; v++){ acc += hist[v]; if (acc > n * .02){ lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--){ acc += hist[v]; if (acc > n * .02){ hi = v; break; } }
    const span = Math.max(40, hi - lo);
    for (let i = 0; i < n; i++){ const g = Math.max(0, Math.min(255, ((d[i * 4] - lo) * 255 / span) | 0)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; }
    ctx.putImageData(im, 0, 0); return cv;
  }
  const toBlob = cv => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('Slike ni mogoče pripraviti.')), 'image/png'));
  /* datoteka → PNG blob prve strani (PDF: prva slika) */
  async function prepare(file){
    const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '');
    let src;
    if (isPdf){
      const imgs = await pdfImages(await file.arrayBuffer());
      if (!imgs.length) throw new Error('V tem PDF ni slike strani. Če ima besedilo, ga označi, kopiraj in prilepi; sicer naredi fotografijo naloga.');
      src = imgs[0];
    } else src = { kind:'blob', blob:file };
    return toBlob(enhance(await toCanvas(src)));
  }
  /* OCR v izoliranem okvirju (brez dostopa do podatkov aplikacije); okvir naloži knjižnico samo ob uporabi */
  /* poti iz config.js so relativne na stran aplikacije; okvir je v mapi ocr/, zato jih pretvorimo v absolutne naslove */
  const abs = u => u ? new URL(String(u), (typeof location !== 'undefined' && location.href) || 'http://localhost/').href : '';
  /* privzete vrednosti: tudi config.js iz starejše izdaje (brez bloka »ocr«) ohrani skeniranje slik; lib: '' ali on: false ga izklopi */
  const OCR_DEFAULT = { on:true, lib:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', lang:'slv' };
  const ocrCfg = () => Object.assign({}, OCR_DEFAULT, (typeof window !== 'undefined' && window.KP_CONFIG && window.KP_CONFIG.ocr) || {});
  /* Seja razpoznave: en izoliran okvir in en delavec za vse slike. Okvir nima dovoljenja za shranjevanje (sandbox brez allow-same-origin), zato brskalnik v njem
     ne more hraniti prenesenih datotek: prenos jedra (~5 MB) in modela (~2 MB) se zato naredi ENKRAT na sejo (v ozadju, ob odprtju okna), ne za vsako sliko znova.
     Nadzor: če okvir 75 s ne pošlje nobenega napredka, se seja prekine z jasno napako; celotna omejitev 10 minut. Seja se po 6 minutah mirovanja sprosti (pomnilnik telefona). */
  const OCR_T = { silence:75000, hard:600000, idle:360000 };   // spremenljivo samo zaradi preizkusov
  const STAGE_LABEL = { lib:'nalagam program za razpoznavo', 'loading tesseract core':'prenašam jedro razpoznave (samo prvič v seji)', 'initializing tesseract':'zaganjam razpoznavo', 'loading language traineddata':'prenašam slovenski jezikovni model (samo prvič v seji)', 'initializing api':'zaganjam razpoznavo', 'recognizing text':'berem besedilo', prep:'pripravljam sliko' };
  const stageLabel = st => STAGE_LABEL[st] || String(st || 'delam');
  let SES = null;
  function makeSession(cfg){
    const fr = document.createElement('iframe'); let dead = false, deadErr = null, ready = false, readyRes, cur = null, silence = 0, hard = 0, idle = 0;
    const readyP = new Promise(res => { readyRes = res; });
    fr.setAttribute('sandbox', 'allow-scripts'); fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.style.cssText = 'position:fixed;width:1px;height:1px;left:-9px;top:-9px;border:0;opacity:0';
    const clear = () => { clearTimeout(silence); clearTimeout(hard); };
    const finish = (fn, v) => { if (!cur) return; const c = cur; cur = null; clear(); fn === 'ok' ? c.resolve(v) : c.reject(v); };
    const post = m => fr.contentWindow && fr.contentWindow.postMessage(m, '*');
    const destroy = err => { if (dead) return; dead = true; deadErr = err || null; clearTimeout(idle); clear(); try { post({ type:'close' }); } catch (e) { /* nič */ } window.removeEventListener('message', onMsg); fr.remove(); if (SES === api) SES = null; if (cur) finish('err', err || new Error('Razpoznava je bila prekinjena.')); };
    const arm = () => { clearTimeout(silence); silence = setTimeout(() => destroy(new Error(`Razpoznava se je ustavila (${Math.round(OCR_T.silence / 1000)} s brez napredka). Najpogostejši vzrok je prekinjena ali počasna internetna povezava do cdn.jsdelivr.net. Poskusi znova ali preveri povezavo.`)), OCR_T.silence); };
    const bump = () => { clearTimeout(idle); if (!dead) idle = setTimeout(() => destroy(), OCR_T.idle); };
    const onMsg = e => {
      if (e.source !== fr.contentWindow) return;
      const m = e.data || {};
      if (m.type === 'ready'){ ready = true; readyRes(); }
      else if (m.type === 'progress'){ if (cur){ arm(); cur.listeners.forEach(f => { try { f(m); } catch (e) { /* prikaz ne sme ustaviti razpoznave */ } }); } }
      else if (m.type === 'warmed'){ if (cur && cur.kind === 'warm') finish('ok'); }
      else if (m.type === 'done'){ if (cur && cur.kind === 'run') finish('ok', cur.words ? { text:S_(m.text), words:Array.isArray(m.words) ? m.words : [], tsv:S_(m.tsv) } : S_(m.text)); }
      else if (m.type === 'error'){ if (cur) finish('err', new Error(S_(m.msg) || 'Razpoznava besedila ni uspela.')); }
    };
    window.addEventListener('message', onMsg);
    fr.onerror = () => destroy(new Error('Okvir za razpoznavo besedila se ni naložil.'));
    fr.src = (cfg.frame || 'ocr/ocr.html'); document.body.appendChild(fr);
    const cfgMsg = () => ({ lib:abs(cfg.lib), lang:cfg.lang || 'slv', langPath:abs(cfg.langPath), workerPath:abs(cfg.workerPath), corePath:abs(cfg.corePath) });
    /* ena zahteva naenkrat; čakajoče zahteve ostanejo v vrsti */
    let chain = Promise.resolve(), warmSt = null;
    const request = (kind, msg, onProgress, words, listeners) => {
      const job = chain.then(async () => {
        if (dead) throw deadErr || new Error('Razpoznava je bila prekinjena.');
        clearTimeout(idle);
        await Promise.race([readyP, new Promise((_, rej) => setTimeout(() => rej(new Error('Okvir za razpoznavo besedila se ni odzval.')), 20000))]);
        return new Promise((resolve, reject) => {
          cur = { kind, resolve, reject, listeners:listeners || [onProgress], words }; arm(); clearTimeout(hard); hard = setTimeout(() => destroy(new Error('Razpoznava je trajala predolgo (' + Math.round(OCR_T.hard / 60000) + ' minut). Poskusi znova z manjšo ali boljšo fotografijo.')), OCR_T.hard);
          Promise.resolve(msg()).then(m => post(m), reject);
        });
      });
      chain = job.then(() => {}, () => {}).then(bump);
      return job;
    };
    const api = {
      cfg, get dead(){ return dead; }, get ready(){ return ready; },
      /* vnaprejšnji zagon: če teče, se ob kasnejšem run() njegov prikaz napredka pridruži istemu prenosu */
      warm: onProgress => { if (warmSt && !warmSt.done) { if (onProgress) warmSt.listeners.push(onProgress); return warmSt.p; } const st = warmSt = { done:false, listeners:[onProgress] }; st.p = request('warm', () => ({ type:'warm', cfg:cfgMsg() }), null, false, st.listeners).finally(() => { st.done = true; }); return st.p; },
      get busy(){ return !!cur; },
      run: async (png, onProgress, extra) => { if (warmSt && !warmSt.done && onProgress) warmSt.listeners.push(onProgress); const buf = await png.arrayBuffer(); return request('run', () => ({ type:'run', cfg:cfgMsg(), image:buf, words:!!(extra && extra.words), psm:extra && extra.psm ? String(extra.psm) : undefined }), onProgress, !!(extra && extra.words)); },
      close: () => destroy(new Error('Razpoznava je bila prekinjena.'))
    };
    bump();
    return api;
  }
  /* seja za trenutne nastavitve (nova, če so se nastavitve spremenile ali je bila stara ustavljena) */
  function ocrSession(cfg = ocrCfg()){
    const key = JSON.stringify([cfg.lib, cfg.lang, cfg.langPath, cfg.workerPath, cfg.corePath, cfg.frame]);
    if (SES && (SES.dead || SES.key !== key)){ const o = SES; SES = null; try { o.close(); } catch (e) { /* nič */ } }
    if (!SES){ SES = makeSession(cfg); SES.key = key; }
    return SES;
  }
  const ocrClose = () => { if (SES) SES.close(); };
  /* prekinitev uporabnika: seja se ustavi samo, če ravno bere; drugače ostane pripravljena za naslednjo sliko */
  const ocrAbort = () => { if (SES && SES.busy) SES.close(); };
  function ocr(png, onProgress, cfg = ocrCfg(), extra){ return ocrSession(cfg).run(png, onProgress, extra); }
  const ocrEnabled = (cfg = ocrCfg()) => cfg.on !== false && !!cfg.lib;

  return { parse, matchPatient, apply, pdfImages, prepare, ocr, ocrSession, ocrClose, ocrAbort, ocrLimits:OCR_T, stageLabel, ocrEnabled, ocrCfg, lines, zzzsIn, dates, title, fixDigits, toCanvas, enhance, toBlob };
})();

/* =====================================================================
   TISK DOPOLNIL NA OBRAZEC »NALOG ZA PREVOZ« (Obr. NLG/05)
   Papirnati nalog ima na sprednji strani polja 1–13 (izpolni zdravnik) in tabelo PREVOZI; hrbtna stran je nadaljevanje tabele.
   Reševalec list položi v tiskalnik, aplikacija natisne SAMO podatke, ki jih izpolni posadka, v pravo vrstico tabele:
   datum, čas (od–do), reg. št. vozila, km, štartnina, spremljevalec in ime voznika (podpis ostane lastnoročen).
   NIČ od pacienta (ime, naslov, številka zavarovane osebe) se ne natisne.
   Položaj je v milimetrih (list A4), izmerjen na fotografiji praznega obrazca; zaradi razlik v tiskalnikih in obrazcih ga je mogoče
   v Nastavitve → Tisk naloga premakniti (mm) in raztegniti (%). Preizkusna stran s črtami celic pomaga pri poravnavi.
   ===================================================================== */
const NP = (() => {
  const PT = 0.3528;                                   // 1 pt v mm
  /* Stolpci (mm od levega roba lista): Datum | Čas (od-do) | Reg. št. vozila | km/min | Štartnina | Spremljevalec | Podpis voznika | Podpis zavarovane osebe */
  const COLS = [9.6, 33.6, 57.8, 85.0, 96.4, 108.0, 141.0, 171.9, 200.0];
  const PAGES = {
    f:{ head:178.0, top:186.4, pitch:8.56, rows:11 },   // sprednja stran: glava tabele, prva vrstica, višina vrstice, število vrstic
    b:{ head:11.8, top:20.2, pitch:8.45, rows:29 }      // hrbtna stran
  };
  const SHEET = PAGES.f.rows + PAGES.b.rows;           // 40 vrstic na list
  const FIELDS = ['datum', 'od', 'do', 'reg', 'km', 'st', 'spr', 'voz'];
  const DEF = { startnina:'', kmDec:1, voznik:true, od:'v_vozilu', dx:0, dy:0, sx:100, sy:100, fs:9 };
  const cfg = () => Object.assign({}, DEF, (typeof S !== 'undefined' && S && S.settings && S.settings.tisk) || {});
  const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? x : null; };
  const clamp = (v, a, b, d) => { const x = num(v); return x == null ? d : Math.min(b, Math.max(a, x)); };

  /* ---------- Oblikovanje ---------- */
  const fmtDate = d => { if (!d) return ''; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d)); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(d); };
  const fmtKm = v => { const x = num(v); if (x == null) return ''; const dec = clamp(cfg().kmDec, 0, 1, 1); return x.toFixed(dec).replace('.', ','); };
  const fmtMoney = v => { const s = String(v ?? '').trim(); if (!s) return ''; const x = num(s); return x == null ? s : x.toFixed(2).replace('.', ','); };
  const hm = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  /* ---------- Mesto vrstice: vrstica 1–40 na listu, 41+ je naslednji list ---------- */
  function loc(row){
    const k = (row - 1) % SHEET, sheet = Math.floor((row - 1) / SHEET) + 1, front = k < PAGES.f.rows;
    return { sheet, page:front ? 'f' : 'b', line:front ? k : k - PAGES.f.rows, key:sheet + (front ? 'f' : 'b') };
  }

  /* ---------- Posadka in vozilo, s katerim je bil prevoz opravljen ---------- */
  function crewOf(date, r){
    let veh = null, voz = '', spr = [], plan = null;
    const fromCrew = c => { veh = S.vehicles.find(v => v.id === c.id) || c.vehicle; voz = c.driver ? c.driver.name : ''; spr = (c.escorts || []).map(e => e.name).filter(Boolean); };
    try {
      plan = computePlan(date);
      const a = plan && plan.assign[r.id], c = a && plan.crews.find(x => x.id === a.crewId);
      if (c) fromCrew(c);
    } catch (e) { /* brez razporeda: poskusi drugje */ }
    /* objavljen razpored / ključ ekipe (»datum_idVozila«) */
    if (!veh && r.runKey){
      const run = (((S.published || {})[date] || {}).runs || []).find(x => x.key === r.runKey);
      if (run){ veh = S.vehicles.find(v => v.id === run.vehId) || { name:run.vehName, reg:'' }; const nm = run.names || []; voz = nm[0] || ''; spr = nm.slice(1); }
      else if (String(r.runKey).startsWith(date + '_')) veh = S.vehicles.find(v => v.id === String(r.runKey).slice(date.length + 1)) || null;
    }
    /* opravljen prevoz ni več v razporedu: ekipo poišči po imenu v »Kdo je naredil odvoz«, sicer če je tisti dan le ena ekipa */
    if (!veh && plan && plan.crews && plan.crews.length){
      const by = norm(r.doneBy || '');
      let c = by ? plan.crews.find(x => (x.driver && x.driver.name && by.includes(norm(x.driver.name))) || (x.escorts || []).some(e => e.name && by.includes(norm(e.name)))) : null;
      if (!c && plan.crews.length === 1) c = plan.crews[0];
      if (c) fromCrew(c);
    }
    if (!voz && r.doneBy){ const parts = String(r.doneBy).split(/\s*,\s*/).filter(Boolean); voz = parts[0] || ''; spr = parts.slice(1); }
    return { veh, vehName:veh ? veh.name : '', reg:veh && veh.reg ? String(veh.reg).trim().toUpperCase() : '', voz, spr:spr.join(', ') };
  }

  /* ---------- Vrednosti vrstice: shranjene (r.pr) > izračunane ---------- */
  function defaults(date, r){
    const c = cfg(), cr = crewOf(date, r), t = r.times || {};
    let pl = null; try { const p = computePlan(date); pl = p && p.assign[r.id] || null; } catch (e) { /* ni razporeda */ }
    const od = hm(t[c.od === 'na_poti' ? 'na_poti' : 'v_vozilu'] || t.v_vozilu || t.na_poti || t.na_kraju) || (pl ? fmtT(pl.pickT) : '');
    const doo = hm(t.na_cilju || t.zakljucena) || (pl ? fmtT(pl.dropT) : '');
    let km = '';
    try { const i = KM.info(r); if (i && i.total != null) km = fmtKm(i.total); } catch (e) { /* brez km */ }
    return { datum:fmtDate(date), od:od === '–' ? '' : od, do:doo === '–' ? '' : doo, reg:cr.reg, km, st:fmtMoney(c.startnina), spr:cr.spr, voz:c.voznik ? cr.voz : '', _veh:cr.vehName };
  }
  function entryFor(date, r){
    const d = defaults(date, r), s = r.pr && r.pr.f ? r.pr.f : {};
    const f = {}; FIELDS.forEach(k => { f[k] = s[k] != null ? s[k] : d[k]; });
    return f;
  }

  /* ---------- Prevozi, ki spadajo k nalogu ---------- */
  function ridesFor(p, n){
    const out = [];
    Object.keys(S.rides).sort().forEach(date => {
      S.rides[date].forEach((r, i) => {
        if (!r || r.patientId !== p.id || r.odpovedano || r.status === 'preklicana') return;
        if (r.nalogId ? r.nalogId !== n.id : !(n.veljaOd && n.veljaDo && date >= n.veljaOd && date <= n.veljaDo && (p.naloge || []).filter(x => !x.preklican && x.veljaOd <= date && x.veljaDo >= date).length === 1)) return;
        out.push({ date, r, nr:i + 1, f:entryFor(date, r), printed:!!(r.pr && r.pr.row), row:r.pr ? r.pr.row : 0, done:!!(r.done || (r.times && (r.times.zakljucena || r.times.na_cilju))) });
      });
    });
    return out;
  }
  const nextRow = n => Math.max(0, Math.floor(+n.tiskRows || 0)) + 1;

  /* ---------- Besedilo v celici: pomanjšaj, da stane; nikoli ne prelomi vrstice ---------- */
  function fitPt(text, widthMm, ptMax, ptMin = 6){
    const len = Math.max(1, String(text).length);
    const pt = widthMm / (len * 0.52 * PT);            // ocena povprečne širine znaka 0,52 em
    return Math.max(ptMin, Math.min(ptMax, Math.round(pt * 10) / 10));
  }
  function cell(page, line, col, text, o = {}){
    if (text == null || String(text).trim() === '') return '';
    const g = PAGES[page], x0 = COLS[col], w = COLS[col + 1] - COLS[col], y0 = g.top + line * g.pitch;
    const pad = o.pad == null ? 1 : o.pad, ww = w - 2 * pad;
    const ptMax = o.pt || clamp(cfg().fs, 6, 14, 9), min = o.min || 6, len = Math.max(1, String(text).length);
    const al = o.al || 'center', top = o.top;
    let pt = fitPt(text, ww, ptMax, min), two = false;
    if (!top && o.wrap && pt < 7.5 && /[\s-]/.test(String(text))){ pt = Math.max(min, Math.min(ptMax, Math.round(ww * 1.85 / (len * 0.52 * PT) * 10) / 10)); two = true; }   // predolgo za eno vrstico: dve vrstici
    const st = `left:${(x0 + pad).toFixed(2)}mm;top:${top ? (y0 + 0.6).toFixed(2) : y0.toFixed(2)}mm;width:${ww.toFixed(2)}mm;height:${top ? (g.pitch * .42).toFixed(2) : g.pitch.toFixed(2)}mm;font-size:${pt}pt;text-align:${al};${top ? '' : 'align-items:center;display:flex;justify-content:' + (al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center')}${two ? ';white-space:normal;line-height:1.05' : ''}`;
    return `<div class="nc${top ? ' nc-top' : ''}" style="${st}"><span>${esc(String(text))}</span></div>`;
  }
  /* vrstica 'line' (0-based) strani 'page' z vrednostmi f */
  function rowHTML(page, line, f){
    const c = cfg(), time = [f.od, f.do].some(Boolean) ? `${f.od || ''}–${f.do || ''}` : '';
    return cell(page, line, 0, f.datum) + cell(page, line, 1, time) + cell(page, line, 2, f.reg) + cell(page, line, 3, f.km) + cell(page, line, 4, f.st)
      + cell(page, line, 5, f.spr, { al:'left', pad:1.2, wrap:true }) + (c.voznik ? cell(page, line, 6, f.voz, { al:'left', pad:1.2, top:true, pt:7.5, min:5.5 }) : '');
  }
  /* črte celic (samo za preizkusno stran in predogled; na pravem natisu jih ni) */
  function guideHTML(page){
    const g = PAGES[page], x0 = COLS[0], x1 = COLS[COLS.length - 1], y0 = g.head, y1 = g.top + g.rows * g.pitch;
    let h = '';
    for (let i = 0; i <= g.rows + 1; i++){ const y = i === 0 ? g.head : g.top + (i - 1) * g.pitch; h += `<i class="ng ng-h" style="left:${x0}mm;top:${y.toFixed(2)}mm;width:${(x1 - x0).toFixed(2)}mm"></i>`; }
    COLS.forEach(x => { h += `<i class="ng ng-v" style="left:${x}mm;top:${y0}mm;height:${(y1 - y0).toFixed(2)}mm"></i>`; });
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y]) => { h += `<i class="ng ng-x" style="left:${(x - 3).toFixed(2)}mm;top:${(y - 3).toFixed(2)}mm"></i>`; });
    return h;
  }
  /* ena stran: entries = [{ line, f }] */
  function pageHTML(page, entries, o = {}){
    const c = cfg(), sx = clamp(c.sx, 80, 120, 100) / 100, sy = clamp(c.sy, 80, 120, 100) / 100, dx = clamp(c.dx, -30, 30, 0), dy = clamp(c.dy, -30, 30, 0);
    const body = (o.guide ? guideHTML(page) : '') + entries.map(e => rowHTML(page, e.line, e.f)).join('');
    const label = o.label ? `<div class="ng-lbl" style="left:12mm;top:${page === 'f' ? 289 : 4}mm">${esc(o.label)}</div>` : '';
    return `<section class="npg${o.guide ? ' npg-guide' : ''}"><div class="npg-in" style="transform:translate(${dx}mm,${dy}mm) scale(${sx},${sy})">${body}</div>${label}</section>`;
  }

  /* ---------- Razporeditev izbranih prevozov po vrsticah in straneh ---------- */
  function layout(rows, start){
    const groups = [], by = {};
    rows.forEach((x, i) => {
      const row = start + i, L = loc(row);
      let g = by[L.key]; if (!g){ g = by[L.key] = { key:L.key, sheet:L.sheet, page:L.page, items:[], from:row, to:row }; groups.push(g); }
      g.items.push({ line:L.line, row, x }); g.to = row;
    });
    return groups;
  }
  const groupLabel = g => `List ${g.sheet} · ${g.page === 'f' ? 'sprednja stran' : 'hrbtna stran'} · vrstic ${g.items.length} (št. ${g.from}${g.to > g.from ? '–' + g.to : ''})`;

  /* ---------- Tisk ---------- */
  function printArea(html){
    let el = document.getElementById('printArea');
    if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
    el.className = 'pnalog'; el.innerHTML = html;
    window.print();
  }
  function printGroup(g){
    printArea(pageHTML(g.page, g.items.map(it => ({ line:it.line, f:it.x.f })), {}));
  }
  /* Preizkusna stran: črte celic + nekaj izmišljenih vrstic. Natisni na navaden papir in primerjaj z obrazcem proti svetlobi. */
  const SAMPLE = [{ datum:'01.01.2026', od:'08:00', do:'09:15', reg:'KK AB-123', km:'23,4', st:'3,50', spr:'Ime Spremljevalec', voz:'Ime Voznik' },
    { datum:'02.01.2026', od:'10:30', do:'12:05', reg:'KK AB-123', km:'61,0', st:'3,50', spr:'Ime Spremljevalec', voz:'Ime Voznik' }];
  function calibHTML(page){
    const g = PAGES[page], last = g.rows - 1;
    const items = [{ line:0, f:SAMPLE[0] }, { line:1, f:SAMPLE[1] }, { line:last, f:{ ...SAMPLE[0], datum:'31.12.2026' } }];
    return pageHTML(page, items, { guide:true, label:'PREIZKUSNA STRAN: črte morajo ležati na črtah obrazca (' + (page === 'f' ? 'sprednja' : 'hrbtna') + ' stran)' });
  }
  function printCalib(page){ printArea(calibHTML(page)); }

  return { COLS, PAGES, SHEET, FIELDS, DEF, cfg, loc, crewOf, defaults, entryFor, ridesFor, nextRow, fitPt, pageHTML, guideHTML, rowHTML, layout, groupLabel, printGroup, printCalib, calibHTML,
    fmtDate, fmtKm, fmtMoney, hm, SAMPLE };
})();

/* =====================================================================
   TISK KNJIGE ZA CEL MESEC (na koncu meseca): kot papirna knjiga, pripravljena za vezavo
   Naslovnica → kazalo → vsak dan v obliki obrazca OBR REŠ 08 (prevozi 1–10, 11–24, posadke po vozilih, posebnosti) → mesečni povzetek.
   Vsi prevozi so zapisani tako, kot so bili opravljeni: ura prevoza, ura pobiranja (dejanska, če jo je posadka zabeležila, sicer po razporedu),
   vozilo (iz razporeda, objavljenega razporeda ali imena v »Kdo je naredil odvoz«), odpovedani prečrtani, opomba in kdo je prevoz opravil.
   Stran je A4 pokonci; pri obojestranskem tisku ima notranji rob za vezavo menjajoče strani (lihe: levo, sode: desno),
   vsak dan se začne na desni strani, zadnja stran dneva pa je črtana stran za opombe.
   Podatki o pacientih gredo samo na tiskalnik te naprave (kot v papirni knjigi); v dnevnik sprememb se zapiše samo mesec.
   ===================================================================== */
const BOOK = (() => {
  const P1 = 10, P2 = 24, CONT = 14;                   // vrstice: prva stran 1–10, druga 11–24, nadaljevanje po 14
  const DEF = { front:true, summary:true, duplex:true, skipEmpty:false, km:false, gut:12 };
  const clampN = (v, a, b, d) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? Math.min(b, Math.max(a, x)) : d; };
  const opts = o => { const x = Object.assign({}, DEF, o || {}); x.gut = clampN(x.gut, 0, 30, DEF.gut); ['front', 'summary', 'duplex', 'skipEmpty', 'km'].forEach(k => { x[k] = !!x[k]; }); return x; };
  const hmIso = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const kmTxt = r => { try { const i = KM.info(r); return i.total == null ? '' : (i.exact && i.backExact ? '' : '~') + KM.fmtKm(i.total); } catch (e) { return ''; } };
  const kmNum = r => { try { const i = KM.info(r); return i.total == null ? null : i.total; } catch (e) { return null; } };

  /* ---------- Podatki enega dne: vsak prevoz z vozilom in uro pobiranja ---------- */
  function dayData(date){
    const all = filledRides(date);
    const pending = all.some(({ r }) => !r.done && !r.odpovedano);
    let plan = null;
    try { plan = computePlan(date); } catch (e) { plan = null; }
    const rides = all.map(({ r, nr }) => {
      const a = plan && plan.assign ? plan.assign[r.id] : null, t = r.times || {};
      let veh = a ? a.veh : '', pick = '', ret = '', est = false, crew = null;
      if (!veh || r.done){
        try { crew = NP.crewOf(date, r); if (crew && crew.vehName && !veh) veh = crew.vehName; } catch (e) { crew = null; }
      }
      const real = hmIso(t.v_vozilu || t.na_kraju || t.na_poti);
      if (r.done && real) pick = real;
      else if (a && a.pickT != null){ pick = fmtT(a.pickT); est = a.late > 0; if (a.retPickT != null) ret = fmtT(a.retPickT); }
      else if (real) pick = real;
      return { r, nr, veh, pick, ret, est, crew };
    });
    return { date, all, rides, plan, pending };
  }

  function rowHTML(x, o){
    const r = x.r, can = r.odpovedano;
    const notes = [r.mode !== 'sede' ? (MODES[r.mode] || r.mode) : '', r.dia ? 'dializa' : '', +r.stay > 0 ? `čaka ${+r.stay} min` : '', r.note || ''].filter(Boolean).join(', ');
    const by = r.done ? '✓' + (r.doneBy ? ' ' + r.doneBy : '') : '';
    const pick = can ? '' : (x.est ? '~' : '') + x.pick + (x.ret ? ` · nazaj ${x.ret}` : '');
    return `<tr class="${can ? 'p-cancel' : ''}"><td class="pd-nr">${x.nr}</td><td>${esc(r.name || '')}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td class="pd-t">${esc(r.time || '')}</td><td class="pd-t">${esc(pick)}</td><td class="pd-v">${can ? '' : esc(x.veh)}</td>${o.km ? `<td class="pd-t">${can ? '' : esc(kmTxt(r))}</td>` : ''}<td>${can ? '<b>ODPOVEDANO</b> ' : ''}${r.chk ? `<b class="pd-chk">⚠ preveri (${esc(r.chk)})</b> ` : ''}${esc(notes)}${by ? `<div class="pd-by">${esc(by)}</div>` : ''}</td></tr>`;
  }
  const emptyRow = (nr, o) => `<tr class="pd-empty"><td class="pd-nr">${nr}</td><td></td><td></td><td></td><td></td><td></td><td></td>${o.km ? '<td></td>' : ''}<td></td></tr>`;
  const colgroup = o => `<colgroup><col style="width:9mm"><col style="width:${o.km ? 27 : 30}mm"><col style="width:${o.km ? 23 : 26}mm"><col style="width:${o.km ? 23 : 26}mm"><col style="width:15mm"><col style="width:20mm"><col style="width:17mm">${o.km ? '<col style="width:13mm">' : ''}<col></colgroup>`;
  const thead = o => `${colgroup(o)}<thead><tr><th class="pd-nr">Št.</th><th>Ime in priimek</th><th>Od</th><th>Do</th><th>Ura prev.</th><th>Pobere</th><th>Vozilo</th>${o.km ? '<th>Km</th>' : ''}<th>Opomba</th></tr></thead>`;

  function head(date, n, N, title, noDate){
    const form = esc((S.settings.formCode || 'OBR REŠ 08').trim()), hol = holiday(date);
    return `<header class="pd-head"><div class="pd-logos">${logoInner()}</div><div class="pd-title"><b>${esc(title || 'KNJIGA REŠEVALNIH PREVOZOV')}</b><span>Reševalna postaja Brežice · ${form}</span></div>
      <div class="pd-date">${noDate ? '' : `<div>DATUM: <b>${fmtDMY(date)}</b></div><div>DAN: <b>${DOW_LONG[dow(date)]}</b>${hol ? ' · ' + esc(hol) : ''}</div>${n ? `<div class="pd-pg">list ${n}/${N}</div>` : ''}`}</div></header>`;
  }
  const lines = h => `<div class="pd-ruled">${'<div class="pd-ln"></div>'.repeat(Math.max(1, Math.floor(h / 22)))}</div>`;

  /* ---------- Strani enega dne ---------- */
  function dayPages(date, o){
    const d = dayData(date), by = {}; d.rides.forEach(x => { by[x.nr] = x; });
    const last = d.all.reduce((m, x) => Math.max(m, x.nr), 0), total = Math.max(P2, last);
    const book = S.crewBook[date] || {}, ostTxt = (book.ost && book.ost.text) || '';
    const notices = (S.notices || []).filter(n => !n.closed && n.from <= date && (!n.to || n.to >= date));
    const posebnosti = [S.dayNote[date] || '', ostTxt ? 'Ostalo: ' + ostTxt : '', ...notices.map(n => `${(S.vehicles.find(v => v.id === n.vehicleId) || {}).name || ''}: ${n.tip}${n.note ? ' – ' + n.note : ''}`)].filter(Boolean);
    const crewList = [];
    const seen = new Set();
    S.vehicles.forEach(v => {
      if (v.tip === 'ostalo') return;
      const nrs = d.rides.filter(x => x.veh === v.name && !x.r.odpovedano).map(x => x.nr);
      const cell = book[v.id] && book[v.id].text;
      let txt = cell || '', start = '';
      const pc = d.plan && d.plan.crews ? d.plan.crews.find(c => c.vehicle && c.vehicle.id === v.id) : null;
      if (!txt && pc){ try { txt = crewLabel(pc); } catch (e) { txt = ''; } }
      if (!txt){ const dn = d.rides.find(x => x.veh === v.name && x.crew && x.crew.voz); if (dn) txt = [dn.crew.voz, dn.crew.spr ? dn.crew.spr + ' (sp.)' : ''].filter(Boolean).join(', '); }
      if (pc && pc.trips && pc.trips.length){ try { start = 'ob ' + fmtT(pc.firstDepart); } catch (e) { start = ''; } }
      if (!txt && !nrs.length) return;
      seen.add(v.name); crewList.push({ veh:v.name, txt, nrs, start });
    });
    d.rides.forEach(x => { if (x.veh && !x.r.odpovedano && !seen.has(x.veh)){ seen.add(x.veh); crewList.push({ veh:x.veh, txt:[x.crew && x.crew.voz, x.crew && x.crew.spr ? x.crew.spr + ' (sp.)' : ''].filter(Boolean).join(', '), nrs:d.rides.filter(y => y.veh === x.veh && !y.r.odpovedano).map(y => y.nr), start:'' }); } });
    const stats = { n:d.all.filter(x => !x.r.odpovedano).length, canc:d.all.filter(x => x.r.odpovedano).length, done:d.all.filter(x => !x.r.odpovedano && x.r.done).length };
    const empty = !d.all.length && !posebnosti.length && !crewList.length;
    const crewRows = crewList.map(c => `<tr><td><b>${esc(c.veh)}</b></td><td>${esc(c.txt || '')}</td><td>${c.nrs.join(', ') || '–'}</td><td>${esc(c.start)}</td></tr>`).join('');
    const crewTab = `<table class="pd-tab pd-crew"><thead><tr><th>Vozilo</th><th>Posadka</th><th>Prevozi (št.)</th><th>Posebnosti</th></tr></thead><tbody>${crewRows || '<tr><td colspan="4">Ni posadk.</td></tr>'}</tbody></table>`;
    const posBlock = `<div class="pd-pos"><b>Posebnosti:</b>${posebnosti.length ? '<ul>' + posebnosti.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : lines(90)}</div>`;
    const pages = [];
    const rowsOf = (a, b) => Array.from({ length:b - a }, (_, j) => by[a + j + 1] ? rowHTML(by[a + j + 1], o) : emptyRow(a + j + 1, o)).join('');
    const tab = (a, b) => `<table class="pd-tab">${thead(o)}<tbody>${rowsOf(a, b)}</tbody></table>`;
    const vehLine = crewList.filter(c => c.nrs.length).map(c => esc(c.veh)).join(' · ') || '–';
    const ctrl = [];   // [html z rezervo za »list n/N«]
    if (!d.all.length){
      pages.push({ kind:'prazno', date, inner:() => `${head(date, 0, 0)}<p class="pd-empty-day">Ni vpisanih prevozov.</p>${crewList.length ? crewTab : ''}${posBlock}` });
    } else {
      ctrl.push(N => `${head(date, ctrl.k, N)}<div class="pd-veh">VOZILA: <b>${vehLine}</b></div>${tab(0, P1)}`);
      ctrl.push(N => `${head(date, ctrl.k, N)}${tab(P1, P2)}`);
      for (let a = P2; a < total; a += CONT){ const b = Math.min(total, a + CONT); ctrl.push(N => `${head(date, ctrl.k, N)}<p class="pd-fine" style="margin:0 0 6px">nadaljevanje: prevozi ${a + 1}–${b}</p>${tab(a, b)}`); }
      ctrl.push(N => `${head(date, ctrl.k, N)}
        ${crewTab}
        ${posBlock}
        <p class="pd-fine">Prevozov: ${stats.n}${stats.canc ? ` · odpovedanih: ${stats.canc}` : ''} · opravljenih: ${stats.done}. ${d.pending ? 'Del prevozov še ni opravljen: ure »Pobere« so tam ocena razporeda.' : 'Ure »Pobere« so dejanske, kjer jih je posadka zabeležila; sicer ocena razporeda.'}</p>
        <div class="pd-sign"><span>Dispečer: ______________________</span></div>`);
      const N = ctrl.length;
      ctrl.forEach((f, i) => { pages.push({ kind:i === N - 1 ? 'posadke' : 'prevozi', date, inner:() => { ctrl.k = i + 1; return f(N); } }); });
    }
    return { pages, stats, rides:d.rides, crewList, empty };
  }

  /* ---------- Posebne strani ---------- */
  const noteBlank = (date, o) => ({ kind:'opombe', date, inner:() => `${head(date, 0, 0, 'OPOMBE')}<p class="pd-fine" style="margin:0 0 8px">Prostor za ročne dopolnitve (${DOW_LONG[dow(date)]}, ${fmtDMY(date)}).</p>${lines(880)}` });
  function monthTotals(y, m, o){
    const n = daysInMonth(y, m), days = [], veh = {};
    let tot = 0, canc = 0, done = 0, km = 0, kmEx = true, kmN = 0;
    for (let k = 1; k <= n; k++){
      const date = `${y}-${pad(m + 1)}-${pad(k)}`, dp = dayPages(date, o);
      dp.rides.forEach(x => {
        if (x.r.odpovedano) return;
        const key = x.veh || '(brez vozila)', v = veh[key] || (veh[key] = { n:0, km:0 });
        v.n++; const kk = kmNum(x.r); if (kk != null){ v.km += kk; km += kk; kmN++; try { const i = KM.info(x.r); if (!(i.exact && i.backExact)) kmEx = false; } catch (e) { kmEx = false; } }
      });
      tot += dp.stats.n; canc += dp.stats.canc; done += dp.stats.done;
      days.push({ date, dp });
    }
    return { days, veh, tot, canc, done, km, kmEx, kmN };
  }

  /* ---------- Cela knjiga ---------- */
  function build(y, m, o0){
    const o = opts(o0), T = monthTotals(y, m, o), pages = [];
    const title = `${MONTHS[m]} ${y}`;
    const shown = T.days.filter(d => !(o.skipEmpty && d.dp.empty));
    const front = o.front ? 2 : 0;                                    // naslovnica + kazalo
    const isOdd = i => i % 2 === 0;                                   // indeks 0 = stran 1
    const dayStart = [];
    let count = front;
    const seq = [];
    shown.forEach(({ date, dp }) => {
      const ps = dp.pages.slice();
      if (o.duplex && (ps.length % 2)) ps.push(noteBlank(date, o));
      dayStart.push({ date, page:count + 1, dp });
      seq.push(...ps); count += ps.length;
    });
    if (o.summary){ seq.push({ kind:'povzetek' }); count++; }
    const N = count;
    const foot = pn => `<footer class="pb-foot"><span>Knjiga reševalnih prevozov · ${esc(title)}</span><span>str. ${pn} / ${N}</span></footer>`;
    const sec = (pn, inner) => `<section class="pb-page ${(!o.duplex || pn % 2 === 1) ? 'pb-odd' : 'pb-even'}" data-pn="${pn}">${inner}${foot(pn)}</section>`;
    const out = [];
    if (o.front){
      const nonEmpty = T.days.filter(d => !d.dp.empty).length;
      out.push(sec(1, `<div class="pb-cover"><div class="pd-logos" style="justify-content:center">${logoInner()}</div><h1>KNJIGA REŠEVALNIH PREVOZOV</h1><h2>${esc(title)}</h2>
        <p>Reševalna postaja Brežice · Zdravstveni dom Brežice</p><p class="pb-big">${T.tot}</p><p>prevozov v mesecu${T.canc ? ` (odpovedanih: ${T.canc})` : ''}</p>
        <p class="pd-fine">Izpisano ${new Date().toLocaleString('sl-SI')} · dni z vpisi: ${nonEmpty} od ${T.days.length}</p></div>`));
      const kz = dayStart.map(s => `<tr><td>${fmtDMY(s.date)}</td><td>${DOW_LONG[dow(s.date)]}${holiday(s.date) ? ' · ' + esc(holiday(s.date)) : ''}</td><td class="num">${s.dp.stats.n || ''}</td><td class="num">${s.dp.stats.canc || ''}</td><td class="num">${s.page}</td></tr>`).join('');
      out.push(sec(2, `${head(`${y}-${pad(m + 1)}-01`, 1, 1, 'KAZALO · ' + title.toUpperCase(), true)}
        <table class="pd-tab pb-index"><colgroup><col style="width:30mm"><col><col style="width:26mm"><col style="width:30mm"><col style="width:18mm"></colgroup><thead><tr><th>Datum</th><th>Dan</th><th class="num">Prevozov</th><th class="num">Odpovedanih</th><th class="num">Stran</th></tr></thead><tbody>${kz || '<tr><td colspan="5">Ni dni.</td></tr>'}</tbody></table>`));
    }
    seq.forEach((p, i) => {
      const pn = front + i + 1;
      if (p.kind === 'povzetek'){
        const vr = Object.keys(T.veh).sort().map(k => `<tr><td><b>${esc(k)}</b></td><td class="num">${T.veh[k].n}</td><td class="num">${T.veh[k].km ? KM.fmtKm(T.veh[k].km) : ''}</td></tr>`).join('');
        out.push(sec(pn, `${head(`${y}-${pad(m + 1)}-01`, 1, 1, 'MESEČNI POVZETEK · ' + title.toUpperCase(), true)}
          <table class="pd-tab pb-sum"><tbody><tr><td>Prevozov (brez odpovedanih)</td><td class="num"><b>${T.tot}</b></td></tr><tr><td>Opravljenih (označenih)</td><td class="num"><b>${T.done}</b></td></tr><tr><td>Odpovedanih</td><td class="num"><b>${T.canc}</b></td></tr>
          <tr><td>Kilometrina prevozov (OD→DO${T.kmEx ? '' : ', del je ocena ~'})</td><td class="num"><b>${T.kmN ? (T.kmEx ? '' : '~') + KM.fmtKm(T.km) + ' km' : 'ni izračunana'}</b></td></tr></tbody></table>
          <h3 style="margin:14px 0 4px">Po vozilih</h3><table class="pd-tab pb-sum"><thead><tr><th>Vozilo</th><th class="num">Prevozov</th><th class="num">Km</th></tr></thead><tbody>${vr || '<tr><td colspan="3">Ni podatkov.</td></tr>'}</tbody></table>
          <p class="pd-fine">Vozilo je določeno iz razporeda ali objavljenega razporeda oziroma po imenu v »Kdo je naredil odvoz«; prevozi brez znanega vozila so v vrstici »(brez vozila)«. Kilometrina je razdalja OD→DO po cestah (osebni avto), ne vožnja reševalca do pacienta in nazaj.</p>
          <h3 style="margin:14px 0 4px">Opombe meseca</h3>${lines(200)}
          <div class="pd-sign"><span>Pregledal: ______________________</span><span>Datum: ______________</span></div>`));
      } else out.push(sec(pn, p.inner()));
    });
    return { y, m, title, html:out.join(''), pagesHtml:out, pages:N, sheets:Math.ceil(N / (o.duplex ? 2 : 1)), days:shown.length, rides:T.tot, canc:T.canc, opts:o, dayStart:dayStart.map(s => ({ date:s.date, page:s.page })), totals:T };
  }

  /* ---------- Možnosti se zapomnijo samo v tej napravi ---------- */
  const KEY = 'kp.book.opts';
  const load = () => { try { return opts(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return opts({}); } };
  const store = o => { try { localStorage.setItem(KEY, JSON.stringify(opts(o))); } catch (e) { /* brez shranjevanja */ } };

  /* ---------- Predogled, tisk in PDF ----------
     Knjiga se NE tiska več iz glavnega okna aplikacije: vsaka pot (predogled strani, tisk, odpiranje v novem zavihku) dobi samostojen dokument z isto
     stilsko tabelo (css()), zato je predogled enak natisnjenemu. Dokument nima skript (CSP), samo oznake in stil. */
  const CSS = [
    '@page{size:A4 portrait;margin:0}',
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    'html,body{margin:0;padding:0;background:#fff;color:#000}',
    'body{font:11px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--gut:12mm}',
    'h1,h2,h3,h4{font-family:inherit;margin:0;text-wrap:balance;letter-spacing:-.01em}',
    'table{border-collapse:collapse;width:100%;font-size:13.5px}',
    'th{font-size:11px;letter-spacing:.07em;text-transform:uppercase;text-align:left;font-weight:600;padding:9px 12px;white-space:nowrap}',
    'td{padding:10px 12px;vertical-align:top}',
    '.logoitem{display:inline-flex;align-items:center} .logoitem img{height:32px;width:auto;max-width:190px;object-fit:contain;display:block} .logoitem .lf{font:700 13px system-ui,sans-serif;color:#0D1A2C} .logoitem .lf[hidden]{display:none}',
    '#printArea{display:block;background:#fff;color:#000;font:11px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '#printArea h2{margin:0 0 2px;font-size:18px} #printArea h3{margin:12px 0 4px;font-size:13px;text-transform:capitalize}',
    '#printArea section{break-inside:avoid} #printArea table{width:100%;border-collapse:collapse}',
    '#printArea th,#printArea td{border:1px solid #888;padding:2px 5px;text-align:left;vertical-align:top;color:#000;background:#fff}',
    '#printArea th{background:#e8e8e8} #printArea tr.p-cancel td{background:#fde2e2;color:#b00020} #printArea td.num,#printArea th.num{text-align:right}',
    '.pd-head{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px}',
    '.pd-logos{display:flex;gap:8px;align-items:center;min-height:34px} .pd-logos img{max-height:34px;width:auto} .pd-logos i{display:none}',
    '.pd-title{display:flex;flex-direction:column;text-align:center} .pd-title b{font-size:15px;letter-spacing:.04em} .pd-title span{font-size:11px}',
    '.pd-date{text-align:right;line-height:1.5} .pd-date b{font-size:13px} .pd-pg{font-size:10px;color:#444}',
    '.pd-veh{margin:0 0 6px;font-size:12px}',
    '.pd-tab{width:100%;border-collapse:collapse;table-layout:fixed}',
    '.pd-tab th,.pd-tab td{border:1px solid #000;padding:3px 4px;vertical-align:top;word-break:break-word;height:19px;color:#000;background:#fff}',
    '.pd-tab th{background:#e6e6e6;font-size:10px;text-transform:uppercase}',
    '.pd-tab .pd-nr{width:9.5mm;padding-left:1px;padding-right:1px;text-align:center;font-weight:700;white-space:nowrap} .pd-tab .pd-t{width:15mm;text-align:center;font-family:ui-monospace,Menlo,monospace} .pd-tab .pd-v{width:14mm;text-align:center}',
    '.pd-tab tr.pd-empty td{height:30px}',
    '.pd-tab tr.p-cancel td{color:#c00000;text-decoration:line-through} .pd-tab tr.p-cancel td b{text-decoration:none;display:inline-block}',
    '.pd-crew td{height:34px;font-size:12px} .pd-pos{margin-top:12px} .pd-pos ul{margin:4px 0 0 16px;padding:0} .pd-lines{height:90px;background:repeating-linear-gradient(transparent 0 21px,#999 21px 22px)}',
    '.pd-sign{display:flex;justify-content:space-between;margin-top:22px;font-size:12px} .pd-fine{font-size:9.5px;color:#444;margin:8px 0 0} .pd-warn{color:#c00000;font-weight:700;margin:8px 0 0}',
    '.pb-page{box-sizing:border-box;width:210mm;height:296mm;padding:9mm 9mm 15mm;position:relative;break-after:page;break-inside:auto}',
    '.pb-page:last-child{break-after:auto}',
    '.pb-odd{padding-left:calc(9mm + var(--gut))} .pb-even{padding-right:calc(9mm + var(--gut))}',
    '.pb-foot{position:absolute;bottom:6mm;display:flex;justify-content:space-between;font-size:9.5px;color:#444;border-top:1px solid #999;padding-top:2px}',
    '.pb-odd .pb-foot{left:calc(9mm + var(--gut));right:9mm} .pb-even .pb-foot{left:9mm;right:calc(9mm + var(--gut))}',
    '.pb-cover{text-align:center;margin-top:55mm} .pb-cover h1{font-size:26px;letter-spacing:.04em;margin:26px 0 6px} .pb-cover h2{font-size:34px;text-transform:capitalize;margin:0 0 22px} .pb-cover p{margin:4px 0;font-size:13px}',
    '.pb-cover .pb-big{font-size:64px;font-weight:700;margin:26px 0 0;line-height:1} .pb-cover .pd-logos img{max-height:56px} .pb-cover .pd-logos{justify-content:center}',
    '.pb-index td,.pb-sum td{height:auto;padding:2px 6px} .pb-index td.num,.pb-sum td.num,.pb-index th.num,.pb-sum th.num{text-align:right}',
    '.pd-empty-day{font-size:14px;margin:22px 0;color:#444}',
    '.pd-by{font-size:9px;color:#333;margin-top:1px} .pd-chk{color:#b45309} .pd-ruled{margin-top:6px} .pd-ln{height:22px;border-bottom:1px solid #999}',
    '#printArea .pd-tab th{font-size:9px;padding:3px 2px;letter-spacing:0}',
    /* samo na zaslonu (predogled, odprt zavihek): ozadje, senca strani in siv pas notranjega roba za vezavo; pri tisku se nič od tega ne izpiše */
    '@media screen{',
    ' .pb-odd{background-image:linear-gradient(90deg,#e6ebf3 0,#e6ebf3 var(--gut),transparent var(--gut))} .pb-even{background-image:linear-gradient(270deg,#e6ebf3 0,#e6ebf3 var(--gut),transparent var(--gut))}',
    ' body.m-view{overflow:hidden;background:#fff}',
    ' body.m-tab{background:#cfd6e2;padding:0 0 28px} body.m-tab #printArea{background:transparent} body.m-tab .pb-page{margin:14px auto;box-shadow:0 2px 14px rgba(0,0,0,.28);background-color:#fff}',
    ' .bk-bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#0d1a2c;color:#fff;font:13px/1.4 system-ui,sans-serif}',
    ' .bk-bar b{font-size:14px} .bk-bar span{flex:1 1 280px;opacity:.92} .bk-bar button{font:700 14px system-ui,sans-serif;padding:9px 16px;border:0;border-radius:8px;background:#DD5207;color:#fff;cursor:pointer}',
    ' @media (pointer:coarse){.bk-bar{font-size:26px;padding:18px 22px;gap:16px} .bk-bar b{font-size:28px} .bk-bar button{font-size:28px;padding:16px 28px;border-radius:14px}}',
    '}',
    '@media print{.bk-bar{display:none!important} body.m-tab .pb-page{margin:0;box-shadow:none}}'
  ].join('\n');
  const css = () => CSS;
  /* mode: 'print' (cela knjiga), 'tab' (cela knjiga za zaslon: odprt zavihek), 'view' (ena stran za predogled; page = številka strani) */
  function doc(b, mode, page){
    mode = mode || 'print'; const dt = 'Knjiga prevozov ' + b.title;
    const pages = mode === 'view' ? [b.pagesHtml[Math.min(b.pages, Math.max(1, +page || 1)) - 1] || ''] : b.pagesHtml;
    const bar = mode === 'tab' ? `<div class="bk-bar"><b>${esc(dt)}</b><span>${b.pages} strani. Za tisk ali PDF izberi v meniju brskalnika (⋮ ali »Deli«) možnost <b>Natisni</b>; tam lahko izbereš tudi »Shrani kot PDF«. Papir A4 pokončno, merilo 100 %.</span><button type="button" id="bkGo">Natisni / PDF</button></div>` : '';
    return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>${esc(dt)}</title>${mode === 'tab' ? '<meta name="viewport" content="width=794">' : ''}<style>${CSS}</style></head><body class="m-${mode}" style="--gut:${b.opts.gut}mm">${bar}<div id="printArea" class="pbook">${pages.join('')}</div></body></html>`;
  }
  const hooks = { print:null, open:null };
  /* tisk: skrit okvir s celotno knjigo, nato print() samo tega okvirja (ne glavnega okna). Na nekaterih telefonih (iOS) to ne deluje: tam »odpri v zavihku«. */
  function printFrame(b){
    const html = doc(b, 'print');
    audit('knjiga.tisk.mesec', { mesec:`${b.y}-${pad(b.m + 1)}`, strani:b.pages });
    if (hooks.print) return hooks.print(html, b);
    const old = document.getElementById('bkPrintFrame'); if (old) old.remove();
    const fr = document.createElement('iframe'); fr.id = 'bkPrintFrame'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.title = 'Knjiga za tisk';
    fr.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;visibility:hidden';
    let done = false;
    const clean = () => { if (done) return; done = true; setTimeout(() => fr.remove(), 1500); };
    fr.onload = () => {
      try { const w = fr.contentWindow; w.addEventListener('afterprint', clean); w.focus(); w.print(); setTimeout(clean, 10 * 60 * 1000); }
      catch (e) { clean(); toast('Tiskanja ni mogoče zagnati v tem brskalniku. Uporabi »Odpri za tisk / PDF«.'); }
    };
    fr.srcdoc = html; document.body.appendChild(fr);
    return fr;
  }
  /* odpre knjigo v novem zavihku (telefon: Deli/⋮ → Natisni → Shrani kot PDF). Vrne okno ali null, če je brskalnik blokiral pojavno okno. */
  function openTab(b){
    const html = doc(b, 'tab').replace(/(\ssrc=")(?!data:|blob:|https?:)([^"]*)"/g, (m, a, u) => { try { return a + new URL(u.replace(/&amp;/g, '&'), location.href).href + '"'; } catch (e) { return m; } });
    audit('knjiga.odprto.mesec', { mesec:`${b.y}-${pad(b.m + 1)}`, strani:b.pages });
    if (hooks.open) return hooks.open(html, b);
    let url = ''; try { url = URL.createObjectURL(new Blob([html], { type:'text/html;charset=utf-8' })); } catch (e) { return null; }
    const w = window.open(url, '_blank');
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* nič */ } }, 15 * 60 * 1000);
    if (w){ try { w.addEventListener('load', () => { const bt = w.document.getElementById('bkGo'); if (bt) bt.addEventListener('click', () => w.print()); }); } catch (e) { /* gumb je dodatek: meni brskalnika deluje vedno */ } }
    return w || null;
  }
  /* zgodovinsko ime: tisk celotne knjige */
  function print(y, m, o, built){ const b = built || build(y, m, o); printFrame(b); return b; }
  /* so podatki za mesec že naloženi iz skupne baze? (v lokalnem načinu vedno) */
  function monthReady(y, m){
    const a = `${y}-${pad(m + 1)}-01`, b = `${y}-${pad(m + 1)}-${pad(daysInMonth(y, m))}`;
    if (typeof SY === 'undefined' || !SY.range) return true;
    return a >= SY.range.from && b <= SY.range.to && !!SY.dayReady;
  }
  return { DEF, opts, build, print, printFrame, openTab, doc, css, hooks, load, store, dayData, dayPages, monthReady, P1, P2, CONT };
})();

/* =====================================================================
   SKENIRANJE STRANI PAPIRNE KNJIGE (fotografija strani → prevozi v dnevu)
   Pot: fotografija → poravnava (zasuk) in izboljšava kontrasta → razpoznava besed (OCR, izolirani okvir ocr/ocr.html; vrne besede z okvirji in zanesljivostjo)
        → vrstice (po številkah polj 1–24) in stolpci (po glavi tabele ali po poravnavi besed) → polja (ime, od, do, ura, način, opomba)
        → primerjava z znanim (baza pacientov, ustanove, klinike, naselja, ulice) → ocena zanesljivosti vsakega polja.
   Aplikacija NE ugiba tiho: vsako polje dobi stopnjo
        ok   = prebrano in potrjeno z znanimi podatki (npr. ime je v bazi, cilj je znana ustanova, ura je smiselna),
        chk  = prebrano, vendar ni potrjeno (novo ime, neznan kraj, slaba razpoznava): PREVERI,
        bad  = neberljivo, manjka ali nesmiselno: POPRAVI.
   Pri vsaki vrstici je v pregledu izrez fotografije, da se prebrano primerja z originalom. Nepotrjena polja ostanejo označena tudi v knjigi (r.chk), dokler jih dispečer ne potrdi.
   Rokopis: razpoznava besedila v brskalniku (Tesseract) je dobra pri tiskanem besedilu in razločni tiskani pisavi, pri tekočem rokopisu pogosto zgreši; zato je označevanje bistveno.
   Razčlenjevalec (parse) je čista funkcija nad besedami; slika in besedilo se NE shranita.
   ===================================================================== */
const BSCAN = (() => {
  const T_ = v => String(v ?? '');
  const N = s => norm(s);
  const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

  /* ---------- Razdalja med nizi, odporna na tipične napake OCR (0/o, 1/l, 5/s, rn/m …) ---------- */
  const CONF = new Set(['0o', '1l', '1i', 'il', 'li', '5s', '8b', '2z', '6g', '9g', '1t', 'tl', 'ce', 'ec', 'uv', 'vu', 'nh', 'hn', 'ao', 'oa', 'eo', 'oe']);
  const confusable = (a, b) => CONF.has(a + b) || CONF.has(b + a);
  const ocrNorm = s => N(s).replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function ed(a, b){
    const n = a.length, m = b.length; if (!n) return m; if (!m) return n;
    let prev = Array.from({ length:m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++){
      const cur = [i];
      for (let j = 1; j <= m; j++){
        const c = a[i - 1] === b[j - 1] ? 0 : confusable(a[i - 1], b[j - 1]) ? 0.35 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
      }
      prev = cur;
    }
    return prev[m];
  }
  const sim = (a, b) => { const x = ocrNorm(a), y = ocrNorm(b), L = Math.max(x.length, y.length); return L ? 1 - ed(x, y) / L : 0; };
  const simNS = (a, b) => { const x = ocrNorm(a).replace(/ /g, ''), y = ocrNorm(b).replace(/ /g, ''), L = Math.max(x.length, y.length); return L ? 1 - ed(x, y) / L : 0; };
  /* imena: vrstni red besed ni pomemben (»Priimek Ime« = »Ime Priimek«) */
  const simName = (a, b) => {
    const x = ocrNorm(a).split(' ').filter(Boolean).sort().join(' '), y = ocrNorm(b).split(' ').filter(Boolean).sort().join(' '), L = Math.max(x.length, y.length);
    return L ? 1 - ed(x, y) / L : 0;
  };

  /* ---------- Besede ---------- */
  const trimTok = t => T_(t).replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}.:)]+$/u, '');
  function cleanWords(words){
    return (words || []).map(w => {
      const bb = w.bbox || {}, x0 = +(w.x0 ?? bb.x0), y0 = +(w.y0 ?? bb.y0), x1 = +(w.x1 ?? bb.x1), y1 = +(w.y1 ?? bb.y1);
      const c = +(w.conf ?? w.confidence ?? w.c);
      return { t:trimTok(w.text ?? w.t), c:isFinite(c) ? Math.max(0, Math.min(100, c)) : 0, x0, y0, x1, y1 };
    }).filter(w => w.t && /[\p{L}\p{N}]/u.test(w.t) && isFinite(w.x0 + w.y0 + w.x1 + w.y1) && w.x1 > w.x0 && w.y1 > w.y0);
  }
  const cx = w => (w.x0 + w.x1) / 2, cy = w => (w.y0 + w.y1) / 2;
  /* besede enega polja → besedilo in zanesljivost (uteženo z dolžino besede) */
  function cellOf(ws){
    const s = ws.slice().sort((a, b) => (Math.abs(cy(a) - cy(b)) > Math.min(a.y1 - a.y0, b.y1 - b.y0) * 0.6) ? cy(a) - cy(b) : a.x0 - b.x0);
    const text = s.map(w => w.t).join(' ').replace(/\s+/g, ' ').trim();
    let sw = 0, sc = 0, mn = 100; s.forEach(w => { const l = Math.max(1, w.t.length); sw += l; sc += w.c * l; mn = Math.min(mn, w.c); });
    return { text, conf:sw ? Math.round(sc / sw) : 0, min:s.length ? Math.round(mn) : 0, n:s.length, ws:s };
  }

  /* ---------- Poravnava številk (OCR) ---------- */
  const DIGFIX = { O:'0', o:'0', Q:'0', D:'0', l:'1', I:'1', '|':'1', i:'1', S:'5', s:'5', B:'8', Z:'2', z:'2', g:'9' };
  const fixNum = t => String(t).replace(/[OoQDlI|iSsBZzg]/g, c => DIGFIX[c] || c);
  const isNumTok = t => /^[0-9OoQDlI|iSsBZz]{1,2}[.)]?$/.test(t) && /\d|[lI|O]/.test(t);
  const numVal = t => { const v = parseInt(fixNum(String(t).replace(/[.)]$/, '')), 10); return isFinite(v) ? v : null; };

  /* ---------- Glava tabele ---------- */
  const HEAD_KEYS = [['nr', ['st', 'stev', 'zst']], ['name', ['ime', 'priimek', 'pacient', 'ime in priimek']], ['from', ['od', 'iz']], ['to', ['do', 'cilj', 'kam']], ['time', ['ura', 'cas', 'prev', 'uraprev', 'ura prevoza']], ['pick', ['pobere', 'pobira', 'pobiranje']], ['veh', ['vozilo', 'avto']], ['note', ['opomba', 'opombe', 'posebnosti']]];
  function headKey(t){
    const n = ocrNorm(t).replace(/ /g, ''); if (!n) return null;
    for (const [k, list] of HEAD_KEYS) for (const h of list){ if (n === h) return k; if (h.length >= 5 && n.length >= 4 && sim(n, h) >= 0.78) return k; }
    return null;
  }
  function findHeader(ws, mh){
    const hits = ws.map(w => ({ w, k:headKey(w.t) })).filter(x => x.k);
    if (hits.length < 3) return null;
    const groups = [];
    hits.sort((a, b) => cy(a.w) - cy(b.w)).forEach(h => { const g = groups.find(g => Math.abs(g.y - cy(h.w)) <= mh * 1.1); if (g){ g.items.push(h); g.y = (g.y * (g.items.length - 1) + cy(h.w)) / g.items.length; } else groups.push({ y:cy(h.w), items:[h] }); });
    const ok = groups.filter(g => new Set(g.items.map(i => i.k).filter(k => k !== 'nr')).size >= 3).sort((a, b) => a.y - b.y)[0];
    if (!ok) return null;
    const cols = {};
    ok.items.forEach(({ w, k }) => { if (!cols[k] || w.x0 < cols[k].x0) cols[k] = { key:k, x0:w.x0, x1:w.x1 }; });
    return { y:ok.y, y1:Math.max(...ok.items.map(i => i.w.y1)), cols:Object.values(cols).sort((a, b) => a.x0 - b.x0) };
  }

  /* ---------- Vrstice po številkah polj ---------- */
  function findRows(ws, mh, head, box){
    const top = head ? head.y1 : box.y0 - 1, leftLimit = head ? (head.cols.find(c => c.key === 'name') || head.cols[0]).x0 - mh * 0.3 : box.x0 + (box.x1 - box.x0) * 0.14;
    let cand = ws.filter(w => w.y0 >= top - 1 && cx(w) < leftLimit && isNumTok(w.t) && numVal(w.t) >= 1 && numVal(w.t) <= 60).sort((a, b) => cy(a) - cy(b));
    /* najdaljše zaporedje naraščajočih številk (OCR napačno prebrane številke izpustimo) */
    const best = [];
    const L = cand.map(() => 1), P = cand.map(() => -1);
    for (let i = 0; i < cand.length; i++) for (let j = 0; j < i; j++) if (numVal(cand[j].t) < numVal(cand[i].t) && L[j] + 1 > L[i]){ L[i] = L[j] + 1; P[i] = j; }
    let bi = 0; L.forEach((v, i) => { if (v > L[bi]) bi = i; });
    for (let i = bi; i >= 0 && cand.length; i = P[i]) best.unshift(cand[i]);
    cand = best;
    return cand.map(w => ({ nr:numVal(w.t), y:cy(w), conf:w.c, w, derived:false }));
  }
  /* manjkajoče številke izpelji iz razmika vrstic */
  function fillRows(rows){
    if (rows.length < 3) return rows;
    const pitch = med(rows.slice(1).map((r, i) => (r.y - rows[i].y) / Math.max(1, r.nr - rows[i].nr)));
    if (!(pitch > 0)) return rows;
    const out = [rows[0]];
    for (let i = 1; i < rows.length; i++){
      const a = rows[i - 1], b = rows[i], k = b.nr - a.nr;
      for (let j = 1; j < k; j++) out.push({ nr:a.nr + j, y:a.y + (b.y - a.y) * j / k, conf:0, w:null, derived:true });
      out.push(b);
    }
    return out;
  }
  /* brez številk: vrstice = vrstice besedila */
  function lineRows(ws, mh, top){
    const s = ws.filter(w => w.y0 >= top - 1).sort((a, b) => cy(a) - cy(b)), rows = [];
    s.forEach(w => { const r = rows[rows.length - 1]; if (r && Math.abs(cy(w) - r.y) <= mh * 0.65){ r.n++; r.y = (r.y * (r.n - 1) + cy(w)) / r.n; } else rows.push({ nr:null, y:cy(w), conf:0, w:null, derived:true, n:1 }); });
    return rows;
  }

  /* ---------- Stolpci ---------- */
  function startClusters(rowWords, mh, nRows){
    const xs = [];
    rowWords.forEach(ws => { const s = ws.slice().sort((a, b) => a.x0 - b.x0); s.forEach((w, i) => { if (i === 0 || w.x0 - s[i - 1].x1 > mh * 1.4) xs.push(w.x0); }); });
    xs.sort((a, b) => a - b);
    const cl = []; xs.forEach(x => { const c = cl[cl.length - 1]; if (c && x - c.last <= mh * 1.2){ c.v.push(x); c.last = x; } else cl.push({ v:[x], last:x }); });
    return cl.filter(c => c.v.length >= Math.max(3, nRows * 0.25)).map(c => med(c.v)).sort((a, b) => a - b);
  }

  /* glava: kratke besede (»Do«) OCR pogosto zgreši → manjkajoči stolpec dopolnimo iz poravnave besed v vrsticah */
  const COL_ORDER = ['nr', 'name', 'from', 'to', 'time', 'pick', 'veh', 'note'];
  function repairCols(cols, edges, mh){
    const free = edges.filter(e => !cols.some(k => Math.abs(k.x0 - e) < mh * 1.8));
    COL_ORDER.forEach((key, oi) => {
      if (cols.some(c => c.key === key)) return;
      const prev = cols.filter(c => COL_ORDER.indexOf(c.key) < oi).sort((a, b) => b.x0 - a.x0)[0], next = cols.filter(c => COL_ORDER.indexOf(c.key) > oi).sort((a, b) => a.x0 - b.x0)[0];
      if (!prev || !next) return;
      const cand = free.find(e => e > prev.x0 + mh * 2 && e < next.x0 - mh * 2);
      if (cand != null){ cols.push({ key, x0:cand, inferred:true }); free.splice(free.indexOf(cand), 1); }
    });
    return cols.sort((a, b) => a.x0 - b.x0);
  }

  /* ---------- Polja ---------- */
  const RE_TIME = /^(\d{1,2})\s*[:.,;h]\s*(\d{2})$/;
  const timeLike = t => { const s = fixNum(T_(t).trim()); return RE_TIME.test(s) || /^\d{3,4}$/.test(s) || /^(dop|pop)\.?$/i.test(T_(t).trim()); };
  function parseTime(text){
    const raw = T_(text).trim(); if (!raw) return { v:'', dia:'' };
    if (/^(dop|dopoldne|dopoldanska)\.?$/i.test(raw)) return { v:'', dia:'dop' };
    if (/^(pop|popoldne|popoldanska)\.?$/i.test(raw)) return { v:'', dia:'pop' };
    const s = fixNum(raw.replace(/\s+/g, '').replace(/^ob/i, ''));
    let h, m, mm;
    if ((mm = RE_TIME.exec(s))){ h = +mm[1]; m = +mm[2]; }
    else if ((mm = /^(\d{1,2})[hH]?$/.exec(s))){ h = +mm[1]; m = 0; }
    else if ((mm = /^(\d{1,2})(\d{2})$/.exec(s))){ h = +mm[1]; m = +mm[2]; }
    else return { v:null, dia:'' };
    if (h > 23 || m > 59) return { v:null, dia:'' };
    return { v:pad(h) + ':' + pad(m), dia:'' };
  }
  const MODE_WORDS = [['sede', 'sede'], ['sedece', 'sede'], ['leze', 'leze'], ['lezece', 'leze'], ['utila', 'utila'], ['utilo', 'utila'], ['vzorci', 'vzorci'], ['vzorec', 'vzorci'], ['vzorce', 'vzorci']];
  function modeIn(text){
    let mode = '', rest = [];
    T_(text).split(/\s+/).filter(Boolean).forEach(tk => {
      const n = ocrNorm(tk); const hit = MODE_WORDS.find(([w]) => n === w || (w.length >= 5 && sim(n, w) >= 0.8));
      if (hit && !mode) mode = hit[1]; else rest.push(tk);
    });
    return { mode, rest:rest.join(' ') };
  }
  const nameCase = s => { const t = T_(s).trim(); return (t === t.toUpperCase() || t === t.toLowerCase()) ? t.toLowerCase().replace(/(^|[\s\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : t; };

  /* znano besedišče za primerjavo (pacienti, ustanove, klinike, naselja, mesta, ulice) */
  let _voc = null, _vocKey = '';
  function vocab(){
    const key = (S.places || []).length + '|' + (S.addrBook || []).length + '|' + (S.patients || []).length;
    if (_voc && _vocKey === key) return _voc;
    const v = [], add = (s, label, kind) => { const x = ocrNorm(s); if (x && x.length >= 2) v.push({ s:x, label, kind }); };
    POIS.forEach(p => { add(p.n, p.n, 'ustanova'); (p.al || []).forEach(a => add(a, p.n, 'ustanova')); });
    (S.places || []).forEach(p => { const lb = p.parent ? p.parent + ' – ' + p.n : p.n; add(p.parent + ' ' + p.n, lb, 'klinika'); (p.al || []).forEach(a => add(p.parent + ' ' + a, lb, 'klinika')); });
    SETTLEMENTS.forEach(s => add(s.n, s.n, 'kraj')); TOWNS.forEach(s => add(s.n, s.n, 'kraj')); BREZICE_STREETS.forEach(s => add(s, s, 'ulica'));
    _voc = v; _vocKey = key; return v;
  }
  /* najboljši predlogi za besedilo kraja/ustanove; naslov brez hišne številke in z njo */
  function placeSuggest(text, max = 3){
    const m = /^(.*?)(?:\s+(\d+\s*[a-zA-Z]?))?$/.exec(T_(text).trim()), base = (m && m[1]) || T_(text), num = (m && m[2]) || '';
    const voc = vocab(), out = [];
    const full = ocrNorm(text);
    voc.forEach(e => { const sc = Math.max(sim(base, e.s), sim(text, e.s), simNS(base, e.s), simNS(text, e.s)); if (sc >= 0.74 && !(Math.abs(e.s.length - full.length) > 6 && e.s.length > 6 && full.length < 5)) out.push({ label:(e.kind === 'ulica' || e.kind === 'kraj') && num ? e.label + ' ' + num.replace(/\s+/g, '') : e.label, score:sc, kind:e.kind }); });
    const seen = new Set();
    return out.sort((a, b) => b.score - a.score).filter(o => !seen.has(o.label) && seen.add(o.label)).slice(0, max);
  }
  /* Rokopis OCR pogosto prebere samo priimek ali samo del imena: poleg primerjave celega imena velja tudi ujemanje posamezne besede (najmanj 4 črke, podobnost ≥ 0,8);
     tak predlog je vedno samo predlog (nikoli samodejno potrjen). */
  function patientSuggest(name, max = 3){
    const out = [], tk = ocrNorm(name).split(' ').filter(t => t.length >= 4);
    (S.patients || []).forEach(p => {
      let sc = simName(name, p.name);
      if (sc < 0.68 && tk.length){
        let best = 0; ocrNorm(p.name).split(' ').filter(q => q.length >= 4).forEach(q => tk.forEach(t => { const v = sim(t, q); if (v > best) best = v; }));
        if (best >= 0.8) sc = Math.max(sc, 0.68 + (best - 0.8) * 0.5);
      }
      if (sc >= 0.68) out.push({ p, score:sc });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, max);
  }

  const LV = { ok:0, chk:1, bad:2 };
  const worst = (a, b) => (LV[b] > LV[a] ? b : a);

  /* ---------- Ocena polj ---------- */
  function judgeName(cell, row, o){
    const text = cell.text, f = { v:text, lvl:'ok', why:[], sug:[], pid:'' };
    if (!text){ f.lvl = row.mode === 'vzorci' ? 'ok' : 'bad'; if (f.lvl === 'bad') f.why.push('ime manjka ali ni berljivo'); return f; }
    f.v = nameCase(text.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2'));
    const sg = patientSuggest(f.v);
    const top = sg[0], second = sg[1];
    if (top && top.score >= 0.88 && (!second || top.score - second.score >= 0.06)){ f.v = top.p.name; f.pid = top.p.id; f.why.push(`v bazi pacientov (${Math.round(top.score * 100)} %)`); if (cell.conf < 40) { f.lvl = 'chk'; f.why.push('slaba razpoznava, preveri ime'); } return f; }
    if (sg.length){ f.lvl = 'chk'; f.sug = sg.map(x => ({ label:x.p.name, pid:x.p.id, score:x.score })); f.why.push('podobno imenu v bazi: izberi ali popravi'); return f; }
    const toks = f.v.split(/\s+/).filter(t => /\p{L}{2,}/u.test(t));
    if (cell.conf >= 65 && toks.length >= 2 && !junkText(text)){ f.lvl = 'chk'; f.why.push('pacienta ni v bazi (nov pacient?): preveri črkovanje'); }
    else { f.lvl = 'bad'; f.why.push(cell.conf < 65 ? `slabo berljivo (${cell.conf} %)` : 'ime ni popolno'); if (junkText(text) || cell.conf < 45){ f.v = ''; f.why = ['rokopisa ne razberem: vpiši s slike']; } }
    return f;
  }
  function judgePlace(cell, side, row){
    const text = cell.text, f = { v:text, lvl:'ok', why:[], sug:[] };
    if (!text){ f.lvl = row.mode === 'vzorci' && side === 'from' ? 'ok' : 'bad'; if (f.lvl === 'bad') f.why.push(side === 'from' ? 'naslov OD manjka' : 'cilj DO manjka'); return f; }
    if (/^doma\.?$/i.test(text)) { f.v = 'Doma'; return f; }
    const fx = NSCAN.fixDigits(text);
    let g = null; try { g = geo(fx); } catch (e) { g = null; }
    if (g && g.kind !== 'neznano'){
      f.v = fx;
      f.why.push(g.kind === 'poi' ? 'znana ustanova' : g.kind === 'addr' ? 'znan naslov' : 'znan kraj');
      if (cell.conf < 45){ f.lvl = 'chk'; f.why.push(`slaba razpoznava (${cell.conf} %)`); }
      else if (g.kind !== 'poi' && g.kind !== 'addr' && cell.conf < 60){ f.lvl = 'chk'; f.why.push(`razpoznava ${cell.conf} %`); }
      return f;
    }
    f.v = fx;
    const ps = placeSuggest(fx);
    f.sug = ps.map(x => ({ label:x.label, score:x.score }));
    if (ps[0] && ps[0].score >= 0.94 && (ps[0].kind === 'ustanova' || ps[0].kind === 'klinika') && (!ps[1] || ps[0].score - ps[1].score >= 0.08) && cell.conf >= 50){
      f.v = ps[0].label; f.why.push('prepoznano kot ' + ps[0].label); f.sug = []; return f;
    }
    if (f.sug.length){ f.lvl = 'chk'; f.why.push('ni znano; morda je mišljeno ponujeno'); }
    else if (cell.conf >= 70 && !junkText(fx)){ f.lvl = 'chk'; f.why.push('kraja ali ustanove ne prepoznam (zunaj Občine Brežice?)'); }
    else { f.lvl = 'bad'; f.why.push(`neberljivo (${cell.conf} %)`); if (junkText(fx) || cell.conf < 45){ f.v = ''; f.why = ['rokopisa ne razberem: vpiši s slike']; } }
    return f;
  }
  function judgeTime(cell, row){
    const text = cell.text, f = { v:'', lvl:'ok', why:[], sug:[], dia:'' };
    const t = parseTime(text);
    if (t.dia){ f.dia = t.dia; f.why.push('dializa ' + (t.dia === 'pop' ? 'popoldne' : 'dopoldne')); return f; }
    if (!text){ f.lvl = row.dia || row.mode === 'vzorci' ? 'ok' : 'chk'; if (f.lvl === 'chk') f.why.push('ure ni'); return f; }
    if (t.v == null){ f.v = row.layout === 'card' ? '' : text; f.lvl = 'bad'; f.why.push('ure ne razberem: vpiši s slike'); return f; }
    /* rokopis: slabo prebrane ure ne vpišemo, ponudimo jih le kot predlog (napačna ura je napaka v prevozu) */
    if (row.layout === 'card' && cell.conf < 60){ f.lvl = 'bad'; f.sug = [{ label:t.v, score:cell.conf / 100 }]; f.why.push(`ure ne preberem zanesljivo (${cell.conf} %): morda ${t.v}`); return f; }
    f.v = t.v; const h = +t.v.slice(0, 2), m = +t.v.slice(3);
    if (h < 5 || h > 21){ f.lvl = 'chk'; f.why.push('nenavadna ura'); }
    else if (cell.conf < 55){ f.lvl = 'chk'; f.why.push(`slaba razpoznava (${cell.conf} %)`); }
    else if (m % 5 !== 0){ f.lvl = 'chk'; f.why.push('nenavadne minute'); }
    return f;
  }

  /* ---------- Postavitev »kartice« (obrazec OBR REŠ 08) ----------
     Vsak prevoz je okvir s tremi vrsticami:  1: št. · IME PRIIMEK … Čas:   2: OD: … DO: …   3: Tel: … Način prevoza: …
     Tiskane oznake OCR bere bistveno bolje kot rokopis. Po oznaki »Način prevoza« (ena na prevoz) poiščemo okvirje (tudi na ukrivljeni in nagnjeni strani),
     vsakemu izračunamo lokalni naklon, razporedimo besede v polja in pripravimo ravno izrezan posnetek prevoza. */
  const labelOf = w => {
    const n = ocrNorm(w.t).replace(/ /g, ''); if (!n || n.length > 9) return null;
    if (n.length >= 5 && sim(n, 'prevoza') >= 0.7 && !/^prevoz(i|ov|ih|e)$/.test(n)) return 'prevoza';
    if (n.length >= 4 && sim(n, 'nacin') >= 0.78) return 'nacin';
    if (n.length <= 3){
      if (sim(n, 'tel') >= 0.66) return 'tel';
      if (sim(n, 'cas') >= 0.66) return 'cas';
      if (n.length === 2 && sim(n, 'od') >= 0.8) return 'od';
      if (n.length === 2 && sim(n, 'do') >= 0.8) return 'do';
    }
    return null;
  };
  const CARD_V = { top:-0.86, r2:-0.46, r3:-0.155, bot:0.14 };   // meje vrstic v enotah razmika med prevozi (0 = vrstica »Način prevoza«)
  function findCardAnchors(ws, box){
    const bw = box.x1 - box.x0, lab = [];
    ws.forEach(w => { if (cx(w) < box.x0 + bw * 0.3) return; const k = labelOf(w); if (k === 'prevoza' || k === 'nacin') lab.push({ w, k }); });
    if (lab.length < 3) return null;
    lab.sort((a, b) => cy(a.w) - cy(b.w));
    const lh = med(lab.map(l => l.w.y1 - l.w.y0)) || 20;
    const inst = [];
    lab.forEach(l => { const g = inst[inst.length - 1]; if (g && Math.abs(cy(l.w) - g.y) <= lh * 1.5){ g.items.push(l); g.y = g.items.reduce((s, i) => s + cy(i.w), 0) / g.items.length; } else inst.push({ y:cy(l.w), items:[l] }); });
    inst.forEach(g => { g.x0 = Math.min(...g.items.map(i => i.w.x0)); g.x1 = Math.max(...g.items.map(i => i.w.x1)); g.hasN = g.items.some(i => i.k === 'nacin'); const p = g.items.find(i => i.k === 'prevoza'); g.pre = p ? p.w.x0 : null; });
    if (inst.length < 3) return null;
    const gs = inst.slice(1).map((g, i) => g.y - inst[i].y).sort((a, b) => a - b), g0 = gs[Math.floor((gs.length - 1) * 0.25)];
    const P = med(gs.filter(g => g <= g0 * 1.35));
    if (!(P > lh * 2.5)) return null;
    /* osamelci na robu (npr. naslov »KNJIGA REŠEVALNIH PREVOZOV«) */
    const odd = g => g > P * 2.3 || (g > P * 1.35 && g < P * 1.75);   // razmik, ki ni niti en niti dva razmika med okvirji
    while (inst.length > 3 && odd(inst[1].y - inst[0].y)) inst.shift();
    while (inst.length > 3 && odd(inst[inst.length - 1].y - inst[inst.length - 2].y)) inst.pop();
    /* manjkajoče oznake: izpelji iz razmika */
    const cards = [inst[0]];
    for (let i = 1; i < inst.length; i++){
      const a = inst[i - 1], b = inst[i], k = Math.round((b.y - a.y) / P);
      if (k < 1) continue;
      for (let j = 1; j < k && j <= 3; j++) cards.push({ y:a.y + (b.y - a.y) * j / k, x0:a.x0 + (b.x0 - a.x0) * j / k, x1:a.x1 + (b.x1 - a.x1) * j / k, derived:true, items:[], hasN:a.hasN, pre:a.pre });
      cards.push(b);
    }
    if (cards.length < 3) return null;
    return { cards, lh, P };
  }
  /* telefonska številka: samo številke, običajno 9 */
  function judgePhone(cell){
    const f = { v:'', lvl:'ok', why:[], sug:[] };
    const raw = T_(cell.text).trim(); if (!raw) return f;
    const d = fixNum(raw).replace(/[^\d]/g, '');
    /* napačna številka je huda napaka (reševalec pokliče napačno osebo): predizpolnimo samo številko običajne oblike, ostalo pusti prazno */
    if (!/^0[1-9]\d{6,7}$/.test(d)){ f.lvl = 'bad'; f.why.push('telefona ne razberem: vpiši s slike'); return f; }
    const nice = d.length === 9 ? d.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3') : d.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1 $2 $3');
    if (cell.conf < 75){ f.lvl = 'bad'; f.sug = [{ label:nice, score:cell.conf / 100 }]; f.why.push(`številke ne preberem zanesljivo (${cell.conf} %): morda ${nice}`); return f; }
    f.v = nice; f.lvl = 'chk'; f.why.push('preveri številko s sliko');
    return f;
  }
  const inFrame = (c, w) => { const dx = cx(w) - c.xa; return (cy(w) - c.y - c.s * dx) / c.P; };
  function parseCards(ws, mh, box, W, H, out){
    const A = findCardAnchors(ws, box); if (!A) return null;
    const { cards, lh:L } = A, n = cards.length;
    cards.forEach((c, i) => { c.xa = (c.x0 + c.x1) / 2; c.P = A.P; });
    /* lokalni razmik (perspektiva): povprečje razmika do sosednjih okvirjev */
    cards.forEach((c, i) => { const a = cards[i - 1], b = cards[i + 1]; c.P = a && b ? (b.y - a.y) / 2 : a ? c.y - a.y : b ? b.y - c.y : A.P; c.s = 0; });
    const labs = ws.map(w => ({ w, k:labelOf(w) })).filter(x => x.k && x.k !== 'prevoza' && x.k !== 'nacin');
    const colRaw = med(cards.map(c => c.hasN ? c.x0 - 0.6 * L : (c.pre != null ? c.pre - 3.2 * L : null)).filter(v => v != null));
    const isLeft = x => x < colRaw - 2 * L;
    const pick = (k, left, py, px, maxDy, sFn) => { let b = null; labs.forEach(({ w, k:kk }) => { if (kk !== k || isLeft(cx(w)) !== left) return; const dy = cy(w) - (py + (sFn ? sFn * (cx(w) - px) : 0)); if (Math.abs(dy) <= maxDy && (!b || Math.abs(dy) < Math.abs(b.dy))) b = { w, dy }; }); return b && b.w; };
    /* naklon: tiskani oznaki v isti vrstici levo (Tel:) in desno (Način prevoza:); najprej po vsem listu, nato po okvirjih (list je lahko ukrivljen) */
    const mT = cards.map(c => { const t = pick('tel', true, c.y, c.xa, 0.6 * c.P, 0); return t && c.xa - cx(t) > L * 8 ? { t, s:(c.y - cy(t)) / (c.xa - cx(t)) } : null; });
    const sg = med(mT.filter(Boolean).map(m => m.s)) || 0;
    const mO = cards.map(c => { const d = pick('do', false, c.y - 0.31 * c.P, c.xa, 0.3 * c.P, sg); if (!d) return null; const o = pick('od', true, cy(d), cx(d), 0.3 * c.P, sg); return o && cx(d) - cx(o) > L * 8 ? { d, o, s:(cy(d) - cy(o)) / (cx(d) - cx(o)) } : null; });
    const meas = cards.map((c, i) => { const e = [mT[i], mO[i]].filter(Boolean).map(m => m.s); return e.length ? e.reduce((x, y) => x + y, 0) / e.length : null; });
    /* naklon se po listu spreminja (ukrivljena stran, perspektiva): izmerjeno vrednost obdržimo, osamelce zavrnemo, vrzeli interpoliramo */
    const have = meas.map((v, i) => v != null ? i : -1).filter(i => i >= 0), ok = meas.map((v, i) => {
      if (v == null) return null;
      const others = have.filter(j => j !== i).sort((x, y) => Math.abs(x - i) - Math.abs(y - i)).slice(0, 2).map(j => meas[j]);
      return others.length >= 2 && Math.abs(v - med(others)) > 0.07 ? null : v; });
    cards.forEach((c, i) => {
      let v = ok[i];
      if (v == null){ let lo = -1, hi = -1; for (let j = i - 1; j >= 0; j--) if (ok[j] != null){ lo = j; break; } for (let j = i + 1; j < n; j++) if (ok[j] != null){ hi = j; break; }
        v = lo >= 0 && hi >= 0 ? ok[lo] + (ok[hi] - ok[lo]) * (i - lo) / (hi - lo) : lo >= 0 ? ok[lo] : hi >= 0 ? ok[hi] : sg; }
      c.s = Math.max(-0.2, Math.min(0.2, v));
    });
    /* oznake po okvirjih (z lokalnim naklonom) */
    const EXP = { tel:0, od:-0.31, do:-0.31, cas:-0.62 };
    cards.forEach(c => {
      c.lab = {};
      ['tel', 'od', 'do', 'cas'].forEach(k => {
        const left = k === 'tel' || k === 'od'; let best = null;
        labs.forEach(({ w, k:kk }) => { if (kk !== k || isLeft(cx(w)) !== left) return; const v = inFrame(c, w), d = Math.abs(v - EXP[k]); if (d <= 0.22 && (!best || d < best.d)) best = { w, d }; });
        if (best) c.lab[k] = best.w;
      });
    });
    /* stolpci: začetek desnega stolpca (DO:), levi rob polj (OD:, Tel:), Čas: */
    const col = cards.map(c => c.lab.do ? c.lab.do.x0 - 0.3 * L : colRaw), colM = med(col);
    cards.forEach((c, i) => { c.col = Math.abs(col[i] - colM) <= 2.5 * L ? col[i] : colM; });
    const leftX = [], casOff = [];
    cards.forEach(c => { if (c.lab.od) leftX.push(c.lab.od.x0); if (c.lab.tel) leftX.push(c.lab.tel.x0); if (c.lab.cas) casOff.push(c.lab.cas.x0 - c.col); });
    const odX = (leftX.length ? Math.min(med(leftX), ...leftX.filter(v => v <= med(leftX) + L)) : box.x0 + (colM - box.x0) * 0.3) - 0.3 * L;
    const offC = casOff.length ? med(casOff) : 0.75 * (colM - odX + 4 * L);
    cards.forEach(c => { c.cas = c.lab.cas ? c.lab.cas.x0 : c.col + offC; c.casEnd = c.lab.cas ? c.lab.cas.x1 : c.cas + 2.6 * L; c.right = Math.min(W, c.casEnd + 5 * L); });
    const right = Math.min(W, Math.max(...cards.map(c => c.right)));
    /* besede v okvirje */
    const body = ws.filter(w => !(labelOf(w) === 'prevoza' || labelOf(w) === 'nacin') || true);
    const cw = cards.map(() => []), upper = [];
    body.forEach(w => {
      let k = -1;
      for (let i = 0; i < n; i++){ const v = inFrame(cards[i], w); if (v >= CARD_V.top && v < CARD_V.bot){ k = i; break; } }
      if (k < 0){ if (inFrame(cards[0], w) < CARD_V.top) upper.push(w); return; }
      cw[k].push({ w, v:inFrame(cards[k], w) });
    });
    /* številke polj: levo od oznak, v 1. vrstici */
    const numTok = cards.map((c, i) => cw[i].filter(({ w, v }) => v < CARD_V.r2 && cx(w) < odX + 0.2 * L && isNumTok(w.t) && numVal(w.t) >= 1 && numVal(w.t) <= 60).sort((a, b) => b.w.c - a.w.c)[0] || null);
    const votes = {}; numTok.forEach((t, i) => { if (t){ const d = numVal(t.w.t) - i; votes[d] = (votes[d] || 0) + 1; } });
    let d0 = null, vb = 0; Object.entries(votes).forEach(([d, v]) => { if (v > vb){ vb = v; d0 = +d; } });
    const hasDatum = upper.some(w => sim(ocrNorm(w.t), 'datum') >= 0.7);
    let nrGuess = false;
    if (d0 == null || (vb < 2 && n >= 5)){ d0 = hasDatum ? 1 : 11; nrGuess = true; }
    else if (d0 + 0 < 1 - 0) { d0 = 1; nrGuess = true; }
    out.layout = 'card'; out.header = false;
    out.cards = n; out.dbg = { y:cards.map(c => Math.round(c.y) + (c.derived ? 'd' : '')), s:cards.map(c => +c.s.toFixed(3)), sg:+sg.toFixed(3), m:meas.map(v => v == null ? null : +v.toFixed(3)), mT:mT.map(m => m ? +m.s.toFixed(3) : null), mO:mO.map(m => m ? +m.s.toFixed(3) : null), nums:numTok.map(t => t ? t.w.t : null), votes, d0, L:Math.round(L), col:Math.round(colM), odX:Math.round(odX) };
    if (nrGuess) out.notes.push(`Številk polj na strani ni mogoče prebrati: prevozi so oštevilčeni od ${d0} naprej. Preveri številke.`);
    /* polja */
    const rows = cards.map((c, i) => {
      const cell = { name:[], from:[], to:[], phone:[], mode:[], time:[], margin:[] };
      const colL = c.col - 0.5 * L;
      const sorted = cw[i].slice().sort((a, b) => a.w.x0 - b.w.x0);
      const drop = {};   // prva oznaka v polju je tiskana oznaka, ne rokopis
      sorted.forEach(({ w, v }) => {
        const x = cx(w), kind = labelOf(w), left = x < colL;
        const row = v < CARD_V.r2 ? 1 : v < CARD_V.r3 ? 2 : 3;
        if (x < odX + 0.2 * L){ if (row === 1 && !(isNumTok(w.t))) { /* kljukica ali pobrana ura v robu: ne gre v polja */ } cell.margin.push(w); return; }
        if (row === 1){
          if (x >= c.cas - 0.5 * L){ if (kind === 'cas' && !drop.cas){ drop.cas = 1; return; } const t = fixNum(w.t); if (/\d/.test(t) || /^(dop|pop)\.?$/i.test(w.t)) cell.time.push(w); return; }
          if (isNumTok(w.t) && x < odX + 3 * L) return;   // številka polja ali kljukica ob njej
          cell.name.push(w); return;
        }
        if (row === 2){
          if (left){ if (kind === 'od' && !drop.od && x < odX + 4 * L){ drop.od = 1; return; } cell.from.push(w); }
          else { if (kind === 'do' && !drop.do && x < c.col + 4 * L){ drop.do = 1; return; } cell.to.push(w); }
          return;
        }
        if (left){ if (kind === 'tel' && !drop.tel && x < odX + 4 * L){ drop.tel = 1; return; } cell.phone.push(w); }
        else { if ((kind === 'nacin' || kind === 'prevoza') && x < c.x1 + 0.5 * L) return; cell.mode.push(w); }
      });
      return cell;
    });
    /* datum: besede nad prvim okvirjem */
    try {
      const up = upper.slice().sort((a, b) => cy(a) - cy(b) || a.x0 - b.x0), txt = up.map(w => w.t).join(' '), dd = NSCAN.dates(NSCAN.fixDigits(txt)).find(x => x.y >= 2000 && x.y <= 2100);
      if (dd) out.date = { iso:dd.iso, conf:Math.round(med(up.map(w => w.c))) };
    } catch (e) { /* brez datuma */ }
    const res = [];
    cards.forEach((c, i) => {
      const cl = rows[i], co = k => cl[k].length ? cellOf(cl[k]) : { text:'', conf:0, min:0, n:0, ws:[] };
      const cc = { name:co('name'), from:co('from'), to:co('to'), time:co('time'), phone:co('phone'), note:co('mode'), pick:co('margin') };
      const nr = d0 + i, rd = numTok[i] && numVal(numTok[i].w.t) === nr;
      const geo = { xa:c.xa, y:c.y, s:c.s, P:c.P, col:c.col, odX, cas:c.cas, casEnd:c.casEnd, x0:Math.max(0, odX - 5 * L), x1:right, L, pre:c.x1, derived:!!c.derived };
      const row = { nr, derived:false, y0:c.y - 0.9 * c.P, y1:c.y + 0.14 * c.P, geo, layout:'card', ctext:cellOf(cl.margin.concat(cl.name, cl.from, cl.to, cl.phone, cl.mode, cl.time)).text };
      res.push({ row, cc, nrLvl:nrGuess ? (hasDatum || i > 0 ? 'ok' : 'chk') : 'ok', words:cw[i].length, hw:['name', 'from', 'to', 'phone', 'mode', 'time'].reduce((a, k) => a + cl[k].length, 0) });
    });
    out.tbl = { x0:Math.max(0, odX - 5 * L), x1:right, y0:cards[0].y - 0.9 * cards[0].P, y1:cards[n - 1].y + 0.14 * cards[n - 1].P };
    out.cols = [];
    return res;
  }

  /* ---------- Ocena celotne vrstice (skupno za tabelo in kartice) ---------- */
  const EMPTYC = { text:'', conf:0, min:0, n:0, ws:[] };
  const junkText = t => { const s = T_(t).replace(/\s+/g, ''); if (!s) return false; const l = (s.match(/\p{L}/gu) || []).length; return l < 3 || l / s.length < 0.6; };
  const ROW_KEYS = ['name', 'from', 'to', 'time', 'note', 'phone', 'mode'];
  function judgeRow(row, c, out, card){
    c.phone = c.phone || EMPTYC;
    /* v stolpcu ure je lahko še kaj (npr. »10.30 leže« pri redkem stolpcu opomb): ura ostane, ostalo gre v opombo */
    if (!card && c.time.n > 1){
      const ti = c.time.ws.findIndex(w => timeLike(w.t));
      if (ti >= 0){ const rest2 = c.time.ws.filter((_, i) => i !== ti); c.time = cellOf([c.time.ws[ti]]); c.note = cellOf([...(c.note.ws || []), ...rest2]); }
    }
    /* način prevoza (leže, utila, vzorci) kjerkoli v vrstici (pri karticah: samo v polju »Način prevoza«) */
    let mode = '';
    (card ? ['note'] : ['name', 'from', 'to', 'note']).forEach(k => { const m = modeIn(c[k].text); if (m.mode && !mode){ mode = m.mode; if (k === 'note' || k === 'to') c[k] = Object.assign({}, c[k], { text:m.rest }); } });
    row.mode = mode; row.dia = '';
    if (/dializ/i.test(c.to.text + ' ' + c.note.text)) row.dia = row.dia || 'pop';   // dializa: ure ni nujno, izbira dop/pop ostane dispečerju
    const tj = judgeTime(c.time, row); row.dia = tj.dia || '';
    if (/dializ/i.test(c.to.text + ' ' + c.note.text) && !tj.v && !tj.dia) { tj.lvl = 'ok'; tj.why = ['dializa: ura po urniku skupine']; }
    const nj = judgeName(c.name, row), fj = judgePlace(c.from, 'from', row), dj = judgePlace(c.to, 'to', row), pj = judgePhone(c.phone);
    let noteTxt = c.note.text;
    const notej = { v:noteTxt, lvl:'ok', why:[], sug:[] };
    if (card && noteTxt && junkText(noteTxt)){ noteTxt = ''; notej.v = ''; }
    if (noteTxt && (card || c.note.conf < 45)){ notej.lvl = 'chk'; notej.why.push(card ? 'opomba ob načinu prevoza: preveri s sliko' : `opomba slabo berljiva (${c.note.conf} %)`); }
    const mj = { v:mode, lvl:'ok', why:[], sug:[] };
    if (card && !mode){ mj.lvl = 'chk'; mj.why.push(c.note.text && !junkText(c.note.text) ? 'načina prevoza ne prepoznam (sede, leže, utila): preveri' : 'načina prevoza ni mogoče prebrati: privzeto sede, preveri'); }
    row.f = { name:nj.v, from:fj.v, to:dj.v, time:tj.v, mode, dia:tj.dia, note:noteTxt, pid:nj.pid, phone:pj.v };
    row.fl = { name:nj, from:fj, to:dj, time:tj, note:notej, phone:pj, mode:mj };
    row.raw = { name:c.name.text, from:c.from.text, to:c.to.text, time:c.time.text, note:c.note.text, phone:c.phone.text };
    row.conf = { name:c.name.conf, from:c.from.conf, to:c.to.conf, time:c.time.conf, note:c.note.conf, phone:c.phone.conf };
    let lvl = 'ok'; ROW_KEYS.forEach(k => { lvl = worst(lvl, row.fl[k].lvl); }); lvl = worst(lvl, row.nrLvl === 'bad' ? 'chk' : 'ok');
    row.lvl = lvl;
    /* razlog vrstice za pregled */
    row.todo = ROW_KEYS.filter(k => row.fl[k].lvl !== 'ok');
    return row;
  }

  /* ---------- Glavni razčlenjevalec ---------- */
  function parse(words, W, H, opt = {}){
    const ws = cleanWords(words);
    const out = { rows:[], date:null, header:false, cols:[], stats:{ ok:0, chk:0, bad:0, empty:0 }, notes:[], words:ws.length };
    if (ws.length < 4){ out.notes.push('Na sliki skoraj ni prebranega besedila.'); return out; }
    const mh = Math.max(6, med(ws.map(w => w.y1 - w.y0)));
    const box = { x0:Math.min(...ws.map(w => w.x0)), y0:Math.min(...ws.map(w => w.y0)), x1:Math.max(...ws.map(w => w.x1)), y1:Math.max(...ws.map(w => w.y1)) };
    out.layout = 'table'; out.cols = out.cols || [];
    const cardRes = parseCards(ws, mh, box, W, H, out);
    if (cardRes){
      cardRes.forEach(({ row, cc, nrLvl, words, hw }) => {
        Object.assign(row, { text:row.ctext, raw:{}, f:{}, fl:{}, lvl:'ok', empty:false, nrLvl, words, touched:{} });
        judgeRow(row, cc, out, true);
        if (!hw){ row.empty = true; out.stats.empty++; } else out.stats[row.lvl]++;
        out.rows.push(row);
      });
      return out;
    }
    const head = findHeader(ws, mh); out.header = !!head;
    let rows = findRows(ws, mh, head, box), numbered = rows.length >= 2;
    if (numbered) rows = fillRows(rows);
    else { rows = lineRows(ws, mh, head ? head.y1 : box.y0); out.notes.push('Številk polj (1–24) ni prepoznati: vrstice so ugotovljene po vrstah besedila, preveri številke.'); }
    if (!rows.length){ out.notes.push('Vrstic prevozov ni mogoče ugotoviti.'); return out; }
    /* meje vrstic */
    const pitch = rows.length > 1 ? med(rows.slice(1).map((r, i) => r.y - rows[i].y)) : mh * 2.5;
    /* meja vrstice: pri oštevilčenih poljih tik nad številko naslednjega polja (številka je v zgornjem delu polja, daljše besedilo se lahko prelomi v več vrstic);
       brez številk: sredina med vrsticami besedila */
    const topOf = r => r.w ? r.w.y0 - mh * 0.9 : r.y - mh * 1.4;
    rows.forEach((r, i) => {
      if (numbered){ r.y0 = topOf(r); r.y1 = i < rows.length - 1 ? topOf(rows[i + 1]) : r.y + pitch * 2.2; }
      else { r.y0 = i ? (rows[i - 1].y + r.y) / 2 : r.y - pitch * 0.55; r.y1 = i < rows.length - 1 ? (r.y + rows[i + 1].y) / 2 : r.y + pitch * 0.55; }
    });
    const top = head ? head.y1 : rows[0].y0;
    const body = ws.filter(w => w.y0 >= top - 1);
    rows.forEach(r => { r.ws = body.filter(w => cy(w) >= r.y0 && cy(w) < r.y1); });
    /* datum strani: besede nad prvo vrstico */
    try {
      const upper = ws.filter(w => cy(w) < (head ? head.y : rows[0].y0)).sort((a, b) => cy(a) - cy(b) || a.x0 - b.x0);
      const txt = upper.map(w => w.t).join(' '), d = NSCAN.dates(NSCAN.fixDigits(txt)).find(x => x.y >= 2000 && x.y <= 2100);
      if (d) out.date = { iso:d.iso, conf:Math.round(med(upper.map(w => w.c))) };
    } catch (e) { /* brez datuma */ }
    /* stolpci */
    const keyOrder = ['name', 'from', 'to', 'time', 'note'];
    let cols = null;
    const numX = med(rows.filter(r => r.w).map(r => r.w.x0));
    if (head){
      cols = head.cols.map(c => ({ key:c.key, x0:c.x0 }));
      if (!cols.some(c => c.key === 'nr')) cols.unshift({ key:'nr', x0:Math.min(numX || box.x0, box.x0) });
      const edges = startClusters(rows.map(r => r.ws), mh, rows.length);
      cols = repairCols(cols, edges, mh);
      /* glavo OCR pogosto razbere slabše kot vrstice: levi rob stolpca se prilagodi najbližjemu robu, kjer res začenjajo besede */
      cols.forEach(c => {
        if (c.key === 'nr') return;
        /* OCR glave pogosto izgubi prvo besedo večbesedne oznake (»IME IN PRIIMEK«): rob je zato običajno levo od zaznanega sidra */
        const near = edges.filter(e => e >= c.x0 - mh * 4.5 && e <= c.x0 + mh * 2 && cols.every(k => k === c || Math.abs(k.x0 - e) > mh * 1.8)).sort((a, b) => Math.abs(a - c.x0) - Math.abs(b - c.x0))[0];
        if (near != null) c.x0 = near;
      });
      cols.sort((a, b) => a.x0 - b.x0);
    } else {
      const edges = startClusters(rows.map(r => r.ws), mh, rows.length);
      if (edges.length >= 3 && edges.length <= 10){
        cols = edges.map((x0, i) => ({ key:'c' + i, x0 }));
        /* prvi stolpec so številke polj, če so prisotne */
        if (numbered && Math.abs(cols[0].x0 - numX) < mh * 2) cols[0].key = 'nr'; else if (numbered) cols.unshift({ key:'nr', x0:numX });
        else cols.unshift({ key:'nr', x0:Math.min(...cols.map(c => c.x0)) - mh * 3 });
        const rest = cols.filter(c => c.key !== 'nr');
        /* stolpec ure = stolpec z največ časovnimi zapisi */
        const share = c => { const i = cols.indexOf(c), nx = cols[i + 1] ? cols[i + 1].x0 : Infinity; let t = 0, n = 0; rows.forEach(r => { const cw = r.ws.filter(w => w.x0 >= c.x0 - mh * 0.6 && w.x0 < nx - mh * 0.6); if (cw.length){ n++; if (timeLike(cellOf(cw).text)) t++; } }); return n ? t / n : 0; };
        const tc = rest.map(c => ({ c, s:share(c) })).sort((a, b) => b.s - a.s)[0];
        const timeCol = tc && tc.s >= 0.4 ? tc.c : null;
        const before = timeCol ? rest.slice(0, rest.indexOf(timeCol)) : rest.slice(0, 3), after = timeCol ? rest.slice(rest.indexOf(timeCol) + 1) : rest.slice(3);
        before.forEach((c, i) => { c.key = before.length >= 3 ? ['name', 'from', 'to'][Math.min(i, 2)] : before.length === 2 ? ['name', 'to'][i] : 'name'; if (before.length >= 3 && i > 2) c.key = 'note'; });
        if (timeCol) timeCol.key = 'time';
        after.forEach(c => { c.key = 'note'; });
        if (before.length === 2){ /* OD ali DO? po vsebini */
          const c = before[1], i = cols.indexOf(c), nx = cols[i + 1] ? cols[i + 1].x0 : Infinity; let poi = 0, n = 0;
          rows.forEach(r => { const cw = r.ws.filter(w => w.x0 >= c.x0 - mh * 0.6 && w.x0 < nx - mh * 0.6); if (cw.length){ n++; try { if (geo(cellOf(cw).text).kind === 'poi') poi++; } catch (e) { /* */ } } });
          c.key = n && poi / n >= 0.5 ? 'to' : 'from';
        }
      } else out.notes.push('Stolpcev tabele ni mogoče zanesljivo ugotoviti: besedilo vrstice je razdeljeno po presledkih, preveri vsako polje.');
    }
    out.cols = cols ? cols.map(c => ({ key:c.key, x0:Math.round(c.x0) })) : [];
    const tol = mh * 1.1;
    const colOf = w => { let k = 0; for (let i = 0; i < cols.length; i++) if (cols[i].x0 <= w.x0 + tol) k = i; return k; };
    rows.forEach(r => {
      const cells = {}; let rest = [];
      if (cols){ r.ws.forEach(w => { const c = cols[colOf(w)]; (cells[c.key] = cells[c.key] || []).push(w); }); }
      else rest = r.ws;
      const row = { nr:r.nr, derived:r.derived, y0:r.y0, y1:r.y1, text:cellOf(r.ws).text, raw:{}, f:{ name:'', from:'', to:'', time:'', mode:'', dia:'', note:'', pid:'', phone:'' }, fl:{}, lvl:'ok', empty:false };
      /* številka polja */
      const nrCells = cells.nr ? cellOf(cells.nr) : { text:'', conf:0 };
      if (r.nr == null){ const v = numVal(nrCells.text); row.nr = v && v < 61 ? v : null; }
      const content = Object.keys(cells).filter(k => k !== 'nr' && cells[k].length);
      if (!content.length && cols){ row.empty = true; out.stats.empty++; out.rows.push(row); return; }
      const c = {}; ['name', 'from', 'to', 'time', 'note', 'pick', 'veh'].forEach(k => { c[k] = cells[k] ? cellOf(cells[k]) : { text:'', conf:0, min:0, n:0, ws:[] }; });
      Object.keys(cells).forEach(k => { if (/^c\d+$/.test(k)) c.note = cellOf([...(cells.note || []), ...cells[k]]); });
      if (!cols){ c.name = cellOf(rest); }
      row.nrLvl = r.derived ? 'chk' : (nrCells.conf && nrCells.conf < 50 ? 'chk' : 'ok');
      if (row.nr == null) row.nrLvl = 'bad';
      judgeRow(row, c, out, false); out.stats[row.lvl]++; out.rows.push(row);
    });
    /* podvojene številke */
    const cnt = {}; out.rows.forEach(r => { if (r.nr != null && !r.empty) cnt[r.nr] = (cnt[r.nr] || 0) + 1; });
    out.rows.forEach(r => { if (r.nr != null && cnt[r.nr] > 1){ r.dupNr = true; if (r.lvl === 'ok'){ r.lvl = 'chk'; out.stats.ok--; out.stats.chk++; } } });
    out.tbl = { x0:box.x0, x1:box.x1, y0:top, y1:box.y1 };
    return out;
  }

  /* ---------- TSV (Tesseract) → besede ---------- */
  function tsvWords(tsv){
    const out = [];
    String(tsv || '').split(/\r?\n/).forEach(l => { const c = l.split('\t'); if (c.length < 12 || c[0] !== '5') return; const x = +c[6], y = +c[7], w = +c[8], h = +c[9]; out.push({ text:c.slice(11).join('\t'), confidence:+c[10], bbox:{ x0:x, y0:y, x1:x + w, y1:y + h } }); });
    return out;
  }
  const fromOcr = r => (r && r.words && r.words.length) ? r.words : tsvWords(r && r.tsv);

  /* ---------- Priprava fotografije (samo v brskalniku): zasuk, kontrast, izrezi ---------- */
  const MAX_SIDE = 2200, MAX_PAGES = 6, INK_BLANK = 0.03, INK_MAYBE = 0.10, BLANK_WORDS = 9;   /* 2200 px zadošča za tiskano mrežo in rokopis; večja slika razpoznavo samo upočasni */
  const tick = () => new Promise(r => setTimeout(r, 0));   /* umik zaslonu: telefon med težko obdelavo ne sme zamrzniti prikaza */
  const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  /* naklon vrstic v stopinjah (+ = vrstice se spuščajo proti desni): največja ostrina projekcije temnih točk na navpično os */
  function skewAngle(cv){
    const k = Math.min(1, 700 / Math.max(cv.width, cv.height)), c = cv2(cv.width * k, cv.height * k), w = c.width, h = c.height;
    const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(cv, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h); let sum = 0;
    for (let i = 0; i < w * h; i++){ g[i] = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0; sum += g[i]; }
    const thr = sum / (w * h) * 0.82, pts = [];
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (g[yy * w + xx] < thr) pts.push(xx, yy);
    if (pts.length < 300) return 0;
    const score = a => {
      const r = a * Math.PI / 180, s = Math.sin(r), co = Math.cos(r), off = Math.ceil(Math.abs(s) * w) + 2, bins = new Float32Array(h + off * 2 + 4);
      for (let i = 0; i < pts.length; i += 2) bins[Math.round(pts[i + 1] * co - pts[i] * s + off)]++;
      let sc = 0; for (let j = 1; j < bins.length; j++){ const df = bins[j] - bins[j - 1]; sc += df * df; } return sc;
    };
    let best = 0, bs = -1;
    for (let a = -10; a <= 10.001; a += 0.5){ const sc = score(a); if (sc > bs){ bs = sc; best = a; } }
    const c0 = best; for (let a = c0 - 0.5; a <= c0 + 0.501; a += 0.1){ const sc = score(a); if (sc > bs){ bs = sc; best = a; } }
    return Math.round(best * 10) / 10;
  }
  function rotated(cv, deg){
    if (Math.abs(deg) < 0.3) return cv;
    const r = -deg * Math.PI / 180, s = Math.abs(Math.sin(r)), co = Math.abs(Math.cos(r)), w = cv.width * co + cv.height * s, h = cv.width * s + cv.height * co, c = cv2(w, h), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(r); x.drawImage(cv, -cv.width / 2, -cv.height / 2);
    return c;
  }
  /* krajevni prag (svetloba po strani ni enakomerna: senca ob hrbtu knjige) → črno-bela slika za OCR */
  function binarize(cv){
    const w = cv.width, h = cv.height, x = cv.getContext('2d', { willReadFrequently:true }), im = x.getImageData(0, 0, w, h), d = im.data, n = w * h, g = new Uint8Array(n);
    for (let i = 0; i < n; i++) g[i] = (d[i * 4] * 30 + d[i * 4 + 1] * 59 + d[i * 4 + 2] * 11) / 100 | 0;
    const W1 = w + 1, I = new Uint32Array(W1 * (h + 1));
    for (let yy = 0; yy < h; yy++){ let row = 0; for (let xx = 0; xx < w; xx++){ row += g[yy * w + xx]; I[(yy + 1) * W1 + xx + 1] = I[yy * W1 + xx + 1] + row; } }
    const r = Math.max(8, Math.round(Math.min(w, h) / 45));
    for (let yy = 0; yy < h; yy++){
      const y0 = Math.max(0, yy - r), y1 = Math.min(h, yy + r + 1);
      for (let xx = 0; xx < w; xx++){
        const x0 = Math.max(0, xx - r), x1 = Math.min(w, xx + r + 1), cnt = (x1 - x0) * (y1 - y0);
        const m = (I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0]) / cnt, v = g[yy * w + xx] < m * 0.9 && g[yy * w + xx] < 215 ? 0 : 255;
        const o = (yy * w + xx) * 4; d[o] = d[o + 1] = d[o + 2] = v;
      }
    }
    /* črte tabele (dolge vodoravne in navpične črne proge) zbrišemo: motijo členitev strani pri razpoznavi */
    const bl = new Uint8Array(n); for (let i = 0; i < n; i++) bl[i] = d[i * 4] === 0 ? 1 : 0;
    const Lh = Math.max(40, Math.round(w * 0.035)), Lv = Math.max(40, Math.round(h * 0.02)), kill = new Uint8Array(n);
    for (let yy = 0; yy < h; yy++){ let st = -1; for (let xx = 0; xx <= w; xx++){ const on = xx < w && bl[yy * w + xx]; if (on && st < 0) st = xx; else if (!on && st >= 0){ if (xx - st >= Lh) for (let k = st; k < xx; k++) kill[yy * w + k] = 1; st = -1; } } }
    for (let xx = 0; xx < w; xx++){ let st = -1; for (let yy = 0; yy <= h; yy++){ const on = yy < h && bl[yy * w + xx]; if (on && st < 0) st = yy; else if (!on && st >= 0){ if (yy - st >= Lv) for (let k = st; k < yy; k++) kill[k * w + xx] = 1; st = -1; } } }
    for (let i = 0; i < n; i++) if (kill[i]){ const o = i * 4; d[o] = d[o + 1] = d[o + 2] = 255; }
    const c = cv2(w, h); c.getContext('2d').putImageData(im, 0, 0); return c;
  }
  /* datoteka → platna strani (PDF: vse strani s sliko, največ 6) */
  async function loadPages(file){
    const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '');
    if (!isPdf) return [await NSCAN.toCanvas({ kind:'blob', blob:file }, MAX_SIDE)];
    const imgs = await NSCAN.pdfImages(await file.arrayBuffer());
    if (!imgs.length) throw new Error('V tem PDF ni slike strani. Naredi fotografijo strani knjige ali izvozi stran kot sliko.');
    const out = []; for (const im of imgs.slice(0, MAX_PAGES)) out.push(await NSCAN.toCanvas(im, MAX_SIDE)); return out;
  }
  async function preparePage(cv){
    await tick(); const angle = skewAngle(cv);
    await tick(); const color = rotated(cv, angle);
    await tick(); const bw = binarize(color);
    await tick(); return { color, angle, bw, png:await NSCAN.toBlob(bw) };
  }
  /* izrez vrstice iz fotografije (za primerjavo prebranega z originalom) */
  function cropRow(color, row, tbl, pitch){
    const padY = Math.max(4, pitch * 0.12), x0 = Math.max(0, tbl.x0 - 12), x1 = Math.min(color.width, tbl.x1 + 12), y0 = Math.max(0, row.y0 - padY), y1 = Math.min(color.height, row.y1 + padY);
    const w = x1 - x0, h = y1 - y0; if (w < 10 || h < 6) return '';
    const k = Math.min(1, 1000 / w), c = cv2(w * k, h * k); c.getContext('2d').drawImage(color, x0, y0, w, h, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
  }
  /* izrez prevoza (kartice): zasukan po lokalnem naklonu okvirja, da so vrstice vodoravne */
  function cropCard(color, g){
    const top = -1.0, bot = 0.3, w = g.x1 - g.x0, h = (bot - top) * g.P;
    if (!(w > 20 && h > 10)) return '';
    const k = Math.min(1, 1000 / w), th = Math.atan(g.s), co = Math.cos(th), si = Math.sin(th);
    const ox = g.x0 - si * top * g.P, oy = g.y + g.s * (g.x0 - g.xa) + co * top * g.P;
    const c = cv2(w * k, h * k), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.setTransform(k * co, -k * si, k * si, k * co, -k * (co * ox + si * oy), k * (si * ox - co * oy));
    x.drawImage(color, 0, 0);
    try { return c.toDataURL('image/jpeg', 0.75); } catch (e) { return ''; }
  }
  /* gostota črnila (črne točke) v poljih za rokopis: prazna kartica ima skoraj nič; ločuje prazen okvir od nerazločnega rokopisa */
  function inkOf(bw, g){
    const w = bw.width, h = bw.height; if (!bw._d) bw._d = bw.getContext('2d', { willReadFrequently:true }).getImageData(0, 0, w, h).data;
    const d = bw._d, L = g.L;
    const Z = [[g.odX + 0.5 * L, g.cas - 0.5 * L, -0.84, -0.5], [g.odX + 2.6 * L, g.col - 0.4 * L, -0.44, -0.19], [g.col + 2.8 * L, g.x1 - 0.5 * L, -0.44, -0.19], [g.odX + 2.8 * L, g.col - 0.4 * L, -0.135, 0.1], [g.pre + 0.6 * L, g.x1 - 0.5 * L, -0.135, 0.1]];
    let best = 0;
    Z.forEach(([u0, u1, v0, v1]) => {
      let dark = 0, tot = 0;
      for (let u = u0; u < u1; u += 2){ const base = g.y + g.s * (u - g.xa), xi = Math.round(u); if (xi < 0 || xi >= w) continue;
        for (let v = v0; v < v1; v += 2 / g.P){ const yi = Math.round(base + v * g.P); if (yi < 0 || yi >= h) continue; tot++; if (d[(yi * w + xi) * 4] < 128) dark++; } }
      if (tot > 50) best = Math.max(best, dark / tot);
    });
    return best;
  }
  /* kartica brez rokopisa je prazna; nejasna kartica se nikoli ne preskoči tiho: prazne se v pregledu pokažejo na koncu (z izrezom) in jih je mogoče vnesti */
  function markCard(row, prep){
    row.ink = inkOf(prep.bw, row.geo);
    const blank = row.ink < INK_BLANK || ((row.words || 0) <= BLANK_WORDS && row.ink < INK_MAYBE);
    if (!blank && row.empty){ row.empty = false; row.fl.name = Object.assign({}, row.fl.name, { lvl:'bad', why:['rokopis je na sliki, a ga ne razberem: vpiši s slike'] }); row.lvl = worst(row.lvl, 'bad'); row.todo = ROW_KEYS.filter(k => row.fl[k].lvl !== 'ok'); }
    if (blank){ row.empty = true; row.blank = true; }
    row.crop = cropCard(prep.color, row.geo);
  }
  /* pomanjšana fotografija strani (JPEG): ostane na voljo tudi, če razpoznava odpove, da lahko prevoze vneseš ročno ob sliki */
  function photoUrl(cv){
    const k = Math.min(1, 1400 / Math.max(cv.width, cv.height)), c = cv2(cv.width * k, cv.height * k); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; }
  }
  const hooks = { onPhoto:null };
  const canceledErr = () => { const e = new Error('Razpoznava je bila prekinjena.'); e.canceled = true; return e; };
  /* vnaprejšnji zagon razpoznave (prenos jedra in modela) med tem, ko uporabnik izbira fotografijo */
  const warm = onProgress => NSCAN.ocrEnabled() ? NSCAN.ocrSession().warm(onProgress) : Promise.resolve();
  const cancel = ctl => { if (ctl) ctl.cancelled = true; NSCAN.ocrAbort(); };
  /* cel postopek za eno ali več slik/PDF: vrne vrstice vseh strani (slika se ne shrani nikamor). ctl = { cancelled } omogoča prekinitev. */
  async function run(files, onProgress, ctl){
    const cfg = NSCAN.ocrCfg(), pages = [], ctlr = ctl || {}; let n = 0;
    const say = (stage, i, np, pct) => { if (onProgress) onProgress({ stage, page:i + 1, pages:np, pct:pct || 0, label:(np > 1 ? `Stran ${i + 1}/${np}: ` : '') + NSCAN.stageLabel(stage) }); };
    const chk = () => { if (ctlr.cancelled) throw canceledErr(); };
    if (onProgress) onProgress({ stage:'prep', page:1, pages:1, pct:0, label:'berem fotografijo' });
    for (const f of files){ await tick(); for (const cv of await loadPages(f)){ if (n++ >= MAX_PAGES) break; pages.push(cv); } }
    chk();
    const res = { pages:[], rows:[], date:null, notes:[], words:0, photos:[] };
    pages.forEach((cv, i) => { const u = photoUrl(cv); res.photos.push(u); if (hooks.onPhoto) hooks.onPhoto(i, u, pages.length); });
    for (let i = 0; i < pages.length; i++){
      const tag = pages.length > 1 ? `Stran ${i + 1}/${pages.length}: ` : '';
      chk(); say('prep', i, pages.length, 0);
      const prep = await preparePage(pages[i]); chk();
      const ocrPsm = async psm => { try { return await NSCAN.ocr(prep.png, p => { say(p.stage, i, pages.length, p.pct); }, cfg, { words:true, psm }); } catch (e) { if (ctlr.cancelled) throw canceledErr(); throw e; } };
      /* redko besedilo (psm 11) najde kartice tudi na ukrivljeni in nagnjeni strani; če stran ni v obliki kartic (tabela), se prebere še enkrat s členitvijo po stolpcih (psm 4). config.js → ocr.bookPsm vse to preglasi. */
      let r = await ocrPsm(cfg.bookPsm || '11'); chk();
      let words = fromOcr(r), ps = parse(words, prep.color.width, prep.color.height);
      if (!cfg.bookPsm && ps.layout !== 'card'){ r = await ocrPsm('4'); chk(); words = fromOcr(r); ps = parse(words, prep.color.width, prep.color.height); }
      say('prep', i, pages.length, 1); await tick();
      const pitch = ps.rows.length > 1 ? med(ps.rows.slice(1).map((x, j) => (x.y0 + x.y1) / 2 - (ps.rows[j].y0 + ps.rows[j].y1) / 2)) : 60;
      ps.rows.forEach(row => {
        row.page = i + 1;
        if (row.geo) markCard(row, prep);
        else if (!row.empty) row.crop = cropRow(prep.color, row, ps.tbl, Math.abs(pitch));
      });
      res.pages.push({ w:prep.color.width, h:prep.color.height, angle:prep.angle, header:ps.header, layout:ps.layout, cards:ps.cards || 0, notes:ps.notes, words:ps.words });
      ps.notes.forEach(t => res.notes.push(tag + t)); res.words += ps.words;
      if (!res.date && ps.date) res.date = ps.date;
      ps.rows.forEach(row => res.rows.push(row));
    }
    res.rows.forEach((r, i) => { r.key = 'b' + i; });
    res.rows.sort((a, b) => (a.nr ?? 999) - (b.nr ?? 999) || a.page - b.page || a.y0 - b.y0);
    const seen = {}; res.rows.forEach(r => { if (!r.empty && r.nr != null){ (seen[r.nr] = seen[r.nr] || []).push(r); } });
    Object.values(seen).forEach(a => { if (a.length > 1) a.forEach(r => { r.dupNr = true; if (r.lvl === 'ok') r.lvl = 'chk'; }); });
    res.stats = { ok:0, chk:0, bad:0, empty:0 }; res.rows.forEach(r => { res.stats[r.empty ? 'empty' : r.lvl]++; });
    return res;
  }

  /* ---------- Iz vrstice v prevoz ---------- */
  const FIELD_LABEL = { name:'ime', from:'od', to:'do', time:'ura', note:'opomba', phone:'tel', mode:'način' };
  const chkText = row => (row.todo || []).map(k => FIELD_LABEL[k]).join(', ');

  return { parse, cleanWords, cellOf, ed, sim, simNS, simName, ocrNorm, parseTime, placeSuggest, patientSuggest, vocab, chkText, FIELD_LABEL, LV, headKey, tsvWords, fromOcr, skewAngle, rotated, binarize, loadPages, preparePage, cropRow, cropCard, inkOf, markCard, run, warm, cancel, hooks, photoUrl, MAX_SIDE };
})();

/* =====================================================================
   ZASLONI
   ===================================================================== */
const UI = { copy:null, view:'knjiga', month:null, date:null, dDate:null, lDate:null, cDate:null, filter:'vsi', q:'', setTab:'vozila', bookRev:'', pid:'', nid:'', pf:'vsi', pq:'', modal:null, stale:false, selfTest:null, maps:{}, routeBusy:'', sect:{}, openRide:'', kmRep:false, gTest:null, kmTried:{} };
const IC = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M9 8h6M9 12h6"/></svg>',
  day:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  kidney:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C8 3 5 6 5 10s2 5 2 8a3 3 0 0 0 6 0c0-2 4-3 4-8a7 7 0 0 0-5-7z"/></svg>'
};
const SV = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
Object.assign(IC, {
  pulse:SV('<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>'),
  users:SV('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.5-3.4 2.6-5 5.5-5s5 1.6 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.7.6 2.6 2.2 2.9 4.7"/>'),
  shield:SV('<path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  phone:SV('<path d="M5 4h3.5l1.7 4.2-2.2 1.4a11 11 0 0 0 5.4 5.4l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  pin:SV('<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  eye:SV('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  send:SV('<path d="M21 3 10 14M21 3l-6.5 18-3.5-7-7-3.5z"/>'),
  check:SV('<path d="m5 12.5 4.2 4.2L19 7"/>')
});
const NAV_ALL = [
  { id:'knjiga', label:'Knjiga', short:'Knjiga', ic:'book' },
  { id:'dan', label:'Dan', short:'Dan', ic:'day' },
  { id:'dispecer', label:'Dispečer', short:'Razpored', ic:'route' },
  { id:'zivo', label:'Živo', short:'Živo', ic:'pulse' },
  { id:'pacienti', label:'Pacienti', short:'Pacienti', ic:'users' },
  { id:'posebnosti', label:'Posebnosti', short:'Okvare', ic:'alert' },
  { id:'nastavitve', label:'Nastavitve', short:'Nastav.', ic:'gear' }
];
const TITLES = {
  knjiga:['Knjiga prevozov', 'Mesečni pregled. Pod vsakim dnevom je polje Ostalo za opombe.'],
  dan:['Dnevna knjiga', ''],
  dispecer:['Dispečer', 'Zaposleni in vozila vpišeš ti. Razpored in vrstni red izračuna aplikacija.'],
  zivo:['Živo stanje', 'Posadke sporočajo korake prevoza. Tukaj vidiš status in čase.'],
  pacienti:['Pacienti in nalogi', 'Baza pacientov z nalogi za prevoz. Opozorilo: letni nalog 30 dni, mesečni 7 dni pred iztekom.'],
  posebnosti:['Posebnosti', 'Okvare vozil, servisi in drugo, kar vpliva na razpored.'],
  nastavitve:['Nastavitve', 'Vozila, zaposleni, dializa, klinike, izračun, uporabniki in podatki.'],
  moji:['Moji prevozi', '']
};

/* ---------- Logotipi: datoteka iz mape logos/, ali naložen v Nastavitve → Logotipi; sicer samo besedilo ---------- */
const LOGOS = { zd:{ label:'ZD Brežice', file:'logos/zd-brezice.png' }, nmp:{ label:'NMP', file:'logos/nmp.png' } };
const logoSrc = k => store.get('kp.logo.' + k) || LOGOS[k].file;   // če datoteke ni, se prikaže besedilo (glej poslušalec napake spodaj)
const logoItem = k => { const src = logoSrc(k), l = LOGOS[k]; return `<span class="logoitem" data-logo="${k}">${src ? `<img src="${esc(src)}" alt="${esc(l.label)}" height="30">` : ''}<span class="lf" ${src ? 'hidden' : ''}>${esc(l.label)}</span></span>`; };
const logoBar = cls => `<div class="logobar ${cls || ''}">${logoItem('zd')}<i></i>${logoItem('nmp')}</div>`;
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.logoitem')){ t.hidden = true; const f = t.nextElementSibling; if (f) f.hidden = false; } }, true);

const navItems = () => (ME && isCrew()) ? [] : NAV_ALL;
function renderNav(){
  const liveN = isStaffRole() ? Object.entries(liveSummary(todayStr())).filter(([k]) => ['odklonjena', 'ni_doma'].includes(k)).reduce((n, [, v]) => n + v, 0) : 0;
  const alerts = isStaffRole() ? nalogAlerts().length : 0;
  const late = isStaffRole() && computePlan(addDays(todayStr(), 1)).totals.late;
  const badge = id => id === 'dispecer' && late ? '<span class="count">!</span>' : id === 'zivo' && liveN ? `<span class="count">${liveN}</span>` : id === 'pacienti' && alerts ? `<span class="count">${alerts}</span>` : '';
  $('#nav').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.label}</span>${badge(n.id)}</button>`).join('');
  $('#tabbar').innerHTML = navItems().map(n => `<button type="button" data-nav="${n.id}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${IC[n.ic]}<span>${n.short}</span>${badge(n.id) ? '<i class="dotbadge"></i>' : ''}</button>`).join('');
}
function setHeader(){
  const [t, s] = TITLES[UI.view] || TITLES.knjiga;
  $('#pageTitle').textContent = UI.view === 'dan' ? fmtLong(UI.date) : t;
  let sub = s;
  if (UI.view === 'dan'){ const h = holiday(UI.date); sub = `${h ? 'Praznik: ' + h + '. ' : ''}${isStandby(UI.date) ? 'Vikend/praznik: pripravljenost.' : 'Delovni dan.'}`; }
  $('#pageSub').textContent = sub;
  $('#topActions').innerHTML = `<span class="savepill" id="savepill"><i></i> Shranjeno</span>`;
}
const demoBanner = () => hasDemo() ? `<div class="banner"><span>${IC.info}</span><div><b>Prikazani so primeri.</b> Pacienti in zaposleni so izmišljeni. Odstrani jih v Nastavitve → Podatki, ko začneš z resničnimi vpisi.</div></div>` : '';
const hasDemo = () => Object.values(S.rides).some(a => a.some(r => r.demo)) || S.staff.some(s => s.demo) || S.patients.some(p => p.demo);

/* ---------- Kilometrina: oznaka in polje ---------- */
const KM_SRC_L = { osm:'naslov + ceste OSM', google:'Google Zemljevidi', rocno:'ročni vnos', osrm:'ocena po cestah (OSM)', ocena:'ocena po zračni razdalji' };
function kmChipHTML(r){
  if (!isFilled(r) || r.odpovedano) return '<span class="kmchip" data-role="kmchip" hidden></span>';
  const i = KM.info(r); if (i.total == null) return '<span class="kmchip" data-role="kmchip" hidden></span>';
  const ex = i.exact && i.backExact, tip = `${KM_SRC_L[i.src] || ''}: ${KM.fmtKm(i.km)} km` + (i.back ? ` + nazaj ${KM.fmtKm(i.back)} km` : '');
  return `<span class="kmchip src-${i.src} ${ex ? 'ex' : 'est'}" data-role="kmchip" title="${esc(tip)}">${ex ? '' : '~'}${KM.fmtKm(i.total)} km</span>`;
}
/* Opozorilo o natančnosti: kateri konec poti nima hišne številke (OSM) – takrat je km približen */
function precNoteHTML(r){
  const p = (r.kmSrc === 'osm' && Array.isArray(r.gp)) ? r.gp : null; if (!p) return '';
  const bad = [['OD', p[0]], ['DO', p[1]]].filter(([, x]) => !GEOC.exactPrec(x));
  if (!bad.length) return '';
  return `<span class="kmwarn" role="note">${bad.map(([l, x]) => l + ': ' + esc(GEOC.PREC[x] || x)).join(', ')} – kilometrina je približna. Vpiši hišno številko ali potrdi točko na zemljevidu.</span>`;
}
function kmBoxHTML(r){
  if (!(r.from || '').trim() || !(r.to || '').trim()) return '<span class="hint">Vpiši OD in DO: kilometrina se izračuna sama.</span>';
  const i = KM.info(r), tilde = x => x ? '' : '~', eng = KM.engine();
  const parts = [`<b class="kmv">${tilde(i.exact)}${KM.fmtKm(i.km)} km</b>`];
  if (i.back) parts.push(`nazaj ${tilde(i.backExact)}${KM.fmtKm(i.back)} km`, `skupaj <b>${tilde(i.exact && i.backExact)}${KM.fmtKm(i.total)} km</b>`);
  const pick = eng === 'osm' ? `<button type="button" class="btn sm" data-act="pickPt" title="Poglej točki OD in DO na zemljevidu ali ju popravi">Točka na zemljevidu</button>` : '';
  return `<span class="srcbadge src-${i.src}">${KM_SRC_L[i.src] || ''}</span><span class="kmtxt">${parts.join(' · ')}</span>
    <input type="text" inputmode="decimal" class="kmin" data-km="manual" placeholder="ročno" aria-label="Ročni vnos kilometrov OD → DO" value="${r.kmSrc === 'rocno' && r.km != null ? KM.fmtKm(r.km) : ''}">
    ${eng ? `<button type="button" class="btn sm" data-act="kmRecalc">Izračunaj znova</button>${pick}` : '<span class="hint">Izračun kilometrine je izklopljen: vklopi iskanje naslovov in dejanske ceste (Nastavitve → Izračun).</span>'}
    ${precNoteHTML(r)}`;
}

/* ---------- Mesečna knjiga ---------- */
function kmReportHTML(y, m){
  const rep = KM.month(y, m), share = rep.total ? Math.round(rep.exact / rep.total * 100) : 0;
  const vehRows = Object.entries(rep.veh).sort((a, b) => b[1] - a[1]).map(([v, k]) => `<tr><td>${esc(v)}</td><td class="num">${KM.fmtKm(k)} km</td></tr>`).join('');
  const dayRows = rep.days.map(d => `<tr><td>${fmtShort(d.date)}</td><td class="num">${d.n}</td><td class="num">${KM.fmtKm(d.km)} km</td></tr>`).join('');
  return `<section class="card card-pad stack kmrep" id="kmReport">
    <div class="card-head" style="margin:0"><h3>Kilometrina · ${MONTHS[m]} ${y}</h3>
      <div class="row" style="gap:6px"><button type="button" class="btn sm" data-act="kmMonth" ${KM.can() ? '' : 'disabled title="Izračun kilometrine je izklopljen: vklopi iskanje naslovov in dejanske ceste (Nastavitve → Izračun)"'}>Izračunaj manjkajoče</button><button type="button" class="btn sm" data-act="kmCsv" data-names="0">Prenesi CSV</button><button type="button" class="btn sm" data-act="kmCsv" data-names="1">CSV z imeni pacientov</button></div></div>
    <div class="sumline"><span><b class="mono">${KM.fmtKm(rep.total)}</b> km skupaj</span><span><b class="mono">${share} %</b> natančno (točen naslov, Google ali ročno)</span><span><b class="mono">${rep.missing}</b> prevozov brez km</span></div>
    ${rep.rows.length ? `<div class="two"><div class="tablewrap"><table><thead><tr><th>Dan</th><th class="num">Prevozov</th><th class="num">Km</th></tr></thead><tbody>${dayRows}</tbody></table></div>
      <div class="tablewrap"><table><thead><tr><th>Vozilo</th><th class="num">Km</th></tr></thead><tbody>${vehRows || '<tr><td colspan="2" class="muted">Vozila se pokažejo po razporeditvi.</td></tr>'}</tbody></table></div></div>` : '<div class="empty-state">V tem mesecu še ni prevozov.</div>'}
    <p class="hint" style="margin:0">Kilometrina prevoza = razdalja OD → DO po cestah (točka naslova iz OpenStreetMap ali Google, cestna pot OSRM ali Google, osebni avto). Pri čakanju na pregled je prišteta tudi pot nazaj. Vožnja reševalca do pacienta in nazaj na postajo ni všteta. Oznaka ~ pomeni, da naslov nima hišne številke v OSM ali da je to ocena: tak vpis potrdi na zemljevidu ali vpiši km ročno.</p></section>`;
}
function renderMonth(){
  const { y, m } = UI.month, n = daysInMonth(y, m), today = todayStr();
  let tr = 0, td = 0, dd = 0, tcn = 0; const cards = [];
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m+1)}-${pad(d)}`;
    const all = (S.rides[date] || []).filter(isFilled), filled = all.filter(r => !r.odpovedano), canc = all.length - filled.length, done = filled.filter(r => r.done).length;
    tcn += canc; tr += filled.length; td += done; if (filled.length) dd++;
    const hol = holiday(date), wk = isStandby(date);
    const oc = (S.crewBook[date] || {}).ost || { text:'', manual:false };
    cards.push(`<article class="day ${date === today ? 'today' : ''} ${wk ? 'wk' : ''} ${date < today ? 'past' : ''}">
      <button type="button" class="day-head" data-act="openDay" data-date="${date}">
        <span class="dnum tnum">${pad(d)}</span>
        <span class="dtxt"><span class="dname">${DOW_LONG[dow(date)]}</span>
          <span class="dmeta">${date === today ? '<span class="chip accent">danes</span>' : ''}${hol ? `<span class="chip warn" title="${esc(hol)}">praznik</span>` : ''}${wk && !hol ? '<span class="chip info">pripravljenost</span>' : ''}</span></span>
        <span class="dcount"><b>${filled.length}</b>${filled.length ? `${done}/${filled.length} ✓` : 'prevozov'}${canc ? `<span class="chip bad">${canc} odpov.</span>` : ''}</span>
      </button>
      <div class="crew"><div class="crew-row"><label>Opomba</label><input type="text" data-crew="${date}|ost" value="${esc(oc.text)}" placeholder="kaj je narobe / opomba" aria-label="Ostalo, ${fmtShort(date)}"></div></div></article>`);
  }
  $('#view').innerHTML = `
    ${demoBanner()}${alertsBanner()}
    <div class="monthbar">
      <button type="button" class="btn" data-act="monthPrev" aria-label="Prejšnji mesec">${IC.left}</button>
      <h2>${MONTHS[m]} ${y}</h2>
      <button type="button" class="btn" data-act="monthNext" aria-label="Naslednji mesec">${IC.right}</button>
      <button type="button" class="btn" data-act="monthToday">Danes</button>
      <span class="sumline"><span><b class="mono">${tr}</b> prevozov</span><span><b class="mono">${td}</b> opravljenih</span>${tcn ? `<span><b class="mono">${tcn}</b> odpovedanih</span>` : ''}</span>
      <span class="sp" style="margin-left:auto"></span>
      <button type="button" class="btn ${UI.kmRep ? 'primary' : ''}" data-act="kmReport" aria-pressed="${UI.kmRep}">Kilometrina</button>
      <button type="button" class="btn" data-act="bkOpen">Natisni knjigo</button>
      <button type="button" class="btn" data-act="bsOpen">Skeniraj stran knjige</button>
    </div>
    ${UI.kmRep ? kmReportHTML(y, m) : ''}
    <div class="days">${cards.join('')}</div>`;
}

/* ---------- Dnevna knjiga: vrstice prevozov, ena odprta za urejanje ---------- */
function modeSeg(mode){
  return `<div class="seg" role="group" aria-label="Način prevoza">${Object.entries(MODES).map(([k, v]) => `<button type="button" data-mode="${k}" data-act="mode" aria-pressed="${mode === k}">${v}</button>`).join('')}</div>`;
}
function pinfoHTML(date, r){
  const p = r.patientId ? patientById(r.patientId) : null;
  if (p){
    const opts = (p.naloge || []).filter(n => !n.preklican).map(n => `<option value="${n.id}" ${r.nalogId === n.id ? 'selected' : ''}>${esc(NALOG_VRSTE[n.vrsta].l)} ${esc(n.stevilka || '')} (${fmtDMY(n.veljaOd)}–${fmtDMY(n.veljaDo)})</option>`).join('');
    const sel = (p.naloge || []).find(n => n.id === r.nalogId);
    const chip = sel ? nalogChip(sel, date) : (activeNalog(p, date) ? '' : '<span class="chip bad">ni veljavnega naloga</span>');
    return `<div class="pinfo">${avatarP(p)}<div class="pinfo-main"><div class="row" style="gap:6px"><select data-f="nalogId" aria-label="Nalog za prevoz"><option value="">Nalog: ni izbran</option>${opts}</select>${chip}</div></div>
      <button type="button" class="icon-btn" data-act="openPatient" data-id="${p.id}" title="Odpri pacienta" aria-label="Odpri pacienta">${IC.users}</button></div>`;
  }
  if ((r.name || '').trim()) return `<div class="pinfo none"><span class="hint">Pacient ni v bazi.</span><button type="button" class="btn sm" data-act="savePat">${IC.plus} Shrani v bazo</button></div>`;
  return '';
}
function assignText(a){ return a ? esc(a.veh) + ' · ' + fmtT(a.t) : ''; }
function sumRowHTML(r, nr, a, open){
  const dir = rideDir(r), showSt = r.status && r.status !== 'nova';
  return `<button type="button" class="rrow" data-act="openRide" aria-expanded="${open}" aria-label="Prevoz ${nr}: ${esc(r.name || 'brez imena')}">
    <span class="nr">${nr}</span><span class="rtm" data-role="rtime">${esc(r.time || '–')}</span>
    <span class="rbody"><span class="rname" data-role="rname">${esc(r.name || '(brez imena)')}</span><span class="rroute" data-role="rroute">${esc(r.from)}${r.to ? ' → ' + esc(r.to) : ''}</span></span>
    <span class="rtags" data-role="rtags">${rowTags(r, dir)}${showSt ? stChip(r.status) : ''}${r.odpovedano ? '<span class="chip bad">odpovedano</span>' : ''}${r.demo ? '<span class="chip warn">PRIMER</span>' : ''}</span>
    ${kmChipHTML(r)}
    <span class="assign ${a && a.late > 0 ? 'late' : ''}" data-role="assign" ${a ? '' : 'hidden'}>${assignText(a)}</span>
    <span class="rcheck" aria-hidden="true">${r.done ? IC.check : ''}</span></button>`;
}
function rowTags(r, dir){
  return `${r.chk ? `<span class="chip warn rchk" title="Prebrano s fotografije, ni potrjeno: ${esc(r.chk)}">⚠ preveri</span>` : ''}${r.mode !== 'sede' ? `<span class="rtag m-${r.mode}">${MODES[r.mode]}</span>` : ''}${dir === 'from' ? '<span class="rtag">odvoz</span>' : ''}${+r.stay > 0 && dir === 'to' ? `<span class="rtag">čaka ${+r.stay} min</span>` : ''}${r.dia ? `<span class="rtag">dializa</span>` : ''}`;
}
/* Čakanje na pregled: prikaže se samo pri prevozu TJA na ustanovo/kliniko. */
function stayInfo(r, a){
  const g = geo(r.to || ''), on = +r.stay > 0;
  const show = rideDir(r) === 'to' && (g.kind === 'poi' || on);
  return { show, on, def:poiStay(g) || S.settings.stayDef || 45, text:on ? (a && a.retPickT != null ? `Pobere nazaj ob ${fmtT(a.retPickT)} (pregled ${+r.stay} min + pot do ambulante).` : `Po pregledu (${+r.stay} min) pobere pacienta nazaj.`) : 'Brez čakanja: prevoz nazaj se vpiše posebej.' };
}
function stayRowHTML(r, a){
  const s = stayInfo(r, a);
  return `<div class="field full stayrow" data-role="stay" ${s.show ? '' : 'hidden'}><label class="check" title="Pacient ima pregled, reševalec počaka in ga odpelje nazaj"><input type="checkbox" data-f="stayOn" ${s.on ? 'checked' : ''}> Reševalec počaka na pregled</label>
    <span class="staymin" data-role="stayMin" ${s.on ? '' : 'hidden'}><input type="number" data-f="stay" min="5" max="480" step="5" value="${s.on ? +r.stay : s.def}" aria-label="Trajanje pregleda v minutah"> <span class="dim">min</span></span>
    <span class="hint" data-role="stayInfo">${esc(s.text)}</span></div>`;
}
function boxHTML(date, r, nr, plan){
  const filled = isFilled(r), a = plan.assign[r.id], open = UI.openRide === r.id;
  const g = r.from.trim() ? geo(r.from) : null;
  const pc = pcClass(r.patientId);
  const ptc = r.patientId ? patientById(r.patientId) : null, nlc = ptc ? ((ptc.naloge || []).find(n => n.id === r.nalogId) || activeNalog(ptc, date)) : null;
  const nt = ptc ? 'nt-' + (nlc ? nlc.vrsta : 'none') : '';
  const editor = !open ? '' : `<div class="editor">
    ${r.chk ? `<div class="banner chkrow" role="status"><span>${IC.alert}</span><div><b>Prebrano s fotografije: preveri ${esc(r.chk)}.</b> Popravi polje in pritisni »Preverjeno«. Oznaka ⚠ se natisne tudi v knjigi, dokler ni potrjena.</div><button type="button" class="btn sm primary" data-act="chkOk">Preverjeno</button></div>` : ''}
    <div class="bgrid">
      <div class="field"><label for="n-${r.id}">Ime in priimek</label><input id="n-${r.id}" type="text" data-f="name" data-suggest="patient" value="${esc(r.name)}" autocomplete="off" placeholder="išči v bazi pacientov"></div>
      <div class="field"><label for="t-${r.id}" title="Ura preiskave. Pri odvozu iz ustanove: ura, ko je pacient pripravljen.">Ura</label><input id="t-${r.id}" type="time" data-f="time" value="${esc(r.time)}"></div>
      <div class="field full"><span class="lbl">Način prevoza</span>${modeSeg(r.mode)}</div>
      <div class="field full"><label for="f-${r.id}">Od</label><input id="f-${r.id}" type="text" data-f="from" data-suggest="from" class="${g && g.kind === 'neznano' ? 'warnfield' : ''}" value="${esc(r.from)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field full"><label for="o-${r.id}">Do</label><input id="o-${r.id}" type="text" data-f="to" data-suggest="to" value="${esc(r.to)}" autocomplete="off" placeholder="npr. UKC Ljubljana – Očesna klinika"></div>
      ${stayRowHTML(r, a)}
      <div class="field full kmrow" data-role="km">${kmBoxHTML(r)}</div>
      <div class="field"><label for="p-${r.id}">Telefon</label><input id="p-${r.id}" type="tel" data-f="phone" value="${esc(r.phone)}" autocomplete="off"></div>
      <div class="field"><label for="x-${r.id}" title="npr. voziček, kisik, spremljevalec">Opomba</label><input id="x-${r.id}" type="text" data-f="note" value="${esc(r.note || '')}" autocomplete="off"></div>
      <div class="field full notechips" role="group" aria-label="Hitre opombe">${NOTE_CHIPS.map(c => `<button type="button" class="chip toggle" data-act="noteChip" data-t="${esc(c)}" aria-pressed="${noteHas(r.note, c)}">${esc(c)}</button>`).join('')}</div>
    </div>
    ${pinfoHTML(date, r)}
    ${r.status && r.status !== 'nova' && r.times && Object.keys(r.times).length ? `<div class="row" style="gap:4px">${timesChips(r)}</div>` : ''}
    <div class="donerow">
      <label class="check"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label>
      <div class="field whodid"><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz" autocomplete="off"></div>
      <span class="sp"></span>
      <details class="menu"><summary class="btn sm ghost">Več</summary><div class="menupop">
        <label class="check" title="Prevoz je odpovedan: označen je rdeče in ni v razporedu"><input type="checkbox" data-f="odpovedano" ${r.odpovedano ? 'checked' : ''}> Odpovedano</label>
        <label class="check" title="Dovoli, da se za ta prevoz pravila prilagodijo (npr. več pacientov v vozilu, daljša pot)"><input type="checkbox" data-f="exc" ${r.exc ? 'checked' : ''}> Izjema pravil</label>
        ${filled ? `<button type="button" class="btn sm" data-act="rideView">${IC.eye} Predogled za kopiranje</button>
        <div class="menulbl">Ponovi prevoz (npr. obsevanje)</div>
        <button type="button" class="btn sm" data-act="repeatRide" data-how="next">Naslednji delovni dan</button>
        <button type="button" class="btn sm" data-act="repeatRide" data-how="week">Do konca tedna (pon–pet)</button>
        <button type="button" class="btn sm" data-act="repeatRide" data-how="five">Naslednjih 5 delovnih dni</button>` : ''}
        <button type="button" class="btn sm danger" data-act="clearRide" title="Počisti polje ${nr}">Počisti prevoz</button></div></details>
      <button type="button" class="btn sm" data-act="closeRide">Zapri</button>
    </div></div>`;
  return `<article class="box ${pc} ${nt} ${open ? 'open' : ''} ${r.done ? 'done' : ''} ${r.odpovedano ? 'cancelled' : ''}" data-ride="${r.id}" data-date="${date}" data-nr="${nr}">${sumRowHTML(r, nr, a, open)}${editor}</article>`;
}
function refreshStaffList(date){
  const names = new Set([...(S.duty[date] || []).map(d => d.name), ...S.staff.map(s => s.name)]);
  $('#staffList').innerHTML = [...names].map(n => `<option value="${esc(n)}"></option>`).join('');
}
const kmSum = date => { let t = 0, all = true, any = false; filledRides(date).forEach(({ r }) => { if (r.odpovedano) return; const i = KM.info(r); if (i.total == null) return; any = true; t += i.total; if (!(i.exact && i.backExact)) all = false; }); return { t, all, any }; };
const noteHas = (note, c) => String(note || '').split(/\s*;\s*/).some(x => norm(x) === norm(c));
function quickFormHTML(date){
  return `<form class="quick" data-form="quick" autocomplete="off"><input id="quickIn" type="text" autocomplete="off" spellcheck="false" placeholder="Hitri vnos: ime, od, do, ura  (npr. Novak Ivan, Dobova 25, OI LJ, 8:00)" aria-label="Hitri vnos prevoza"><button type="submit" class="btn primary">${IC.plus} Dodaj</button></form>
    <div class="hint quickprev" id="quickPrev" aria-live="polite">${QUICK_HELP}</div>`;
}
function copyPanelHTML(date){
  const c = UI.copy, src = c.src, list = filledRides(src).filter(x => !x.r.odpovedano), n = c.sel.size;
  const loaded = typeof dayLoaded === 'function' ? dayLoaded(src) : true;
  return `<section class="card card-pad stack copypanel" style="gap:10px"><div class="card-head" style="margin:0"><h3>Kopiraj prevoze z drugega dne na ${fmtShort(date)}</h3><button type="button" class="icon-btn" data-act="copyClose" aria-label="Zapri">${IC.x}</button></div>
    <div class="row"><label for="copySrc" style="font-weight:600">Z dne</label><input type="date" id="copySrc" value="${src}" style="width:auto"><button type="button" class="btn sm" data-act="copyStep" data-d="-1">${IC.left}</button><button type="button" class="btn sm" data-act="copyStep" data-d="1">${IC.right}</button><span class="hint">${fmtShort(src)} · ${list.length} prevozov</span></div>
    ${list.length ? `<div class="copylist">${list.map(({ r, nr }) => `<label class="copyrow"><input type="checkbox" data-copy="${r.id}" ${c.sel.has(r.id) ? 'checked' : ''}><span class="nr">${nr}</span><span class="cn"><b>${esc(r.name || '(brez imena)')}</b> <span class="mono dim">${esc(r.time)}</span><span class="hint"> ${esc(r.from)} → ${esc(r.to)}</span></span></label>`).join('')}</div>`
      : `<div class="empty-state">${loaded ? 'Ta dan nima vpisanih prevozov.' : 'Ta dan še ni naložen iz baze. Počakaj trenutek ali izberi drug datum.'}</div>`}
    <div class="row"><button type="button" class="btn sm" data-act="copyAll">Označi vse</button><button type="button" class="btn sm" data-act="copyNone">Odznači vse</button><span class="sp" style="flex:1"></span><button type="button" class="btn primary" data-act="copyDo" ${n ? '' : 'disabled'}>Kopiraj izbrane (${n})</button></div>
    <p class="hint" style="margin:0">Kopirajo se ime, ura, naslova, način prevoza in opomba. Opravljeno, stanje in posadka se ne kopirajo. Prevozi, ki so tega dne že vpisani, se preskočijo.</p></section>`;
}
function renderDay(){
  const date = UI.date, today = todayStr(), a = ensureDay(date), plan = computePlan(date);
  refreshStaffList(date);
  const list = filledRides(date), filled = list.length, done = list.filter(x => x.r.done).length, terms = diaTermsFor(date);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const warns = dayWarnings(date), ks = kmSum(date);
  const openR = rideById(date, UI.openRide), openEmpty = openR && !isFilled(openR.r) ? openR : null;
  const tools = filled >= 6 || UI.q || UI.filter !== 'vsi';
  $('#view').innerHTML = `
    <div class="daybar">
      <div class="row">
        <button type="button" class="btn" data-act="dayPrev" aria-label="Prejšnji dan">${IC.left}</button>
        <input type="date" id="dayPick" value="${date}" style="width:auto" aria-label="Izberi datum">
        <button type="button" class="btn" data-act="dayNext" aria-label="Naslednji dan">${IC.right}</button>
        <button type="button" class="btn ${date === today ? 'primary' : ''}" data-act="dayToday">Danes</button>
        <button type="button" class="btn ${date === addDays(today,1) ? 'primary' : ''}" data-act="dayTomorrow">Jutri</button>
      </div>
      <div class="row">
        <button type="button" class="btn primary" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button>
        <details class="menu right"><summary class="btn" aria-label="Več možnosti">Več</summary><div class="menupop">
          ${terms.length ? `<button type="button" class="btn sm" data-act="loadDia">${IC.kidney.replace('<svg', '<svg width="14" height="14"')} Naloži dializne paciente</button>` : ''}
          <button type="button" class="btn sm" data-act="copyOpen">Kopiraj prevoze z drugega dne …</button>
          <button type="button" class="btn sm" data-act="printDay">Natisni knjigo dneva (OBR REŠ 08)</button>
          <button type="button" class="btn sm" data-act="kmDay" ${KM.can() ? '' : 'disabled title="Izračun kilometrine je izklopljen: vklopi iskanje naslovov in dejanske ceste (Nastavitve → Izračun)"'}>Preračunaj kilometrino dneva</button></div></details>
      </div>
    </div>
    <div class="sumline" id="daySum"><span><b class="mono">${filled}</b> ${filled === 1 ? 'prevoz' : 'prevozov'}</span><span><b class="mono">${done}</b> opravljenih</span>${ks.any ? `<span title="${ks.all ? 'Vse razdalje so natančne (točen naslov, Google ali ročno)' : 'Del razdalj je ocena (~)'}"><b class="mono">${ks.all ? '' : '~'}${KM.fmtKm(ks.t)}</b> km</span>` : ''}${terms.map(t => `<span class="chip">${IC.kidney.replace('<svg', '<svg width="12" height="12"')} dializa ${t === 'dop' ? 'dopoldne' : 'popoldne'}</span>`).join('')}${warns.length ? `<details class="warnbox inline"><summary>${warns.length} opozoril</summary><ul class="warnlist">${warns.slice(0, 40).map(w => `<li>${esc(w.text)}</li>`).join('')}</ul></details>` : ''}</div>
    ${blocked.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${blocked.map(v => `<b>${esc(v.name)}</b>: ${esc(vehBlocked(date, v.id).tip)}${vehBlocked(date, v.id).note ? ' (' + esc(vehBlocked(date, v.id).note) + ')' : ''}`).join(' · ')}. Vozilo ni v razporedu.</div></div>` : ''}
    ${S.dayNote[date] ? `<div class="banner warn"><span>${IC.info}</span><div><b>Opomba dneva:</b> ${esc(S.dayNote[date])}</div></div>` : ''}
    ${quickFormHTML(date)}${UI.copy ? copyPanelHTML(date) : ''}
    ${tools ? `<div class="toolbar"><div class="seg inline" role="group" aria-label="Filter">${[['vsi', 'Vsi'], ['cakajo', 'Čakajo'], ['opravljeni', 'Opravljeni']].map(([k, l]) => `<button type="button" data-act="filter" data-k="${k}" aria-pressed="${UI.filter === k}">${l}</button>`).join('')}</div>
      <input type="search" id="rideSearch" placeholder="Išči po imenu ali naslovu" value="${esc(UI.q)}" aria-label="Išči"></div>` : ''}
    <div class="boxes" id="boxes">${list.map(({ r, nr }) => boxHTML(date, r, nr, plan)).join('')}${openEmpty ? boxHTML(date, openEmpty.r, openEmpty.nr, plan) : ''}</div>
    ${list.length || openEmpty ? '' : '<div class="empty-state">Za ta dan še ni vpisanih prevozov.</div>'}
    <div class="row" style="margin-top:12px"><button type="button" class="btn ${list.length ? '' : 'primary'}" data-act="newRide">${IC.plus} Nov prevoz</button></div>`;
  applyFilter();
  kmAuto(date);
}
function applyFilter(){
  const q = norm(UI.q);
  $$('#boxes .box').forEach(el => {
    const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
    const r = hit.r; let show = true;
    if (UI.filter === 'cakajo') show = !r.done; else if (UI.filter === 'opravljeni') show = !!r.done;
    if (show && q) show = norm([r.name, r.from, r.to, r.phone].join(' ')).includes(q);
    el.hidden = !show && UI.openRide !== r.id;
  });
}
function updateDayCounts(){
  const date = UI.date, list = filledRides(date), el = $('#daySum'); if (!el) return;
  const f = list.length, d = list.filter(x => x.r.done).length, ks = kmSum(date), spans = $$(':scope > span:not(.chip)', el);
  if (spans[0]) spans[0].innerHTML = `<b class="mono">${f}</b> ${f === 1 ? 'prevoz' : 'prevozov'}`;
  if (spans[1]) spans[1].innerHTML = `<b class="mono">${d}</b> opravljenih`;
  let kmEl = spans[2];
  if (ks.any){ if (!kmEl){ kmEl = document.createElement('span'); spans[1].after(kmEl); } kmEl.title = ks.all ? 'Vse razdalje so natančne (točen naslov, Google ali ročno)' : 'Del razdalj je ocena (~)'; kmEl.innerHTML = `<b class="mono">${ks.all ? '' : '~'}${KM.fmtKm(ks.t)}</b> km`; }
  else if (kmEl) kmEl.remove();
}
/* Lahka osvežitev vrstice med tipkanjem (ne zamenja polj, da fokus ostane) */
function refreshKm(el){
  const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
  const r = hit.r, chip = $('[data-role=kmchip]', el);
  if (chip){ const tmp = document.createElement('div'); tmp.innerHTML = kmChipHTML(r); chip.replaceWith(tmp.firstElementChild); }
  const kb = $('[data-role=km]', el); if (kb && !kb.contains(document.activeElement)) kb.innerHTML = kmBoxHTML(r);
  updateDayCounts();
}
function refreshStay(el, a){
  const hit = rideById(el.dataset.date, el.dataset.ride); if (!hit) return;
  const r = hit.r, sr = $('[data-role=stay]', el); if (!sr) return;
  const s = stayInfo(r, a);
  sr.hidden = !s.show; const cb = $('[data-f=stayOn]', sr), mi = $('[data-f=stay]', sr), mw = $('[data-role=stayMin]', sr), tx = $('[data-role=stayInfo]', sr);
  if (cb) cb.checked = s.on; if (mw) mw.hidden = !s.on; if (mi && document.activeElement !== mi) mi.value = s.on ? +r.stay : s.def; if (tx) tx.textContent = s.text;
}
function refreshAssign(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const plan = computePlan(date), a = plan.assign[hit.r.id], b = $('[data-role=assign]', el);
  if (b){ b.hidden = !a; b.className = 'assign ' + (a && a.late > 0 ? 'late' : ''); b.innerHTML = assignText(a); }
  refreshStay(el, a);
}
function refreshBox(el){
  const date = el.dataset.date, hit = rideById(date, el.dataset.ride); if (!hit) return;
  const r = hit.r;
  el.classList.toggle('done', !!r.done); el.classList.toggle('cancelled', !!r.odpovedano);
  const set = (sel, txt) => { const n = $(sel, el); if (n) n.textContent = txt; };
  set('[data-role=rname]', r.name || '(brez imena)'); set('[data-role=rtime]', r.time || '–'); set('[data-role=rroute]', `${r.from}${r.to ? ' → ' + r.to : ''}`);
  const tg = $('[data-role=rtags]', el); if (tg){ const showSt = r.status && r.status !== 'nova'; tg.innerHTML = rowTags(r, rideDir(r)) + (showSt ? stChip(r.status) : '') + (r.odpovedano ? '<span class="chip bad">odpovedano</span>' : '') + (r.demo ? '<span class="chip warn">PRIMER</span>' : ''); }
  const chk = $('.rcheck', el); if (chk) chk.innerHTML = r.done ? IC.check : '';
  const fi = $('[data-f=from]', el); if (fi){ const g = r.from.trim() ? geo(r.from) : null; fi.classList.toggle('warnfield', !!g && g.kind === 'neznano'); }
  $$('.seg [data-mode]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === r.mode)));
  refreshStay(el, null); refreshKm(el);
}
/* Samodejni izračun kilometrine za današnji in bližnje dneve (enkrat na sejo in dan; pozneje ob spremembi naslova) */
function kmAuto(date){
  if (!KM.auto() || UI.kmTried[date]) return;
  const t = todayStr(); if (date < addDays(t, -1) || date > addDays(t, 14)) return;
  UI.kmTried[date] = 1; KM.day(date).catch(() => {});
}

/* ---------- Dispečer ---------- */
function dutyHTML(date){
  const duty = S.duty[date] || [], avail = availableVehicles(date);
  const onNames = new Set(duty.map(d => d.name));
  const chips = S.staff.map(s => `<button type="button" class="chip toggle" data-act="toggleStaff" data-id="${s.id}" aria-pressed="${onNames.has(s.name)}">${esc(s.name)}${s.team === 'NN' ? ' · NN' : ''}</button>`).join('');
  const otOpts = [[0, 'Nadure: brez'], [30, 'Nadure do 30 min'], [60, 'Nadure do 1 h'], [120, 'Nadure do 2 h'], [180, 'Nadure do 3 h'], [240, 'Nadure do 4 h']];
  const items = duty.map((d, i) => { const st = staffOfDuty(d), vn = d.vehicleId && vehById(d.vehicleId), sum = ['Izmena' + (d.from ? ' ' + d.from + (d.to ? '–' + d.to : '') : ''), vn ? vn.name : '', +d.ot ? 'nadure' : ''].filter(Boolean).join(' · '); return `<div class="duty-item" data-di="${i}">
      <div class="dn">${esc(d.name)}</div><button type="button" class="icon-btn" data-act="rmDuty" data-i="${i}" aria-label="Odstrani ${esc(d.name)}">${IC.x}</button>
      <div class="dsel">
        <select data-duty="team" aria-label="Ekipa"><option value="redna" ${d.team==='redna'?'selected':''}>Redna ekipa</option><option value="NN" ${d.team==='NN'?'selected':''}>NN ekipa</option><option value="pripravljenost" ${d.team==='pripravljenost'?'selected':''}>Pripravljenost</option></select>
        <select data-duty="role" aria-label="Vloga"><option value="voznik" ${!['spremljevalec','student','dijak'].includes(d.role)?'selected':''}>Voznik</option><option value="spremljevalec" ${d.role==='spremljevalec'?'selected':''}>Spremljevalec</option><option value="student" ${d.role==='student'?'selected':''}>Študent</option><option value="dijak" ${d.role==='dijak'?'selected':''}>Dijak</option></select>
      </div>
      <details class="more"><summary>${esc(sum)}</summary><div class="dsel">
        <label class="mini">Začetek izmene<input type="time" data-duty="from" value="${esc(d.from||'')}" title="Prazno = izmena ni omejena"></label>
        <label class="mini">Konec izmene<input type="time" data-duty="to" value="${esc(d.to||'')}" title="Prazno = začetek + ${S.rules.shiftHours} h (če je vpisan začetek)"></label>
        <select data-duty="vehicleId" aria-label="Vozilo"><option value="">Vozilo: samodejno</option>${avail.map(v => `<option value="${v.id}" ${d.vehicleId===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select>
        <select data-duty="ot" aria-label="Nadure">${otOpts.map(([v, l]) => `<option value="${v}" ${(+d.ot || 0) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div></details></div>`; }).join('');
  return `<div class="card card-pad stack" style="gap:12px">
    <div class="card-head" style="margin:0"><h3>Zaposleni na delu</h3><span class="chip mono">${duty.length}</span></div>
    ${chips ? `<div class="row" style="gap:6px">${chips}</div>` : '<div class="hint">Seznam zaposlenih dodaš v Nastavitve → Zaposleni ali kar spodaj.</div>'}
    ${items || '<div class="empty-state" style="padding:14px">Še nihče ni vpisan za ta dan.</div>'}
    <form class="row" data-form="addDuty" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime novega zaposlenega" list="staffList" aria-label="Ime zaposlenega" autocomplete="off"><button class="btn primary" type="submit">Dodaj</button></form>
    <label class="check"><input type="checkbox" data-act="daySplit" ${S.dayRules[date] && S.dayRules[date].split ? 'checked' : ''}> Ekipa se razdeli na 2 voznika (vsak v svojem vozilu)</label>
    <div class="row"><button type="button" class="btn sm" data-act="copyDuty">${IC.copy} Kopiraj osebje od prejšnjega dne</button></div>
    <details class="hintdet"><summary>Pravila ekip</summary><p class="hint">NN ekipa ima 2 reševalca: voznik in spremljevalec (samodejno). Leže pacient vedno potrebuje voznika + spremljevalca in vozilo z nosili. Študent in dijak sta dodatna pomočnika. Posadka dialize lahko po koncu dialize prevaža tudi sede paciente.</p></details>
  </div>`;
}
function vehiclesHTML(date){
  const vs = S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo'), onN = vs.filter(v => !vehOff(date, v.id) && !vehBlocked(date, v.id)).length;
  return `<details class="card card-pad sect" data-sect="veh" ${UI.sect.veh ? 'open' : ''}><summary><h3>Vozila na voljo</h3><span class="chip mono">${onN}/${vs.length}</span></summary><div class="stack" style="gap:10px;margin-top:10px">
    ${S.vehicles.filter(v => v.aktiv && v.tip !== 'ostalo').map(v => {
      const b = vehBlocked(date, v.id), off = vehOff(date, v.id);
      return `<div class="veh-item ${b || off ? 'off' : ''}"><label><input type="checkbox" data-act="vehToggle" data-id="${v.id}" ${!off && !b ? 'checked' : ''} ${b ? 'disabled' : ''}><span><span class="vn">${esc(v.name)}</span><br><span class="hint">${esc(VEH_VRSTE[v.vrsta] || '')} · ${esc(capText(v))}${v.fn === 'dializa' ? ' · primarno dializa' : ''}</span></span></label>${b ? `<span class="chip bad">${esc(b.tip)}</span>` : (v.ns === 'NN' ? '<span class="chip">NN</span>' : '')}</div>`;
    }).join('') || '<div class="hint">Vozila dodaš v Nastavitve → Vozila.</div>'}
  </div></details>`;
}
/* ---------- Cestni podatki, ETA in pot na zemljevidu ---------- */
const legKm = l => ((l.est || l.wait) ? '~' : '') + l.km.toFixed(1) + ' km';
const tripKey = (c, t) => c.id + '|' + t.kind + '|' + t.rides.map(r => r.id).sort().join(',');
const etaTone = sl => sl < 0 ? 'bad' : sl < 5 ? 'warn' : 'ok';
function routeBar(plan){
  const i = ROUTE.info(), tot = plan.totals, off = S.settings.routing && S.settings.routing.on === false, nEst = tot.estLegs + tot.waitLegs;
  let tone = 'ok', head, text, retry = false;
  const host = (() => { try { return new URL(i.url || i.urls[0]).host; } catch(e){ return ''; } })();
  if (!i.configured){ tone = 'warn'; head = 'Cestni podatki: ni nastavljeno'; text = `Razdalje so ocenjene (zračna razdalja × ${S.settings.road}). Cestni strežnik se nastavi v config.js (routing.url).`; }
  else if (off){ tone = 'warn'; head = 'Cestni podatki: izklopljeni'; text = `Razdalje so ocenjene (zračna razdalja × ${S.settings.road}). Vklopi v Nastavitve → Izračun.`; }
  else if (i.status === 'error' || i.cooling > 0){ tone = 'warn'; head = 'Cestni podatki: ni povezave'; text = `Cestni strežnik ni dosegljiv${i.err ? ' (' + (/failed to fetch|networkerror|load failed|aborted/i.test(i.err) ? 'brez povezave s strežnikom' : esc(i.err)) + ')' : ''}. Za relacije brez podatkov velja ocena (zračna razdalja × ${S.settings.road}); ponovni poskus teče samodejno.`; retry = true; }
  else if (i.pending || i.busy || i.status === 'loading'){ tone = 'info'; head = 'Cestni podatki: nalaganje'; text = `Prenašam razdalje po cestah${i.pending ? ' (' + i.pending + ' relacij)' : ''}. Do takrat veljajo ocene, označene z ~.`; retry = true; }
  else if (nEst > 0){ tone = 'warn'; head = 'Cestni podatki: deloma'; text = `${nEst} relacij ni mogoče usmeriti po cesti (npr. neznan kraj), zato so ocenjene (~).`; }
  else if (tot.realLegs > 0){ head = 'Cestni podatki: v redu'; text = `Vse vožnje (${tot.realLegs} relacij) so izračunane po dejanskih cestah (OpenStreetMap${i.cached === 0 && i.shared ? ', vnaprej pripravljena datoteka razdalje.json' : host ? ', ' + esc(host) : ''}).`; }
  else { head = 'Cestni podatki: pripravljeni'; text = `Razdalje in časi se računajo po cestah (OpenStreetMap${host ? ', ' + esc(host) : ''}).`; }
  if (tone === 'ok') return '';
  return `<div class="routebar" role="status"><span class="chip ${tone}">${head}</span><span class="rt">${text}</span>${retry ? '<button type="button" class="btn sm" data-act="routeRetry">Poskusi znova</button>' : ''}</div>`;
}
const SUG_LABEL = { opt:'optimizacija', merge:'združeno', shift:'izmena', veh:'vozilo', bend:'pravila', late:'zamuda', road:'ceste' };
function suggestHTML(plan){
  const sg = (plan.suggestions || []).filter(x => x.k !== 'road'), e = plan.eff;   // »road« je že v vrstici cestnih podatkov
  let eff = '';
  if (e && e.tried > 1 && !sg.some(x => x.k === 'opt')){
    const sv = e.saved, parts = [];
    if (sv.unassigned > 0) parts.push(`${sv.unassigned} več razporejenih prevozov`);
    if (sv.late > 0) parts.push(`${sv.late} manj zamud`);
    if (sv.km > 0.5) parts.push(`${sv.km.toFixed(0)} km manj`);
    if (sv.min > 1) parts.push(`${fmtDur(sv.min)} manj vožnje`);
    eff = e.variant !== 'osnovni' && parts.length ? `Optimizator je preizkusil ${e.tried} različic razporeda in izbral »${esc(e.variant)}«: ${parts.join(', ')}.` : `Razpored je že najboljši med ${e.tried} preizkušenimi različicami.`;
  }
  if (!sg.length && !eff) return '';
  return `<section class="card card-pad stack" style="gap:8px"><div class="card-head" style="margin:0"><h3>Predlogi za učinkovitejši razpored</h3></div>
    ${eff ? `<p class="hint" style="margin:0">${eff}</p>` : ''}
    ${sg.length ? `<ul class="sugg">${sg.map(x => `<li><span class="chip ${x.tone || ''}">${esc(SUG_LABEL[x.k] || 'predlog')}</span><span>${esc(x.text)}</span></li>`).join('')}</ul>` : ''}</section>`;
}
/* ---------- Zemljevid: pot vožnje in zemljevid dneva (interaktivni zemljevid, 56-map.js) ---------- */
const MAP_COLORS = ['#1d4ed8', '#c2410c', '#15803d', '#7e22ce', '#be123c', '#0f766e', '#a16207', '#475569'];
const crewColor = c => { const i = (typeof CREWS_PIN !== 'undefined' ? CREWS_PIN : []).findIndex(v => v.id === c.vehicle.id); return MAP_COLORS[(i < 0 ? 0 : i) % MAP_COLORS.length]; };
const geoOk = p => p && isFinite(p.lat) && isFinite(p.lon);
function stopPopHTML(t, s, i, tag){
  const ppl = (s.people || []).filter(Boolean), pt = s.pt;
  const personRow = (t.kind === 'to' && s.type === 'pu') || (t.kind === 'from' && s.type === 'do');
  const label = pt.label || (s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : ''), ap = t.ev && (t.ev.nEst || t.ev.nWait) ? '~' : '';
  const addr = personRow && ppl[0] ? (ppl[0].kind === 'to' ? ppl[0].fromTxt : ppl[0].toTxt) || label : label;
  const who = ppl.map(r => `${esc(r.name)} <span class="mp-t">št. ${r.nr}</span>${r.timeTxt ? ` · ura ${esc(r.timeTxt)}` : ''}`).join('<br>');
  return `${tag || ''}<b>${i}. ${s.type === 'pu' ? 'Pobere' : 'Izstop'}</b> <span class="mp-t">${ap}${fmtT(s.t)}</span><div>${esc(addr || '')}</div>${who ? `<div class="mp-p">${who}</div>` : ''}`;
}
/* točke ene vožnje: postaja (ali prejšnji cilj) in postanki; pri zemljevidu dneva je oznaka številka prevoza, pri vožnji vrstni red postankov */
function tripPins(c, t, color, idp, byRide){
  const pins = [], tag = byRide ? `<span class="chip mono" style="margin-right:6px">${esc(c.vehicle.name)}</span>` : '';
  if (geoOk(t.from)) pins.push({ id:idp + '0', lon:t.from.lon, lat:t.from.lat, kind:'base', label:'', name:'Štart', color, html:`${tag}<b>Štart</b> <span class="mp-t">${fmtT(t.depart)}</span><div>${esc(t.from.label || 'RP Brežice (ZD)')}</div>` });
  t.stopsAbs.forEach((s, i) => {
    if (!geoOk(s.pt)) return;
    const ppl = (s.people || []).filter(Boolean);
    pins.push({ id:idp + (i + 1), lon:s.pt.lon, lat:s.pt.lat, kind:s.type === 'do' ? 'do' : 'pu', label:byRide && ppl.length ? ppl.map(r => r.nr).join(',') : String(i + 1), name:ppl.map(r => r.name).join(', '), color, html:stopPopHTML(t, s, i + 1, tag) });
  });
  return pins;
}
function tripRoute(t, g, color){
  const pts = [t.from, ...t.stopsAbs.map(x => x.pt)].filter(geoOk);
  return { coords:g && g.coords.length > 1 ? g.coords : pts.map(p => [p.lon, p.lat]), color, est:!g };
}
const MAP_HOW = 'Povleci za premik, kolešček ali dva prsta za povečavo, klik na točko za podrobnosti.';
function tripMapHTML(c, t){
  const key = tripKey(c, t), st = UI.maps[key]; if (!st) return '';
  const g = ROUTE.pathCached(tripWaypoints(t)), col = crewColor(c);
  const pins = tripPins(c, t, col, 't', false);
  if (pins.length < 2) return '<div class="rmap"><div class="rleg">Za to vožnjo ni koordinat za prikaz.</div></div>';
  const legend = (g ? `Pot po cestah: ${g.km.toFixed(1)} km, ${fmtDur(g.min)} (brez postankov).` : st === 'load' ? 'Nalaganje cestne poti …' : (String(st).startsWith('err') ? 'Cestna geometrija ni na voljo (' + esc(String(st).slice(4)) + '); črtkana črta je samo orientacija med točkami, ne razdalja.' : 'Cestna geometrija ni na voljo; črtkana črta je samo orientacija med točkami, ne razdalja.'))
    + ` ${MAP_HOW} Kvadrat = postaja ali prejšnji cilj, polni krog = izstop, številke = vrstni red postankov (klik na postanek v seznamu ga pokaže na zemljevidu).${MAP.tilesOn() ? '' : ' Podlaga zemljevida je izklopljena (Nastavitve → Izračun).'}`;
  return MAP.html(key, { routes:[tripRoute(t, g, col)], pins }, { legend, label:'Zemljevid poti vožnje, ' + c.vehicle.name });
}
/* Zemljevid dneva: vse vožnje vseh vozil na enem zemljevidu; barva = vozilo */
function dayMapSpec(date, plan){
  const hide = UI.dayHide || (UI.dayHide = {}), routes = [], pins = []; let total = 0, have = 0, km = 0;
  plan.crews.filter(c => c.trips.length && !hide[c.vehicle.id]).forEach(c => {
    const col = crewColor(c);
    c.trips.forEach((t, ti) => {
      const g = ROUTE.pathCached(tripWaypoints(t)); total++; if (g){ have++; km += g.km; }
      routes.push(tripRoute(t, g, col)); pins.push(...tripPins(c, t, col, c.vehicle.id + ':' + ti + ':', true));
    });
  });
  return { spec:{ routes, pins }, total, have, km };
}
const dayMapLegend = (d, busy) => d.total ? `${d.have === d.total ? `Vse vožnje (${d.total}) po cestah` : busy ? `Nalagam poti po cestah: ${d.have}/${d.total} …` : `${d.have} od ${d.total} vožnj po cestah, ostalo je črtkano (orientacijsko)`}${d.have ? ` · skupaj ${d.km.toFixed(0)} km (brez vožnje do prvega postanka)` : ''}. ${MAP_HOW} Številke so št. prevozov v knjigi; krog = pobere, poln krog = izstop, kvadrat = postaja.` : 'Ni vožnj za prikaz.';
function dayMapCard(date, plan){
  const open = !!UI.sect.daymap, crews = plan.crews.filter(c => c.trips.length);
  if (!crews.length) return '';
  let body = '';
  if (open){
    const d = dayMapSpec(date, plan), hide = UI.dayHide || {};
    body = `<div class="daymap-legend" role="group" aria-label="Vozila na zemljevidu">${crews.map(c => `<button type="button" class="chip toggle" data-act="dayMapCrew" data-veh="${esc(c.vehicle.id)}" aria-pressed="${!hide[c.vehicle.id]}"><span class="sw" style="background:${crewColor(c)}"></span>${esc(c.vehicle.name)} · ${esc(c.driver.name)}</button>`).join('')}</div>
      ${MAP.html('day|' + date, d.spec, { legend:dayMapLegend(d, !!UI.dayBusy), label:'Zemljevid vseh voženj dneva', tall:true })}`;
  }
  return `<details class="card card-pad sect" data-sect="daymap" ${open ? 'open' : ''}><summary><h3>Zemljevid dneva</h3><span class="chip">${crews.length} ${crews.length === 1 ? 'vozilo' : 'vozil'} · ${crews.reduce((n, c) => n + c.trips.length, 0)} vožnj</span></summary>${body}</details>`;
}
let DAYMAP_TAG = '';
/* poti po cestah za zemljevid dneva se naložijo po eno in sproti osvežijo zemljevid (brez ponovnega izrisa strani) */
async function loadDayPaths(date){
  if (!ROUTE.enabled()) return;
  const plan = computePlan(date), tag = date + '#' + rev + '#' + ROUTE.version;
  if (DAYMAP_TAG === tag) return; DAYMAP_TAG = tag;
  const todo = []; plan.crews.forEach(c => c.trips.forEach(t => { const wp = tripWaypoints(t); if (!ROUTE.pathCached(wp)) todo.push(wp); }));
  if (!todo.length) return;
  UI.dayBusy = true;
  const upd = () => { if (UI.view !== 'dispecer' || UI.dDate !== date || !UI.sect.daymap) return false; const d = dayMapSpec(date, plan); MAP.update('day|' + date, d.spec); const lg = document.querySelector('.imap[data-map="day|' + date + '"]'); const rl = lg && lg.parentElement.querySelector('.rleg'); if (rl) rl.innerHTML = dayMapLegend(d, UI.dayBusy); return true; };
  for (const wp of todo){
    try { await ROUTE.path(wp); } catch(e){}
    if (!upd()){ DAYMAP_TAG = ''; break; }
  }
  UI.dayBusy = false; upd();
}
function stopRow(c, t, s, L, prev){
  const ppl = (s.people || []).filter(Boolean);
  const personRow = (t.kind === 'to' && s.type === 'pu') || (t.kind === 'from' && s.type === 'do');
  const pt = s.pt, label = pt.label || (s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : ''), ap = t.ev && (t.ev.nEst || t.ev.nWait) ? '~' : '';
  const inf = r => (t.info && t.info[r.id]) || {};
  const etaOf = r => {
    const o = inf(r), out = [];
    if (t.kind === 'to'){
      if (o.dropT != null) out.push(`<span class="eta">na cilju ${ap}${fmtT(o.dropT)}</span>`);
      if (o.slack != null) out.push(`<span class="eta ${etaTone(o.slack)}">${o.slack < 0 ? 'zamuda ' + (-o.slack) : 'rezerva ' + o.slack} min</span>`);
    } else {
      if (o.pickT != null) out.push(`<span class="eta">pobran ${ap}${fmtT(o.pickT)}</span>`);
      if (o.wait > 0) out.push(`<span class="eta ${o.wait > S.settings.waitTol ? 'warn' : ''}">čaka ${o.wait} min</span>`);
    }
    return out.join(' ');
  };
  const firstRet = !!(s.ret && prev && !prev.ret);
  const base = firstRet ? (t.waitMin > 0 ? `<li class="legline wait"><span></span><i></i><span>čaka na pregled ~${fmtDur(t.waitMin)}</span></li>` : '')
    : prev ? `<li class="legline"><span></span><i></i><span>${Math.max(1, Math.round(s.t - prev.t - stopDwell(prev)))} min · ${legKm(L(prev.pt, pt))}</span></li>` : '';
  let body;
  if (s.ret){   // vrnitev po pregledu: pobere nazaj na ustanovi, izstop doma
    const who = ppl.map(r => `<span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>`).join('<br>');
    body = s.type === 'pu'
      ? `<div><div class="who">Pobere nazaj: ${esc(label || (t.anchor && t.anchor.label) || 'ustanova')}</div><div class="addr">${who}</div></div><div></div>`
      : `<div><div class="who">Izstop doma</div><div class="addr">${ppl.map(r => `${esc(r.name)} · ${esc(r.fromTxt)}`).join('<br>')}</div></div><div></div>`;
  } else if (personRow && ppl.length){
    const r = ppl[0];
    const rr = rideById(UI.dDate, r.id), rs = rr ? rr.r : null;
    body = `<div><div class="who"><span class="pdot ${pcClass(r.pid)}"></span>${esc(r.name)} <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span> <span class="chip mono">št. ${r.nr}</span>${rs && rs.status && rs.status !== 'nova' ? ' ' + stChip(rs.status) : ''}${rs && rs.exc ? ' <span class="chip accent">izjema</span>' : ''}</div>
      <div class="addr">${esc(r.kind === 'to' ? r.fromTxt : r.toTxt)}${r.phone ? ` · <span class="mono">${esc(r.phone)}</span>` : ''}${r.timeTxt ? ` · ura ${esc(r.timeTxt)}` : ''}${t.kind === 'to' && r.toTxt ? ` · cilj ${esc(r.toTxt)}` : ''}</div>
      <div class="addr">${etaOf(r)}</div></div>
      <div class="pin"><select data-act="pin" data-ride="${r.id}" aria-label="Prestavi prevoz ${r.nr} na vozilo"><option value="">Samodejno</option>${CREWS_PIN.map(v => `<option value="${v.id}" ${r.pin===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>`;
  } else {
    const who = ppl.map(r => `${esc(r.name)} <span class="chip mono">št. ${r.nr}</span>${t.kind === 'to' && s.type === 'do' && r.timeTxt ? ` <span class="eta">preiskava ${esc(r.timeTxt)}</span> ${etaOf(r)}` : (t.kind === 'from' && s.type === 'pu' && r.timeTxt ? ` <span class="eta">ura ${esc(r.timeTxt)}</span> ${etaOf(r)}` : '')}`).join('<br>');
    body = `<div><div class="who">${s.type === 'pu' ? 'Pobere' : 'Izstop'}: ${esc(label)}</div><div class="addr">${who}</div></div><div></div>`;
  }
  const mk = tripKey(c, t), mapOpen = !!UI.maps[mk] && geoOk(s.pt);
  return `${base}<li class="stop${mapOpen ? ' mapfocus' : ''}"${mapOpen ? ` data-act="stopFocus" data-mapkey="${esc(mk)}" data-mapid="t${t.stopsAbs.indexOf(s) + 1}" title="Pokaži na zemljevidu"` : ''}><time>${ap}${fmtT(s.t)}</time><span class="dot ${s.type === 'do' ? 'do' : ''}"></span>${body}</li>`;
}
function renderDispatch(){
  const date = UI.dDate, today = todayStr(), tom = addDays(today, 1);
  const plan = computePlan(date), L = makeLeg(S.settings);
  if (UI.bookRev !== date + '#' + rev){ writeBook(date); UI.bookRev = date + '#' + rev; }
  CREWS_PIN = plan.crews.map(c => c.vehicle);
  const blocked = S.vehicles.filter(v => v.tip !== 'ostalo' && vehBlocked(date, v.id));
  const tot = plan.totals;
  /* opozorila: težave (zamude, zgodnji štarti) na vrhu, »prilagojeno« posebej; več enakih opozoril o štartu pred izmeno postane eno */
  const wBend = plan.warnings.filter(w => w.level === 'bend'), wMain = [], early = [];
  plan.warnings.filter(w => w.level !== 'bend').forEach(w => { const m = /^(.+?): za pravočasen prihod .*?štartati ob (\d{1,2}:\d{2}), izmena pa se začne ob (\d{1,2}:\d{2})/.exec(w.text); if (m) early.push({ v:m[1], t:m[2], s:m[3], level:w.level }); else wMain.push(w); });
  if (early.length) wMain.unshift({ level:early[0].level, text:`Za pravočasen prihod bi morale posadke štartati pred začetkom izmene: ${early.map(e => `${e.v} ob ${e.t}`).join(', ')} (izmena se začne ob ${early[0].s}). Nastavi zgodnejši začetek izmene.` });
  const rows = plan.crews.map(c => `<tr>
      <td><b>${esc(c.vehicle.name)}</b><div class="hint">${esc(capText(c.vehicle))}</div></td>
      <td>${esc(c.driver.name)}${c.team === 'NN' ? ' <span class="chip">NN</span>' : ''}${c.escorts.map(e => `<div class="hint">${esc(e.name)} (sp.)</div>`).join('')}${(c.helpers || []).map(h => `<div class="hint">${esc(h.name)} (${ROLE_TAG[h.role] || ''})</div>`).join('')}</td>
      <td><div class="numchips">${c.rideNrs.length ? c.rideNrs.map(n => `<span class="chip mono">${n}</span>`).join('') : '<span class="dim">–</span>'}</div></td>
      <td>${c.trips.length ? `<b class="mono">Štart ${fmtT(c.firstDepart)}</b> iz postaje<div class="hint">${c.trips.map(t => `${fmtT(t.depart)} → ${esc(tripTitle(t) + (t.kind === 'to' ? '' : ' (odvoz)'))}`).join(' · ')}</div>${c.trips.some(t=>t.late>0) ? '<div><span class="chip bad">zamuda</span></div>' : ''}${c.overtime > 0 ? `<div><span class="chip accent">nadure ~${c.overtime} min</span></div>` : ''}` : '<span class="dim">Brez prevozov</span>'}</td></tr>`).join('');
  const blockedRows = blocked.map(v => { const b = vehBlocked(date, v.id); return `<tr><td><b>${esc(v.name)}</b></td><td colspan="2"><span class="chip bad">${esc(b.tip)}</span></td><td class="muted">${esc(b.note || 'Vozilo ni na voljo')}</td></tr>`; }).join('');
  const unRows = plan.unassigned.map(u => `<span class="chip bad mono" title="${esc(u.reason)}">${u.ride.nr}</span>`).join(' ');
  const cards = plan.crews.filter(c => c.trips.length).map(c => `<details class="card crewcard" data-sect="crew:${esc(c.vehicle.id)}" ${UI.sect['crew:' + c.vehicle.id] ? 'open' : ''}>
      <summary><div><h3>${esc(c.vehicle.name)} · ${esc(crewLabel(c))}</h3><div class="timeline-note">Štart iz postaje ${fmtT(c.firstDepart)} · konec ob ${fmtT(c.trips[c.trips.length-1].end)}</div></div>
      <div class="meta"><span class="chip mono">${c.rideNrs.length} prevozov</span><span class="chip mono">${c.km.toFixed(0)} km</span><span class="chip mono">${fmtDur(c.busy)}</span>${c.trips.some(t => t.late > 0) ? '<span class="chip bad">zamuda</span>' : ''}</div></summary>
      ${c.trips.map((t, ti) => `<div class="trip"><div class="trip-head">
          <span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(tripTitle(t) || 'cilj') : 'Iz: ' + esc(tripTitle(t) || 'ustanova')}</b>
          <span class="chip mono">${t.rides.length} pac.</span>${t.ev.ret ? `<span class="chip info" title="Reševalec po izstopu počaka na pregled in pacienta odpelje nazaj">počaka ~${fmtDur(t.waitMin || 0)}</span>` : ''}<span class="chip mono" title="${t.ev.nEst || t.ev.nWait ? 'Del poti je ocenjen (brez cestnih podatkov)' : 'Izračunano po cestah'}">${t.ev.nEst || t.ev.nWait ? '~' : ''}${t.ev.km.toFixed(0)} km</span><span class="chip mono">${t.ev.nEst || t.ev.nWait ? '~' : ''}${fmtDur(t.ev.dur)}</span>${new Set((t.dests || []).map(p => p.key)).size > 1 ? `<span class="chip info" title="Pacienti z blizu skupaj ležečimi cilji so v eni vožnji">${new Set(t.dests.map(p => p.key)).size} cilji</span>` : ''}
          ${t.late > 0 ? `<span class="chip bad">${t.kind === 'from' ? 'pacient čaka ~' + t.wait + ' min' : 'zamuda ~' + t.late + ' min'}</span>` : (t.kind === 'to' && t.slack != null ? `<span class="chip ok">rezerva ${t.slack} min</span>` : '')}
          ${t.sbReturn && c.team === 'NN' ? '<span class="chip">NN ekipa</span>' : ''}<button type="button" class="btn sm" data-act="tripMap" data-trip="${esc(tripKey(c, t))}" aria-expanded="${UI.maps[tripKey(c, t)] ? 'true' : 'false'}" style="margin-left:auto">${UI.maps[tripKey(c, t)] ? 'Skrij zemljevid' : 'Pot na zemljevidu'}</button></div>
        ${tripMapHTML(c, t)}
        <ul class="stops">
          <li class="stop"><time>${fmtT(t.depart)}</time><span class="dot base"></span><div><div class="who">Štart: ${ti === 0 ? 'RP Brežice (ZD)' : 'prejšnji cilj'}</div><div class="addr">Vožnja do prvega postanka ${legKm(L(t.from, t.stopsAbs[0].pt))}</div></div><div></div></li>
          ${t.stopsAbs.map((s, i) => stopRow(c, t, s, L, i ? t.stopsAbs[i-1] : null)).join('')}
        </ul></div>`).join('')}
    </details>`).join('');
  const closeList = (date <= tom) ? filledRides(date).map(({ r, nr }) => `<div class="duty-item" style="grid-template-columns:auto minmax(0,1fr) minmax(0,1.1fr);align-items:center" data-ride="${r.id}" data-date="${date}">
        <span class="nr">${nr}</span><div class="dn" style="min-width:0"><div style="overflow:hidden;text-overflow:ellipsis">${esc(r.name || '(brez imena)')} <span class="mono dim">${esc(r.time)}</span></div><div class="hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.from)} → ${esc(r.to)}</div></div>
        <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="row" style="gap:6px;flex-wrap:nowrap;font-weight:600"><input type="checkbox" data-f="done" ${r.done ? 'checked' : ''}> Opravljeno</label><input type="text" data-f="doneBy" list="staffList" value="${esc(r.doneBy)}" placeholder="Kdo je naredil odvoz" aria-label="Kdo je naredil odvoz, prevoz ${nr}" style="${r.done ? '' : 'visibility:hidden'}"></div></div>`).join('') : '';
  refreshStaffList(date);
  const kms = kmSum(date);
  $('#view').innerHTML = `
    <div class="row">
      <div class="seg inline" role="group" aria-label="Izbira dneva"><button type="button" data-act="dDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="dDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      <input type="date" id="dispPick" value="${date}" style="width:auto" aria-label="Drug datum">
      <span class="chip ${plan.standby ? 'info' : ''}">${plan.standby ? 'Pripravljenost (vikend/praznik)' : 'Delovni dan'}</span>
      ${diaTermsFor(date).map(t => `<span class="chip">${IC.kidney.replace('<svg', '<svg width="12" height="12"')} dializa ${t === 'dop' ? 'dopoldne' : 'popoldne'}</span>`).join('')}
    </div>
    <div class="dispatch">
      <div class="stack">
        ${dutyHTML(date)}${vehiclesHTML(date)}
        <details class="card card-pad sect" data-sect="note" ${UI.sect.note || S.dayNote[date] ? 'open' : ''}><summary><h3>Opomba dneva</h3>${S.dayNote[date] ? '<span class="chip">vpisana</span>' : ''}</summary><textarea id="dayNote" style="margin-top:10px" placeholder="npr. ob 9:00 sestanek, cesta zaprta, pacient potrebuje spremljevalca">${esc(S.dayNote[date] || '')}</textarea></details>
      </div>
      <div class="stack">
        ${publishBar(date, plan)}
        <div class="stats compact"><div class="stat"><b>${tot.rides}</b><span>prevozov</span></div>${kms.any ? `<div class="stat" title="Vsota razdalj OD → DO po prevozih (v knjigo)"><b>${kms.all ? '' : '~'}${KM.fmtKm(kms.t)}</b><span>km prevozov${kms.all ? '' : ' (~)'}</span></div>` : ''}<div class="stat"><b>${tot.vehicles}/${plan.crews.length}</b><span>vozil</span></div><div class="stat"><b>${tot.km.toFixed(0)}</b><span>km ekip (${!ROUTE.enabled() ? 'ocena' : tot.estLegs + tot.waitLegs ? 'deloma ocena' : 'po cestah'})</span></div><div class="stat"><b style="color:${tot.late ? 'var(--bad)' : 'var(--ok)'}">${tot.late}</b><span>z zamudo</span></div></div>
        ${wMain.length ? `<details class="warnbox" ${wMain.some(w => w.level === 'bad') ? 'open' : ''}><summary>${wMain.length} ${wMain.length === 1 ? 'opozorilo' : wMain.length < 5 ? 'opozorila' : 'opozoril'}</summary><ul class="warnlist">${wMain.map(w => `<li class="w-${w.level}">${esc(w.text)}</li>`).join('')}</ul></details>` : ''}
        ${routeBar(plan)}
        <div class="card card-pad">
          <div class="card-head"><h3>Razpored za ${fmtShort(date)}</h3><div class="row"><button type="button" class="btn sm" data-act="copyPlan">${IC.copy} Kopiraj kot besedilo</button></div></div>
          ${plan.crews.length || blocked.length ? `<div class="tablewrap"><table><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št. v knjigi)</th><th>Posebnosti · ure štarta</th></tr></thead><tbody>${rows}${blockedRows}</tbody></table></div>`
            : '<div class="empty-state">Vpiši zaposlene na delu in označi vozila. Razpored se sestavi sam.</div>'}
          ${unRows ? `<p style="margin:10px 0 0"><b>Nerazporejeni prevozi:</b> ${unRows}</p>` : ''}
          <details class="hintdet" style="margin-top:10px"><summary>Kako se računa</summary><p class="hint" style="margin:6px 0 0">${ROUTE.enabled() ? 'Razdalje in časi vožnje so izračunani po dejanskih cestah (OpenStreetMap, brez prometnih zastojev' + (+S.settings.routing.factor !== 1 ? ', čas × ' + S.settings.routing.factor : '') + '); relacije brez cestnih podatkov so označene z ~ in ocenjene kot zračna razdalja × ' + S.settings.road + ' pri omejitvah ' : 'Časi so ocena: zračna razdalja × ' + S.settings.road + ', omejitve '}${S.settings.lim.naselje}/${S.settings.lim.izven}/${S.settings.lim.hitra}/${S.settings.lim.avtocesta} km/h (naselje/izven/hitra/avtocesta), dejansko ${S.settings.eff} %. Pobiranje ${S.settings.pickMin} min, izstop ${S.settings.dropMin} min na pacienta (leže ${S.settings.pickLeze}/${S.settings.dropLeze}, utila ${S.settings.pickUtila}/${S.settings.dropUtila}), rezerva ${S.settings.buffer} min pred preiskavo. Pri pregledu s čakanjem reševalec po izstopu počaka in pacienta odpelje nazaj. Razpored se vpiše tudi v mesečno knjigo.</p></details>
        </div>
        ${rulesBar(date, plan, wBend)}
        ${suggestHTML(plan)}
        ${dayMapCard(date, plan)}
        ${cards ? `<div class="crewhead"><h3>Podrobnosti po posadkah</h3><span class="sp"></span><button type="button" class="btn sm ghost" data-act="crewsAll" data-open="1">Razširi vse</button><button type="button" class="btn sm ghost" data-act="crewsAll" data-open="0">Skrči vse</button></div>` : ''}
        ${cards}
        ${closeList ? `<details class="card card-pad sect" data-sect="close" ${UI.sect.close ? 'open' : ''}><summary><h3>Zaključek prevozov</h3><span class="hint">opravljeno in kdo je vozil</span></summary><div class="stack" style="gap:10px;margin-top:10px">${closeList}</div></details>` : ''}
      </div>
    </div>`;
  if (UI.sect.daymap) loadDayPaths(date);
}

/* ---------- Posebnosti ---------- */
function renderNotices(){
  const today = todayStr();
  const list = S.notices.slice().sort((a,b) => (a.closed - b.closed) || b.from.localeCompare(a.from));
  const tipChip = n => `<span class="chip ${n.tip === 'okvara' ? 'bad' : n.tip === 'servis' ? 'warn' : 'info'}">${esc(n.tip)}</span>`;
  $('#view').innerHTML = `
    <div class="two">
      <form class="card card-pad stack" data-form="addNotice" style="gap:12px">
        <h3>Nova posebnost</h3>
        <div class="formgrid">
          <div class="field full"><label for="nv">Vozilo</label><select id="nv" name="vehicleId">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="nt">Vrsta</label><select id="nt" name="tip"><option>okvara</option><option>servis</option><option>pregled</option><option>drugo</option></select></div>
          <div class="field"><label for="nf">Od</label><input id="nf" type="date" name="from" value="${today}" required></div>
          <div class="field"><label for="nto">Do (prazno = do preklica)</label><input id="nto" type="date" name="to"></div>
          <div class="field full"><label for="nn">Opis</label><input id="nn" type="text" name="note" placeholder="npr. pokvarjen zavorni sistem, redni servis v Krškem" autocomplete="off"></div>
        </div>
        <button class="btn primary" type="submit">Dodaj posebnost</button>
        <p class="hint" style="margin:0">Okvara in servis samodejno izločita vozilo iz razporeda za vse dni v obdobju.</p>
      </form>
      <div class="stack">
        <div class="card card-pad"><div class="card-head"><h3>Stanje vozil danes</h3></div>
          <div class="row" style="gap:8px">${S.vehicles.filter(v => v.tip !== 'ostalo').map(v => { const b = vehBlocked(today, v.id); return `<span class="chip ${b ? 'bad' : 'ok'}">${esc(v.name)} · ${b ? esc(b.tip) : 'v redu'}</span>`; }).join('')}</div></div>
        ${list.length ? list.map(n => `<div class="notice ${n.closed ? 'closed' : ''}">${tipChip(n)}<div><b>${esc((vehById(n.vehicleId) || { name:'(izbrisano vozilo)' }).name)}</b> <span class="mono dim">${n.from}${n.to ? ' → ' + n.to : ' → do preklica'}</span><div class="muted">${esc(n.note || '')}</div></div>
          <div class="row">${n.closed ? '<span class="chip">zaključeno</span>' : `<button type="button" class="btn sm" data-act="closeNotice" data-id="${n.id}">Zaključi</button>`}<button type="button" class="icon-btn" data-act="delNotice" data-id="${n.id}" aria-label="Izbriši">${IC.x}</button></div></div>`).join('')
          : '<div class="empty-state">Ni vpisanih posebnosti. Ko vozilo odpove ali gre na servis, ga vpiši tukaj.</div>'}
      </div>
    </div>`;
}

/* ---------- Nastavitve ---------- */
function mapCard(){
  const c = MAP.cfg(), on = MAP.tilesOn();
  let host = ''; try { host = c.url ? new URL(c.url.replace(/\{[a-z]\}/g, '0')).host : ''; } catch(e){}
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Zemljevid poti</h3><span class="chip ${!c.url ? 'warn' : on ? 'ok' : ''}">${!c.url ? 'podlaga ni nastavljena' : on ? 'podlaga vklopljena' : 'podlaga izklopljena'}</span></div>
    <p class="hint" style="margin:0">Pot vožnje in zemljevid dneva sta interaktivna zemljevida (povleci, povečaj, klik na točko). Podlaga so ploščice zemljevida${host ? ' (<span class="mono">' + esc(host) + '</span>)' : ''}. Brez podlage se prikažeta samo pot in točke na nevtralni mreži.</p>
    <div class="row"><button type="button" class="chip toggle" data-act="mapTiles" aria-pressed="${on}" ${c.url ? '' : 'disabled'}>Podlaga zemljevida na tej napravi: ${on ? 'vklopljena' : 'izklopljena'}</button></div>
    <details class="hintdet"><summary>Zasebnost in pogoji uporabe ploščic</summary><p class="hint" style="margin:6px 0 0">Ko je podlaga vklopljena, brskalnik pri strežniku ploščic zahteva slike za prikazano območje. Strežnik tako vidi IP naslov naprave, izvor te strani (brez poti) in koordinate prikazanih ploščic, ne vidi pa imen, naslovov ali drugih podatkov o pacientih. Točke in poti se izrisujejo v brskalniku. Javni strežnik ploščic OpenStreetMap je namenjen zmerni rabi (pogoji: operations.osmfoundation.org/policies/tiles): za redno delo v več pisarnah uporabi lasten strežnik ploščic ali ponudnika z dogovorom (config.js → tiles.url, v CSP v build-prod.py dodaj njegov izvor v img-src). Pripis »© prispevajoči OpenStreetMap« mora ostati viden.</p></details></div>`;
}
function routingCard(){
  const ri = ROUTE.info(), R = S.settings.routing, tst = UI.routeTest, wm = UI.routeWarm;
  const kn = (label, path, val, step, unit = '') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, val, { num:1, step, label }).replace('data-path', `id="k-${path}" data-path`)}`;
  const host = (() => { try { return new URL(ri.url || ri.urls[0]).host; } catch(e){ return ''; } })();
  const stTone = !ri.configured || !ri.on ? 'warn' : ri.status === 'ok' ? 'ok' : ri.status === 'error' ? 'bad' : 'info';
  const stTxt = !ri.configured ? 'ni nastavljeno' : !ri.on ? 'izklopljeno' : ri.status === 'ok' ? 'deluje' : ri.status === 'error' ? 'ni povezave' : ri.status === 'loading' ? 'nalaganje' : 'pripravljeno';
  const test = tst ? (tst.running ? '<span class="chip info">Preverjam …</span>' : `<div class="banner" style="${tst.ok ? '' : 'background:var(--warn-soft);color:var(--warn)'}"><span>${IC.info}</span><div><b>${tst.ok ? 'Povezava deluje' : 'Preizkus ni uspel'}</b>${tst.url ? ' · ' + esc(tst.url) : ''}<br>${esc(tst.msg)}${tst.km ? ` Brežice → UKC Ljubljana: ${tst.km.toFixed(1)} km, ${fmtDur(tst.min)} (${tst.ms} ms).` : ''}</div></div>`) : '';
  const warm = wm ? (wm.running ? `<span class="chip info" id="routeProg">Prenos … ${wm.done}/${wm.total || '?'}</span>` : `<span class="chip ${wm.err ? 'bad' : 'ok'}">${esc(wm.msg || '')}</span>`) : '';
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Cestno usmerjanje (OpenStreetMap)</h3><span class="chip ${stTone}">${stTxt}</span></div>
    <div class="banner"><span>${IC.info}</span><div>Razdalje in časi vožnje se računajo po dejanskem cestnem omrežju (OSRM nad podatki OpenStreetMap), tudi za Ljubljano, Novo mesto in druge kraje izven občine. Strežniku se pošljejo <b>samo koordinate</b> (brez imen, naslovov in podatkov o pacientih), brez piškotkov in brez povezave z vašo prijavo. Javni strežnik je brezplačen in brez jamstva; za redno delo z resničnimi pacienti uporabite lasten strežnik ali datoteko razdalje.json (glej NAVODILA.md).</div></div>
    <div class="stack" style="gap:8px">
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.routing.on" data-bool="1" ${R.on !== false ? 'checked' : ''}> Uporabi dejanske ceste (če je izklopljeno ali strežnik ni dosegljiv: ocena po zračni razdalji)</label>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.optimize" data-bool="1" ${S.settings.optimize !== false ? 'checked' : ''}> Samodejno poišči učinkovitejši razpored (združevanje bližnjih ciljev, primernejša vozila)</label></div>
    <div class="kv">${kn('Popravek časa vožnje (1 = brez popravka; npr. 1.15 za promet)', 'settings.routing.factor', R.factor, 0.05)}${kn('Združevanje ciljev: največ vožnje med cilji', 'settings.destMin', S.settings.destMin, 1, 'min')}${kn('Največ različnih ciljev v eni vožnji', 'settings.maxDests', S.settings.maxDests, 1)}${kn('Opozori, če pacient na cilju čaka več kot', 'settings.waitMax', S.settings.waitMax, 5, 'min')}</div>
    <div class="row"><button type="button" class="btn sm" data-act="routeTest">Preveri cestne podatke</button><button type="button" class="btn sm" data-act="routeWarm" ${ri.on && ri.configured ? '' : 'disabled'}>Predpripravi vse relacije</button><button type="button" class="btn sm" data-act="routeExport">Prenesi razdalje.json</button><button type="button" class="btn sm danger" data-act="routeClear">Izbriši predpomnilnik poti</button>${warm}</div>
    ${test}
    <p class="hint" style="margin:0">Predpomnilnik: ${ri.cached} relacij${ri.shared ? ', iz razdalje.json: ' + ri.shared + (ri.sharedBuilt ? ' (' + esc(String(ri.sharedBuilt).slice(0, 10)) + ')' : '') : ''}${ri.pending ? ', čaka na prenos: ' + ri.pending : ''}${host ? ' · strežnik: ' + esc(host) : ''}. V predpomnilnik gredo samo splošne točke (naselja, ustanove, mesta), nikoli hišni naslovi pacientov. Točnost: naselja so predstavljena s središčno točko, promet v živo ni upoštevan.</p></div>`;
}
/* ---------- Nastavitve: brezplačna natančna kilometrina (naslov → točka → cesta) ---------- */
function geocodeCard(){
  const gi = GEOC.info(), G = S.settings.geocode || {}, t = UI.geoTest, eng = KM.engine();
  const tone = !gi.configured || !gi.on ? 'warn' : gi.status === 'error' ? 'bad' : gi.status === 'ok' ? 'ok' : 'info';
  const txt = !gi.configured ? 'ni nastavljeno' : !gi.on ? 'izklopljeno' : gi.status === 'error' ? 'napaka' : gi.status === 'ok' ? 'deluje' : 'pripravljeno';
  const test = t ? (t.running ? '<span class="chip info">Preverjam …</span>' : `<div class="banner" style="${t.ok ? '' : 'background:var(--warn-soft);color:var(--warn)'}"><span>${IC.info}</span><div><b>${t.ok ? 'Iskanje naslovov deluje' : 'Preizkus ni uspel'}</b>${t.ok ? ` · Zdravstveni dom Brežice najden ${t.d} m od znane točke postaje (${t.ms} ms)` : ''}<br>${esc(t.msg || '')}</div></div>`) : '';
  const chk = (path, on, label) => `<label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="${path}" data-bool="1" ${on ? 'checked' : ''}> ${label}</label>`;
  const nfix = Object.keys(S.geoFix || {}).length;
  const mode = eng === 'osm' ? '<span class="chip ok">kilometrina se računa brezplačno (OpenStreetMap)</span>' : eng === 'google' ? '<span class="chip warn">trenutno velja Google (ključ je vnesen); za brezplačni način ga odstrani ali izklopi spodaj</span>' : '<span class="chip warn">izračun kilometrine je izklopljen</span>';
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Natančna kilometrina: naslovi OD → DO (brezplačno)</h3><span class="chip ${tone}">${txt}</span></div>
    <div class="banner"><span>${IC.info}</span><div>Ko vpišeš naslov z ulico in hišno številko (npr. »Cesta prvih borcev 18, Brežice« ali »Dobova 25«), aplikacija najde točko naslova v OpenStreetMap in izračuna <b>cestno razdaljo OD → DO</b>. Google Zemljevidov ni treba odpirati. Pri vsakem vpisu je viden vir in natančnost: <b>~</b> pomeni, da OSM za ta naslov nima hišne številke. Takrat točko potrdi ali popravi na zemljevidu (gumb »Točka na zemljevidu« pri prevozu). Strežnik dobi <b>samo besedilo naslova</b>, brez imena, telefona in naloga.</div></div>
    <div>${mode}</div>
    <div class="stack" style="gap:8px">
      ${chk('settings.geocode.on', G.on !== false, 'Išči točke naslovov v OpenStreetMap')}
      ${chk('settings.geocode.auto', G.auto !== false, 'Izračunaj samodejno, ko vpišem OD in DO (in ob odprtju dneva od včeraj do 14 dni naprej)')}</div>
    <div class="row"><button type="button" class="btn sm" data-act="geoTest" ${gi.configured ? '' : 'disabled'}>Preveri iskanje naslovov</button><span class="hint">Poskusno iskanje: Zdravstveni dom Brežice (en zahtevek).</span></div>
    ${test}
    <p class="hint" style="margin:0">V tej seji: ${gi.calls} zahtevkov${gi.errors ? ', ' + gi.errors + ' napak' : ''}, ${gi.cached} naslovov v pomnilniku${gi.queued ? ', v čakalni vrsti ' + gi.queued : ''}${gi.host ? ' · strežnik: ' + esc(gi.host) : ''}. Ročno popravljenih točk: ${nfix}.</p>
    <details class="hintdet"><summary>Zasebnost, omejitve in kako deluje</summary><p class="hint" style="margin:6px 0 0">Javni strežnik Nominatim (OpenStreetMap) je brezplačen, vendar velja pravilo največ 1 zahtevek na sekundo, brez množičnega iskanja in brez samodokončanja med tipkanjem: aplikacija išče šele, ko vnos potrdiš, zahtevke postavi v vrsto in vsak naslov poišče samo enkrat (točka se shrani pri pacientu in za ponovne prevoze, npr. dializo, se ne išče znova). Strežnik vidi besedilo naslova, IP naslov naprave in izvor te strani. Naslovi pacientov so osebni podatki: za redno delo preveri s pooblaščencem za varstvo podatkov ali uporabi lasten strežnik (config.js → geocode.url, v CSP v build-prod.py dodaj njegov izvor). Zadetek, ki je več kot nekaj km od prepoznanega kraja, aplikacija zavrne (npr. ista ulica v drugem kraju) in uporabi središče naselja z oznako ~. Cestno pot izračuna OSRM po omrežju OpenStreetMap; razdalja se lahko od Google Zemljevidov razlikuje za nekaj odstotkov (drugačna izbira poti), zato je ročni vnos km vedno mogoč. Podatki © prispevajoči OpenStreetMap (ODbL).</p></details></div>`;
}
/* ---------- Nastavitve: Google, dializa, klinike ---------- */
function googleCard(){
  const gi = GOOGLE.info(), G = S.settings.google || {}, t = UI.gTest;
  const cfgKey = !!(((window.KP_CONFIG && window.KP_CONFIG.google && window.KP_CONFIG.google.key) || '').trim()), local = !!store.get('kp.gkey');
  const tone = !gi.configured || !gi.on ? 'warn' : gi.status === 'error' ? 'bad' : gi.status === 'ok' ? 'ok' : 'info';
  const txt = !gi.configured ? 'ključ ni vnesen' : !gi.on ? 'izklopljeno' : gi.status === 'error' ? 'napaka' : gi.status === 'ok' ? 'deluje' : 'pripravljeno';
  const test = t ? (t.running ? '<span class="chip info">Preverjam …</span>' : `<div class="banner ${t.ok ? '' : 'warn'}"><span>${IC.info}</span><div><b>${t.ok ? 'Google deluje' : 'Preizkus ni uspel'}</b>${t.km ? ` · SB Brežice → UKC Ljubljana: ${KM.fmtKm(t.km)} km, ${Math.round(t.min)} min (${t.ms} ms)` : ''}<br>${esc(t.msg)}</div></div>`) : '';
  const chk = (path, on, label) => `<label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="${path}" data-bool="1" ${on ? 'checked' : ''}> ${label}</label>`;
  return `<div class="card card-pad stack" style="gap:12px"><div class="card-head" style="margin:0"><h3>Google Zemljevidi (neobvezno, plačljivo)</h3><span class="chip ${tone}">${txt}</span></div>
    <div class="banner"><span>${IC.info}</span><div>Kilometrina vsakega prevoza se izračuna z Googlom po najboljši cestni poti <b>OD → DO</b>, kot v Google Zemljevidih. Google dobi <b>samo besedilo naslova OD in DO</b> (brez imena, telefona in naloga). Rezultat se zapiše v knjigo z oznako vira. Naslovi pacientov so osebni podatki: pred uporabo se posvetuj s pooblaščencem za varstvo podatkov.</div></div>
    <div class="stack" style="gap:8px">
      ${chk('settings.google.on', G.on !== false, 'Uporabi Google za kilometrino')}
      ${chk('settings.google.auto', G.auto !== false, 'Izračunaj samodejno, ko vpišem OD in DO (in ob odprtju dneva od včeraj do 14 dni naprej)')}
      ${chk('settings.google.traffic', !!G.traffic, 'Upoštevaj promet pri času vožnje (dražja zahteva)')}</div>
    <div class="field full"><label for="gkey">Ključ API ${local ? '<span class="chip ok">shranjen na tej napravi</span>' : cfgKey ? '<span class="chip ok">v config.js</span>' : ''}</label>
      <div class="row" style="flex-wrap:nowrap"><input id="gkey" type="password" autocomplete="off" spellcheck="false" placeholder="${local ? 'vpiši novega, da zamenjaš' : 'AIza…'}"><button type="button" class="btn sm" data-act="gkeySave">Shrani</button>${local ? '<button type="button" class="btn sm danger" data-act="gkeyClear">Odstrani</button>' : ''}</div>
      <span class="hint">Ključ vpisan tu velja samo za to napravo. Za vse naprave ga vpiši v config.js (google.key); v obeh primerih ga omeji na naslov te strani in na Routes API.</span></div>
    <div class="row"><button type="button" class="btn sm" data-act="gTest" ${gi.configured ? '' : 'disabled'}>Preveri Google</button><span class="hint">Poskusni izračun: SB Brežice → UKC Ljubljana (en zahtevek).</span></div>
    ${test}
    <p class="hint" style="margin:0">V tej seji: ${gi.calls} zahtevkov, ${gi.errors} napak, ${gi.cached} poti v pomnilniku${gi.queued ? ', v čakalni vrsti ' + gi.queued : ''}.</p>
    <details class="hintdet"><summary>Kako dobiš ključ in koliko stane</summary><p class="hint" style="margin:6px 0 0">1) V Google Cloud Console ustvari projekt in vklopi obračun. 2) Vklopi »Routes API«. 3) Ustvari ključ API in ga omeji: aplikacije → spletna mesta (HTTP referrer) z naslovom te strani (npr. https://uporabnik.github.io/*), API-ji → samo Routes API. 4) Vnesi ga zgoraj ali v config.js. Google zaračunava po zahtevku; cena in brezplačna kvota se spreminjata, zato preveri trenutni cenik za Routes API (Compute Routes). Aplikacija uporablja Google samo za natančen km vpisanih prevozov, razpored pa računa po cestah OpenStreetMap, da je zahtevkov malo (za vsak prevoz eden, pri čakanju na pregled dva). Poti se ne shranjujejo v trajni predpomnilnik; Googlova pravila o shranjevanju podatkov preveri pred uvedbo.</p></details></div>`;
}
function diaTab(){
  const adm = isAdmin(), T = S.settings.diaT, byName = (a, b) => a.name.localeCompare(b.name, 'sl');
  const dp = S.patients.filter(p => p.dt).sort(byName), free = S.patients.filter(p => !p.dt).sort(byName);
  const tm = (t, k) => adm ? field(`settings.diaT.${t}.${k}`, T[t][k], { time:1, label:`${DIA_TERMS[t]} ${k === 'start' ? 'začetek' : 'konec'}` }) : `<b class="mono">${esc(T[t][k])}</b>`;
  const terms = Object.keys(DIA_TERMS).map(t => `<tr><td><b>${DIA_TERMS[t]} dializa</b></td><td>${tm(t, 'start')}</td><td>${tm(t, 'end')}</td></tr>`).join('');
  const rows = dp.map(p => `<tr data-pid="${p.id}"><td><button type="button" class="linkbtn" data-act="openPatient" data-id="${p.id}">${esc(p.name)}</button><div class="hint">${esc(p.addr || 'brez naslova')}</div></td>
    <td><div class="seg" role="group" aria-label="Termin dialize">${Object.keys(DIA_TERMS).map(t => `<button type="button" data-act="diaTerm" data-id="${p.id}" data-t="${t}" aria-pressed="${p.dt.t === t}">${DIA_TERMS[t]}</button>`).join('')}</div></td>
    <td><div class="row" style="gap:4px">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip toggle" data-act="diaDay" data-id="${p.id}" data-d="${d}" aria-pressed="${(p.dt.d || []).includes(d)}">${DOW_SHORT[d]}</button>`).join('')}</div></td>
    <td><button type="button" class="icon-btn" data-act="diaDel" data-id="${p.id}" aria-label="Odstrani ${esc(p.name)} iz dialize">${IC.x}</button></td></tr>`).join('');
  const cur = S.settings.diaPlace || '', cands = [...POIS.filter(x => x.dia || /^SB |^ZD |dializ/i.test(x.n)).map(x => x.n), ...S.places.filter(x => /dializ/i.test(x.n) || !x.parent).map(x => x.n)];
  const center = `<div class="card card-pad stack" style="gap:8px"><h3>Kje je dializni center?</h3>
      <p class="hint" style="margin:0">Kratice »Dializa«, »Dializa KK«, »KK dializa« in ime dializnega centra v knjigi se vedno preberejo kot ta ustanova (cilj, koordinate in pot). Dokler ni izbrana, se uporablja Dializni center Krško (Nefrodial; v knjigi »Dializa KK«) – koordinate so približne, po potrebi izberi drugo ustanovo ali dodaj svojo.</p>
      ${adm ? `<select data-path="settings.diaPlace" aria-label="Dializni center"><option value="">${esc(DIA_DEFAULT)} (privzeto)</option>${[...new Set(cands)].filter(n => n !== DIA_DEFAULT).map(n => `<option value="${esc(n)}" ${cur === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : `<b>${esc(cur || DIA_DEFAULT + ' (privzeto)')}</b>`}</div>`;
  return `<div class="stack">${center}<div class="card card-pad stack"><h3>Termina dialize</h3>
      <p class="muted" style="margin:0">Dializni bolniki imajo dopoldanski ali popoldanski termin. Prevoz tja je ob začetku termina, prevoz nazaj ob koncu. Posadka, ki pelje na dializo, lahko po koncu dialize prevaža tudi sede paciente: razpored jim jih doda v prostem času, če to ne ovira dialize.</p>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Termin</th><th>Začetek</th><th>Konec</th></tr></thead><tbody>${terms}</tbody></table></div>
      ${adm ? '' : '<p class="hint" style="margin:0">Ure terminov spreminja skrbnik.</p>'}</div>
    <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Dializni pacienti</h3><span class="chip mono">${dp.length}</span></div>
      <form class="row" data-form="diaAdd" style="flex-wrap:nowrap"><select name="pid" aria-label="Pacient" required><option value="">Izberi pacienta iz baze …</option>${free.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
        <select name="t" style="width:auto" aria-label="Termin">${Object.keys(DIA_TERMS).map(t => `<option value="${t}">${DIA_TERMS[t]}</option>`).join('')}</select><button class="btn primary" type="submit">Dodaj</button></form>
      ${dp.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th>Pacient</th><th>Termin</th><th>Dnevi</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state">Še ni dializnih pacientov. Izberi pacienta iz baze in termin.</div>'}
      <p class="hint" style="margin:0">Dnevni prevozi tja in nazaj se vpišejo v knjigo z gumbom »Naloži dializne paciente« (v meniju Več pri dnevu). Pacient mora biti v bazi pacientov, nalog pa se vodi tam.</p></div></div>`;
}
function placesTab(){
  const parents = [...POIS.filter(p => !p.home || /^SB |UKC|UKM|OI |URI/.test(p.n)).map(p => p.n), ...S.places.filter(p => !p.parent && p.n).map(p => p.n)];
  const pl = (i, k, v, o = {}) => `<input data-pl="${i}|${k}" type="${o.num ? 'number' : 'text'}" ${o.num ? 'min="0" step="5" inputmode="numeric"' : ''} value="${esc(v == null ? '' : v)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} aria-label="${esc(o.label || k)}" autocomplete="off">`;
  const list = S.places.map((p, i) => ({ p, i })).sort((a, b) => (a.p.parent || a.p.n).localeCompare(b.p.parent || b.p.n, 'sl') || a.p.n.localeCompare(b.p.n, 'sl'));
  const rows = list.map(({ p, i }) => `<tr><td><select data-pl="${i}|parent" aria-label="Ustanova"><option value="">(samostojna ustanova)</option>${[...new Set(parents)].filter(n => n !== p.n).map(n => `<option value="${esc(n)}" ${p.parent === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></td>
    <td>${pl(i, 'n', p.n, { label:'Ime klinike ali ustanove', ph:'npr. Očesna klinika' })}</td><td>${pl(i, 'al', (p.al || []).join(', '), { label:'Druga imena', ph:'oči, ocesna' })}</td>
    <td>${pl(i, 'addr', p.addr, { label:'Naslov (za Google)', ph:'ulica, kraj' })}</td>
    <td class="coord">${pl(i, 'stay', p.stay, { num:1, label:'Čakanje na pregled v minutah', ph:'min' })}</td><td class="coord">${pl(i, 'extra', p.extra, { num:1, label:'Pot do ambulante v minutah', ph:'min' })}</td>
    <td><details class="menu"><summary class="btn sm ghost">Točka</summary><div class="menupop"><label class="mini">Širina (lat)${pl(i, 'lat', p.lat, { label:'Širina' })}</label><label class="mini">Dolžina (lon)${pl(i, 'lon', p.lon, { label:'Dolžina' })}</label><span class="hint">Prazno = točka ustanove.</span></div></details></td>
    <td><button type="button" class="icon-btn" data-act="delPlace" data-i="${i}" aria-label="Izbriši ${esc(p.n)}">${IC.x}</button></td></tr>`).join('');
  return `<div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Klinike, ambulante in druge ustanove</h3><div class="row" style="gap:6px"><button type="button" class="btn sm primary" data-act="addPlace" data-k="clinic">${IC.plus} Dodaj kliniko</button><button type="button" class="btn sm" data-act="addPlace" data-k="inst">${IC.plus} Dodaj ustanovo</button></div></div>
      <div class="banner"><span>${IC.info}</span><div>Vpiši »UKC Ljubljana – Očesna klinika« ali samo »očesna klinika« in aplikacija ve, kam voziti, kako dolgo traja pregled in koliko hoje je od vhoda do ambulante. <b>Čakanje na pregled</b>: če pacient potrebuje pregled, reševalec počaka in ga odpelje nazaj; razpored to upošteva (prevoz nazaj se ne vpisuje posebej). <b>Naslov</b> se uporabi za natančen izračun kilometrov z Googlom: začetni naslovi so predlogi, preveri jih.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th>Ustanova</th><th>Klinika / ambulanta</th><th>Druga imena</th><th>Naslov</th><th>Pregled (min)</th><th>Pot do amb. (min)</th><th></th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="muted">Ni vpisov.</td></tr>'}</tbody></table></div>
      <p class="hint" style="margin:0">Samostojna ustanova (npr. zasebna ordinacija ali zdravilišče) potrebuje naslov, po možnosti tudi točko (lat, lon); brez točke se za razpored uporabi središče Brežic, km pa vseeno izračuna Google po naslovu.</p></div></div>`;
}

const field = (path, val, opts={}) => `<input data-path="${path}" ${opts.num ? 'type="number" data-num="1" step="' + (opts.step || 1) + '"' : (opts.time ? 'type="time"' : 'type="text"')} value="${esc(val)}" ${opts.sug ? 'data-suggest="from"' : ''} ${opts.ph ? 'placeholder="' + esc(opts.ph) + '"' : ''} ${opts.label ? 'aria-label="' + esc(opts.label) + '"' : ''}>`;
function settingsTabs(){
  const t = [['vozila','Vozila',true],['zaposleni','Zaposleni',false],['dializa','Dializa',false],['ustanove','Klinike',false],['planiranje','Izračun',true],['tisk','Tisk naloga',true],['pravila','Pravila',true],['naslovi','Naslovi in naselja',true],['uporabniki','Uporabniki',true],['varnost','Varnost',true],['logotipi','Logotipi',true],['podatki','Podatki',false]];
  return `<div class="tabs" role="tablist">${t.filter(x => !x[2] || isAdmin()).map(x => `<button type="button" role="tab" data-act="setTab" data-k="${x[0]}" aria-selected="${UI.setTab === x[0]}">${x[1]}</button>`).join('')}</div>`;
}
const accountOptions = cur => {
  const list = BACKEND === 'firebase' ? USERS_REMOTE.map(u => ({ id:u.id, name:u.name, role:u.role })) : USERS.map(u => ({ id:u.id, name:u.name, role:u.role }));
  return `<option value="">brez računa</option>` + list.map(u => `<option value="${esc(u.id)}" ${cur === u.id ? 'selected' : ''}>${esc(u.name)} (${esc(ROLES[u.role] || u.role)})</option>`).join('');
};
function renderSettings(){
  if (!isAdmin() && ['vozila','pravila','planiranje','tisk','naslovi','uporabniki','varnost','logotipi'].includes(UI.setTab)) UI.setTab = 'dializa';
  let body = '';
  const T = UI.setTab;
  if (T === 'vozila'){
    const num = (i, k, v, lbl) => field(`vehicles.${i}.${k}`, v, { num:1, label:lbl });
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Vozila in kapaciteta</h3><button type="button" class="btn primary sm" data-act="addVeh">${IC.plus} Dodaj vozilo</button></div>
      <div class="banner"><span>${IC.info}</span><div><b>Običajno</b> je število pacientov, ki jih vozilo vozi po pravilih. <b>Izjemoma</b> je največ, kar vozilo še lahko pelje, kadar je treba pravila prilagoditi (npr. vozilo s 6 sedeži, ki običajno vozi 4 paciente). Prilagoditev se uporabi samo, ko je potrebna, in je vedno izpisana. Vrstica »OSTALO« ni vozilo, ampak mesto za zaposlene brez vozila. Začetne številke so ocena, popravi jih.</div></div>
      <div class="tablewrap"><table class="edtable"><thead><tr><th rowspan="2">Ime</th><th rowspan="2">Reg. tablica</th><th rowspan="2">Vrsta</th><th rowspan="2">Tip vozila</th><th rowspan="2">Namen</th><th rowspan="2">Ekipa</th><th colspan="4">Običajno</th><th colspan="4">Izjemoma največ</th><th rowspan="2">Aktivno</th><th rowspan="2"></th></tr><tr><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th><th>Sede</th><th>Leže</th><th>Utila</th><th>Skupaj</th></tr></thead><tbody>
      ${S.vehicles.map((v, i) => `<tr><td>${field(`vehicles.${i}.name`, v.name, { label:'Ime' })}</td><td>${field(`vehicles.${i}.reg`, v.reg || '', { label:'Registrska tablica', ph:'KK AB-123' })}</td>
        <td><select data-path="vehicles.${i}.tip" aria-label="Vrsta"><option value="sanitetno" ${v.tip==='sanitetno'?'selected':''}>Sanitetno</option><option value="resevalno" ${v.tip==='resevalno'?'selected':''}>Reševalno</option><option value="ostalo" ${v.tip==='ostalo'?'selected':''}>Ostalo (brez vozila)</option></select></td>
        <td><select data-path="vehicles.${i}.vrsta" aria-label="Tip vozila">${Object.entries(VEH_VRSTE).map(([k, l]) => `<option value="${k}" ${v.vrsta === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><select data-path="vehicles.${i}.fn" aria-label="Namen">${Object.entries(VEH_FN).map(([k, l]) => `<option value="${k}" ${v.fn === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><select data-path="vehicles.${i}.ns" aria-label="Ekipa"><option value="redna" ${v.ns==='redna'?'selected':''}>Redna</option><option value="NN" ${v.ns==='NN'?'selected':''}>NN</option><option value="oboje" ${v.ns==='oboje'?'selected':''}>Oboje</option></select></td>
        <td>${num(i,'sede',v.sede,'Sede')}</td><td>${num(i,'leze',v.leze,'Leže')}</td><td>${num(i,'utila',v.utila,'Utila')}</td><td>${num(i,'skupaj',v.skupaj,'Skupaj')}</td>
        <td>${num(i,'sedeMax',v.sedeMax,'Sede največ')}</td><td>${num(i,'lezeMax',v.lezeMax,'Leže največ')}</td><td>${num(i,'utilaMax',v.utilaMax,'Utila največ')}</td><td>${num(i,'skupajMax',v.skupajMax,'Skupaj največ')}</td>
        <td><input type="checkbox" data-path="vehicles.${i}.aktiv" data-bool="1" ${v.aktiv ? 'checked' : ''} aria-label="Aktivno"></td>
        <td><button type="button" class="icon-btn" data-act="delVeh" data-i="${i}" aria-label="Izbriši vozilo">${IC.x}</button></td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint" style="margin:0">Nosil (leže) aplikacija nikoli ne »ustvari«: če vozilo nima nosil, ostane pacient leže nerazporejen in dobiš opozorilo.</p></div>`;
  } else if (T === 'zaposleni'){
    body = `<div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Zaposleni</h3></div>
      <form class="row" data-form="addStaff" style="flex-wrap:nowrap"><input type="text" name="name" placeholder="Ime in priimek" aria-label="Ime zaposlenega" required autocomplete="off"><select name="team" style="width:auto" aria-label="Ekipa"><option value="redna">Redna ekipa</option><option value="NN">NN ekipa</option></select><button class="btn primary" type="submit">Dodaj</button></form>
      ${S.staff.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th>Ime in priimek</th><th>Privzeta ekipa</th><th>Račun za aplikacijo posadke</th><th></th></tr></thead><tbody>${S.staff.map((s, i) => `<tr><td>${field(`staff.${i}.name`, s.name, { label:'Ime' })}${s.demo ? ' <span class="chip warn">PRIMER</span>' : ''}</td><td><select data-path="staff.${i}.team" aria-label="Ekipa"><option value="redna" ${s.team==='redna'?'selected':''}>Redna</option><option value="NN" ${s.team==='NN'?'selected':''}>NN</option></select></td><td><select data-path="staff.${i}.userId" aria-label="Račun">${accountOptions(s.userId)}</select></td><td><button type="button" class="icon-btn" data-act="delStaff" data-i="${i}" aria-label="Izbriši">${IC.x}</button></td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">Zaposlenega poveži z računom (Nastavitve → Uporabniki), da bo po »Objavi razpored« videl svoje prevoze v aplikaciji in javljal korake.</p>` : '<div class="empty-state">Še ni zaposlenih. Dodani zaposleni se v Dispečerju izberejo z enim dotikom.</div>'}
      <details class="stimp" ${S.staff.length ? '' : 'open'}><summary><b>Uvozi seznam zaposlenih</b></summary>
        <form class="stack" data-form="importStaff" style="gap:8px;margin-top:8px">
          <p class="hint" style="margin:0">Prilepi imena (eno na vrstico) ali izberi besedilno datoteko (.txt, .csv). Sprejme »Ana K.«, »Ana K« in zlepljeno »AnaK«. Že vpisani se preskočijo.</p>
          <textarea name="list" rows="6" data-role="stlist" placeholder="Ana K.&#10;Beta B.&#10;Gama G." aria-label="Seznam zaposlenih" spellcheck="false" autocomplete="off"></textarea>
          <div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn" for="stfile" style="cursor:pointer">Izberi datoteko …</label><input id="stfile" type="file" accept=".txt,.csv,text/plain,text/csv" data-role="stfile" style="position:absolute;opacity:0;width:1px;height:1px">
            <select name="team" style="width:auto" aria-label="Ekipa za vse uvožene"><option value="redna">Redna ekipa</option><option value="NN">NN ekipa</option></select>
            <button class="btn primary" type="submit" data-role="stgo" disabled>Dodaj</button></div>
          <div class="hint" data-role="stprev" role="status">Seznam je prazen.</div>
        </form></details></div>`;
  } else if (T === 'pravila'){
    body = rulesTab();
  } else if (T === 'dializa'){
    body = diaTab();
  } else if (T === 'ustanove'){
    body = placesTab();
  } else if (T === 'tisk'){
    body = tiskCard();
  } else if (T === 'planiranje'){
    const k = (label, path, step=1, unit='') => `<label for="k-${path}">${label}${unit ? ' <span class="dim">(' + unit + ')</span>' : ''}</label>${field(path, S.settings[path.split('.')[1]], { num:1, step, label })}`.replace('data-path', `id="k-${path}" data-path`);
    const kl = (label, key) => `<label for="k-lim-${key}">${label} <span class="dim">(km/h)</span></label>${field('settings.lim.' + key, S.settings.lim[key], { num:1, step:1, label }).replace('data-path', 'id="k-lim-' + key + '" data-path')}`;
    body = `<div class="stack">${geocodeCard()}${routingCard()}${googleCard()}${mapCard()}<details class="card card-pad sect" data-sect="param" ${UI.sect.param ? 'open' : ''}><summary><h3>Parametri izračuna: hitrosti, časi pobiranja, rezerve</h3></summary><div class="kv" style="margin-top:12px">
      ${kl('Omejitev v naselju','naselje')}${kl('Omejitev izven naselij','izven')}${kl('Omejitev na hitri cesti','hitra')}${kl('Omejitev na avtocesti','avtocesta')}${k('Dejanska hitrost glede na omejitev','settings.eff',1,'%')}${k('Faktor ceste (samo za ocene brez cestnih podatkov)','settings.road',0.05)}${k('Pobiranje sede pacienta','settings.pickMin',1,'min')}${k('Odpuščanje sede pacienta','settings.dropMin',1,'min')}${k('Pobiranje leže pacienta','settings.pickLeze',1,'min')}${k('Odpuščanje leže pacienta','settings.dropLeze',1,'min')}${k('Pobiranje pacienta na vozičku','settings.pickUtila',1,'min')}${k('Odpuščanje pacienta na vozičku','settings.dropUtila',1,'min')}${k('Privzet čas pregleda (čakanje)','settings.stayDef',5,'min')}${k('Privzeta pot od vhoda do ambulante','settings.extraDef',1,'min')}
      ${k('Rezerva pred preiskavo','settings.buffer',1,'min')}${k('Okno združevanja po uri','settings.window',5,'min')}${k('Okno združevanja pri oddaljenih ciljih (Ljubljana, Novo mesto)','settings.windowFar',10,'min')}${k('NN ekipa: najdlje od postaje (0 = brez omejitve)','settings.nnMaxKm',5,'km')}${k('Največji dodaten čas za soprevoznika','settings.detour',5,'min')}${k('Najdaljša vožnja pacienta v vozilu','settings.maxRide',5,'min')}
      ${k('Čakanje pri odvozu brez zamude','settings.waitTol',1,'min')}${k('Število polj v knjigi na dan','settings.slots',1,'polj')}${k('Samodejna odjava','settings.idleMin',5,'min')}
      <label for="k-shift">Privzet začetek izmene</label><input id="k-shift" type="time" data-path="settings.shift" value="${esc(S.settings.shift)}"></div>
      <p class="hint" style="margin:0">Spremembe veljajo takoj. Razpored za današnji in jutrišnji dan se ponovno izračuna.</p></details></div>`;
  } else if (T === 'naslovi'){
    body = `<div class="stack"><div class="card card-pad stack"><h3>Naslovi za samodejno dopolnjevanje</h3>
      <p class="muted" style="margin:0">Predlogi zajemajo vseh ${SETTLEMENTS.length} naselij Občine Brežice, ustanove, del ulic v Brežicah in naslove, ki jih že vpisuješ (${S.addrBook.length}). Za predloge do hišne številke uvozi CSV z naslovi (npr. iz odprtih podatkov GURS, register prostorskih enot). Stolpci: ulica, hišna številka, naselje, ter koordinate (lat, lon v WGS84 ali E, N v D96/TM); stolpec občina je neobvezen (uvozijo se samo naslovi Občine Brežice). Da bodo naslovi na vseh napravah, po uvozu klikni »Prenesi naslovi.json« in datoteko naloži na GitHub poleg index.html (glej navodila).</p>
      <div class="row"><input type="file" id="csvFile" accept=".csv,text/csv,text/plain" style="max-width:320px"><span class="chip mono">uvoženih: ${ADDR.list.length}${SHARED_ADDR.length ? ' (skupnih: ' + SHARED_ADDR.length + ')' : ''}</span><button type="button" class="btn sm" data-act="exportAddr">Prenesi naslovi.json</button><button type="button" class="btn sm danger" data-act="clearAddr">Izbriši uvožene</button><button type="button" class="btn sm" data-act="clearLearned">Pozabi naučene naslove</button></div></div>
      <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Koordinate naselij</h3><span class="chip warn">približne vrednosti</span></div>
      <p class="muted" style="margin:0">Izračun razdalj uporablja te točke. Če poznaš boljše koordinate, jih popravi. Spremenjene vrstice so označene.</p>
      <div class="scrollbox"><table class="edtable"><thead><tr><th>Naselje</th><th>Širina (lat)</th><th>Dolžina (lon)</th><th></th></tr></thead><tbody>${SETTLEMENTS.map((s, i) => { const o = S.coordOv[s.n]; return `<tr><td>${esc(s.n)}</td><td class="coord"><input type="number" step="0.001" data-coord="${i}|0" value="${o ? o[0] : s.lat}" aria-label="${esc(s.n)} lat"></td><td class="coord"><input type="number" step="0.001" data-coord="${i}|1" value="${o ? o[1] : s.lon}" aria-label="${esc(s.n)} lon"></td><td>${o ? '<span class="chip accent">spremenjeno</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  } else if (T === 'uporabniki'){
    body = usersTab();
  } else if (T === 'varnost'){
    body = securityTab();
  } else if (T === 'logotipi'){
    body = logosTab();
  } else {
    body = dataTab();
  }
  $('#view').innerHTML = `${settingsTabs()}<div style="height:14px"></div>${body}`;
}

/* ---------- Prijava ---------- */
function renderAuth(mode, msg=''){
  const first = BACKEND !== 'firebase' && USERS.length === 0;
  const card = $('#authCard');
  const local = BACKEND !== 'firebase' ? `<div class="banner warn" style="font-size:12.5px"><span>${IC.info}</span><div><b>Lokalni način.</b> Podatki so samo v tem brskalniku. Uporabi samo izmišljene podatke.${LOCAL_WHY ? `<br><b>Zakaj:</b> ${esc(LOCAL_WHY)}` : ' Za pravo uporabo glej navodila (Firebase).'}</div></div>` : '';
  if (first){
    card.innerHTML = `<h2>Prvi zagon</h2><p class="muted" style="margin:0">Ustvari račun skrbnika. Pozneje dodaš še račune za dispečerje in posadke.</p>${local}
      <form id="setupForm"><div class="field"><label for="su">Uporabniško ime</label><input id="su" name="username" required autocomplete="username"></div>
      <div class="field"><label for="sn">Ime in priimek</label><input id="sn" name="name" autocomplete="name"></div>
      <div class="field"><label for="sp">Geslo (vsaj 10 znakov)</label><input id="sp" name="pw" type="password" minlength="10" required autocomplete="new-password"></div>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" name="demo" checked> Naloži primere (izmišljeni pacienti, voznik in spremljevalec)</label>
      <button class="btn primary" type="submit">Ustvari račun in začni</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      <p class="legalnote">Podatki o pacientih se ne shranjujejo na GitHub. Prijava deluje v tem brskalniku.</p>`;
  } else {
    card.innerHTML = `<h2>Prijava</h2><p class="muted" style="margin:0">Dostop imajo samo zaposleni Reševalne postaje Brežice.</p>${local}
      <form id="loginForm"><div class="field"><label for="lu">${BACKEND === 'firebase' ? 'Uporabniško ime ali e-pošta' : 'Uporabniško ime'}</label><input id="lu" name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" autofocus></div>
      <div class="field"><label for="lp">Geslo</label><input id="lp" name="pw" type="password" required autocomplete="current-password"></div>
      ${BACKEND === 'firebase' ? '<label class="row" style="gap:8px;flex-wrap:nowrap;font-size:13px"><input type="checkbox" name="remember"> Ostani prijavljen na tej napravi (ne na skupnem računalniku)</label>' : ''}
      <button class="btn primary" type="submit">Prijava</button><div class="auth-err" id="authErr" role="alert">${esc(msg)}</div></form>
      ${BACKEND === 'firebase' ? `<p class="hint" style="margin:0">Uporabniško ime »ime« se v Firebase išče kot ${FB_USER_DOMAINS.map(d => `<b>ime@${esc(d)}</b>`).join(' ali ')}; z @ vneseš celoten e-naslov računa.</p>` : ''}
      ${BACKEND === 'firebase' ? '<details class="fbhelp"><summary>Težave s prijavo?</summary><button type="button" class="btn small" id="fbCheck">Preveri povezavo</button><div id="fbCheckOut" aria-live="polite"></div></details>' : ''}
      <p class="legalnote">Podatke o pacientih obravnavaj skladno z internimi pravili zdravstvenega doma. Vsaka prijava in ogled pacienta se beležita.</p>`;
    const fbb = $('#fbCheck'); if (fbb) fbb.onclick = () => { fbb.disabled = true; fbCheck().finally(() => { fbb.disabled = false; }); };
  }
}

/* uvoz zaposlenih: sprotni predogled (koliko bo dodanih, koliko že obstaja) */
function stPreview(){
  const ta = document.querySelector('[data-role=stlist]'); if (!ta) return null;
  const r = parseStaffList(ta.value, S.staff.map(s => s.name)), pv = document.querySelector('[data-role=stprev]'), go = document.querySelector('[data-role=stgo]');
  if (go){ go.disabled = !r.add.length; go.textContent = r.add.length ? `Dodaj ${r.add.length}` : 'Dodaj'; }
  if (pv){
    pv.textContent = !ta.value.trim() ? 'Seznam je prazen.' : (r.add.length ? `Dodal bom ${r.add.length}: ${r.add.join(', ')}.` : 'Ni novih imen za dodajanje.') + (r.dup.length ? ` Že na seznamu (preskočeno): ${r.dup.join(', ')}.` : '') + (r.bad.length ? ` Ni videti kot ime (preskočeno): ${r.bad.join(', ')}.` : '');
  }
  return r;
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('input', e => { if (e.target && e.target.dataset && e.target.dataset.role === 'stlist') stPreview(); });
  document.addEventListener('change', async e => {
    const t = e.target; if (!t || !t.dataset || t.dataset.role !== 'stfile') return;
    const f = t.files && t.files[0]; t.value = ''; if (!f) return;
    try { const txt = await f.text(), ta = document.querySelector('[data-role=stlist]'); if (ta){ ta.value = (ta.value ? ta.value.replace(/\s+$/, '') + '\n' : '') + txt; stPreview(); } } catch (err) { toast('Datoteke ni mogoče prebrati.'); }
  });
}

/* =====================================================================
   ZASLONI 2: pacienti in nalogi, živo stanje, aplikacija posadke, pravila, uporabniki, varnost, logotipi, podatki, predogled
   ===================================================================== */
let USERS_REMOTE = [];
const RULE_MODES = { strogo:'Strogo', samodejno:'Samodejno', prosto:'Prosto' };
const RULE_DESC = {
  strogo:'Samo običajne vrednosti. Če se prevoz ne izide, ostane nerazporejen z razlogom. Ročna izjema na prevozu ali pripeto vozilo še vedno dovolita prilagoditev.',
  samodejno:'Najprej običajne vrednosti. Če se prevoz ne izide ali bi zamudil, se pravila prilagodijo samo toliko, kot je treba, in vsaka prilagoditev je izpisana.',
  prosto:'Prilagoditve so vedno dovoljene: največja kapaciteta vozila, daljše poti, krajša rezerva in nadure.'
};
const NALOG_RAZLOGI = ['Dializa', 'Obsevanje', 'Kemoterapija', 'Rehabilitacija', 'Specialistični pregled', 'Preiskava (RTG, CT, MR)', 'Sprejem v bolnišnico', 'Odpust iz bolnišnice', 'Kontrola po operaciji', 'Drugo'];

/* ---------- Opozorila o nalogih ---------- */
function alertsBanner(){
  const al = nalogAlerts(); if (!al.length) return '';
  const exp = al.filter(a => a.s.st === 'potekel').length, soon = al.length - exp;
  return `<div class="banner ${exp ? 'bad' : 'warn'}"><span>${IC.alert}</span><div><b>${al.length} ${al.length === 1 ? 'nalog' : 'nalogov'} za prevoz</b>: ${soon ? `kmalu poteče (${soon})` : ''}${soon && exp ? ', ' : ''}${exp ? `potekel (${exp})` : ''}. <button type="button" class="linkbtn" data-act="pfAlerts">Odpri seznam</button></div></div>`;
}

/* ---------- Dispečer: pravila za dan in objava ---------- */
function rulesBar(date, plan, wBend){
  const mode = dayMode(date), own = !!(S.dayRules[date] && S.dayRules[date].mode), nb = (wBend || []).length;
  return `<details class="card card-pad sect ctrl" data-sect="rules" ${UI.sect.rules ? 'open' : ''}><summary><h3>Pravila razporejanja</h3><span class="chip ${own ? 'accent' : ''}">${esc(RULE_MODES[mode])}${own ? ' · samo za ta dan' : ''}</span>${nb ? `<span class="chip accent">${nb} prilagoditev</span>` : ''}</summary>
    <div class="stack" style="gap:8px;margin-top:10px"><div class="ctrl-row"><span class="lbl">Način</span>
    <div class="seg" role="group" aria-label="Način pravil">${Object.entries(RULE_MODES).map(([k, l]) => `<button type="button" data-act="dayMode" data-k="${k}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>
    ${own ? '<button type="button" class="btn sm ghost" data-act="dayModeReset">Uporabi privzeto</button>' : '<span class="chip">privzeto</span>'}</div>
    <p class="hint" style="margin:0"><b>${esc(RULE_MODES[mode])}:</b> ${RULE_DESC[mode]}</p>
    ${nb ? `<ul class="warnlist">${wBend.map(w => `<li class="w-bend"><span class="chip accent">prilagojeno</span> ${esc(w.text)}</li>`).join('')}</ul>` : ''}</div></details>`;
}
function publishBar(date, plan){
  const st = publishState(date), pub = S.published[date];
  const duty = S.duty[date] || [], noAcc = duty.filter(d => { const s = staffOfDuty(d); return !(s && s.userId); });
  const chip = st === 'ok' ? `<span class="chip ok">objavljeno ob ${timeOf(pub.at)}</span>` : st === 'spremenjeno' ? '<span class="chip warn">spremenjeno po objavi</span>' : '<span class="chip">ni objavljeno</span>';
  return `<div class="card card-pad stack ctrl" style="gap:8px"><div class="ctrl-row"><span class="lbl">Posadke</span>${chip}${noAcc.length ? `<span class="chip warn" title="Brez računa ne vidijo razporeda v aplikaciji: ${esc(noAcc.map(d => d.name).join(', '))}. Poveži v Nastavitve → Zaposleni.">${noAcc.length} brez računa</span>` : ''}<span class="sp"></span>
    <button type="button" class="btn" data-nav="zivo" data-live="${date}">${IC.pulse} Živo stanje</button>
    <button type="button" class="btn primary" data-act="publish" data-date="${date}" ${plan.crews.some(c => c.trips.length) ? '' : 'disabled'} title="Vsaka posadka v aplikaciji vidi samo svoje prevoze in javlja korake. Časi se vpišejo v knjigo.">${IC.send} ${st === 'ni' ? 'Objavi razpored' : 'Objavi znova'}</button></div></div>`;
}

/* ---------- Pacienti ---------- */
function patientMatches(p){
  const q = norm(UI.pq);
  if (q && !norm([p.name, p.addr, p.phone].join(' ')).includes(q)) return false;
  const sm = patientNalogSummary(p);
  if (UI.pf === 'opozorila') return ['kmalu', 'potekel'].includes(sm.st) && !!nalogAlerts().find(a => a.p.id === p.id);
  if (UI.pf === 'dializa') return !!p.dt;
  if (UI.pf === 'brez') return !(p.naloge || []).length || sm.st === 'brez';
  return true;
}
function nalogCardHTML(p, n){
  const s = nalogState(n), miss = missingNalog(n), open = UI.nid === n.id;
  const head = `<div class="ncard-head"><span class="chip nt nt-${n.vrsta}">${esc(NALOG_VRSTE[n.vrsta].l)}</span><b class="mono">${esc(n.stevilka || 'brez številke')}</b>${nalogChip(n)}${miss.length ? `<span class="chip warn" title="Manjka: ${esc(miss.join(', '))}">nepopoln</span>` : ''}</div>`;
  const sum = `<div class="hint ncard-sum">${esc(n.od || '–')} → ${esc(n.do || '–')} · ${esc(MODES[n.mode] || n.mode)} · ${fmtDMY(n.veljaOd)} – ${fmtDMY(n.veljaDo)}${n.razlog ? ' · ' + esc(n.razlog) : ''}</div>`;
  const acts = `<div class="row" style="gap:6px">
    <button type="button" class="btn sm" data-act="editNalog" data-id="${n.id}">${open ? 'Zapri' : 'Uredi'}</button>
    <button type="button" class="btn sm" data-act="previewNalog" data-id="${n.id}" ${miss.length ? 'disabled title="Najprej izpolni vsa polja"' : ''}>${IC.eye} Predogled</button>
    <button type="button" class="btn sm" data-act="npOpen" data-id="${n.id}" data-pid="${p.id}" title="Natisne samo podatke posadke v tabelo PREVOZI na papirnatem nalogu">${IC.print || ''} Natisni v nalog</button>
    <button type="button" class="btn sm" data-act="renewNalog" data-id="${n.id}">Podaljšaj</button>
    ${n.vrsta === 'enkratna' ? `<button type="button" class="btn sm" data-act="usedNalog" data-id="${n.id}">${n.porabljen ? 'Odznači porabljen' : 'Označi porabljen'}</button>` : ''}
    <button type="button" class="btn sm" data-act="cancelNalog" data-id="${n.id}">${n.preklican ? 'Obnovi' : 'Prekliči'}</button>
    <button type="button" class="btn sm danger" data-act="delNalog" data-id="${n.id}">Izbriši</button></div>`;
  let form = '';
  if (open){
    const f = (k, label, type = 'text', extra = '') => `<div class="field"><label for="nf-${k}">${label}</label><input id="nf-${k}" data-nf="${k}" type="${type}" value="${esc(n[k] || '')}" autocomplete="off" ${extra}></div>`;
    form = `<div class="nform"><div class="formgrid">
      <div class="field"><label for="nf-vrsta">Vrsta naloga</label><select id="nf-vrsta" data-nf="vrsta">${Object.entries(NALOG_VRSTE).map(([k, v]) => `<option value="${k}" ${n.vrsta === k ? 'selected' : ''}>${v.l}</option>`).join('')}</select></div>
      ${f('stevilka', 'Številka naloga')}
      ${f('narocnik', 'Naročnik (ustanova / zdravnik)')}
      ${f('izvajalec', 'Izvajalec prevoza')}
      ${f('zdravnik', 'Zdravnik (ime in priimek)')}
      <div class="field"><label for="nf-zv">Zdravnik je</label><select id="nf-zv" data-nf="zdravnikVrsta">${ZDRAVNIK_VRSTE.map(z => `<option ${n.zdravnikVrsta === z ? 'selected' : ''}>${z}</option>`).join('')}</select></div>
      <div class="field"><label for="nf-razlog">Razlog prevoza</label><input id="nf-razlog" data-nf="razlog" list="razlogList" value="${esc(n.razlog || '')}" autocomplete="off"><datalist id="razlogList">${NALOG_RAZLOGI.map(r => `<option value="${esc(r)}"></option>`).join('')}</datalist></div>
      <div class="field"><label for="nf-mode">Način prevoza</label><select id="nf-mode" data-nf="mode">${Object.entries(PMODES).map(([k, v]) => `<option value="${k}" ${n.mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="nf-od">Relacija: od</label><input id="nf-od" data-nf="od" data-suggest="from" value="${esc(n.od || '')}" autocomplete="off" placeholder="npr. domači naslov"></div>
      <div class="field"><label for="nf-do">Relacija: do</label><input id="nf-do" data-nf="do" data-suggest="to" value="${esc(n.do || '')}" autocomplete="off" placeholder="npr. Dializni center Krško"></div>
      ${f('veljaOd', 'Velja od', 'date')}
      <div class="field"><label for="nf-veljaDo">Velja do ${n.auto ? '<span class="dim">(predlog)</span>' : ''}</label><input id="nf-veljaDo" data-nf="veljaDo" type="date" value="${esc(n.veljaDo || '')}"></div>
      ${f('dnevi', 'Dnevi / pogostost (npr. pon, sre, pet)')}
      <div class="field full"><label for="nf-opombe">Opombe</label><textarea id="nf-opombe" data-nf="opombe" rows="2">${esc(n.opombe || '')}</textarea></div>
      </div>
      <p class="hint nform-hint" style="margin:6px 0 0">Predlog veljavnosti: ${esc(NALOG_VRSTE[n.vrsta].hint)}. Pred shranjevanjem preveri datuma na nalogu.${miss.length ? ` <b>Manjka:</b> ${esc(miss.join(', '))}.` : ' Vsa polja so izpolnjena.'}</p></div>`;
  }
  return `<article class="ncard ${s.tone}" data-nalog="${n.id}">${head}${sum}${acts}${form}</article>`;
}
function patientDetailHTML(p){
  const sw = Array.from({ length:PCOLORS }, (_, i) => `<button type="button" class="swatch pc${i}" data-act="pColor" data-c="${i}" aria-pressed="${p.color === i}" aria-label="Barva ${i + 1}"></button>`).join('');
  const nl = (p.naloge || []).slice().sort((a, b) => (b.veljaDo || '').localeCompare(a.veljaDo || ''));
  return `<section class="card card-pad stack pdetail ${p.color >= 0 ? 'pc' + p.color : ''}" style="gap:14px">
    <div class="card-head" style="margin:0"><div class="row" style="gap:10px">${avatarP(p)}<h3>${esc(p.name || 'Nov pacient')}</h3>${p.demo ? '<span class="chip warn">PRIMER</span>' : ''}</div>
      <div class="row"><button type="button" class="btn sm" data-act="pBack">Nazaj na seznam</button><button type="button" class="btn sm danger" data-act="delPatient" data-id="${p.id}">Izbriši pacienta</button></div></div>
    <div class="formgrid">
      <div class="field"><label for="pf-name">Ime in priimek</label><input id="pf-name" data-pf="name" value="${esc(p.name)}" autocomplete="off"></div>
      <div class="field"><label for="pf-phone">Telefon / kontakt</label><input id="pf-phone" data-pf="phone" type="tel" value="${esc(p.phone)}" autocomplete="off"></div>
      <div class="field full"><label for="pf-addr">Domači naslov</label><input id="pf-addr" data-pf="addr" data-suggest="from" value="${esc(p.addr)}" autocomplete="off" placeholder="npr. Dobova 25"></div>
      <div class="field"><span class="lbl">Običajni način prevoza</span><div class="seg" role="group">${Object.entries(PMODES).map(([k, v]) => `<button type="button" data-act="pMode" data-mode="${k}" aria-pressed="${p.mode === k}">${v}</button>`).join('')}</div></div>
      <div class="field"><label for="pf-zzzs">Št. zavarovane osebe (neobvezno)</label><input id="pf-zzzs" data-pf="zzzs" value="${esc(p.zzzs || '')}" autocomplete="off" inputmode="numeric"></div>
      <div class="field"><span class="lbl">Barva pacienta</span><div class="swatches">${sw}</div></div>
      <div class="field full"><label for="pf-note">Opomba (npr. voziček, kisik, hišni ključ)</label><textarea id="pf-note" data-pf="note" rows="2">${esc(p.note || '')}</textarea></div>
    </div>
    <div class="card-head" style="margin:6px 0 0"><h3>Nalogi za prevoz</h3>
      <div class="row" style="gap:6px">${Object.entries(NALOG_VRSTE).map(([k, v]) => `<button type="button" class="btn sm" data-act="addNalog" data-v="${k}">${IC.plus} ${v.l}</button>`).join('')}</div></div>
    ${nl.length ? nl.map(n => nalogCardHTML(p, n)).join('') : '<div class="empty-state">Pacient še nima naloga. Dodaj letni, mesečni, enkratni nalog ali nalog za čas zdravljenja.</div>'}
  </section>`;
}
function renderPatients(){
  const sel = patientById(UI.pid);
  if (sel) logPatientOpen(sel.id);
  const all = S.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl'));
  const list = all.filter(patientMatches);
  const al = nalogAlerts();
  const rows = list.map(p => { const sm = patientNalogSummary(p); return `<button type="button" class="prow ${p.color >= 0 ? 'pc' + p.color : ''}" data-act="openPatient" data-id="${p.id}" aria-current="${UI.pid === p.id}">${avatarP(p)}<span class="pr-main"><b>${esc(p.name || '(brez imena)')}</b><span class="hint">${esc(p.addr || 'brez naslova')}${p.phone ? ' · ' + esc(p.phone) : ''}</span></span><span class="pr-side">${p.dt ? `<span class="chip" title="Dializa: ${DIA_TERMS[p.dt.t].toLowerCase()}">dial. ${p.dt.t === 'dop' ? 'dop.' : 'pop.'}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('');
  $('#view').innerHTML = `${demoBanner()}${alertsBanner()}
    <div class="plist ${sel ? 'has-sel' : ''}">
      <div class="stack" style="gap:12px">
        <div class="toolbar"><input type="search" id="patSearch" placeholder="Išči po imenu, naslovu, telefonu" value="${esc(UI.pq)}" aria-label="Išči pacienta"><button type="button" class="btn primary" data-act="newPatient">${IC.plus} Nov pacient</button><button type="button" class="btn" data-act="nsOpen" title="Fotografiraj ali naloži nalog in podatke izpolni samodejno">Skeniraj nalog</button></div>
        <div class="seg" role="group" aria-label="Filter">${[['vsi', `Vsi (${all.length})`], ['opozorila', `Opozorila (${al.length})`], ['brez', 'Brez naloga']].map(([k, l]) => `<button type="button" data-act="pf" data-k="${k}" aria-pressed="${UI.pf === k}">${l}</button>`).join('')}</div>
        <div class="prows">${rows || '<div class="empty-state">Ni pacientov za ta filter. Pacienta dodaš z gumbom »Nov pacient« ali v dnevni knjigi z »Shrani v bazo«.</div>'}</div>
      </div>
      <div class="stack">${sel ? patientDetailHTML(sel) : '<div class="empty-state">Izberi pacienta na seznamu ali dodaj novega. Ko pacienta izbereš v dnevni knjigi, se podatki izpolnijo sami.</div>'}</div>
    </div>`;
}
function cleanupEmptyPatient(){
  const p = patientById(UI.pid);
  if (p && !p.name.trim() && !p.addr.trim() && !p.phone.trim() && !(p.naloge || []).length){ S.patients = S.patients.filter(x => x.id !== p.id); save(); }
}

/* ---------- Živo stanje (dispečer) ---------- */
/* Ocena prihoda glede na zadnje sporočilo posadke (po cestnih podatkih); prazno, če prevoz ni v teku */
function etaChip(date, r){
  let e = null; try { e = liveEta(date, r); } catch(err){}
  if (!e) return '';
  const late = e.appt != null && e.t > e.appt;
  return `<span class="eta ${late ? 'bad' : ''}" title="Ocena iz zadnjega sporočila posadke in cestnih podatkov">${esc(e.what)} ~${fmtT(e.t)}${late ? ' · po uri preiskave' : ''}</span>`;
}
function renderLive(){
  const today = todayStr(), tom = addDays(today, 1), date = UI.lDate || today;
  const sum = liveSummary(date), rows = liveRows(date), pub = S.published[date], st = publishState(date);
  const problems = rows.filter(x => ['odklonjena', 'ni_doma'].includes(x.r.status));
  const byRun = {}; rows.forEach(x => { const k = x.run ? x.run.key : '_'; (byRun[k] = byRun[k] || []).push(x); });
  const order = x => (x.r.time || '99:99');
  const runCards = ((pub && pub.runs) || []).map(run => {
    const items = (byRun[run.key] || []).sort((a, b) => order(a).localeCompare(order(b)));
    if (!items.length) return '';
    const done = items.filter(x => ['zakljucena'].includes(x.r.status)).length;
    return `<section class="card crewcard"><header><div><h3>${esc(run.vehName)} · ${esc((run.names || []).join(', '))}</h3><div class="timeline-note">${items.length} prevozov · ${done} zaključenih</div></div><div class="meta">${run.uids && run.uids.length ? `<span class="chip ok">${run.uids.length} v aplikaciji</span>` : '<span class="chip warn">nihče v aplikaciji</span>'}</div></header>
      <div class="livelist">${items.map(({ r, nr }) => `<div class="liverow ${pcClass(r.patientId)}"><span class="pdot ${pcClass(r.patientId)}"></span><div class="lr-main"><b>${esc(r.name || '(brez imena)')}</b> <span class="chip mono">št. ${nr}</span> <span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span><div class="hint">${esc(r.from)} → ${esc(r.to)} · ura ${esc(r.time || '–')}${r.statusBy ? ' · ' + esc(r.statusBy) : ''}${r.statusNote ? ' · ' + esc(r.statusNote) : ''}</div></div><div class="lr-side">${stChip(r.status || 'nova')}${etaChip(date, r)}<div class="row" style="gap:4px;justify-content:flex-end">${timesChips(r)}</div></div></div>`).join('')}</div></section>`;
  }).join('');
  const loose = (byRun._ || []).filter(x => !['zakljucena', 'preklicana'].includes(x.r.status) && !x.r.done);
  $('#view').innerHTML = `${demoBanner()}
    <div class="row"><div class="seg inline" role="group" aria-label="Dan"><button type="button" data-act="lDate" data-date="${today}" aria-pressed="${date === today}">Danes · ${fmtShort(today)}</button><button type="button" data-act="lDate" data-date="${tom}" aria-pressed="${date === tom}">Jutri · ${fmtShort(tom)}</button></div>
      ${st === 'ok' ? `<span class="chip ok">objavljeno ob ${timeOf(pub.at)}</span>` : st === 'spremenjeno' ? '<span class="chip warn">spremenjeno po objavi</span>' : '<span class="chip">ni objavljeno</span>'}
      <button type="button" class="btn sm" data-act="gotoDisp" data-date="${date}">${IC.route} Razpored</button></div>
    <div class="stats">${['dodeljena', 'sprejeta', 'na_poti', 'na_kraju', 'v_vozilu', 'zakljucena'].map(k => `<div class="stat"><b>${(sum[k] || 0) + (k === 'zakljucena' ? (sum.na_cilju || 0) : 0)}</b><span>${esc(STATUSI[k].s)}</span></div>`).join('')}</div>
    ${problems.length ? `<div class="banner bad"><span>${IC.alert}</span><div>${problems.map(x => `<div><b>${esc(x.r.name)}</b> (št. ${x.nr}): ${esc(STATUSI[x.r.status].l)}${x.r.statusNote ? ' – ' + esc(x.r.statusNote) : ''}${x.r.statusBy ? ' · ' + esc(x.r.statusBy) : ''}. <button type="button" class="linkbtn" data-act="reassign" data-date="${date}" data-id="${x.r.id}">Vrni v razpored</button></div>`).join('')}</div></div>` : ''}
    ${runCards || '<div class="empty-state">Razpored za ta dan še ni objavljen. V pogledu Dispečer klikni »Objavi razpored«.</div>'}
    ${loose.length ? `<div class="card card-pad stack" style="gap:8px"><h3>Brez posadke (ni objavljeno)</h3><div class="row" style="gap:6px">${loose.map(x => `<span class="chip mono">${x.nr} ${esc(x.r.name)}</span>`).join('')}</div></div>` : ''}`;
}

/* ---------- Aplikacija posadke (voznik, spremljevalec) ---------- */
function crewRideCard(date, doc, rid, r){
  const stt = crewRideState(doc.runKey, rid), s = stt.status;
  const idx = STATUS_FLOW.indexOf(s), nextBtn = STATUS_BTN[s];
  const pc = r.color >= 0 ? 'pc' + r.color : '';
  const toPick = !['v_vozilu', 'na_cilju', 'zakljucena'].includes(s);
  const tel = String(r.phone || '').replace(/[^\d+]/g, '');
  const chips = STATUS_FLOW.filter(k => CASI_KLJUC[k] && stt.times[k]).map(k => `<span class="chip mono">${esc(STATUSI[k].s)} ${timeOf(stt.times[k])}</span>`).join('');
  const lastKey = stt.last && stt.last.status, lastT = lastKey && stt.times[lastKey];
  const hh = lastT ? timeOf(lastT) : '';
  let extra = '';
  if (['na_poti', 'na_kraju'].includes(s)) extra += `<button type="button" class="btn sm danger" data-act="crewNoHome" data-ride="${rid}" data-date="${date}">Pacienta ni na naslovu</button>`;
  if (s === 'dodeljena') extra += `<details class="decline"><summary class="btn sm danger">Ne morem prevzeti</summary><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" data-cnote="${rid}" placeholder="Razlog (neobvezno)" maxlength="120" aria-label="Razlog"><button type="button" class="btn sm danger" data-act="crewDecline" data-ride="${rid}" data-date="${date}">Pošlji</button></div></details>`;
  if (lastT && !['dodeljena'].includes(s)) extra += `<details class="decline"><summary class="btn sm">Popravi uro (${esc(STATUSI[s].s)})</summary><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="time" data-cfix="${rid}" value="${hh}" aria-label="Pravilna ura"><button type="button" class="btn sm" data-act="crewFix" data-ride="${rid}" data-date="${date}">Shrani uro</button></div></details>`;
  let primary = '';
  if (nextBtn) primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="${STATUS_FLOW[idx + 1]}">${esc(nextBtn)}</button>`;
  else if (s === 'ni_doma') primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="na_poti">Poskusim znova (na poti)</button>`;
  else if (s === 'odklonjena') primary = `<button type="button" class="btn primary big" data-act="crewStep" data-ride="${rid}" data-date="${date}" data-st="sprejeta">Vseeno sprejmem</button>`;
  else if (s === 'zakljucena') primary = `<div class="donebar">${IC.check} Prevoz zaključen</div>`;
  return `<article class="rcard ${pc} st-card-${s}"><div class="rc-head"><span class="chip mono">${esc(r.pickT || r.time || '')}</span><span class="chip mono">št. ${r.nr}</span><span class="chip mono" style="color:var(--m-${r.mode})">${esc(MODES[r.mode] || r.mode)}</span>${r.dia ? `<span class="chip mono">${esc(r.dia)}</span>` : ''}<span class="sp"></span>${stChip(s)}</div>
    <h3 class="rc-name"><span class="pdot ${pc}"></span>${esc(r.name)}</h3>
    <div class="rc-addr"><div><span class="lbl">Od</span><div>${esc(r.from)}</div></div><div><span class="lbl">Do</span><div>${esc(r.to)}</div></div></div>
    ${r.time || /\d/.test(r.dropT || '') ? `<div class="hint">${r.time ? `Ura preiskave / dogovorjena ura: <b>${esc(r.time)}</b>` : ''}${/\d/.test(r.dropT || '') ? `${r.time ? ' · ' : ''}predviden ${r.kind === 'from' ? 'prihod domov' : 'prihod na cilj'}: <b class="mono">${esc(r.dropT)}</b>` : ''}</div>` : ''}
    ${r.note ? `<div class="banner warn" style="padding:8px 12px"><span>${IC.info}</span><div>${esc(r.note)}</div></div>` : ''}
    ${r.nalog ? `<div class="hint">Nalog: ${esc(r.nalog.v)}${r.nalog.st ? ', št. ' + esc(r.nalog.st) : ''}</div>` : ''}
    <div class="row" style="gap:6px">${tel ? `<a class="btn sm" href="tel:${esc(tel)}">${IC.phone} Pokliči</a>` : ''}<a class="btn sm" href="${esc(navUrl(toPick ? r.from : r.to))}" target="_blank" rel="noopener noreferrer">${IC.pin} Navigacija</a></div>
    ${chips ? `<div class="row" style="gap:4px">${chips}</div>` : ''}${stt.note ? `<div class="hint">${esc(stt.note)}</div>` : ''}
    ${primary}<div class="row" style="gap:6px;align-items:flex-start">${extra}</div></article>`;
}
function renderCrewApp(){
  const today = todayStr(), dates = [addDays(today, -1), today, addDays(today, 1)].filter(d => d !== addDays(today, -1) || CREW.docs[d]);
  if (!UI.cDate || !dates.includes(UI.cDate)) UI.cDate = today;
  const date = UI.cDate, doc = CREW.docs[date];
  const tabs = `<div class="seg" role="group" aria-label="Dan">${dates.map(d => `<button type="button" data-act="cDate" data-date="${d}" aria-pressed="${date === d}">${d === today ? 'Danes' : d === addDays(today, 1) ? 'Jutri' : 'Včeraj'}<small> ${fmtShort(d)}</small></button>`).join('')}</div>`;
  let body;
  if (!CREW.ready) body = '<div class="empty-state">Nalagam razpored …</div>';
  else if (!doc) body = `<div class="empty-state">Za ${date === today ? 'danes' : fmtShort(date)} razpored še ni objavljen ali nisi v nobeni posadki.<br><span class="hint">Ko dispečer objavi razpored, se prikaže tukaj.</span></div>`;
  else {
    const done = Object.keys(doc.rides).filter(id => crewRideState(doc.runKey, id).status === 'zakljucena').length, total = Object.keys(doc.rides).length;
    body = `<div class="card card-pad stack" style="gap:6px"><div class="row" style="justify-content:space-between"><h3>${esc(doc.vehName)}</h3><span class="chip mono">${done}/${total} zaključenih</span></div>
      <div class="muted">${esc((doc.names || []).join(', '))}</div><div class="hint">Štart iz postaje: <b class="mono">${esc(doc.depart || '–')}</b></div></div>
      ${(doc.trips || []).map((t, ti) => `<section class="stack" style="gap:10px"><div class="row" style="gap:8px"><span class="chip ${t.kind === 'from' ? 'ok' : 'info'}">${t.kind === 'from' ? 'ODVOZ' : 'TJA'}</span><b>${t.kind === 'to' ? esc(t.anchor || 'cilj') : 'Iz: ' + esc(t.anchor || 'ustanova')}</b><span class="hint mono">štart ${esc(t.depart)}</span></div>
        <details class="stopsum"><summary>Postanki (${t.stops.length})</summary><ul>${t.stops.map(s => `<li><time class="mono">${esc(s.t)}</time> ${s.type === 'pu' ? 'pobere' : 'izstop'}: ${esc(s.label)}${s.rideIds.length ? ' · ' + s.rideIds.map(id => esc((doc.rides[id] || {}).name || '')).join(', ') : ''}</li>`).join('')}</ul></details>
        ${[...new Set(t.stops.flatMap(s => s.rideIds))].filter(id => doc.rides[id]).sort((a, b) => String(doc.rides[a].pickT).localeCompare(String(doc.rides[b].pickT))).map(id => crewRideCard(date, doc, id, doc.rides[id])).join('')}</section>`).join('')}`;
  }
  $('#view').innerHTML = `${tabs}<div style="height:12px"></div><div class="stack">${body}</div>
    <p class="hint" style="margin-top:14px">Koraki se zapišejo z uro ob pritisku. Če ni povezave, počakaj, da se vrne; aplikacija naj ostane odprta.</p>
    <details class="card card-pad" style="margin-top:10px"><summary><b>Moj račun</b> · spremeni geslo</summary><div style="height:10px"></div>${pwFormHTML()}</details>`;
}

/* ---------- Pravila (skrbnik) ---------- */
function rulesTab(){
  const r = S.rules, st = S.settings, n = (path, v, step = 1) => field(path, v, { num:1, step, label:path });
  const rows = [
    ['Najdaljša vožnja pacienta v vozilu', 'min', 'settings.maxRide', st.maxRide, 'rules.bend.maxRide', r.bend.maxRide, 'Koliko minut največ sme pacient sedeti v vozilu.'],
    ['Dodaten čas za soprevoznika', 'min', 'settings.detour', st.detour, 'rules.bend.detour', r.bend.detour, 'Za koliko se vožnja podaljša, da se vzame še en pacient.'],
    ['Okno združevanja po uri', 'min', 'settings.window', st.window, 'rules.bend.window', r.bend.window, 'Največja razlika v uri preiskave pri pacientih v istem vozilu.'],
    ['Rezerva pred preiskavo', 'min', 'settings.buffer', st.buffer, 'rules.bend.buffer', r.bend.buffer, 'Koliko minut pred preiskavo naj pacient prispe.']
  ];
  return `<div class="stack"><div class="card card-pad stack"><h3>Način pravil (privzeto)</h3>
    <div class="seg" role="group" aria-label="Privzeti način">${Object.entries(RULE_MODES).map(([k, l]) => `<button type="button" data-act="ruleMode" data-k="${k}" aria-pressed="${r.mode === k}">${l}</button>`).join('')}</div>
    <p class="muted" style="margin:0">${RULE_DESC[r.mode]}</p>
    <p class="hint" style="margin:0">Dispečer lahko način spremeni tudi samo za en dan (Dispečer → Pravila za ta dan). Posamezen prevoz lahko dobi »Izjemo pravil« v dnevni knjigi.</p></div>
    <div class="card card-pad stack"><h3>Običajne in prilagojene vrednosti</h3>
    <div class="tablewrap"><table class="edtable"><thead><tr><th>Pravilo</th><th>Običajno</th><th>Prilagojeno</th><th>Pomen</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td><b>${x[0]}</b><div class="hint">${x[1]}</div></td><td>${n(x[2], x[3], 5)}</td><td>${n(x[4], x[5], 5)}</td><td class="hint">${x[6]}</td></tr>`).join('')}
    <tr><td><b>Kapaciteta vozila</b></td><td colspan="2" class="hint">Običajno / izjemoma največ: Nastavitve → Vozila</td><td class="hint">Npr. vozilo s 6 sedeži, ki običajno vozi 4 paciente.</td></tr></tbody></table></div></div>
    <div class="card card-pad stack"><h3>Izmene in nadure</h3>
    <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="rules.enforceShift" data-bool="1" ${r.enforceShift ? 'checked' : ''}> Pazi na dolžino izmene (velja za zaposlene, ki imajo v Dispečerju vpisan začetek ali konec izmene)</label>
    <div class="kv"><label for="k-sh">Običajna dolžina izmene <span class="dim">(ur)</span></label>${field('rules.shiftHours', r.shiftHours, { num:1, step:1, label:'Dolžina izmene' }).replace('data-path', 'id="k-sh" data-path')}
    <label for="k-ot">Največ nadur ob prilagoditvi <span class="dim">(min)</span></label>${field('rules.overtimeMax', r.overtimeMax, { num:1, step:15, label:'Nadure' }).replace('data-path', 'id="k-ot" data-path')}
    <label for="k-wd">Opozorilo: letni nalog <span class="dim">(dni vnaprej)</span></label>${field('rules.opozoriloDni', r.opozoriloDni, { num:1, step:1, label:'Opozorilo o poteku letnega naloga' }).replace('data-path', 'id="k-wd" data-path')}
    <label for="k-wk">Opozorilo: mesečni in zdravljenje <span class="dim">(dni vnaprej)</span></label>${field('rules.opozoriloKratki', r.opozoriloKratki ?? 7, { num:1, step:1, label:'Opozorilo o poteku mesečnega naloga' }).replace('data-path', 'id="k-wk" data-path')}</div>
    <p class="hint" style="margin:0">Nadure lahko dispečer tudi vnaprej odobri pri posameznem zaposlenem (Dispečer → zaposleni na delu → Nadure). Če začetek in konec izmene nista vpisana, dolžina izmene ni omejena.</p></div></div>`;
}

/* ---------- Uporabniki ---------- */
async function loadRemoteUsers(){
  if (!DB || BACKEND !== 'firebase') return;
  try { const l = await DB.list('users'); USERS_REMOTE = l.map(x => ({ id:x.id, ...x.data })); } catch(e){ USERS_REMOTE = []; }
  if (ME && UI.view === 'nastavitve' && ['uporabniki', 'zaposleni'].includes(UI.setTab)) scheduleRender();
}
const pwFormHTML = () => `<form class="card card-pad stack" data-form="chPw" style="gap:10px"><h3>Spremeni svoje geslo</h3><div class="formgrid"><div class="field"><label for="po">Staro geslo</label><input id="po" name="old" type="password" autocomplete="current-password" required></div><div class="field"><label for="pn">Novo geslo (vsaj 10 znakov)</label><input id="pn" name="pw" type="password" minlength="10" autocomplete="new-password" required></div></div><button class="btn" type="submit">Spremeni geslo</button><div class="auth-err" id="pwErr"></div></form>`;
function usersTab(){
  const roleOpts = sel => Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v}</option>`).join('');
  const pwForm = pwFormHTML();
  if (BACKEND === 'firebase'){
    return `<div class="two"><div class="stack"><form class="card card-pad stack" data-form="remoteRole" style="gap:12px"><h3>Dodeli vlogo računu</h3>
      <div class="banner"><span>${IC.info}</span><div>1) V Firebase konzoli (Authentication) ustvari uporabnika. 2) Kopiraj njegov <b>UID</b>. 3) Tukaj mu dodeli ime in vlogo. Brez vloge se uporabnik ne more prijaviti.</div></div>
      <div class="field"><label for="ru">UID (iz Firebase konzole)</label><input id="ru" name="uid" required autocomplete="off" spellcheck="false"></div><div class="field"><label for="rn">Ime in priimek</label><input id="rn" name="name" required autocomplete="off"></div>
      <div class="field"><label for="rr">Vloga</label><select id="rr" name="role">${roleOpts('dispecer')}</select></div><button class="btn primary" type="submit">Shrani vlogo</button><div class="auth-err" id="userErr"></div></form>${pwForm}</div>
      <div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Uporabniki</h3><button type="button" class="btn sm" data-act="reloadUsers">Osveži</button></div>
      <div class="tablewrap"><table><thead><tr><th>Ime</th><th>Vloga</th><th>Aktiven</th><th>UID</th></tr></thead><tbody>${USERS_REMOTE.map(u => `<tr><td>${esc(u.name || '')}</td><td><select data-urole="${esc(u.id)}" aria-label="Vloga">${roleOpts(u.role)}</select></td><td><input type="checkbox" data-uactive="${esc(u.id)}" ${u.active !== false ? 'checked' : ''} ${u.id === ME.id ? 'disabled' : ''} aria-label="Aktiven"></td><td class="mono hint" style="word-break:break-all">${esc(u.id)}</td></tr>`).join('') || '<tr><td colspan="4" class="hint">Ni uporabnikov ali seznam se še nalaga.</td></tr>'}</tbody></table></div>
      <p class="hint" style="margin:0">Če uporabnik zapusti ekipo: odstrani kljukico »Aktiven« (prijava preneha delovati takoj) in ga nato izbriši v Firebase konzoli.</p></div></div></div>`;
  }
  return `<div class="two"><div class="stack"><form class="card card-pad stack" data-form="addUser" style="gap:12px"><h3>Nov uporabnik</h3>
      <div class="field"><label for="uu">Uporabniško ime</label><input id="uu" name="username" required autocomplete="off"></div><div class="field"><label for="un">Ime in priimek</label><input id="un" name="name" autocomplete="off"></div>
      <div class="field"><label for="ur">Vloga</label><select id="ur" name="role">${roleOpts('dispecer')}</select></div>
      <div class="field"><label for="us">Poveži z zaposlenim (za voznike in spremljevalce)</label><select id="us" name="staffId"><option value="">ni povezan</option>${S.staff.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="up">Geslo (vsaj 10 znakov)</label><input id="up" name="pw" type="password" minlength="10" required autocomplete="new-password"></div>
      <button class="btn primary" type="submit">Ustvari račun</button><div class="auth-err" id="userErr"></div></form>${pwForm}</div>
    <div class="stack"><div class="card card-pad stack"><h3>Uporabniki</h3><div class="tablewrap"><table><thead><tr><th>Ime</th><th>Uporabnik</th><th>Vloga</th><th></th></tr></thead><tbody>${USERS.map(u => `<tr><td>${esc(u.name)}${u.demo ? ' <span class="chip warn">PRIMER</span>' : ''}</td><td class="mono">${esc(u.username)}</td><td><span class="chip ${u.role === 'skrbnik' ? 'accent' : ''}">${esc(ROLES[u.role] || u.role)}</span></td><td>${u.id === ME.id ? '<span class="hint">ti</span>' : `<button type="button" class="icon-btn" data-act="delUser" data-id="${u.id}" aria-label="Izbriši ${esc(u.username)}">${IC.x}</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint" style="margin:0">Lokalni način: računi so samo v tem brskalniku (za preizkus). Za pravo uporabo na več napravah uporabi način Firebase (glej navodila).</p></div></div></div>`;
}

/* ---------- Varnost ---------- */
function securityChecks(){
  const out = [];
  const secure = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  out.push({ ok:secure, t:'Povezava je šifrirana (HTTPS)', d:secure ? 'Stran se nalaga prek varne povezave.' : 'Stran ni odprta prek HTTPS. Prijava in podatki niso zaščiteni.' });
  out.push({ ok:BACKEND === 'firebase' ? true : 'warn', t:'Skupna baza z vlogami', d:BACKEND === 'firebase' ? 'Podatki so v Cloud Firestore, dostop urejajo pravila po vlogah (firestore.rules).' : 'Lokalni način: podatki so samo v tem brskalniku. Uporabi samo z izmišljenimi podatki. ' + (LOCAL_WHY ? 'Razlog: ' + LOCAL_WHY : 'Za pravo uporabo preklopi na Firebase.') });
  const csp = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  out.push({ ok:csp ? true : 'warn', t:'Content-Security-Policy', d:csp ? 'Brskalnik dovoli samo kodo in povezave, ki jih aplikacija potrebuje.' : 'Ni nastavljena: to ni stran iz mape web/ (predogled ali samostojna datoteka). Pravi index.html jo vsebuje; za delo s pravimi podatki odpri stran iz GitHub Pages.' });
  out.push({ ok:S.settings.idleMin <= 30, t:'Samodejna odjava', d:`Po ${S.settings.idleMin} min nedejavnosti. Priporočeno je 30 min ali manj.` });
  const cfgOk = !CFG_BROKEN && (KPC.mode !== 'firebase' || BACKEND === 'firebase');
  out.push({ ok:cfgOk, t:'Nastavitve Firebase (config.js)', d:cfgOk ? (BACKEND === 'firebase' ? 'Povezava z vašim projektom je nastavljena.' : 'Ni v uporabi (lokalni način).') : (LOCAL_WHY || 'config.js vsebuje še nadomestne vrednosti.') });
  const sw = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  out.push({ ok:sw ? true : 'warn', t:'Namestljiva aplikacija (PWA)', d:sw ? 'Service worker je aktiven: aplikacija deluje kot nameščena in nalaga zadnjo različico.' : 'Service worker še ni aktiven (potrebuje HTTPS in ponovni zagon).' });
  out.push({ ok:'warn', t:'Podatki na napravi (obvestilo, ne napaka)', d:'Pri vključenem delovanju brez povezave Firebase hrani kopijo podatkov na napravi. Na skupnih računalnikih se po odjavi izbriše; telefone zaščiti z zaklepom zaslona.' });
  return out;
}
const PERM_EXPECT = { skrbnik:{ book:1, publish:1, patients:1, settings:1, users:1, audit:1, crew:0 }, dispecer:{ book:1, publish:1, patients:1, settings:0, users:0, audit:0, crew:0 }, voznik:{ book:0, publish:0, patients:0, settings:0, users:0, audit:0, crew:1 }, spremljevalec:{ book:0, publish:0, patients:0, settings:0, users:0, audit:0, crew:1 } };
async function runSelfTest(){
  const res = [], add = (name, pass, detail = '') => res.push({ name, pass, detail });
  const denied = async fn => { try { await fn(); return false; } catch(e){ return !!(e && (e.code === 'permission-denied' || /permission|insufficient/i.test(String(e.message || '')))); } };
  const allowed = async fn => { try { await fn(); return true; } catch(e){ return false; } };
  // 1) matrika pravic v vmesniku
  let ok = true; const saved = ME;
  for (const [role, exp] of Object.entries(PERM_EXPECT)) for (const [perm, v] of Object.entries(exp)){ ME = { ...saved, role }; if (can(perm) !== !!v) ok = false; }
  ME = saved; add('Matrika pravic po vlogah (vmesnik)', ok, 'Voznik in spremljevalec ne smeta urejati knjige, pacientov, nastavitev in uporabnikov.');
  add('Izhod HTML je varen', !/[<>"]/.test(esc('<img src=x onerror=alert(1)>"')), 'Znaki < > " se pretvorijo, vpisano besedilo ne more zagnati kode.');
  try { const s1 = b64e(crypto.getRandomValues(new Uint8Array(16))), s2 = b64e(crypto.getRandomValues(new Uint8Array(16))); const h1 = await hashPw('test-geslo', s1, 1000), h2 = await hashPw('test-geslo', s2, 1000); add('Gesla so soljena in zgoščena (PBKDF2)', h1 !== h2 && h1.length > 30, 'Isto geslo z drugo soljo da drugačno vrednost.'); } catch(e){ add('Gesla so soljena in zgoščena (PBKDF2)', false, 'Brskalnik ne podpira WebCrypto.'); }
  const a = { x:{ y:1, z:[1, 2] }, k:1 }, b = { x:{ y:2, z:[1, 2] }, n:5 }; const ops = diffDoc(a, b); add('Sinhronizacija spreminja samo spremenjena polja', JSON.stringify(applyOps(J(a), ops)) === JSON.stringify(b) && ops.n === 3, 'Dve osebi lahko hkrati urejata različni polji istega dne brez prepisovanja.');
  // 2) žive preizkušnje pravil baze
  if (BACKEND !== 'firebase'){ add('Pravila baze (Firestore)', null, 'Ni na voljo v lokalnem načinu. V načinu Firebase se tukaj preizkusijo zavrnjeni dostopi za tvojo vlogo.'); return res; }
  const today = todayStr();
  add('Preberem lasten profil (kontrola)', await allowed(() => DB.get('users/' + ME.id)), 'Pozitivna kontrola: če ta spodleti, so pravila ali omrežje narobe.');
  if (isStaffRole()){
    add('Ne morem si sam dodeliti vloge skrbnika', ME.role === 'skrbnik' ? null : await denied(() => DB.patch('users/' + ME.id, { set:{ role:'skrbnik' }, del:[], n:1 })), ME.role === 'skrbnik' ? 'Preskočeno: si skrbnik.' : 'Dispečer ne sme spreminjati vlog.');
    const id = await DB.add('audit', { t:new Date().toISOString(), uid:String(ME.id), who:ME.name, role:ME.role, action:'varnostni.test', detail:{} }).catch(() => null);
    add('Revizijske sledi ni mogoče spremeniti', id ? await denied(() => DB.patch('audit/' + id, { set:{ action:'x' }, del:[], n:1 })) : false, 'Zapis v revizijski sledi ostane nespremenjen.');
    add('Revizijske sledi ni mogoče izbrisati', id ? await denied(() => DB.del('audit/' + id)) : false, '');
  } else {
    add('Ne morem prebrati baze pacientov', await denied(() => DB.list('patients')), 'Posadka vidi samo svoje prevoze.');
    add('Ne morem prebrati dnevne knjige', await denied(() => DB.get('days/' + today)), '');
    add('Ne morem prebrati nastavitev', await denied(() => DB.get('cfg/main')), '');
    add('Ne morem pisati v tuj razpored', await denied(() => DB.set('crew/' + today + '_tuj-uporabnik', { date:today, uid:'tuj-uporabnik', uids:['tuj-uporabnik'] })), '');
    add('Ne morem javljati korakov za tuje vozilo', await denied(() => DB.add('runs/' + today + '_nic/events', { rideId:'x', status:'sprejeta', t:new Date().toISOString(), c:new Date().toISOString(), uid:String(ME.id), by:ME.name })), '');
  }
  return res;
}
function securityTab(){
  const checks = securityChecks(), st = UI.selfTest;
  const mark = v => v === true ? '<span class="chip ok">v redu</span>' : v === false ? '<span class="chip bad">pozor</span>' : '<span class="chip warn">preveri</span>';
  return `<div class="stack"><div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Varnostni pregled</h3><button type="button" class="btn primary" data-act="selfTest" ${st && st.running ? 'disabled' : ''}>${IC.shield} ${st && st.running ? 'Preizkušam …' : 'Zaženi preizkus'}</button></div>
    <div class="checks">${checks.map(c => `<div class="check-row">${mark(c.ok)}<div><b>${esc(c.t)}</b><div class="hint">${esc(c.d)}</div></div></div>`).join('')}</div>
    ${st && st.results ? `<h3 style="margin-top:8px">Rezultat preizkusa (${new Date(st.at).toLocaleTimeString('sl-SI', { hour:'2-digit', minute:'2-digit' })})</h3><div class="checks">${st.results.map(r => `<div class="check-row">${r.pass === true ? '<span class="chip ok">uspelo</span>' : r.pass === false ? '<span class="chip bad">NI USPELO</span>' : '<span class="chip">preskočeno</span>'}<div><b>${esc(r.name)}</b>${r.detail ? `<div class="hint">${esc(r.detail)}</div>` : ''}</div></div>`).join('')}</div>` : ''}</div>
    <div class="card card-pad stack"><div class="card-head" style="margin:0"><h3>Revizijska sled</h3><button type="button" class="btn sm" data-act="loadAudit">Osveži</button></div>
    <div class="scrollbox" style="max-height:340px"><table><thead><tr><th>Čas</th><th>Kdo</th><th>Dejanje</th><th>Podrobnosti</th></tr></thead><tbody>${AUDIT.slice(0, 120).map(e => `<tr><td class="mono hint" style="white-space:nowrap">${new Date(e.t).toLocaleString('sl-SI', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td><td>${esc(e.who || '')} <span class="hint">${esc(ROLES[e.role] || e.role || '')}</span></td><td class="mono">${esc(e.action)}</td><td class="hint">${esc(JSON.stringify(e.detail || {}))}</td></tr>`).join('') || '<tr><td colspan="4" class="hint">Še ni zapisov.</td></tr>'}</tbody></table></div>
    <p class="hint" style="margin:0">Beleži se prijava, odjava, objava razporeda, ogled in sprememba pacientov ter nalogov, izvoz podatkov in spremembe uporabnikov. Zapisi se dodajajo; urejanje in brisanje nista mogoča. V zapisih ni zdravstvenih podatkov, samo začetnice in oznake.</p></div></div>`;
}
async function loadAudit(){
  if (!DB) return;
  try { const l = await DB.list('audit'); const arr = l.map(x => x.data).filter(x => x && x.t).sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 300); AUDIT.length = 0; arr.forEach(x => AUDIT.push(x)); } catch(e){ toast('Revizijske sledi ni mogoče prebrati.'); }
  if (UI.view === 'nastavitve') rerender();
}

/* ---------- Logotipi ---------- */
function logosTab(){
  const one = k => { const src = store.get('kp.logo.' + k); return `<div class="card card-pad stack" style="gap:10px"><h3>${esc(LOGOS[k].label)}</h3><div class="logoprev">${src ? `<img src="${esc(src)}" alt="${esc(LOGOS[k].label)}">` : '<span class="hint">Ni naloženega logotipa. Prikazano je besedilo.</span>'}</div>
    <input type="file" data-logo-file="${k}" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Naloži logotip ${esc(LOGOS[k].label)}">${src ? `<button type="button" class="btn sm danger" data-act="rmLogo" data-k="${k}">Odstrani</button>` : ''}
    <p class="hint" style="margin:0">Uradni logotip prejmeš od ZD Brežice (komunikacije/uprava). Za vse naprave ga shrani v mapo <span class="mono">${esc(LOGOS[k].file)}</span> v repozitoriju. Tukaj naložen logotip velja samo na tej napravi. Največ 400 KB.</p></div>`; };
  return `<div class="two">${one('zd')}${one('nmp')}</div>`;
}

/* ---------- Podatki ---------- */
function dataTab(){
  const adm = isAdmin();
  return `<div class="stack"><div class="card card-pad stack"><h3>Varnostna kopija</h3><p class="muted" style="margin:0">${BACKEND === 'firebase' ? 'Podatki so v skupni bazi. Izvoz prenese celotno knjigo (vse dneve), paciente in nastavitve v datoteko. Brezplačni Firebase nima samodejnih varnostnih kopij: izvozi enkrat na teden in datoteko shrani šifrirano (glej navodila, razdelek Varnostne kopije).' : 'Podatki so shranjeni v tem brskalniku. Izvozi kopijo in jo uvozi na drugem računalniku.'} Datoteka vsebuje podatke o pacientih, zato jo hrani šifrirano in varno.</p>
      ${adm ? `<div class="row"><button type="button" class="btn" data-act="exportData">Izvozi podatke</button><button type="button" class="btn" data-act="importData">Uvozi podatke</button><input type="file" id="jsonFile" accept=".json,application/json" style="max-width:260px"></div>
      <textarea id="dataBox" placeholder="Tu se prikaže izvoz. Za uvoz sem prilepi vsebino kopije ali izberi datoteko (podprta je tudi kopija prve različice)." style="min-height:110px;font-family:var(--font-mono);font-size:12px"></textarea>` : '<p class="hint">Izvoz in uvoz je na voljo skrbniku.</p>'}</div>
    <div class="card card-pad stack"><h3>Primeri</h3><p class="muted" style="margin:0">Izmišljeni pacienti, zaposleni in dializni vpisi, označeni s »PRIMER«.</p><div class="row"><button type="button" class="btn danger" data-act="rmDemo" ${hasDemo() ? '' : 'disabled'}>Odstrani vse primere</button></div></div>
    ${adm && BACKEND !== 'firebase' ? `<div class="card card-pad stack"><h3>Brisanje</h3><p class="muted" style="margin:0">Izbriše vse prevoze, paciente in nastavitve v tem brskalniku. Računi ostanejo.</p><div class="row"><button type="button" class="btn danger" data-act="wipe">Izbriši vse podatke</button></div></div>` : ''}</div>`;
}

/* ---------- Predogled za kopiranje ---------- */
function openPreview(title, variants){ UI.modal = { title, variants, idx:0 }; renderModal(); }
function renderModal(){
  const host = $('#modal'), m = UI.modal;
  if (!m){ host.hidden = true; host.innerHTML = ''; delete host.dataset.pk; return; }
  if (m.type === 'pick'){ renderPick(host, m); return; }
  if (m.type === 'nscan'){ renderScan(host, m); return; }
  if (m.type === 'nprint'){ renderNPrint(host, m); return; }
  if (m.type === 'bprint'){ renderBPrint(host, m); return; }
  if (m.type === 'bscan'){ renderBScan(host, m); return; }
  delete host.dataset.pk;
  const v = m.variants[m.idx], lines = v.text.split('\n');
  host.hidden = false;
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">${esc(m.title)}</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    ${m.variants.length > 1 ? `<div class="seg" role="group" aria-label="Oblika">${m.variants.map((x, i) => `<button type="button" data-act="pvVariant" data-i="${i}" aria-pressed="${i === m.idx}">${esc(x.label)}</button>`).join('')}</div>` : ''}
    <div class="pv" role="group" aria-label="Predogled">${lines.map((l, i) => `<button type="button" class="pvline" data-act="copyLine" data-i="${i}" title="Klikni za kopiranje vrstice">${esc(l) || '&nbsp;'}</button>`).join('')}</div>
    <p class="hint" style="margin:0">Klikni vrstico za kopiranje samo te vrstice.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button><button type="button" class="btn primary" data-act="copyVariant">${IC.copy} Kopiraj vse</button></div></div>`;
  const b = host.querySelector('.btn.primary'); if (b) b.focus();
}


/* ---------- Točka naslova na zemljevidu: pregled in popravek (kilometrina) ----------
   Dispečer vidi, kje aplikacija meni, da je naslov OD ali DO, in lahko z dotikom na zemljevidu postavi pravo točko. Popravek je ročen vpis (S.geoFix),
   velja za vse prevoze z istim naslovom od včeraj naprej in na vseh napravah. Za ustanove točke ni treba popravljati tukaj (Nastavitve → Klinike in ustanove). */
const pickText = m => { const hit = rideById(m.date, m.id); return hit ? String(hit.r[m.side] || '').trim() : ''; };
function pickSpec(m){
  const pins = [];
  if (m.cur && GEOC.isPoint(m.cur)) pins.push({ id:'cur', lon:m.cur.lon, lat:m.cur.lat, kind:'pu', label:'•', name:'Trenutna točka', html:`<b>Trenutna točka</b><br>${esc(GEOC.PREC[m.cur.prec] || '')}${m.cur.warn ? '<br>' + esc(m.cur.warn) : ''}` });
  if (m.pick) pins.push({ id:'new', lon:m.pick[0], lat:m.pick[1], kind:'do', label:'✓', name:'Nova točka', html:'<b>Nova točka</b><br>Shrani jo spodaj.' });
  return { routes:[], pins, pick:m.canFix ? { cb:pickAt } : null };
}
function pickAt(lon, lat){
  const m = UI.modal; if (!m || m.type !== 'pick') return;
  m.pick = [lon, lat]; const v = MAP.views[m.key]; if (v) v.user = true;
  pickRefresh(m);
}
function pickRefresh(m){
  const host = $('#modal'); if (!host || UI.modal !== m) return;
  const txt = pickText(m), st = host.querySelector('[data-role=pickst]');
  if (st){
    let t = '', warn = false;
    if (m.status){ t = m.status; warn = !!m.err; }
    else if (m.pick) t = 'Nova točka je izbrana. Shrani jo, da se kilometrina preračuna.';
    else if (m.cur){ t = 'Trenutna točka: ' + (GEOC.PREC[m.cur.prec] || '') + (m.cur.warn ? ' (' + m.cur.warn + ')' : '') + '.'; warn = !GEOC.exactPrec(m.cur.prec); }
    if (m.canFix === false && !m.status) t += ' Točka ustanove se ureja v Nastavitve → Klinike in ustanove.';
    else if (m.canFix && !MAP.tilesOn()) t += ' Podlaga zemljevida je izklopljena ali ni dosegljiva: točke ne moreš natančno izbrati.';
    else if (m.canFix && !m.pick) t += ' Dotakni se zemljevida tam, kjer je hiša (povečaj s + ali koleščkom).';
    st.textContent = t.trim(); st.classList.toggle('warn', warn);
  }
  const sv = host.querySelector('[data-act="pickSave"]'), cl = host.querySelector('[data-act="pickClear"]');
  if (sv) sv.disabled = !m.pick || !m.canFix;
  if (cl) cl.disabled = !GEOC.hasFix(txt);
  MAP.update(m.key, pickSpec(m));
}
async function pickLoad(m){
  const txt = pickText(m), side = m.side, an = GEOC.analyse(txt);
  m.cur = null; m.pick = null; m.err = false; m.canFix = ['search', 'unknown', 'settlement'].includes(an.mode) || (an.mode === 'import' ? false : GEOC.hasFix(txt));
  m.status = 'Iščem točko …'; pickRefresh(m);
  try { m.cur = await GEOC.resolve(txt); m.status = ''; }
  catch(e){
    m.status = e.message; m.err = true;
    if (an.g && isFinite(an.g.lat) && an.g.kind !== 'neznano') m.cur = { lat:an.g.lat, lon:an.g.lon, prec:'naselje', warn:'središče naselja' };
  }
  if (UI.modal !== m || m.side !== side) return;
  pickRefresh(m);
}
function openPick(date, id){
  const hit = rideById(date, id); if (!hit) return;
  const r = hit.r, side = (r.to || '').trim() && geo(r.to).kind !== 'poi' ? 'to' : 'from';
  UI.modal = { type:'pick', date, id, side }; renderModal(); pickLoad(UI.modal);
}
function renderPick(host, m){
  const hit = rideById(m.date, m.id); if (!hit){ UI.modal = null; renderModal(); return; }
  const k = m.key = 'pick|' + m.id + '|' + m.side;
  if (host.dataset.pk === k && host.querySelector('.imap[data-map="' + k + '"]')){ pickRefresh(m); return; }   // ponovni izris strani ne uniči zemljevida
  host.dataset.pk = k; host.hidden = false;
  const r = hit.r, short = s => { const t = String(s || '').trim() || '–'; return t.length > 34 ? t.slice(0, 33) + '…' : t; };
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Točka naslova na zemljevidu</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="seg" role="group" aria-label="Konec poti">${[['from', 'OD'], ['to', 'DO']].map(([s, l]) => `<button type="button" data-act="pickSide" data-s="${s}" aria-pressed="${m.side === s}">${l}: ${esc(short(r[s]))}</button>`).join('')}</div>
    ${MAP.html(k, pickSpec(m), { label:'Zemljevid za izbiro točke naslova' })}
    <div class="pickst" data-role="pickst" aria-live="polite"></div>
    <div class="pickbar"><button type="button" class="btn primary" data-act="pickSave" disabled>Shrani točko in preračunaj km</button><button type="button" class="btn" data-act="pickClear" disabled>Odstrani popravek</button><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
    <p class="hint" style="margin:0">Točka se shrani kot popravek naslova za vse prevoze z istim naslovom (od včeraj naprej) in na vseh napravah. Podatki zemljevida: © prispevajoči OpenStreetMap.</p></div>`;
  MAP.mountAll(host);
  const b = host.querySelector('.seg button[aria-pressed="true"]'); if (b) b.focus();
}

/* ---------- Tisk knjige prevozov za mesec ---------- */
const kmPrint = r => { const i = KM.info(r); return i.total == null ? '' : (i.exact && i.backExact ? '' : '~') + KM.fmtKm(i.total); };
function printMonthHTML(){
  const { y, m } = UI.month, n = daysInMonth(y, m); let body = '', total = 0, canc = 0;
  for (let d = 1; d <= n; d++){
    const date = `${y}-${pad(m + 1)}-${pad(d)}`, rs = filledRides(date), note = ((S.crewBook[date] || {}).ost || {}).text || '';
    if (!rs.length && !note) continue;
    rs.forEach(({ r }) => { if (r.odpovedano) canc++; else total++; });
    const rows = rs.map(({ r, nr }) => `<tr class="${r.odpovedano ? 'p-cancel' : ''}"><td>${nr}</td><td>${esc(r.time)}</td><td>${esc(r.name)}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${esc(MODES[r.mode] || '')}</td><td class="num">${r.odpovedano ? '' : kmPrint(r)}</td><td>${esc(r.note || '')}</td><td>${r.odpovedano ? '<b>ODPOVEDANO</b>' : r.done ? 'opravljeno' + (r.doneBy ? ' · ' + esc(r.doneBy) : '') : ''}</td></tr>`).join('');
    const hol = holiday(date);
    body += `<section><h3>${DOW_LONG[dow(date)]}, ${fmtDMY(date)}${hol ? ' · ' + esc(hol) : ''}</h3>${rs.length ? `<table><thead><tr><th>Št.</th><th>Ura</th><th>Pacient</th><th>Od</th><th>Do</th><th>Način</th><th>Km</th><th>Opomba</th><th>Stanje</th></tr></thead><tbody>${rows}</tbody></table>` : ''}${note ? `<p class="p-note"><b>Ostalo:</b> ${esc(note)}</p>` : ''}</section>`;
  }
  return `<h2>Knjiga prevozov · ${MONTHS[m]} ${y}</h2><p>Reševalna postaja Brežice · prevozov: ${total}${canc ? ` · odpovedanih: ${canc}` : ''}</p>${body || '<p>Ni vpisov.</p>'}`;
}
function printMonth(){
  let el = document.getElementById('printArea');
  if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
  el.className = ''; el.innerHTML = printMonthHTML();
  window.print();
}

/* ---------- Tisk knjige dneva (obrazec OBR REŠ 08: prevozi 1–10, 11–24, posadke po vozilih, posebnosti) ---------- */
function printDayHTML(date){
  const plan = computePlan(date), form = esc((S.settings.formCode || 'OBR REŠ 08').trim()), rides = ensureDay(date);
  const total = Math.max(24, rides.reduce((m, r, i) => isFilled(r) ? i + 1 : m, 0)), pageSplit = [[0, 10], [10, total]];
  const head = (n, N) => `<header class="pd-head"><div class="pd-logos">${logoInner()}</div><div class="pd-title"><b>KNJIGA REŠEVALNIH PREVOZOV</b><span>Reševalna postaja Brežice · ${form}</span></div>
    <div class="pd-date"><div>DATUM: <b>${fmtDMY(date)}</b></div><div>DAN: <b>${DOW_LONG[dow(date)]}</b></div><div class="pd-pg">list ${n}/${N}</div></div></header>`;
  const vehLine = plan.crews.filter(c => c.trips.length).map(c => esc(c.vehicle.name)).join(' · ') || '–';
  const row = i => {
    const r = rides[i], nr = i + 1;
    if (!r || !isFilled(r)) return `<tr class="pd-empty"><td class="pd-nr">${nr}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    const a = plan.assign[r.id], can = r.odpovedano;
    const pick = a && a.pickT != null ? fmtT(a.pickT) : '';
    const ret = a && a.retPickT != null ? ` · nazaj ${fmtT(a.retPickT)}` : '';
    const notes = [r.mode !== 'sede' ? (MODES[r.mode] || r.mode) : '', r.dia ? 'dializa' : '', +r.stay > 0 ? `čaka ${+r.stay} min` : '', r.note || ''].filter(Boolean).join(', ');
    return `<tr class="${can ? 'p-cancel' : ''}"><td class="pd-nr">${nr}</td><td>${esc(r.name || '')}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td class="pd-t">${esc(r.time || '')}</td><td class="pd-t">${can ? '' : (a && a.late > 0 ? '~' : '') + pick + ret}</td><td class="pd-v">${can ? '' : esc(a ? a.veh : '')}</td><td>${can ? '<b>ODPOVEDANO</b> ' : ''}${esc(notes)}</td></tr>`;
  };
  const N = 3;
  const page = ([a, b], k) => `<section class="pd-page">${head(k + 1, N)}${k === 0 ? `<div class="pd-veh">VOZILA: <b>${vehLine}</b></div>` : ''}
    <table class="pd-tab"><thead><tr><th class="pd-nr">Št.</th><th>Ime in priimek</th><th>Od</th><th>Do</th><th>Ura prev.</th><th>Pobere</th><th>Vozilo</th><th>Opomba</th></tr></thead><tbody>${Array.from({ length:b - a }, (_, j) => row(a + j)).join('')}</tbody></table></section>`;
  const crewRows = plan.crews.filter(c => c.trips.length || c.vehicle.tip !== 'ostalo').map(c => `<tr><td><b>${esc(c.vehicle.name)}</b></td><td>${esc(c.driver.name)}${c.team === 'NN' ? ' <b>(NN)</b>' : ''}${c.escorts.map(e => `<div>${esc(e.name)} (sp.)</div>`).join('')}${(c.helpers || []).map(h => `<div>${esc(h.name)} (${ROLE_TAG[h.role] || ''})</div>`).join('')}</td><td>${c.rideNrs.join(', ') || '–'}</td><td>${c.trips.length ? `ob ${fmtT(c.firstDepart)}` : ''}</td></tr>`).join('');
  const notices = S.notices.filter(n => !n.closed && n.from <= date && (!n.to || n.to >= date));
  const posebnosti = [S.dayNote[date] || '', ...notices.map(n => `${(S.vehicles.find(v => v.id === n.vehicleId) || {}).name || ''}: ${n.tip}${n.note ? ' – ' + n.note : ''}`)].filter(Boolean);
  const unas = plan.unassigned.length ? `<p class="pd-warn">Nerazporejeni prevozi: ${plan.unassigned.map(u => u.ride.nr).join(', ')}</p>` : '';
  return page(pageSplit[0], 0) + page(pageSplit[1], 1) + `<section class="pd-page">${head(3, N)}
    <table class="pd-tab pd-crew"><thead><tr><th>Vozilo</th><th>Voznik</th><th>Prevozi (št.)</th><th>Posebnosti</th></tr></thead><tbody>${crewRows || '<tr><td colspan="4">Ni posadk.</td></tr>'}</tbody></table>${unas}
    <div class="pd-pos"><b>Posebnosti:</b>${posebnosti.length ? '<ul>' + posebnosti.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : '<div class="pd-lines"></div>'}</div>
    <div class="pd-sign"><span>Dispečer: ______________________</span><span>Izpisano: ${new Date().toLocaleString('sl-SI')}</span></div>
    <p class="pd-fine">Ure »Pobere« so ocena razporeda (cestni podatki); dejanske ure vpiše posadka.</p></section>`;
}
function printDay(date){
  let el = document.getElementById('printArea');
  if (!el){ el = document.createElement('div'); el.id = 'printArea'; document.body.appendChild(el); }
  el.className = 'pday'; el.innerHTML = printDayHTML(date);
  audit('knjiga.tisk', { dan:date });
  window.print();
}

/* =====================================================================
   VMESNIK: skeniranje naloga (pregled prebranega) in tisk dopolnil na nalog; nastavitve tiska
   ===================================================================== */

/* ---------- Skeniranje naloga ---------- */
const NS_FIELDS = [
  ['name', 'Ime in priimek', 'text'], ['zzzs', 'Številka zavarovane osebe', 'text'], ['addr', 'Domači naslov (ulica hišna št., kraj)', 'text', 'full'], ['phone', 'Telefon', 'text'],
  ['stevilka', 'Številka naloga', 'text'], ['narocnik', 'Naročnik (izvajalec, ki je izdal nalog)', 'text', 'full'], ['zdravnik', 'Zdravnik', 'text'],
  ['od', 'Relacija: OD', 'text', 'full'], ['do', 'Relacija: DO', 'text', 'full'], ['razlog', 'Razlog prevoza', 'text'],
  ['izdan', 'Velja od (datum izdaje)', 'date'], ['veljaDo', 'Velja do', 'date']
];
function nsOpen(){
  UI.modal = { type:'nscan', step:'in', text:'', busy:'', err:'', f:{}, src:{}, notes:[], match:null, usePid:'', raw:'' };
  renderModal();
}
function nsSetText(m, text){
  m.raw = text;
  if (!String(text).trim()){ m.err = 'Besedila ni; prilepi besedilo ali izberi sliko.'; return false; }
  const r = NSCAN.parse(text);
  m.f = Object.assign({}, r.fields); m.src = r.src; m.notes = r.notes; m.found = r.found; m.total = r.total;
  const mt = NSCAN.matchPatient(m.f); m.match = mt; m.usePid = mt ? mt.p.id : '';
  m.step = 'review'; m.err = ''; return true;
}
async function nsFile(file){
  const m = UI.modal; if (!m || m.type !== 'nscan' || !file) return;
  m.err = ''; m.busy = 'Pripravljam sliko …'; renderModal();
  try {
    const png = await NSCAN.prepare(file);
    if (!NSCAN.ocrEnabled()) throw new Error('Razpoznava besedila iz slike ni vklopljena (config.js → ocr). Prilepi besedilo, ki ga prebere telefon (Kamera → Skeniraj besedilo).');
    m.busy = 'Razpoznavam besedilo (prvič lahko traja minuto ali dve) …'; renderModal();
    const text = await NSCAN.ocr(png, p => { const el = document.querySelector('[data-role=nsbusy]'); if (el){ const pc = p.pct != null && isFinite(p.pct) ? ' ' + Math.round(p.pct * 100) + ' %' : ''; el.textContent = (p.stage === 'lib' ? 'Nalagam razpoznavo besedila …' : 'Razpoznavam besedilo …' + pc); } });
    m.busy = ''; if (UI.modal !== m) return;
    if (!nsSetText(m, text)) m.text = text;
  } catch (e) { m.busy = ''; m.err = String(e && e.message || e); }
  if (UI.modal === m) renderModal();
}
function nsSave(){
  const m = UI.modal; if (!m || m.type !== 'nscan') return;
  const f = m.f;
  if (!String(f.name || '').trim()){ m.err = 'Vpiši vsaj ime in priimek pacienta.'; renderModal(); return; }
  const r = NSCAN.apply(f, { pid:m.usePid });
  UI.pid = r.p.id; UI.nid = r.n.id; UI.modal = null; renderModal();
  toast(r.created ? 'Pacient in nalog shranjena. Preveri podatke.' : r.updated ? 'Nalog posodobljen.' : 'Nalog dodan pacientu.');
  go('pacienti');
}
function renderScan(host, m){
  host.hidden = false; delete host.dataset.pk;
  const f = m.f || {}, miss = k => !String(f[k] || '').trim();
  const ocrOn = NSCAN.ocrEnabled();
  let body;
  if (m.step === 'review'){
    const grid = NS_FIELDS.map(([k, l, type, cls]) => `<div class="field ${cls || ''} ${miss(k) ? 'ns-miss' : ''}"><label for="ns-${k}">${esc(l)}${miss(k) ? ' <span class="dim">· ni prebrano</span>' : ''}</label><input id="ns-${k}" data-ns="${k}" type="${type}" value="${esc(f[k] || '')}" autocomplete="off"></div>`).join('');
    const sel = (k, label, opts) => `<div class="field"><label for="ns-${k}">${label}</label><select id="ns-${k}" data-ns="${k}">${opts.map(([v, l]) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
    const known = m.match ? `<div class="banner"><span>${IC.info}</span><div>Pacient je že v bazi (${esc(m.match.how)}). <label class="row" style="gap:8px;flex-wrap:nowrap;margin-top:6px"><input type="radio" name="nsWho" data-nswho="${m.match.p.id}" ${m.usePid === m.match.p.id ? 'checked' : ''}> Dodaj nalog pacientu <b>${esc(m.match.p.name)}</b></label>
      <label class="row" style="gap:8px;flex-wrap:nowrap"><input type="radio" name="nsWho" data-nswho="" ${m.usePid ? '' : 'checked'}> Ustvari novega pacienta</label></div></div>` : '';
    body = `${known}
      <p class="hint" style="margin:0">Prebrano je ${m.found || 0} od ${m.total || 5} ključnih podatkov. Preveri vsako polje, popravi, kar je narobe, in shrani. Polja z oznako »ni prebrano« izpolni ročno.${(m.notes || []).length ? ' ' + esc(m.notes.join(' ')) : ''}</p>
      <div class="formgrid">${grid}
        ${sel('mode', 'Način prevoza', Object.entries(MODES))}
        ${sel('vrsta', 'Vrsta naloga', Object.entries(NALOG_VRSTE).map(([k, v]) => [k, v.l]))}
        <div class="field full"><label for="ns-opombe">Opombe</label><textarea id="ns-opombe" data-ns="opombe" rows="2">${esc(f.opombe || '')}</textarea></div></div>
      <details class="hintdet"><summary>Prebrano besedilo (za primerjavo)</summary><pre class="nsraw">${esc(m.raw)}</pre></details>
      <p class="hint" style="margin:0">Datum rojstva in e-pošta se ne shranita. Slika in besedilo se ne hranita; shrani se samo, kar potrdiš.</p>
      ${m.err ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.info}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row" style="justify-content:space-between"><button type="button" class="btn" data-act="nsBack">Nazaj</button><button type="button" class="btn primary" data-act="nsSave">Shrani pacienta in nalog</button></div>`;
  } else {
    body = `<div class="banner"><span>${IC.info}</span><div>Fotografiraj nalog ali izberi PDF-sken. Aplikacija prebere besedilo in izpolni podatke; pred shranjevanjem vse preveriš. <b>Slika se ne pošlje nikamor in se ne shrani</b>; branje poteka v tej napravi (prvič se prenese program za razpoznavo besedila).</div></div>
      <div class="stack" style="gap:8px"><label class="btn primary" for="nsFile" style="cursor:pointer;justify-self:start">${ocrOn ? 'Izberi fotografijo ali PDF' : 'Izberi fotografijo ali PDF (razpoznava izklopljena)'}</label>
        <input id="nsFile" type="file" accept="image/*,application/pdf,.pdf" style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        ${m.busy ? `<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span data-role="nsbusy" role="status">${esc(m.busy)}</span></div>` : ''}</div>
      <div class="field"><label for="nsText">ali prilepi besedilo</label><textarea id="nsText" rows="7" placeholder="Prilepi besedilo naloga …">${esc(m.text)}</textarea>
        <span class="hint">iPhone: v polje se dotakni → ikona kamere → »Skeniraj besedilo«. Android: Google Lens → kopiraj besedilo. PDF z besedilom: označi vse, kopiraj, prilepi.</span></div>
      ${m.err ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.info}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button><button type="button" class="btn primary" data-act="nsParse" ${m.busy ? 'disabled' : ''}>Preberi besedilo</button></div>`;
  }
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Skeniraj nalog za prevoz</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div><div class="stack" style="gap:12px">${body}</div></div>`;
}

/* ---------- Tisk dopolnil na nalog ---------- */
function npOpen(pid, nid){
  const p = patientById(pid), n = p && (p.naloge || []).find(x => x.id === nid); if (!p || !n) return;
  const today = todayStr();
  const rows = NP.ridesFor(p, n).map(x => Object.assign(x, { on:!x.printed && x.done && x.date <= today }));
  UI.modal = { type:'nprint', pid, nid, rows, start:NP.nextRow(n), printed:{}, saved:false, err:'' };
  renderModal();
}
function npGroups(m){
  const sel = m.rows.filter(x => x.on);
  return NP.layout(sel, Math.max(1, Math.floor(+m.start) || 1));
}
function npDynHTML(m){
  const groups = npGroups(m), n = groups.reduce((a, g) => a + g.items.length, 0);
  if (!n) return `<div class="empty-state">Izberi vsaj en prevoz.</div>`;
  const pend = groups.filter(g => m.printed[g.key]);
  const btns = groups.map(g => `<button type="button" class="btn ${m.printed[g.key] ? '' : 'primary'}" data-act="npPrint" data-k="${g.key}">${IC.print || ''} ${esc(NP.groupLabel(g))}${m.printed[g.key] ? ' · natisnjeno' : ''}</button>`).join('');
  const first = groups[0], pv = NP.pageHTML(first.page, first.items.map(it => ({ line:it.line, f:it.x.f })), { guide:true });
  const sheets = new Set(groups.map(g => g.sheet));
  return `<div class="npv-wrap"><div class="npv" aria-label="Predogled: ${esc(NP.groupLabel(first))}">${pv}</div>
    <div class="stack" style="gap:8px">
      <p class="hint" style="margin:0">Predogled prve strani. Rdeče črte so samo pomoč pri poravnavi in se ne natisnejo.</p>
      ${sheets.size > 1 ? `<div class="banner"><span>${IC.info}</span><div>Prevozov je več, kot jih stane na en list (40 vrstic): za vsak list vstavi nov obrazec.</div></div>` : ''}
      <div class="stack" style="gap:6px">${btns}</div>
      <p class="hint" style="margin:0">Tiskalnik: papir A4, merilo <b>100 %</b> (ne »prilagodi strani«), brez glave in noge. Obrazec položi tako, da se natisne na stran s tabelo PREVOZI (sprednja stran: spodaj; hrbtna: od vrha).</p>
      ${pend.length ? `<div class="banner" style="background:var(--ok-soft,var(--soft));"><span>${IC.info}</span><div>Je izpis uspel? <button type="button" class="btn sm primary" data-act="npDone">Da, zapomni vrstice</button> Potem teh prevozov ne ponudimo več.</div></div>` : ''}</div></div>`;
}
function renderNPrint(host, m){
  host.hidden = false; delete host.dataset.pk;
  const p = patientById(m.pid), n = p && (p.naloge || []).find(x => x.id === m.nid);
  const cell = (i, k, v, w, cls = '') => `<td><input data-np="${i}|${k}" value="${esc(v)}" style="width:${w}" class="${cls}" autocomplete="off" aria-label="${k}"></td>`;
  const rows = m.rows.map((x, i) => `<tr class="${x.printed ? 'np-done' : ''}"><td><input type="checkbox" data-npon="${i}" ${x.on ? 'checked' : ''} aria-label="Natisni"></td>
    ${cell(i, 'datum', x.f.datum, '88px')}${cell(i, 'od', x.f.od, '58px')}${cell(i, 'do', x.f.do, '58px')}${cell(i, 'reg', x.f.reg, '92px')}${cell(i, 'km', x.f.km, '56px')}${cell(i, 'st', x.f.st, '52px')}${cell(i, 'spr', x.f.spr, '130px')}${cell(i, 'voz', x.f.voz, '120px')}
    <td class="dim">${x.printed ? `natisnjeno (št. ${x.row})` : x.done ? '' : 'še ni opravljen'}</td></tr>`).join('');
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide nprint" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Natisni v nalog ${n && n.stevilka ? '· ' + esc(n.stevilka) : ''}</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="stack" style="gap:12px">
      <div class="banner"><span>${IC.info}</span><div>Natisnejo se <b>samo podatki posadke</b> v tabelo PREVOZI: datum, čas od–do, reg. št., km, štartnina, spremljevalec in ime voznika (podpis voznika in pacienta ostane lastnoročen). Podatki pacienta se ne natisnejo. Vrednosti lahko popraviš pred tiskom.</div></div>
      ${m.rows.length ? `<div class="tablewrap"><table class="edtable"><thead><tr><th></th><th>Datum</th><th>Od</th><th>Do</th><th>Reg. št.</th><th>km</th><th>Štartnina</th><th>Spremljevalec</th><th>Voznik</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="row"><label for="npStart">Začni v vrstici št.</label><input id="npStart" data-npstart="1" type="number" min="1" max="400" value="${m.start}" style="width:72px"><span class="hint">Prva prosta vrstica po že natisnjenih je ${NP.nextRow(n)}. Vrstice 1–11 so na sprednji strani, 12–40 na hrbtni.</span></div>
      <div data-role="npdyn" class="stack" style="gap:10px">${npDynHTML(m)}</div>` : `<div class="empty-state">Za ta nalog še ni prevozov v knjigi. Prevoz dodaj v dnevno knjigo in izberi pacienta; nato ga tukaj natisneš.</div>`}
      <div class="row" style="justify-content:space-between"><span class="hint">Poravnavo položaja nastaviš v Nastavitve → Tisk naloga.</span><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
    </div></div>`;
}
function npRefreshDyn(){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const d = document.querySelector('[data-role=npdyn]'); if (d) d.innerHTML = npDynHTML(m);
}
function npPrintGroup(key){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const g = npGroups(m).find(x => x.key === key); if (!g) return;
  NP.printGroup(g); m.printed[key] = true; npRefreshDyn();
}
function npDone(){
  const m = UI.modal; if (!m || m.type !== 'nprint') return;
  const p = patientById(m.pid), n = p && (p.naloge || []).find(x => x.id === m.nid); if (!n) return;
  const at = new Date().toISOString(); let cnt = 0, max = +n.tiskRows || 0;
  npGroups(m).filter(g => m.printed[g.key]).forEach(g => g.items.forEach(it => {
    const hit = rideById(it.x.date, it.x.r.id); if (!hit) return;
    hit.r.pr = { row:it.row, sheet:g.sheet, at, f:Object.assign({}, it.x.f) }; cnt++; max = Math.max(max, it.row);
  }));
  if (cnt){ n.tiskRows = max; audit('nalog.tisk', { pid:p.id, nid:n.id, vrstic:cnt }); save(); toast(`Zapomnjenih vrstic: ${cnt}.`); }
  UI.modal = null; renderModal(); if (UI.view === 'pacienti') render();
}

/* ---------- Nastavitve → Tisk naloga ---------- */
function tiskCard(){
  const T = NP.cfg(), pv = (page) => `<div class="npv npv-s" aria-label="Preizkusna stran (${page === 'f' ? 'sprednja' : 'hrbtna'})">${NP.calibHTML(page)}</div>`;
  const num = (path, v, step, label, unit) => `<div class="field"><label for="tk-${path}">${label} <span class="dim">(${unit})</span></label>${field(path, v, { num:1, step, label })}</div>`;
  const regs = S.vehicles.filter(v => v.tip !== 'ostalo');
  return `<div class="card card-pad stack" style="gap:14px"><div class="card-head" style="margin:0"><h3>Tisk naloga za prevoz (dopolnila na obrazec)</h3></div>
    <div class="banner"><span>${IC.info}</span><div>Papirnati obrazec <b>Nalog za prevoz (NLG/05)</b> položiš v tiskalnik; aplikacija natisne <b>samo podatke posadke</b> v tabelo PREVOZI (datum, čas od–do, reg. št., km, štartnina, spremljevalec, ime voznika). Pacientovih podatkov ne natisne. Gumb »Natisni v nalog« je pri nalogu pacienta (Pacienti).</div></div>
    <div class="formgrid">
      <div class="field"><label for="tk-st">Štartnina <span class="dim">(€, natisne se pri vsakem prevozu; prazno = ne natisne)</span></label>${field('settings.tisk.startnina', T.startnina, { label:'Štartnina', ph:'npr. 3,50' })}</div>
      <div class="field"><label for="tk-kd">Decimalke pri km</label><select data-path="settings.tisk.kmDec" id="tk-kd"><option value="1" ${+T.kmDec === 1 ? 'selected' : ''}>ena (23,4)</option><option value="0" ${+T.kmDec === 0 ? 'selected' : ''}>cele km (23)</option></select></div>
      <div class="field"><label for="tk-od">Čas »od« je</label><select data-path="settings.tisk.od" id="tk-od"><option value="v_vozilu" ${T.od !== 'na_poti' ? 'selected' : ''}>pacient v vozilu (začetek poti OD → DO)</option><option value="na_poti" ${T.od === 'na_poti' ? 'selected' : ''}>odhod posadke k pacientu</option></select></div>
      <div class="field"><span class="lbl">Ime voznika</span><label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-path="settings.tisk.voznik" data-bool="1" ${T.voznik ? 'checked' : ''}> natisni v celico »Podpis voznika« (podpis ostane lastnoročen)</label></div>
    </div>
    <div class="card-head" style="margin:4px 0 0"><h3 style="font-size:15px">Poravnava na obrazec</h3></div>
    <p class="hint" style="margin:0">Obrazec predpostavlja list A4. Natisni preizkusno stran na navaden papir, jo skupaj z obrazcem pridrži proti svetlobi in popravi, če črte ne sedejo. Premik: pozitivno pomakne desno/navzdol.</p>
    <div class="formgrid">${num('settings.tisk.dx', T.dx, 0.5, 'Premik vodoravno', 'mm')}${num('settings.tisk.dy', T.dy, 0.5, 'Premik navpično', 'mm')}${num('settings.tisk.sx', T.sx, 0.5, 'Širina', '%')}${num('settings.tisk.sy', T.sy, 0.5, 'Višina', '%')}${num('settings.tisk.fs', T.fs, 0.5, 'Velikost pisave', 'pt')}</div>
    <div class="row"><button type="button" class="btn" data-act="npCalib" data-p="f">Natisni preizkus: sprednja stran</button><button type="button" class="btn" data-act="npCalib" data-p="b">Natisni preizkus: hrbtna stran</button></div>
    <div class="row" style="gap:16px;align-items:flex-start">${pv('f')}${pv('b')}</div>
    <p class="hint" style="margin:0">Registrske tablice so pri vozilih (Nastavitve → Vozila): ${regs.length ? regs.map(v => `${esc(v.name)} ${v.reg ? '<b>' + esc(v.reg) + '</b>' : '<span class="dim">(ni vnešena)</span>'}`).join(' · ') : 'ni vozil'}. Posadka (voznik, spremljevalec) in vozilo se vzamejo iz razporeda dneva, čas in km iz zabeleženih časov in kilometrine.</p></div>`;
}

/* ---------- Dogodki obrazcev (vnos v modalih) ---------- */
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('input', e => {
    const t = e.target, m = UI.modal; if (!t || !m) return;
    if (m.type === 'nscan'){ if (t.id === 'nsText') m.text = t.value; else if (t.dataset && t.dataset.ns){ m.f[t.dataset.ns] = t.value; } }
  });
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m) return;
    if (m.type === 'nscan'){
      if (t.id === 'nsFile'){ const fl = t.files && t.files[0]; t.value = ''; nsFile(fl); }
      else if (t.dataset && t.dataset.ns !== undefined){ m.f[t.dataset.ns] = t.value; if (t.dataset.ns === 'vrsta' || t.dataset.ns === 'izdan'){ if (t.dataset.ns === 'vrsta' && !m.f.veljaDo){ /* privzeta veljavnost se izračuna ob shranjevanju */ } } }
      else if (t.dataset && t.dataset.nswho !== undefined){ m.usePid = t.dataset.nswho; }
    } else if (m.type === 'nprint'){
      if (t.dataset && t.dataset.npon !== undefined){ m.rows[+t.dataset.npon].on = t.checked; npRefreshDyn(); }
      else if (t.dataset && t.dataset.np){ const [i, k] = t.dataset.np.split('|'); m.rows[+i].f[k] = t.value; npRefreshDyn(); }
      else if (t.dataset && t.dataset.npstart){ m.start = Math.max(1, Math.floor(+t.value) || 1); npRefreshDyn(); }
    }
  });
}

/* ============================================================================
   HITRI VNOS IN PONAVLJANJE: dispečerjev žargon v prevoz, kopiranje prevozov z drugega dne, ponovitev prevoza za naslednje dni
   Dispečer na papirju piše kratko (»Novak, Dobova 25, OI LJ, 8:00«). Hitri vnos razbere ime, naslov OD, cilj DO, uro in način;
   ustanove prepozna po imenih in kraticah (O.I. LJ, SBB, UKC LJ, ZD KK …), pacienta po bazi pacientov (»Doma« → naslov pacienta).
   ============================================================================ */
const QUICK_MODES = { sede:'sede', leze:'leze', 'leže':'leze', lezece:'leze', 'ležeče':'leze', utila:'utila', utilo:'utila', vzorci:'vzorci', vzorec:'vzorci', vzorce:'vzorci' };
/* V knjigi je pri dializi namesto ure napisano »Dop« ali »Pop«: termin dialize; uro določi Nastavitve → Dializa */
const QUICK_DIA = { dop:'dop', dopoldne:'dop', dopoldanska:'dop', pop:'pop', popoldne:'pop', popoldanska:'pop' };
const NOTE_CHIPS =['brez spremljevalca', 's spremljevalcem', 'invalidski voziček', 'kisik', 'počaka na pregled', 'vrne se sam', 'vzame izvide'];
const QUICK_NOTE_RE = /^(brez|z|s)\s+spremljevalc|voziček|vozicek|kisik|izvid|\bsam\b|opomba|^javijo|^prej\s+poklic|^poklic|^dodatna\s+dializ|^sprejem|^ne\s+prej|^mrsa|^pride\s+pred|^po\s+\d{1,2}\s?h?$/i;
const qNorm = s => norm(String(s || '')).replace(/\./g, '');

function quickTime(part){
  const m = /^(?:ob\s*)?(\d{1,2})(?:\s*[:.h]\s*(\d{2}))?\s*(?:h|uri)?$/i.exec(String(part).trim());
  if (!m) return null;
  const hh = +m[1], mm = m[2] == null ? 0 : +m[2];
  if (hh > 23 || mm > 59) return null;
  const explicit = /[:.h]|^ob\s/i.test(String(part).trim());
  return { t:String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), explicit };
}
function quickPatient(name){
  const q = norm(name); if (!q || q.length < 3) return null;
  let hit = S.patients.filter(p => norm(p.name) === q);
  if (hit.length === 1) return hit[0];
  const toks = q.split(/\s+/);
  hit = S.patients.filter(p => { const n = norm(p.name); return toks.every(t => n.includes(t)); });
  return hit.length === 1 ? hit[0] : null;
}
const isPoiText = s => { const g = geo(s); return g.kind === 'poi'; };

/* Razčleni vrstico: deli ločeni z vejico, podpičjem, | ali puščico; brez ločil se ime, naslov, cilj, ura in način poiščejo po besedah. */
function parseQuick(text){
  const out = { name:'', from:'', to:'', time:'', mode:'', dia:'', note:'', pid:'', ok:false };
  let s = String(text || '').replace(/\s+/g, ' ').trim(); if (!s) return out;
  s = s.replace(/\s*(→|->|>)\s*/g, ';');
  const sepText = s;
  let parts = s.split(/;|\|/.test(sepText) ? /\s*[;|]\s*/ : /\s*,\s*/).filter(Boolean);
  const notes = [];
  let timeLoose = null;
  if (parts.length === 1){
    /* brez ločil: odstrani uro in način, cilj je najdaljši končni del, ki je ustanova, ime so prve besede pred naslovom */
    let toks = s.split(' '), keep = [];
    for (let i = 0; i < toks.length; i++){
      const tk = toks[i], nx = toks[i + 1];
      if (/^ob$/i.test(tk) && nx && quickTime(nx)){ out.time = quickTime(nx).t; i++; continue; }
      const qt = quickTime(tk); if (qt && qt.explicit && !out.time){ out.time = qt.t; continue; }
      if (QUICK_MODES[qNorm(tk)] && !out.mode){ out.mode = QUICK_MODES[qNorm(tk)]; continue; }
      if (QUICK_DIA[qNorm(tk)] && !out.dia){ out.dia = QUICK_DIA[qNorm(tk)]; continue; }
      keep.push(tk);
    }
    if (out.mode === 'vzorci'){   // »Vzemi vzorce za IMI«: ni pacienta, cel preostanek je cilj
      keep = keep.filter(x => !/^(vzemi|vzami|odnesi|odvoz|za|v|na|do)$/i.test(x));
      if (keep.length && isPoiText(keep.join(' '))){ out.to = keep.join(' '); keep = []; }
    }
    let cut = -1;
    for (let i = 1; i < keep.length; i++){ if (isPoiText(keep.slice(i).join(' '))){ cut = i; break; } }
    const head = cut < 0 ? keep : keep.slice(0, cut);
    if (cut >= 0) out.to = keep.slice(cut).join(' ');
    let d = head.findIndex(x => /\d/.test(x));
    let nameN = d <= 0 ? Math.min(2, head.length) : Math.max(1, d - 1);
    if (head.length <= 1) nameN = head.length;
    out.name = head.slice(0, nameN).join(' '); out.from = head.slice(nameN).join(' ');
    if (cut < 0 && out.from && isPoiText(out.from)){ out.to = out.from; out.from = ''; }
  } else {
    const rest = [];
    for (let raw of parts){
      const tm = /^(.*\S)\s+(?:ob\s+)?(\d{1,2}(?:[:.]\d{2})?\s*h?)$/i.exec(raw);
      if (tm && !out.time && isPoiText(tm[1]) && quickTime(tm[2])){ out.time = quickTime(tm[2]).t; raw = tm[1]; }
      const n = qNorm(raw);
      if (QUICK_MODES[n]){ if (!out.mode) out.mode = QUICK_MODES[n]; continue; }
      if (QUICK_DIA[n]){ if (!out.dia) out.dia = QUICK_DIA[n]; continue; }
      const qt = quickTime(raw);
      if (qt && qt.explicit && !out.time){ out.time = qt.t; continue; }
      if (qt && !qt.explicit && !timeLoose){ timeLoose = qt.t; continue; }
      if (QUICK_NOTE_RE.test(raw) && !isPoiText(raw)){ notes.push(raw.replace(/^opomba:?\s*/i, '')); continue; }
      rest.push(raw);
    }
    if (!out.time && timeLoose) out.time = timeLoose;
    let name = '';
    if (rest.length && quickPatient(rest[0])) name = rest.shift();
    else if (rest.length && !isPoiText(rest[0]) && qNorm(rest[0]) !== 'doma' && (!/\d/.test(rest[0]) || (rest.length >= 3 && geo(rest[0]).kind === 'neznano'))) name = rest.shift();
    out.name = name;
    const items = rest.map(x => { const iz = /^iz\s+/i.test(x); return { t:x.replace(/^(iz|v|na|do)\s+/i, ''), poi:isPoiText(x.replace(/^(iz|v|na|do)\s+/i, '')), iz }; });
    const pois = items.filter(i => i.poi), oth = items.filter(i => !i.poi);
    if (pois.length >= 2){ out.from = pois[0].t; out.to = pois[1].t; oth.slice(0).forEach(o => notes.push(o.t)); }
    else if (pois.length === 1){
      const pi = items.indexOf(pois[0]), firstOther = oth.length ? items.indexOf(oth[0]) : -1;
      if (firstOther >= 0 && pi < firstOther || pois[0].iz){ out.from = pois[0].t; out.to = oth.length ? oth[0].t : ''; }
      else { out.to = pois[0].t; out.from = oth.length ? oth[0].t : ''; }
      oth.slice(1).forEach(o => notes.push(o.t));
    } else { out.from = oth[0] ? oth[0].t : ''; out.to = oth[1] ? oth[1].t : ''; oth.slice(2).forEach(o => notes.push(o.t)); }
  }
  const p = quickPatient(out.name);
  if (p){
    out.pid = p.id; out.name = p.name;
    if (!out.mode) out.mode = p.mode || '';
  }
  if (qNorm(out.from) === 'doma' && p) out.from = p.addr || out.from;
  if (qNorm(out.to) === 'doma' && p) out.to = p.addr || out.to;
  out.note = notes.join('; ');
  out.ok = !!(out.name || out.from || out.to);
  return out;
}
const QUICK_HELP = 'Piši po dispečersko: ustanove in kratice (OI LJ, SBB, UKC LJ, ZD KK), »Doma« vzame naslov pacienta iz baze. Ura: 8:00 ali ob 8.30. Način: leže, utila, vzorci.';
const MODE_LABEL = k => MODES[k] || k;
function quickPreview(p){
  if (!p || !p.ok) return '';
  const bits = [p.name ? `<b>${esc(p.name)}</b>${p.pid ? ' <span class="chip ok">v bazi</span>' : ''}` : '<span class="chip warn">brez imena</span>'];
  bits.push(`Od: ${p.from ? esc(p.from) : '<span class="dim">–</span>'}`); bits.push(`Do: ${p.to ? esc(p.to) : '<span class="dim">–</span>'}`);
  bits.push(p.time ? `ura <b class="mono">${esc(p.time)}</b>` : '<span class="dim">brez ure</span>');
  bits.push(esc(MODE_LABEL(p.mode || 'sede')));
  if (p.dia) bits.push('dializa ' + (p.dia === 'pop' ? 'popoldne' : 'dopoldne'));
  if (p.note) bits.push('opomba: ' + esc(p.note));
  return bits.join(' · ');
}
/* Vpiše prevoz v prvo prosto polje dneva. Vrne vpisani prevoz. */
function addQuickRide(date, p){
  if (!p || !p.ok) return null;
  const a = ensureDay(date); let r = a.find(x => !isFilled(x));
  if (!r){ addSlots(date, 5); r = ensureDay(date).find(x => !isFilled(x)); }
  Object.assign(r, blankRide(), { id:r.id, name:p.name, from:p.from, to:p.to, time:p.time, mode:p.mode || 'sede', dia:p.dia || '', note:p.note });
  if (p.pid){ applyPatientToRide(date, r.id, p.pid, { keepMode:!!p.mode }); r.from = p.from || r.from; r.to = p.to || r.to; r.note = p.note; }
  if (p.mode === 'vzorci' && !r.name) r.name = 'Vzorci';
  save(); if (typeof afterAddressChange === 'function') afterAddressChange(date, r, 'to'); else KM.schedule(date, r.id);
  if (r.from && typeof learnAddress === 'function') learnAddress(r.from);
  return r;
}

/* ---------- Kopiranje in ponavljanje ---------- */
const COPY_FIELDS = ['name', 'time', 'from', 'to', 'phone', 'mode', 'patientId', 'nalogId', 'note', 'stay', 'stayAuto', 'stayTouched', 'km', 'kmBack', 'kmSrc', 'kk', 'gf', 'gt', 'gp', 'kmWarn', 'kmAt'];
function cloneRideTo(r, date){
  const a = ensureDay(date);
  const dup = a.some(x => isFilled(x) && !x.odpovedano && norm(x.name) === norm(r.name) && (x.time || '') === (r.time || '') && norm(x.to) === norm(r.to) && norm(x.from) === norm(r.from));
  if (dup) return null;
  let t = a.find(x => !isFilled(x));
  if (!t){ addSlots(date, 5); t = ensureDay(date).find(x => !isFilled(x)); }
  Object.assign(t, blankRide(), { id:t.id });
  for (const k of COPY_FIELDS) if (r[k] !== undefined) t[k] = (r[k] && typeof r[k] === 'object') ? JSON.parse(JSON.stringify(r[k])) : r[k];
  if (r.patientId){ const p = patientById(r.patientId); const nl = p ? activeNalog(p, date) : null; t.nalogId = nl ? nl.id : ''; }
  return t;
}
function prevDayWithRides(date){
  for (let i = 1; i <= 21; i++){ const d = addDays(date, -i); if (filledRides(d).length) return d; }
  return addDays(date, -1);
}
function copyRides(src, dst, ids){
  let n = 0, skipped = 0;
  for (const { r } of filledRides(src)){ if (ids && !ids.includes(r.id)) continue; if (r.odpovedano) continue; if (cloneRideTo(r, dst)) n++; else skipped++; }
  if (n) save();
  return { n, skipped };
}
/* Ponovi prevoz za naslednje delovne dni: how = 'next' (naslednji delovni dan), 'week' (do petka), 'five' (naslednjih 5 delovnih dni) */
function repeatDates(date, how){
  const out = []; let d = date;
  const want = how === 'five' ? 5 : how === 'next' ? 1 : 99;
  for (let i = 0; i < 28 && out.length < want; i++){
    d = addDays(date, i + 1);
    if (how === 'week' && dow(d) === 1) break;                      // teden se konča z nedeljo
    if (isStandby(d)) continue;
    out.push(d);
    if (how === 'week' && dow(d) === 5) break;
  }
  return out;
}
function repeatRide(date, rideId, how){
  const hit = rideById(date, rideId); if (!hit) return { n:0, dates:[] };
  const dates = repeatDates(date, how), done = [];
  for (const d of dates){ const t = cloneRideTo(hit.r, d); if (t){ done.push(d); KM.schedule(d, t.id); } }
  if (done.length) save();
  return { n:done.length, dates:done, tried:dates.length };
}

/* =====================================================================
   OBJAVA RAZPOREDA, STATUSI PREVOZOV (dispečer) IN APLIKACIJA ZA POSADKE (voznik, spremljevalec)
   Tok: dispečer "Objavi razpored" → crew/{datum}_{uid} (vsak član posadke vidi samo svoj razpored) in runs/{datum}_{vozilo}.
   Posadka pritiska korake → runs/{ključ}/events/{id} (samo dodajanje). Dispečer te dogodke prenese v knjigo (čas, status, "kdo je naredil odvoz").
   ===================================================================== */
const EVENTS = {};      // runKey -> { eventId: event }
const RUNS = {};        // runKey -> run doc (pogled dispečerja)
let renderTimer = null;
const typingNow = () => { const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest && a.closest('#view') && !['checkbox', 'button', 'radio'].includes(a.type)); };
function scheduleRender(){
  if (!ME) return;
  if (typingNow()){ UI.stale = true; return; }
  clearTimeout(renderTimer); renderTimer = setTimeout(() => { UI.stale = false; rerender(); }, 60);
}
document.addEventListener('focusout', () => { setTimeout(() => { if (UI.stale && !typingNow()){ UI.stale = false; scheduleRender(); } }, 250); });

const staffOfDuty = d => S.staff.find(s => s.id === d.staffId) || S.staff.find(s => norm(s.name) === norm(d.name)) || null;
const hashStr = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const timeOf = iso => { if (!iso) return '–'; const d = new Date(iso); return isNaN(d) ? '–' : `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- Objava ---------- */
function planSig(date){
  const plan = computePlan(date);
  const rides = ensureDay(date).filter(r => plan.assign[r.id]).map(r => [r.id, r.name, r.time, r.from, r.to, r.phone, r.mode, r.note]);
  return hashStr(JSON.stringify([plan.crews.map(c => [c.id, c.driver.name, c.escorts.map(e => e.name), (c.helpers || []).map(h => h.name), c.trips.map(t => [fmtT(t.depart), t.rides.map(r => r.id)])]), rides]));
}
function publishState(date){
  const p = S.published[date]; if (!p || !p.at) return 'ni';
  return p.sig === planSig(date) ? 'ok' : 'spremenjeno';
}
async function publishDay(date){
  if (!can('publish')) return { ok:false, msg:'Nimaš pravice za objavo.' };
  // pred objavo počakaj na cestne podatke (prvi izračun jih samo zahteva), da so objavljeni časi izračunani po dejanskih cestah
  computePlan(date); try { await ROUTE.settle(); } catch(e){}
  const plan = computePlan(date), at = new Date().toISOString();
  const runs = [], noAccount = new Set(), ridesAssigned = new Set();
  for (const c of plan.crews){
    if (!c.trips.length) continue;
    const members = [c.driver, ...c.escorts, ...(c.helpers || [])], staffs = members.map(staffOfDuty);
    members.forEach((m, i) => { if (!(staffs[i] && staffs[i].userId)) noAccount.add(m.name); });
    const uids = [...new Set(staffs.map(s => s && s.userId).filter(Boolean))];
    const key = date + '_' + c.id, rides = {}, trips = [];
    c.trips.forEach(t => {
      t.rides.forEach(r => {
        const hit = rideById(date, r.id); if (!hit) return;
        const rr = hit.r, p = patientById(rr.patientId), n = p ? (p.naloge || []).find(x => x.id === rr.nalogId) : null;
        rides[r.id] = { nr:hit.nr, name:rr.name, time:rr.time, from:rr.from, to:rr.to, phone:rr.phone, mode:rr.mode, note:rr.note || '', dia:rr.dia || '', color:p && p.color >= 0 ? p.color : -1,
          nalog:n ? { v:NALOG_VRSTE[n.vrsta].l, st:n.stevilka } : null, pickT:fmtT(plan.assign[r.id].t), dropT:(t.ev && (t.ev.nEst || t.ev.nWait) ? '~' : '') + fmtT(plan.assign[r.id].dropT), kind:t.kind };
        ridesAssigned.add(r.id);
      });
      trips.push({ id:t.id, kind:t.kind, anchor:tripTitle(t) || t.anchor.label || '', depart:fmtT(t.depart), est:!!(t.ev && t.ev.nEst), stops:t.stopsAbs.map(s => ({ t:fmtT(s.t), type:s.type, label:s.pt.label || (s.type === 'do' && t.kind === 'to' ? (t.anchor.label || '') : ''), rideIds:(s.people || []).filter(Boolean).map(r => r.id) })) });
    });
    runs.push({ key, vehId:c.id, vehName:c.vehicle.name, uids, names:members.map(m => m.name), rides, trips, depart:fmtT(c.firstDepart), rideIds:Object.keys(rides) });
  }
  if (!runs.length) return { ok:false, msg:'Ni posadke s prevozi. Najprej sestavi razpored.' };
  const prev = (S.published[date] && S.published[date].runs) || [];
  const runJobs = [], crewJobs = [];
  for (const r of runs){
    runJobs.push(DB.set('runs/' + r.key, { date, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, rideIds:r.rideIds, at, by:ME.name }));
    r.uids.forEach(u => crewJobs.push(DB.set('crew/' + date + '_' + u, { date, vehId:r.vehId, vehName:r.vehName, runKey:r.key, uid:u, uids:r.uids, names:r.names, depart:r.depart, trips:r.trips, rides:r.rides, at, by:ME.name })));
  }
  // posadke, ki jih novi razpored ne vsebuje več
  prev.forEach(o => {
    const still = runs.find(r => r.key === o.key);
    if (!still) runJobs.push(DB.set('runs/' + o.key, { date, vehId:o.vehId || '', vehName:o.vehName, uids:[], names:[], rideIds:[], at, by:ME.name, withdrawn:true }));
    (o.uids || []).forEach(u => { if (!still || !still.uids.includes(u)) crewJobs.push(DB.del('crew/' + date + '_' + u)); });
  });
  // najprej "runs" (pravila za dogodke jih potrebujejo), nato razpored posameznih članov posadke
  await Promise.all(runJobs);
  await Promise.all(crewJobs);
  ensureDay(date).forEach(r => {
    const a = plan.assign[r.id];
    if (a){ r.runKey = date + '_' + a.crewId; if (!r.status || r.status === 'nova' || r.status === 'odklonjena') r.status = 'dodeljena'; }
  });
  S.published[date] = { at, by:ME.name, sig:planSig(date), runs:runs.map(r => ({ key:r.key, vehId:r.vehId, vehName:r.vehName, uids:r.uids, names:r.names, n:r.rideIds.length })) };
  audit('razpored.objavljen', { datum:date, vozila:runs.length, prevozov:ridesAssigned.size, prilagoditve:plan.bends.map(b => b.k) });
  save();
  return { ok:true, runs:runs.length, rides:ridesAssigned.size, noAccount:[...noAccount] };
}

/* ---------- Dispečer: sprejem dogodkov posadke ---------- */
function onRuns(changes){
  changes.forEach(c => {
    if (!c.data){ delete RUNS[c.id]; if (SY.runUnsubs[c.id]){ SY.runUnsubs[c.id](); delete SY.runUnsubs[c.id]; } return; }
    RUNS[c.id] = c.data;
    if (!SY.runUnsubs[c.id] && DB) SY.runUnsubs[c.id] = DB.watchCol('runs/' + c.id + '/events', ch => onEvents(c.id, ch));
  });
  remoteChanged();
}
function onEvents(key, changes){
  const m = EVENTS[key] = EVENTS[key] || {};
  changes.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  remoteChanged();
}
const sortedEvents = key => Object.values(EVENTS[key] || {}).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
function applyAllEvents(){
  if (!ME || !isStaffRole()) return false;
  let changed = false;
  for (const key of Object.keys(EVENTS)){
    const run = RUNS[key]; if (!run || !run.date) continue;
    const day = S.rides[run.date]; if (!day) continue;
    const byRide = {};
    sortedEvents(key).forEach(e => { (byRide[e.rideId] = byRide[e.rideId] || []).push(e); });
    for (const [rid, evs] of Object.entries(byRide)){
      const r = day.find(x => x.id === rid); if (!r) continue;
      const times = { ...(r.times || {}) };
      evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
      const last = evs[evs.length - 1];
      const sameT = JSON.stringify(times) === JSON.stringify(r.times || {});
      if (!sameT){ r.times = times; changed = true; }
      if (r.status !== last.status){ r.status = last.status; r.statusBy = last.by || ''; changed = true; }
      if (last.status === 'zakljucena' && !r.done){ r.done = true; r.doneAt = times.zakljucena || last.t; if (!r.doneBy) r.doneBy = (run.names || []).join(', '); changed = true; }
      if (last.status === 'odklonjena' && r.pin){ r.pin = ''; changed = true; }
      if (last.note && r.statusNote !== last.note){ r.statusNote = last.note; changed = true; }
    }
  }
  if (changed) save();
  return changed;
}
SY.onRemote = () => { if (isStaffRole()) applyAllEvents(); scheduleRender(); };

/* ---------- Dispečer: pogled "Živo" ---------- */
const ST_ORDER = ['odklonjena', 'ni_doma', 'na_kraju', 'na_poti', 'v_vozilu', 'sprejeta', 'dodeljena', 'nova', 'na_cilju', 'zakljucena', 'preklicana'];
const stChip = st => { const d = STATUSI[st] || STATUSI.nova; return `<span class="chip st-${st} ${d.tone}">${esc(d.s)}</span>`; };
function timesChips(r){
  const t = r.times || {};
  return STATUS_FLOW.filter(k => CASI_KLJUC[k] && t[k]).map(k => `<span class="chip mono" title="${esc(STATUSI[k].l)}">${esc(STATUSI[k].s)} ${timeOf(t[k])}</span>`).join('');
}
function liveSummary(date){
  const rows = filledRides(date).filter(x => x.r.status && x.r.status !== 'nova');
  const c = {}; rows.forEach(x => { c[x.r.status] = (c[x.r.status] || 0) + 1; });
  return c;
}
function liveRows(date){
  const published = S.published[date], out = [];
  filledRides(date).forEach(({ r, nr }) => { out.push({ r, nr, run:(published && published.runs || []).find(o => o.key === r.runKey) || null }); });
  return out;
}

/* ---------- Posadka: stanje in dejanja ---------- */
const CREW = { docs:{}, evs:{}, unsubs:[], evUnsub:{}, ready:false, date:null, err:'' };
function startCrew(){
  stopCrew();
  const today = todayStr(), ds = [addDays(today, -1), today, addDays(today, 1)];
  ds.forEach(d => CREW.unsubs.push(DB.watchDoc('crew/' + d + '_' + ME.id, doc => onCrewDoc(d, doc))));
  CREW.date = today;
}
function stopCrew(){
  CREW.unsubs.forEach(u => { try { u(); } catch(e){} }); CREW.unsubs = [];
  Object.values(CREW.evUnsub).forEach(u => { try { u(); } catch(e){} }); CREW.evUnsub = {};
  CREW.docs = {}; CREW.evs = {};
}
function onCrewDoc(d, doc){
  if (doc && doc.runKey){
    CREW.docs[d] = doc;
    if (!CREW.evUnsub[doc.runKey]) CREW.evUnsub[doc.runKey] = DB.watchCol('runs/' + doc.runKey + '/events', ch => onCrewEvents(doc.runKey, ch));
  } else delete CREW.docs[d];
  CREW.ready = true; scheduleRender();
}
function onCrewEvents(key, ch){
  const m = CREW.evs[key] = CREW.evs[key] || {};
  ch.forEach(c => { if (c.data) m[c.id] = c.data; else delete m[c.id]; });
  scheduleRender();
}
function crewRideState(runKey, rideId){
  const evs = Object.values(CREW.evs[runKey] || {}).filter(e => e.rideId === rideId).sort((a, b) => String(a.c || a.t).localeCompare(String(b.c || b.t)));
  const times = {}; evs.forEach(e => { if (CASI_KLJUC[e.status]) times[e.status] = e.t; });
  const last = evs[evs.length - 1];
  return { status:last ? last.status : 'dodeljena', times, last, note:last && last.note || '' };
}
async function sendStatus(date, rideId, status, opts = {}){
  const doc = CREW.docs[date]; if (!doc || !(CASI_KLJUC[status] || ['ni_doma', 'odklonjena'].includes(status))) return false;
  const now = new Date().toISOString();
  const e = { rideId, status, t:opts.t || now, c:now, uid:String(ME.id), by:ME.name };
  if (opts.note) e.note = String(opts.note).slice(0, 200);
  if (opts.corr) e.corr = true;
  try { await DB.add('runs/' + doc.runKey + '/events', e); return true; }
  catch(err){ console.error(err); toast('Pošiljanje ni uspelo. Poskusi znova.'); return false; }
}
const navUrl = addr => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((addr || '') + ', Slovenija');

/* ============================================================================
   INTERAKTIVNI ZEMLJEVID (brez zunanjih knjižnic)
   - povleci (miška / prst), povečaj (kolešček, dvojni klik ali dotik, dva prsta, gumba +/−, tipke), cela pot, čez cel zaslon
   - podlaga: ploščice OpenStreetMap (config.js → tiles; po napravi izklopljivo). Brez ploščic (izklop, brez povezave, blokirano)
     se še vedno prikaže pot in točke na nevtralni mreži.
   - pot po cestah (geometrija OSRM), puščice smeri, oštevilčene točke z okenci (kdo, kdaj, kje), merilo, pripisovanje virov
   Zemljevid se ob ponovnem izrisu strani znova ustvari; pogled (središče, povečava) si zapomni po ključu zemljevida.
   ============================================================================ */
const MAP = (() => {
  const TS = 256, MAXLAT = 85.05112878, MINZ = 2;
  const M = { specs:{}, views:{}, inst:new Set(), full:'' };
  const cfg = () => {
    const t = (window.KP_CONFIG && window.KP_CONFIG.tiles) || {};
    let url = t.url === undefined ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : String(t.url || '');
    if (url && !(/^https:\/\//.test(url) && url.includes('{z}') && url.includes('{x}') && url.includes('{y}'))) url = '';
    const link = String(t.link || 'https://www.openstreetmap.org/copyright');
    return { url, attr:String(t.attribution || '© prispevajoči OpenStreetMap'), link:/^https:\/\//.test(link) ? link : '', maxZoom:Math.max(5, Math.min(20, +t.maxZoom || 19)), subs:String(t.subdomains || '') };
  };
  const tilesOn = () => !!cfg().url && store.get('kp.map.tiles') !== 'off';
  const tileUrl = (c, z, x, y) => c.url.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', c.subs ? c.subs[(x + y) % c.subs.length] : '');
  /* Web Mercator: koordinate v slikovnih točkah sveta pri povečavi z */
  const px = (lon, lat, z) => { const s = TS * Math.pow(2, z), la = Math.max(-MAXLAT, Math.min(MAXLAT, lat)) * Math.PI / 180; return [(lon + 180) / 360 * s, (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * s]; };
  const ll = (x, y, z) => { const s = TS * Math.pow(2, z); y = Math.max(0, Math.min(s, y)); return [x / s * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / s))) * 180 / Math.PI]; };
  const ok = p => p && isFinite(p.lon) && isFinite(p.lat);

  const SVGI = {
    plus:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    minus:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    fit:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>',
    full:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 8V4h4M12 4h4v4M16 12v4h-4M8 16H4v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    close:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    layers:'<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" fill="none"/></svg>'
  };

  /* HTML za mesto zemljevida. spec: { routes:[{coords:[[lon,lat],…], color, est}], pins:[{id, lon, lat, kind:'base'|'pu'|'do', label, color, html}] } */
  function html(key, spec, o = {}){
    M.specs[key] = spec;
    return `<div class="rmap"><div class="imap${o.tall ? ' imap-tall' : ''}${M.full === key ? ' imap-full' : ''}" data-map="${esc(key)}"><div class="imap-vp" tabindex="0" role="application" aria-label="${esc(o.label || 'Zemljevid poti')}. Puščice premikajo, plus in minus spreminjata povečavo, 0 prilagodi na celotno pot."></div></div>${o.legend ? `<div class="rleg">${o.legend}</div>` : ''}</div>`;
  }

  function create(el, key, spec0){
    let spec = spec0;
    const vp = el.querySelector('.imap-vp'); if (!vp) return null;
    const c = cfg(); let on = tilesOn();
    const attrHtml = c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener noreferrer">${esc(c.attr)}</a>` : esc(c.attr);
    vp.innerHTML = `<div class="imap-tiles"></div><svg class="imap-svg" aria-hidden="true"></svg><div class="imap-pins"></div>
      <div class="imap-ctl" role="group" aria-label="Upravljanje zemljevida"><button type="button" data-mc="in" aria-label="Povečaj" title="Povečaj">${SVGI.plus}</button><button type="button" data-mc="out" aria-label="Pomanjšaj" title="Pomanjšaj">${SVGI.minus}</button><button type="button" data-mc="fit" aria-label="Prikaži celotno pot" title="Cela pot">${SVGI.fit}</button><button type="button" data-mc="full" aria-label="Čez cel zaslon" title="Čez cel zaslon">${SVGI.full}</button><button type="button" data-mc="tiles" aria-label="Vklopi ali izklopi podlago zemljevida" aria-pressed="${on}" title="Podlaga zemljevida">${SVGI.layers}</button></div>
      <div class="imap-pop" hidden></div><div class="imap-scale" aria-hidden="true"></div><div class="imap-note" hidden></div><div class="imap-attr">${on ? attrHtml : 'Podlaga izklopljena'}</div>`;
    const $t = vp.querySelector('.imap-tiles'), $s = vp.querySelector('.imap-svg'), $p = vp.querySelector('.imap-pins'), $pop = vp.querySelector('.imap-pop'),
      $note = vp.querySelector('.imap-note'), $sc = vp.querySelector('.imap-scale'), $full = vp.querySelector('[data-mc="full"]');
    const tiles = new Map(), bad = new Set();
    let W = 0, H = 0, okN = 0, errN = 0, openId = '', clusters = [], raf = 0, purgeT = 0, dead = false, ro = null;
    let v = M.views[key]; if (!v) v = M.views[key] = { lon:15.59, lat:45.9, zoom:11, user:false };
    const maxZ = () => on ? c.maxZoom : 18;
    const clampZ = z => Math.max(MINZ, Math.min(maxZ(), z));
    const routes = () => (spec.routes || []).filter(r => r.coords && r.coords.length > 1);
    const allPts = () => { const a = []; routes().forEach(r => r.coords.forEach(p => a.push(p))); (spec.pins || []).forEach(p => { if (ok(p)) a.push([p.lon, p.lat]); }); return a.filter(p => isFinite(p[0]) && isFinite(p[1])); };

    function fit(){
      if (!W || !H) return;
      const pts = allPts();
      if (!pts.length){ v.lon = 15.59; v.lat = 45.9; v.zoom = 11; return; }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(([lo, la]) => { const [x, y] = px(lo, la, 0); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const pL = 40, pR = 66, pV = 44, sx = Math.max(x1 - x0, 1e-7), sy = Math.max(y1 - y0, 1e-7);   // desno je prostor za gumbe
      const z = Math.min(Math.log2((W - pL - pR) / sx), Math.log2((H - 2 * pV) / sy));
      v.zoom = clampZ(Math.min(15.5, isFinite(z) ? z : 14));
      const k = Math.pow(2, v.zoom);
      [v.lon, v.lat] = ll((x0 + x1) / 2 * k + (pR - pL) / 2, (y0 + y1) / 2 * k, v.zoom);
      v.user = false;
    }
    const centerPx = () => px(v.lon, v.lat, v.zoom);
    function pan(dx, dy){ const [cx, cy] = centerPx(); [v.lon, v.lat] = ll(cx - dx, cy - dy, v.zoom); v.user = true; }
    function zoomAt(nz, sx, sy){
      nz = clampZ(nz); if (nz === v.zoom) return;
      const [cx, cy] = centerPx(), wx = cx - W / 2 + sx, wy = cy - H / 2 + sy, k = Math.pow(2, nz - v.zoom);
      [v.lon, v.lat] = ll(wx * k - sx + W / 2, wy * k - sy + H / 2, nz); v.zoom = nz; v.user = true;
    }
    const schedule = () => { if (!raf && !dead) raf = requestAnimationFrame(() => { raf = 0; render(); }); };

    /* ----- ploščice ----- */
    function settle(){
      /* ko so vse potrebne ploščice naložene (ali neuspešne), pobriši tiste izven pogleda ali stare povečave */
      const need = [...tiles.values()].filter(t => t.need);
      if (need.some(t => !t.img.classList.contains('ok') && !t.failed)) return false;
      for (const [k, t] of [...tiles]) if (!t.need){ t.img.remove(); tiles.delete(k); }
      return true;
    }
    function drawTiles(ox, oy){
      if (!on){ for (const t of tiles.values()) t.img.remove(); tiles.clear(); return; }
      const zt = Math.max(0, Math.min(c.maxZoom, Math.round(v.zoom))), n = Math.pow(2, zt), ts = TS * Math.pow(2, v.zoom - zt);
      const tx0 = Math.floor(ox / ts), tx1 = Math.floor((ox + W) / ts), ty0 = Math.max(0, Math.floor(oy / ts)), ty1 = Math.min(n - 1, Math.floor((oy + H) / ts));
      for (const t of tiles.values()) t.need = false;
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 90) return;          // zaščita pred nenavadno velikim pogledom
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){
        const k = zt + '/' + tx + '/' + ty;
        let t = tiles.get(k);
        if (!t){
          if (bad.has(k)) continue;
          const wx = ((tx % n) + n) % n, img = new Image();
          img.className = 'imap-t'; img.alt = ''; img.draggable = false; img.decoding = 'async';
          img.referrerPolicy = 'origin';        // pravila strežnika ploščic zahtevajo Referer (samo izvor, brez poti); stran sicer pošilja no-referrer
          img.style.zIndex = zt;
          t = { img, z:zt, tx, ty, need:true, failed:false };
          img.onload = () => { img.classList.add('ok'); okN++; $note.hidden = true; if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 60); };
          img.onerror = () => { t.failed = true; bad.add(k); errN++; img.remove(); tiles.delete(k); if (errN >= 3 && !okN){ $note.textContent = 'Podlaga zemljevida ni dosegljiva (brez povezave ali blokirana). Prikazana sta samo pot in točke.'; $note.hidden = false; } if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 60); };
          img.src = tileUrl(c, zt, wx, ty);
          $t.appendChild(img); tiles.set(k, t);
        }
        t.need = true;
      }
      for (const t of tiles.values()){
        const s = TS * Math.pow(2, v.zoom - t.z);
        t.img.style.width = t.img.style.height = (s + 0.6) + 'px';
        t.img.style.transform = `translate(${(t.tx * s - ox).toFixed(1)}px,${(t.ty * s - oy).toFixed(1)}px)`;
      }
      if (!purgeT) purgeT = setTimeout(() => { purgeT = 0; settle(); }, 400);
    }

    /* ----- pot (SVG) ----- */
    function drawRoutes(ox, oy){
      let out = '';
      for (const r of routes()){
        let d = '', lx = -1e9, ly = -1e9, arrows = '', acc = 0, px0 = null;
        r.coords.forEach(([lo, la], i) => {
          const [x, y] = px(lo, la, v.zoom), X = x - ox, Y = y - oy;
          if (i && Math.abs(X - lx) < 1.2 && Math.abs(Y - ly) < 1.2 && i < r.coords.length - 1) return;
          d += (d ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
          if (px0){
            const seg = Math.hypot(X - px0[0], Y - px0[1]); acc += seg;
            if (acc > 130 && seg > 6 && X > -20 && X < W + 20 && Y > -20 && Y < H + 20){ acc = 0; arrows += `<path class="imap-arrow" d="M-4 -4L3 0L-4 4" transform="translate(${((X + px0[0]) / 2).toFixed(1)} ${((Y + px0[1]) / 2).toFixed(1)}) rotate(${(Math.atan2(Y - px0[1], X - px0[0]) * 180 / Math.PI).toFixed(0)})"/>`; }
          }
          px0 = [X, Y]; lx = X; ly = Y;
        });
        if (!d) continue;
        out += `<path class="imap-casing" d="${d}"/><path class="imap-line${r.est ? ' est' : ''}" style="stroke:${r.color || 'var(--info)'}" d="${d}"/>${r.est ? '' : arrows}`;
      }
      $s.setAttribute('viewBox', `0 0 ${W} ${H}`); $s.setAttribute('width', W); $s.setAttribute('height', H);
      $s.innerHTML = out;
    }

    /* ----- točke (združene, če so blizu skupaj) ----- */
    function drawPins(ox, oy){
      const items = (spec.pins || []).filter(ok).map(p => { const [x, y] = px(p.lon, p.lat, v.zoom); return { p, x:x - ox, y:y - oy }; }).filter(q => q.x > -30 && q.x < W + 30 && q.y > -30 && q.y < H + 30);
      clusters = [];
      for (const q of items){
        let cl = clusters.find(k => Math.hypot(k.x - q.x, k.y - q.y) < 19);
        if (!cl){ cl = { x:q.x, y:q.y, items:[] }; clusters.push(cl); }
        cl.items.push(q.p);
      }
      $p.innerHTML = clusters.map((k, i) => {
        const non = k.items.filter(p => p.kind !== 'base'), base = !non.length;
        const labels = [...new Set(non.map(p => p.label).filter(Boolean))], lab = base ? '' : (labels.join(',').length > 9 ? labels.slice(0, 3).join(',') + '…' : labels.join(','));
        const drop = non.some(p => p.kind === 'do'), col = (non[0] && non[0].color) || '';
        const ids = k.items.map(p => p.id).join(',');
        const name = k.items.map(p => p.name || p.label || '').filter(Boolean).join('; ');
        return `<button type="button" class="imap-pin${base ? ' base' : ''}${drop ? ' do' : ''}${!base && k.items.some(p => p.kind === 'base') ? ' mixed' : ''}${openId && k.items.some(p => p.id === openId) ? ' sel' : ''}" data-ci="${i}" data-ids="${esc(ids)}" style="transform:translate(${k.x.toFixed(1)}px,${k.y.toFixed(1)}px)${col ? ';--pc:' + col : ''}" aria-label="${esc(base ? 'Postaja' : 'Postanek ' + lab)}${name ? ': ' + esc(name) : ''}">${esc(lab)}</button>`;
      }).join('');
      placePop();
    }
    function placePop(){
      if (!openId){ $pop.hidden = true; return; }
      const k = clusters.find(q => q.items.some(p => p.id === openId));
      if (!k){ $pop.hidden = true; return; }
      if ($pop.dataset.for !== openId){
        $pop.innerHTML = `<button type="button" class="imap-x" data-mc="pop-x" aria-label="Zapri okno">${SVGI.close}</button>` + k.items.map(p => `<div class="imap-pi">${p.html || esc(p.label || '')}</div>`).join('');
        $pop.dataset.for = openId;
      }
      $pop.hidden = false;
      const w = $pop.offsetWidth, h = $pop.offsetHeight;
      let left = Math.max(6, Math.min(W - w - 6, k.x - w / 2)), top = k.y - 20 - h;
      if (top < 6) top = Math.min(H - h - 6, k.y + 20);
      $pop.style.left = left + 'px'; $pop.style.top = Math.max(6, top) + 'px';
    }
    function scale(){
      const mpp = 156543.03392 * Math.cos(v.lat * Math.PI / 180) / Math.pow(2, v.zoom);
      const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000], target = 90 * mpp;
      let m = steps[0]; for (const s of steps) if (s <= target) m = s;
      $sc.style.width = Math.max(18, m / mpp) + 'px'; $sc.textContent = m >= 1000 ? (m / 1000) + ' km' : m + ' m';
    }
    function render(){
      if (dead) return;
      W = vp.clientWidth; H = vp.clientHeight; if (!W || !H) return;
      if (!v.user && !v.fitted){ fit(); }
      const [cx, cy] = centerPx(), ox = cx - W / 2, oy = cy - H / 2;
      drawTiles(ox, oy); drawRoutes(ox, oy); drawPins(ox, oy); scale();
    }

    /* ----- upravljanje ----- */
    const ptrs = new Map(); let moved = false, downPin = null, lastTap = { t:0, x:0, y:0 }, pinch = null, travel = 0;
    const rect = () => vp.getBoundingClientRect();
    vp.addEventListener('pointerdown', e => {
      if (e.target.closest('.imap-ctl, .imap-pop, .imap-attr')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { vp.setPointerCapture(e.pointerId); } catch(_){}
      ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if (ptrs.size === 1){ moved = false; travel = 0; downPin = e.target.closest('.imap-pin'); }
      if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = { d:Math.hypot(a.x - b.x, a.y - b.y) || 1, z:v.zoom, mx:(a.x + b.x) / 2, my:(a.y + b.y) / 2 }; moved = true; downPin = null; }
      vp.classList.add('grab');
    });
    vp.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1){
        travel += Math.abs(dx) + Math.abs(dy);
        if (travel > 5){ moved = true; pan(dx, dy); schedule(); }
      } else if (ptrs.size === 2 && pinch){
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = rect();
        pan(mx - pinch.mx, my - pinch.my); pinch.mx = mx; pinch.my = my;
        zoomAt(pinch.z + Math.log2(d / pinch.d), mx - r.left, my - r.top); schedule();
      }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      const wasOne = ptrs.size === 1; ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!ptrs.size) vp.classList.remove('grab');
      if (e.type === 'pointerup' && wasOne && !moved){
        if (downPin){ openPin(downPin); }
        else if (spec.pick && typeof spec.pick.cb === 'function'){      // način izbire točke: en dotik postavi točko (dvojni dotik za povečavo ni na voljo, povečaj z +/− ali koleščkom)
          const r = rect(), [cx, cy] = centerPx(), [lo, la] = ll(cx - W / 2 + (e.clientX - r.left), cy - H / 2 + (e.clientY - r.top), v.zoom);
          spec.pick.cb(lo, la);
        } else {
          const now = Date.now(), r = rect(), x = e.clientX - r.left, y = e.clientY - r.top;
          if (now - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 30){ zoomAt(v.zoom + 1, x, y); schedule(); lastTap.t = 0; }
          else { lastTap = { t:now, x, y }; if (openId){ openId = ''; $pop.dataset.for = ''; placePop(); drawPins(...origin()); } }
        }
      }
      downPin = null;
    };
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    const origin = () => { const [cx, cy] = centerPx(); return [cx - W / 2, cy - H / 2]; };
    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const r = rect(), d = -e.deltaY * (e.deltaMode ? 0.05 : 0.0022);
      zoomAt(v.zoom + Math.max(-0.7, Math.min(0.7, d)), e.clientX - r.left, e.clientY - r.top); schedule();
    }, { passive:false });
    function openPin(btn){
      const ids = (btn.dataset.ids || '').split(','), first = ids[0]; if (!first) return;
      openId = openId === first ? '' : first; $pop.dataset.for = '';
      drawPins(...origin());
    }
    $p.addEventListener('click', e => { const b = e.target.closest('.imap-pin'); if (b && e.detail === 0) openPin(b); });   // tipkovnica (Enter/preslednica)
    function setFull(on2){
      M.full = on2 ? key : ''; el.classList.toggle('imap-full', on2); document.documentElement.classList.toggle('imap-lock', on2);
      $full.setAttribute('aria-label', on2 ? 'Zapri celozaslonski prikaz' : 'Čez cel zaslon'); $full.innerHTML = on2 ? SVGI.close : SVGI.full;
      if (on2) vp.focus(); schedule();
    }
    function setTiles(x){ store.set('kp.map.tiles', x ? 'on' : 'off'); on = tilesOn(); vp.querySelector('[data-mc="tiles"]').setAttribute('aria-pressed', on); vp.querySelector('.imap-attr').innerHTML = on ? attrHtml : 'Podlaga izklopljena'; if (!on){ $note.hidden = true; for (const t of tiles.values()) t.img.remove(); tiles.clear(); } v.zoom = clampZ(v.zoom); schedule(); }
    vp.addEventListener('click', e => {
      const b = e.target.closest('[data-mc]'); if (!b) return;
      const a = b.dataset.mc, cxx = W / 2, cyy = H / 2;
      if (a === 'in') zoomAt(Math.floor(v.zoom + 1e-6) + 1, cxx, cyy);
      else if (a === 'out') zoomAt(Math.ceil(v.zoom - 1e-6) - 1, cxx, cyy);
      else if (a === 'fit'){ v.user = false; v.fitted = false; fit(); }
      else if (a === 'full') setFull(!el.classList.contains('imap-full'));
      else if (a === 'tiles') setTiles(!on);
      else if (a === 'pop-x'){ openId = ''; $pop.dataset.for = ''; }
      schedule();
    });
    vp.addEventListener('keydown', e => {
      if (e.target.closest('.imap-pin, .imap-ctl, .imap-pop')){ if (e.key === 'Escape' && openId){ openId = ''; $pop.dataset.for = ''; schedule(); e.stopPropagation(); } return; }
      const k = e.key; let h = true;
      if (k === 'ArrowLeft') pan(60, 0); else if (k === 'ArrowRight') pan(-60, 0); else if (k === 'ArrowUp') pan(0, 60); else if (k === 'ArrowDown') pan(0, -60);
      else if (k === '+' || k === '=') zoomAt(v.zoom + 0.5, W / 2, H / 2); else if (k === '-' || k === '_') zoomAt(v.zoom - 0.5, W / 2, H / 2);
      else if (k === '0' || k === 'Home'){ v.user = false; v.fitted = false; fit(); }
      else if (k === 'Escape'){ if (openId){ openId = ''; $pop.dataset.for = ''; } else if (el.classList.contains('imap-full')) setFull(false); else h = false; }
      else h = false;
      if (h){ e.preventDefault(); schedule(); }
    });
    if (typeof ResizeObserver !== 'undefined'){ ro = new ResizeObserver(() => schedule()); ro.observe(vp); }
    if (el.classList.contains('imap-full')){ document.documentElement.classList.add('imap-lock'); $full.innerHTML = SVGI.close; }
    el.classList.toggle('picking', !!spec.pick);
    render();

    const api = {
      el, key, render, fit:() => { v.user = false; v.fitted = false; fit(); schedule(); },
      focusPin(id, z){
        const p = (spec.pins || []).find(q => q.id === id); if (!p || !ok(p)) return false;
        v.zoom = clampZ(Math.max(v.zoom, z || 14)); v.lon = p.lon; v.lat = p.lat; v.user = true; openId = id; $pop.dataset.for = ''; render(); return true;
      },
      setSpec(sp){ spec = sp; el.classList.toggle('picking', !!sp.pick); $pop.dataset.for = ''; schedule(); },
      destroy(){ dead = true; if (ro) ro.disconnect(); clearTimeout(purgeT); cancelAnimationFrame(raf); tiles.clear(); }
    };
    return api;
  }

  function mountAll(root){
    for (const m of [...M.inst]) if (!m.el.isConnected){ m.destroy(); M.inst.delete(m); }
    if (M.full && !document.querySelector('.imap.imap-full')){ M.full = ''; document.documentElement.classList.remove('imap-lock'); }
    (root || document).querySelectorAll('.imap[data-map]').forEach(el => {
      if (el.__imap) return;
      const spec = M.specs[el.dataset.map]; if (!spec) return;
      el.__imap = create(el, el.dataset.map, spec); if (el.__imap) M.inst.add(el.__imap);
    });
  }
  /* zamenjaj vsebino že prikazanega zemljevida (npr. ko se naložijo ceste), pogled ostane */
  function update(key, spec){
    M.specs[key] = spec;
    for (const m of M.inst) if (m.key === key && m.el.isConnected) m.setSpec(spec);
  }
  /* pomakni zemljevid na točko (klik na postanek v seznamu) */
  function focus(key, id){
    for (const m of M.inst) if (m.key === key && m.el.isConnected){ m.el.scrollIntoView({ block:'nearest', behavior:'smooth' }); return m.focusPin(id); }
    return false;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && M.full){ const m = [...M.inst].find(x => x.key === M.full); const b = m && m.el.querySelector('[data-mc="full"]'); if (b) b.click(); } });
  return Object.assign(M, { html, mountAll, update, focus, cfg, tilesOn, px, ll });
})();

/* =====================================================================
   VMESNIK: tisk knjige za mesec (pogovorno okno) in skeniranje strani papirne knjige (pregled z označbami nejasnega)
   ===================================================================== */

/* ---------- Predogled in tisk knjige za mesec ----------
   Okno: mesec → predogled strani (ena stran naenkrat, enaka natisnjeni; telefon in računalnik) → tisk ali odpiranje v zavihku (PDF).
   Predogled je izoliran okvir (sandbox, brez skript) z istim dokumentom, kot gre v tisk (BOOK.doc). */
const BK_W = 794, BK_H = 1119;   // A4 (210 × 296 mm) v CSS pikslih pri 96 dpi
function bkOpen(){
  const { y, m } = UI.month, wide = typeof window !== 'undefined' && window.innerWidth >= 900;
  UI.modal = { type:'bprint', y, m, o:BOOK.load(), b:null, wait:false, tries:0, err:'', msg:'', t:0, pg:1, zoom:'fit', optOpen:wide, bid:0 };
  bkEnsure(UI.modal); renderModal(); bkBuildSoon(UI.modal, 30);
}
function bkEnsure(m){
  const a = `${m.y}-${pad(m.m + 1)}-01`, b = `${m.y}-${pad(m.m + 1)}-${pad(daysInMonth(m.y, m.m))}`;
  try { ensureRange(a, b); } catch (e) { /* lokalni način */ }
}
function bkBuildSoon(m, delay){
  clearTimeout(m.t); m.b = null;
  m.t = setTimeout(() => {
    if (UI.modal !== m) return;
    if (!BOOK.monthReady(m.y, m.m)){
      m.tries++; m.wait = m.tries < 20; if (!m.wait) m.err = 'Podatkov za ta mesec ni mogoče naložiti (preveri povezavo).';
      renderModal(); if (m.wait) m.t = setTimeout(() => bkBuildSoon(m, 0), 1200); return;
    }
    m.wait = false; m.err = '';
    try { m.b = BOOK.build(m.y, m.m, m.o); m.bid++; m.pg = Math.min(m.b.pages, Math.max(1, m.pg | 0)); } catch (e) { m.err = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); }
    if (UI.modal === m) renderModal();
  }, delay);
}
const bkCoarse = () => { try { return !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } };
function bkJumps(b){
  const o = b.opts, out = [];
  if (o.front){ out.push(['Naslovnica', 1], ['Kazalo', 2]); }
  b.dayStart.forEach(d => out.push([`${fmtDMY(d.date)} · ${DOW_LONG[dow(d.date)]}`, d.page]));
  if (o.summary) out.push(['Mesečni povzetek', b.pages]);
  return out;
}
function renderBPrint(host, m){
  host.hidden = false; delete host.dataset.pk;
  const o = m.o, b = m.b, coarse = bkCoarse();
  const chk = (k, label, hint) => `<label class="row bk-opt" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-bk="${k}" ${o[k] ? 'checked' : ''}><span><b>${label}</b>${hint ? `<span class="hint" style="display:block">${hint}</span>` : ''}</span></label>`;
  const info = m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>`
    : m.wait ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Podatki za ta mesec se nalagajo …</span></div>'
    : !b ? '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span role="status">Sestavljam knjigo …</span></div>'
    : `<div class="banner"><span>${IC.info}</span><div role="status"><b>${b.pages}</b> strani${o.duplex ? ` (<b>${b.sheets}</b> listov, obojestransko)` : ''} · ${b.days} dni · <b>${b.rides}</b> prevozov${b.canc ? `, ${b.canc} odpovedanih` : ''}.</div></div>`;
  const ready = !!(b && !m.wait);
  const jumps = ready ? bkJumps(b) : [];
  const prev = ready ? `<section class="bk-prevbox" aria-label="Predogled knjige">
      <div class="bk-nav">
        <button type="button" class="btn sm" data-act="bkPg" data-d="-1" aria-label="Prejšnja stran" data-role="bkprevbtn">◀</button>
        <label class="bk-pgn">Stran <input type="number" min="1" max="${b.pages}" step="1" inputmode="numeric" data-bk="pg" value="${m.pg}" aria-label="Številka strani"> / ${b.pages}</label>
        <button type="button" class="btn sm" data-act="bkPg" data-d="1" aria-label="Naslednja stran" data-role="bknextbtn">▶</button>
        <select data-bk="jump" aria-label="Skoči na dan" data-role="bkjump">${jumps.map(([t, p]) => `<option value="${p}">str. ${p} · ${esc(t)}</option>`).join('')}</select>
        <select data-bk="zoom" aria-label="Povečava predogleda"><option value="fit" ${m.zoom === 'fit' ? 'selected' : ''}>Prilagodi zaslonu</option><option value="1" ${m.zoom === '1' ? 'selected' : ''}>100 %</option><option value="1.5" ${m.zoom === '1.5' ? 'selected' : ''}>150 %</option></select>
      </div>
      <div class="bk-prev" data-role="bkprev"><div class="bk-sheet" data-role="bksheet"><iframe class="bk-frame" sandbox title="Predogled strani knjige" data-role="bkframe" tabindex="-1"></iframe></div></div>
      <p class="hint" style="margin:6px 0 0">Predogled je enak natisu. Siv pas ob notranjem robu je prostor za vezavo (ne natisne se).</p></section>`
    : `<section class="bk-prevbox bk-prevwait" aria-label="Predogled knjige">${m.err ? '' : '<div class="row" style="gap:8px"><span class="spin" aria-hidden="true"></span><span>Predogled se pripravlja …</span></div>'}</section>`;
  const btnPrint = `<button type="button" class="btn ${coarse ? '' : 'primary'}" data-act="bkPrint" ${ready ? '' : 'disabled'}>Natisni knjigo</button>`;
  const btnTab = `<button type="button" class="btn ${coarse ? 'primary' : ''}" data-act="bkTab" ${ready ? '' : 'disabled'} title="Knjiga se odpre v novem zavihku: tam izberi Natisni ali Shrani kot PDF (priporočeno na telefonu)">Odpri za tisk / PDF</button>`;
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bprint" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Knjiga meseca: predogled in tisk</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div>
    <div class="bk-grid">
      <div class="bk-top stack" style="gap:10px"><div class="field"><label for="bk-ym">Mesec</label><input id="bk-ym" type="month" data-bk="ym" value="${m.y}-${pad(m.m + 1)}" style="max-width:220px"></div>${info}</div>
      ${prev}
      <div class="bk-act stack" style="gap:8px">
        ${m.msg ? `<div class="banner bad" role="alert"><span>${IC.alert}</span><div>${esc(m.msg)}</div></div>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap">${coarse ? btnTab + btnPrint : btnPrint + btnTab}</div>
        <p class="hint" style="margin:0"><b>Telefon:</b> pritisni »Odpri za tisk / PDF«, nato v meniju brskalnika (⋮ ali »Deli«) izberi »Natisni« ali »Shrani kot PDF«. <b>Računalnik:</b> »Natisni knjigo« odpre okno tiskanja (tam je tudi »Shrani kot PDF«).</p>
        <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><button type="button" class="btn" data-act="bkList" title="Starejši, krajši izpis: ena tabela po dnevih, A4 ležeče">Samo seznam (ležeče)</button><button type="button" class="btn" data-act="closeModal">Zapri</button></div>
      </div>
      <details class="bk-opts" data-role="bkopts" ${m.optOpen ? 'open' : ''}><summary>Možnosti knjige</summary><div class="stack" style="gap:8px;margin-top:8px">
        ${chk('front', 'Naslovnica in kazalo', 'prva stran: naslovnica, druga: kazalo z datumi in številkami strani')}
        ${chk('duplex', 'Obojestransko, vsak dan na nov list', 'dan se začne na desni strani; zadnja stran dneva je črtana stran za opombe; rob za vezavo se menja po straneh')}
        ${chk('summary', 'Mesečni povzetek na koncu', 'število prevozov, kilometrina in prevozi po vozilih, podpis')}
        ${chk('skipEmpty', 'Izpusti dneve brez vpisov', 'privzeto so v knjigi vsi dnevi meseca, tudi prazni')}
        ${chk('km', 'Stolpec »Km« pri prevozih', 'ga v papirni knjigi ni; kilometrina OD→DO po cestah')}
        <div class="field" style="max-width:220px"><label for="bk-gut">Rob za vezavo (mm)</label><input id="bk-gut" type="number" min="0" max="30" step="1" data-bk="gut" value="${o.gut}" inputmode="numeric"></div>
        <p class="hint" style="margin:0">Tiskalnik: papir <b>A4 pokončno</b>, merilo <b>100 %</b> (ne »prilagodi strani«), brez glave in noge. Obojestransko: obrni ob <b>dolgem robu</b>.</p>
      </div></details>
      <p class="hint bk-note" style="margin:0">Opravljeni prevozi imajo dejansko uro pobiranja, vozilo in ime tistega, ki je prevoz opravil (✓), če je to vpisano. Prevozi z oznako ⚠ so bili prebrani s fotografije in še niso potrjeni.</p>
    </div></div>`;
  bkPaintPrev(m);
}
/* predogled: nastavi stran in merilo (okvir je vedno velik kot A4 pri 96 dpi in se samo pomanjša/poveča) */
function bkPaintPrev(m){
  if (UI.modal !== m || !m.b) return;
  const fr = document.querySelector('[data-role=bkframe]'), prev = document.querySelector('[data-role=bkprev]'), sheet = document.querySelector('[data-role=bksheet]'); if (!fr || !prev || !sheet) return;
  const n = m.b.pages; m.pg = Math.min(n, Math.max(1, m.pg | 0 || 1));
  const sig = m.bid + ':' + m.pg;
  if (fr.dataset.sig !== sig){ fr.dataset.sig = sig; fr.srcdoc = BOOK.doc(m.b, 'view', m.pg); }
  const cw = Math.max(120, prev.clientWidth - 16), wide = window.innerWidth >= 900, maxH = wide ? Math.max(380, window.innerHeight * 0.68) : 1e9;
  const k = m.zoom === 'fit' ? Math.min(1.5, cw / BK_W, maxH / BK_H) : (+m.zoom || 1);
  sheet.style.width = Math.round(BK_W * k) + 'px'; sheet.style.height = Math.round(BK_H * k) + 'px';
  fr.style.transform = 'scale(' + k + ')'; m.k = k;
  const inp = document.querySelector('input[data-bk=pg]'); if (inp && document.activeElement !== inp) inp.value = m.pg;
  const pb = document.querySelector('[data-role=bkprevbtn]'), nb = document.querySelector('[data-role=bknextbtn]'); if (pb) pb.disabled = m.pg <= 1; if (nb) nb.disabled = m.pg >= n;
  const jp = document.querySelector('[data-role=bkjump]'); if (jp){ let sel = null; [...jp.options].forEach(op => { if (+op.value <= m.pg) sel = op; }); if (sel) jp.value = sel.value; }
}
function bkGoto(m, p){ if (!m || m.type !== 'bprint' || !m.b) return; m.pg = Math.min(m.b.pages, Math.max(1, parseInt(p, 10) || 1)); bkPaintPrev(m); }
/* sveža knjiga iz trenutnih podatkov (za tisk in odpiranje) */
function bkFresh(m){
  if (!BOOK.monthReady(m.y, m.m)){ m.msg = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek.'; renderModal(); return null; }
  BOOK.store(m.o); m.msg = '';
  try { return BOOK.build(m.y, m.m, m.o); } catch (e) { m.msg = 'Knjige ni mogoče sestaviti: ' + String(e && e.message || e); renderModal(); return null; }
}
function bkPrint(){
  const m = UI.modal; if (!m || m.type !== 'bprint') return;
  const b = bkFresh(m); if (!b) return;
  try { BOOK.printFrame(b); } catch (e) { m.msg = 'Tiskanja ni mogoče zagnati: ' + String(e && e.message || e) + ' Poskusi »Odpri za tisk / PDF«.'; renderModal(); }
}
function bkTab(){
  const m = UI.modal; if (!m || m.type !== 'bprint') return;
  const b = bkFresh(m); if (!b) return;
  const w = BOOK.openTab(b);
  if (!w){ m.msg = 'Brskalnik je blokiral novo okno. Dovoli pojavna okna za to stran in poskusi znova.'; renderModal(); }
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bprint' || !t.dataset || t.dataset.bk === undefined) return;
    const k = t.dataset.bk;
    if (k === 'pg'){ bkGoto(m, t.value); return; }
    if (k === 'jump'){ bkGoto(m, t.value); return; }
    if (k === 'zoom'){ m.zoom = t.value; bkPaintPrev(m); return; }
    if (k === 'ym'){
      const mm = /^(\d{4})-(\d{2})$/.exec(t.value); if (!mm) return;
      m.y = +mm[1]; m.m = +mm[2] - 1; m.tries = 0; m.pg = 1; bkEnsure(m);
    } else if (k === 'gut') m.o.gut = t.value;
    else m.o[k] = t.checked;
    m.o = BOOK.opts(m.o); BOOK.store(m.o);
    renderModal(); bkBuildSoon(m, 30);
  });
  document.addEventListener('toggle', e => { const t = e.target, m = UI.modal; if (t && t.dataset && t.dataset.role === 'bkopts' && m && m.type === 'bprint'){ m.optOpen = t.open; bkPaintPrev(m); } }, true);
  document.addEventListener('keydown', e => {
    const m = UI.modal; if (!m || m.type !== 'bprint' || !m.b || e.altKey || e.ctrlKey || e.metaKey) return;
    const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft'){ bkGoto(m, m.pg - 1); e.preventDefault(); } else if (e.key === 'ArrowRight'){ bkGoto(m, m.pg + 1); e.preventDefault(); }
  });
  window.addEventListener('resize', () => { const m = UI.modal; if (m && m.type === 'bprint') bkPaintPrev(m); });
}

/* ---------- Skeniranje strani papirne knjige ----------
   Fotografija → branje v napravi (BSCAN) → pregled vsake vrstice s sliko izreza in označbami:
   ✔ zeleno = prebrano zanesljivo, ⚠ rumeno = preveri, ✖ rdeče = popravi. Karkoli ostane nepotrjeno, se vpiše z oznako ⚠ (ride.chk),
   ki ostane vidna v dnevu, v opozorilih in v natisnjeni knjigi, dokler dispečer ne pritisne »Preverjeno«. Slika in besedilo se ne shranita. */
const BS_LABEL = { ok:'prebrano', chk:'preveri', bad:'popravi' };
const BS_SYM = { ok:'✔', chk:'⚠', bad:'✖' };
const BS_FIELDS = [['name', 'Ime in priimek', 'text', 'bs-c4'], ['from', 'Od', 'text', 'bs-c4'], ['to', 'Do', 'text', 'bs-c4']];
const BS_KEYS = ['name', 'from', 'to', 'time', 'note', 'phone', 'mode'];
const bsWorst = (a, b) => (BSCAN.LV[b] > BSCAN.LV[a] ? b : a);
const bsNr = row => { const n = parseInt(String(row.nrEdit == null ? '' : row.nrEdit).trim(), 10); return n >= 1 && n <= 60 ? n : null; };
const bsDateOk = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(new Date(d + 'T12:00:00'));
function bsOpen(){
  UI.modal = { type:'bscan', step:'in', busy:'', err:'', date:(UI.view === 'dan' && UI.date) || '', dateSrc:(UI.view === 'dan' && UI.date) ? 'user' : '', dateTouched:false, rows:[], notes:[], only:false, done:null, doneTouched:false, pages:0, words:0, empties:0, jumpKey:'', warm:'', warmMsg:'', photos:[], manual:false, photoOpen:false, zoom:false, ctl:null, lastFiles:null, seq:0 };
  renderModal(); bsWarm(UI.modal);
}
/* raven polja po popravkih dispečerja: urejeno polje velja za pregledano, če ni prazno (ura: veljavna) */
function bsLvl(row, k){
  if (row.manual){ if (k !== 'time') return 'ok'; const v = String(row.f.time || '').trim(), p = v ? BSCAN.parseTime(v) : null; return p && !p.v && !p.dia ? 'bad' : 'ok'; }
  const fl = row.fl[k]; if (!fl) return 'ok';
  if (!row.touched[k]) return fl.lvl;
  const v = String(row.f[k] || '').trim();
  if (k === 'time') return v ? (BSCAN.parseTime(v).v ? 'ok' : 'bad') : ((row.f.dia || row.f.mode === 'vzorci') ? 'ok' : 'chk');
  if (k === 'note' || k === 'phone' || k === 'mode') return 'ok';   // dispečer je polje pregledal (lahko je prazno)
  if (k === 'from' && row.f.mode === 'vzorci') return 'ok';
  return v ? 'ok' : 'bad';
}
function bsNrLvl(m, row){
  const n = bsNr(row); if (n == null) return row.manual && !bsFilled(row) ? 'ok' : 'bad';
  const dup = m.rows.some(x => x !== row && x.on && bsNr(x) === n);
  if (row.touched.nr) return dup ? 'chk' : 'ok';
  return dup || row.nrLvl === 'chk' ? 'chk' : 'ok';
}
const bsFilled = row => !!(String(row.f.name || '').trim() || String(row.f.from || '').trim() || String(row.f.to || '').trim());
function bsRowLvl(m, row){
  let l = 'ok'; BS_KEYS.forEach(k => { l = bsWorst(l, bsLvl(row, k)); });
  const nl = bsNrLvl(m, row); if (nl !== 'ok') l = bsWorst(l, 'chk');
  return l;
}
function bsTodo(m, row){
  const t = BS_KEYS.filter(k => bsLvl(row, k) !== 'ok').map(k => BSCAN.FIELD_LABEL[k]);
  if (bsNrLvl(m, row) !== 'ok') t.push('št. polja');
  return t.join(', ');
}
function bsReason(row, k){
  const fl = row.fl[k], l = bsLvl(row, k);
  if (l === 'ok') return row.touched[k] && fl && fl.lvl !== 'ok' ? '✔ popravljeno' : ((fl && fl.why && fl.why[0] && /prepoznano kot/.test(fl.why[0])) ? fl.why[0] : '');
  if (row.touched[k]) return k === 'time' ? 'ure ne razberem: vpiši npr. 8:30' : 'polje je prazno';
  const why = (fl && fl.why || []).join('; ');
  return (BS_SYM[l] + ' ') + (why || (l === 'bad' ? 'ni prebrano' : 'preveri s sliko'));
}
function bsStats(m){
  const s = { ok:0, chk:0, bad:0, on:0, flagged:0 };
  m.rows.forEach(r => { const l = bsRowLvl(m, r); s[l]++; if (r.on && bsFilled(r)){ s.on++; if (l !== 'ok') s.flagged++; } });
  return s;
}
function bsFieldHTML(m, row, k, label, cls){
  const id = `bs-${row.key}-${k}`, l = bsLvl(row, k), why = bsReason(row, k), sug = ((row.fl[k] || {}).sug || []).slice(0, 3);
  const chips = (l !== 'ok' && !row.touched[k]) ? sug.map((s, i) => `<button type="button" class="chip toggle bs-sug" data-act="bsSug" data-k="${row.key}|${k}|${i}">${esc(s.label)}</button>`).join('') : '';
  return `<div class="field bs-f ${cls || ''}" data-lv="${l}" data-bsf="${k}"><label for="${id}">${esc(label)}</label>
    <input id="${id}" type="text" data-bs="f" data-key="${row.key}" data-k="${k}" value="${esc(row.f[k] || '')}" autocomplete="off" ${k === 'time' ? 'inputmode="numeric" maxlength="8" placeholder="08:00"' : k === 'phone' ? 'inputmode="tel" maxlength="24" placeholder="031 123 456"' : ''} ${k === 'name' ? 'list="bsPat"' : ''} ${l === 'bad' ? 'aria-invalid="true"' : ''} aria-describedby="${id}-w">
    <div class="bs-reason" id="${id}-w" role="note">${esc(why)}</div><div class="bs-sugs">${chips}</div></div>`;
}
function bsRowHTML(m, row){
  const l = bsRowLvl(m, row), todo = bsTodo(m, row), ml = bsLvl(row, 'mode');
  const modeSel = `<div class="field bs-f bs-c2" data-lv="${ml}" data-bsf="mode"><label for="bs-${row.key}-mode">Način</label><select id="bs-${row.key}-mode" data-bs="f" data-key="${row.key}" data-k="mode">${Object.entries(MODES).map(([v, t]) => `<option value="${v}" ${(row.f.mode || 'sede') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><div class="bs-reason">${esc(bsReason(row, 'mode'))}</div></div>`;
  const diaSel = `<div class="field bs-f bs-c2" data-lv="ok"><label for="bs-${row.key}-dia">Dializa</label><select id="bs-${row.key}-dia" data-bs="f" data-key="${row.key}" data-k="dia"><option value="" ${!row.f.dia ? 'selected' : ''}>ne</option><option value="dop" ${row.f.dia === 'dop' ? 'selected' : ''}>dopoldne</option><option value="pop" ${row.f.dia === 'pop' ? 'selected' : ''}>popoldne</option></select></div>`;
  return `<article class="bs-row" data-bsrow="${row.key}" data-lv="${l}" ${m.only && l === 'ok' ? 'hidden' : ''}>
    <div class="bs-head"><label class="check bs-on"><input type="checkbox" data-bs="on" data-key="${row.key}" ${row.on ? 'checked' : ''}> Vpiši</label>
      <label class="bs-nr" for="bs-${row.key}-nr">Polje <input id="bs-${row.key}-nr" type="number" min="1" max="60" inputmode="numeric" data-bs="nr" data-key="${row.key}" value="${esc(row.nrEdit)}" data-lv="${bsNrLvl(m, row)}"></label>
      <span class="bs-lv" data-role="bslv" ${row.manual && l === 'ok' ? 'hidden' : ''}><span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}</span><span class="bs-todo" data-role="bstodo">${todo ? '· ' + esc(todo) : ''}</span><span class="sp"></span>
      <button type="button" class="btn sm" data-act="bsConfirm" data-key="${row.key}" data-role="bsconf" ${l === 'ok' ? 'hidden' : ''} title="Primerjal sem s sliko: vse je prav">Vse je prav</button></div>
    ${row.crop ? `<div class="bs-cropwrap"><img class="bs-crop" src="${row.crop}" alt="Izrez prevoza ${esc(row.nrEdit || '')} s fotografije"></div>` : ''}
    <div class="bs-grid">${BS_FIELDS.map(([k, lb, , c]) => bsFieldHTML(m, row, k, lb, c)).join('')}${bsFieldHTML(m, row, 'phone', 'Telefon', 'bs-c3')}${bsFieldHTML(m, row, 'time', 'Ura', 'bs-c2')}${modeSel}${diaSel}
      <div class="field bs-f bs-c3" data-lv="${bsLvl(row, 'note')}" data-bsf="note"><label for="bs-${row.key}-note">Opomba</label><input id="bs-${row.key}-note" type="text" data-bs="f" data-key="${row.key}" data-k="note" value="${esc(row.f.note || '')}" autocomplete="off"><div class="bs-reason">${esc(bsReason(row, 'note'))}</div></div></div></article>`;
}
function bsSumHTML(m){
  const s = bsStats(m), bad = s.chk + s.bad;
  if (m.manual){ const n = m.rows.filter(r => r.on && bsFilled(r)).length; return `<span class="bs-cnt" data-lv="ok">✎ Ročni vnos: ${n} ${n === 1 ? 'izpolnjena vrstica' : 'izpolnjenih vrstic'}</span><span class="sp"></span>${bad ? `<button type="button" class="btn sm primary" data-act="bsJump">Skoči na naslednje nejasno</button>` : ''}`; }
  const head = !m.rows.length ? '' : bad ? `<span class="bs-cnt" data-lv="ok">✔ ${s.ok} prebrano</span><span class="bs-cnt" data-lv="chk">⚠ ${s.chk} preveri</span><span class="bs-cnt" data-lv="bad">✖ ${s.bad} popravi</span>`
    : `<span class="bs-cnt" data-lv="ok">✔ Vseh ${s.ok} vrstic je prebranih zanesljivo.</span>`;
  return `${head}<span class="sp"></span>${bad ? `<button type="button" class="btn sm primary" data-act="bsJump">Skoči na naslednje nejasno</button>` : ''}
    <label class="check"><input type="checkbox" data-bs="only" ${m.only ? 'checked' : ''}> Samo nejasno</label>`;
}
function bsBlankHTML(m){
  const b = m.blank || []; if (!b.length) return '';
  return `<details class="bs-blank" data-role="bsblank"><summary>${b.length} ${b.length === 1 ? 'kartica je videti prazna' : 'kartic je videti praznih'} (št. ${b.map(r => esc(r.nrEdit)).join(', ')}): preglej</summary>
    ${b.map(r => `<div class="bs-blankrow"><div class="bs-cropwrap"><img class="bs-crop" src="${r.crop}" alt="Izrez kartice ${esc(r.nrEdit)}"></div><button type="button" class="btn sm" data-act="bsUnblank" data-key="${r.key}">Ni prazna: vnesi ta prevoz</button></div>`).join('')}</details>`;
}
function bsApplyLabel(m){
  const s = bsStats(m);
  return `Vpiši ${s.on} ${s.on === 1 ? 'prevoz' : 'prevozov'}${bsDateOk(m.date) ? ' v ' + fmtLong(m.date) : ''}${s.flagged ? ` (${s.flagged} z oznako ⚠)` : ''}`;
}
function bsDateHTML(m){
  const ok = bsDateOk(m.date), l = !ok ? 'bad' : (m.dateSrc === 'ocr' && !m.dateTouched ? 'chk' : 'ok');
  const why = !ok ? '✖ datuma na strani ni mogoče prebrati: vpiši ga' : l === 'chk' ? '⚠ datum je prebran s fotografije: preveri, preden vpišeš' : '';
  const have = ok ? (S.rides[m.date] || []).filter(isFilled).length : 0;
  return `<div class="field bs-f" data-lv="${l}" data-role="bsdate" style="max-width:260px"><label for="bs-date">Datum strani</label><input id="bs-date" type="date" data-bs="date" value="${esc(m.date)}" ${l === 'bad' ? 'aria-invalid="true"' : ''}><div class="bs-reason">${esc(why)}</div></div>
    ${have ? `<div class="banner"><span>${IC.info}</span><div>Ta dan ima že <b>${have}</b> vpisov. Vrstice se vpišejo v svoje polje; če je zasedeno, v prvo prosto. Enaki prevozi se preskočijo.</div></div>` : ''}`;
}
function renderBScan(host, m){
  host.hidden = false; delete host.dataset.pk;
  const ocrOn = NSCAN.ocrEnabled();
  let body;
  if (m.step === 'review'){
    const list = m.rows.map(r => bsRowHTML(m, r)).join('');
    body = `<div class="bs-sum" data-role="bssum" role="status">${bsSumHTML(m)}</div>
      ${m.notes.length ? `<div class="banner" style="background:var(--warn-soft);color:var(--warn)"><span>${IC.alert}</span><div>${m.notes.map(n => esc(n)).join('<br>')}</div></div>` : ''}
      <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap">${bsDateHTML(m)}
        <label class="check" style="margin-top:22px" title="Prevozi s te strani so že narejeni (knjiga za nazaj): označijo se kot opravljeni"><input type="checkbox" data-bs="done" ${m.done ? 'checked' : ''}> Prevozi so že opravljeni</label></div>
      ${m.cardMode ? `<div class="banner"><span>${IC.info}</span><div>Pisavo s fotografije računalnik prebere samo deloma. Zato ima vsak prevoz svoj <b>poravnan izrez</b> in polja za vnos: prepiši ime, naslov, telefon in uro. <b>Ime izberi s seznama pacientov</b>: naslov in telefon se dopolnita iz baze. Rdeča polja niso prebrana, rumeni gumbi so predlogi.</div></div>` : ''}
      ${bsPhotosHTML(m)}
      <p class="hint" style="margin:0">${m.manual ? 'Ročni vnos ob fotografiji: vpiši ime, od, do in uro za vsak prevoz; prazne vrstice se preskočijo. Ime lahko izbereš s seznama bolnikov. Ročno vpisane vrstice niso označene z ⚠.' : 'Primerjaj vsako vrstico s sliko izreza. Rumena in rdeča polja so tista, ki jih nisem razumel: izberi predlog, popravi ali pritisni »Vse je prav«. Rdeče vrstice niso izbrane za vpis. Karkoli ostane nepotrjeno, se vpiše z oznako <b>⚠ preveri</b>, ki ostane vidna v dnevu in v natisnjeni knjigi, dokler je ne potrdiš.'}${m.empties ? ` · Prazne vrstice: ${m.empties}.` : ''}</p>
      <div class="bs-list" data-role="bslist">${list || '<div class="empty-state">Na strani ni vpisanih vrstic.</div>'}</div>
      ${bsBlankHTML(m)}
      <div class="row"><button type="button" class="btn sm" data-act="bsAddRow">+ Dodaj vrstico</button></div>
      <datalist id="bsPat">${S.patients.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'sl')).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      <div class="row bs-foot" style="justify-content:space-between;flex-wrap:wrap"><button type="button" class="btn" data-act="bsBack">Nazaj (nova fotografija)</button>
        <span class="row"><button type="button" class="btn" data-act="closeModal">Prekliči</button><button type="button" class="btn primary" data-act="bsApply" data-role="bsapply">${esc(bsApplyLabel(m))}</button></span></div>`;
  } else {
    body = `<div class="banner"><span>${IC.info}</span><div>Fotografiraj stran papirne knjige (ali izberi PDF-sken). Aplikacija prebere številke polj, imena, naslove in ure ter jih postavi v dan. <b>Fotografija se ne pošlje nikamor in se ne shrani</b>; branje poteka v tej napravi. Program za branje se ob odprtju okna enkrat prenese (približno 7 MB) in nato velja za vse strani.</div></div>
      ${ocrOn ? `<div class="bs-warm" data-role="bswarm" data-st="${esc(m.warm)}" role="status">${esc(bsWarmText(m))}</div>` : ''}
      <div class="stack" style="gap:8px"><div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn primary" for="bsFile" style="cursor:pointer">${ocrOn ? 'Izberi fotografije ali PDF' : 'Razpoznava izklopljena'}</label>
        <label class="btn" for="bsCam" style="cursor:pointer">Fotografiraj</label></div>
        <input id="bsFile" type="file" accept="image/*,application/pdf,.pdf" multiple style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        <input id="bsCam" type="file" accept="image/*" capture="environment" style="position:absolute;opacity:0;width:1px;height:1px" ${m.busy ? 'disabled' : ''}>
        ${m.busy ? `<div class="bs-busy" role="status"><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="spin" aria-hidden="true"></span><span data-role="bsbusy" style="flex:1;min-width:0">${esc(m.busy)}</span><span class="hint" data-role="bsel" style="white-space:nowrap"></span></div>
          <progress data-role="bsbar" max="100" aria-label="Napredek branja"></progress><div class="hint" data-role="bsslow" hidden>Na telefonu lahko branje ene strani traja do dve minuti. Če se ne premakne, pritisni »Prekini« in prevoze vnesi ročno ob fotografiji.</div>
          <div class="row"><button type="button" class="btn sm" data-act="bsCancel">Prekini</button></div></div>` : ''}</div>
      <ul class="hint bs-tips" style="margin:0;padding-left:18px">
        <li>Knjigo položi ravno, v celoti v kader, brez sence in bliska; telefon drži vzporedno z listom.</li>
        <li>Ena fotografija = ena stran. Za dan z več stranmi izberi več fotografij naenkrat (isti dan).</li>
        <li><b>Tiskano ali lepo berljivo pisavo</b> aplikacija prebere dobro. <b>Hitro ročno pisavo pogosto napačno</b>: takšna polja dobijo oznako ⚠ ali ✖ in jih preveriš s sliko vrstice. Nič se ne vpiše neopazno.</li>
      </ul>
      ${m.err ? `<div class="banner bad"><span>${IC.alert}</span><div>${esc(m.err)}</div></div>` : ''}
      ${m.err && !m.busy && m.photos.some(Boolean) ? `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-act="bsManual">Vnesi ročno ob fotografiji</button>${m.lastFiles ? '<button type="button" class="btn" data-act="bsRetry">Poskusi znova</button>' : ''}</div>` : ''}
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="closeModal">Zapri</button></div>`;
  }
  host.innerHTML = `<div class="modal-back" data-act="closeModal"></div><div class="modal modal-wide bscan" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-head"><h3 id="mTitle">Skeniraj stran knjige</h3><button type="button" class="icon-btn" data-act="closeModal" aria-label="Zapri">${IC.x}</button></div><div class="stack" style="gap:12px">${body}</div></div>`;
}
const bsWarmText = m => m.warm === 'ok' ? '✔ Razpoznava je pripravljena: strani se berejo brez novega prenosa.'
  : m.warm === 'busy' ? 'Razpoznava se pripravlja v ozadju' + (m.warmP ? ' (' + BSCAN.stageLabel(m.warmP) + ')' : '') + '. Fotografijo lahko izbereš že zdaj.'
  : m.warm === 'err' ? '⚠ Razpoznave ni bilo mogoče pripraviti vnaprej: ' + (m.warmMsg || 'neznana napaka') + ' Ob izbiri fotografije poskusim znova.' : '';
function bsPaintWarm(m){
  if (UI.modal !== m) return; const el = document.querySelector('[data-role=bswarm]'); if (!el) return;
  el.dataset.st = m.warm; el.textContent = bsWarmText(m);
}
/* vnaprejšnji zagon branja (jedro in model) takoj ob odprtju okna: do izbire fotografije je že pripravljeno */
function bsWarm(m){
  if (!NSCAN.ocrEnabled()) return;
  m.warm = 'busy'; m.warmP = null; bsPaintWarm(m);
  let p; try { p = BSCAN.warm(x => { m.warmP = x.stage; bsPaintWarm(m); }); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(() => { m.warm = 'ok'; bsPaintWarm(m); }, e => { m.warm = 'err'; m.warmMsg = String(e && e.message || e); bsPaintWarm(m); });
}
function bsProgress(m, p){
  if (UI.modal !== m) return;
  const el = document.querySelector('[data-role=bsbusy]'); if (!el) return;
  const pc = p.pct > 0 && p.pct <= 1 ? Math.round(p.pct * 100) : 0;
  el.textContent = p.label + (pc ? ' ' + pc + ' %' : ' …');
  const bar = document.querySelector('[data-role=bsbar]'); if (bar){ if (pc) bar.value = pc; else bar.removeAttribute('value'); }
}
async function bsFiles(list){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy) return;
  const files = Array.from(list || []).filter(Boolean); if (!files.length) return;
  if (!NSCAN.ocrEnabled()){ m.err = 'Razpoznava besedila iz slike ni vklopljena (config.js → ocr).'; renderModal(); return; }
  m.err = ''; m.busy = 'berem fotografijo …'; m.photos = []; m.manual = false; m.lastFiles = files; m.ctl = { cancelled:false }; m.t0 = Date.now(); renderModal();
  const ctl = m.ctl;
  const timer = setInterval(() => {
    if (UI.modal !== m || !m.busy){ clearInterval(timer); if (UI.modal !== m){ BSCAN.cancel(ctl); } return; }
    const sec = Math.round((Date.now() - m.t0) / 1000), el = document.querySelector('[data-role=bsel]'), sl = document.querySelector('[data-role=bsslow]');
    if (el) el.textContent = sec + ' s'; if (sl && sec >= 60) sl.hidden = false;
  }, 1000);
  BSCAN.hooks.onPhoto = (i, url) => { if (UI.modal === m) m.photos[i] = url; };
  try {
    const res = await BSCAN.run(files, p => bsProgress(m, p), ctl);
    if (UI.modal !== m) return;
    bsLoad(m, res);
  } catch (e) { m.err = e && e.canceled ? 'Branje je prekinjeno.' : String(e && e.message || e); }
  finally { clearInterval(timer); BSCAN.hooks.onPhoto = null; }
  m.busy = '';
  if (UI.modal === m) renderModal();
}
function bsCancel(){ const m = UI.modal; if (!m || m.type !== 'bscan' || !m.busy) return; m.busy = 'prekinjam …'; const el = document.querySelector('[data-role=bsbusy]'); if (el) el.textContent = m.busy; BSCAN.cancel(m.ctl); }
function bsRetry(){ const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy || !m.lastFiles) return; bsFiles(m.lastFiles); }
/* če razpoznava ne uspe: prevoze vneseš sam, ob celi fotografiji (prazne vrstice 1–12, po potrebi še dodaš) */
function bsBlankRow(m){
  const n = m.rows.length + 1, key = 'm' + (++m.seq);
  return { key, page:1, nr:n, nrEdit:String(n), nrLvl:'ok', lvl:'ok', todo:[], manual:true, on:true, touched:{}, fl:{}, crop:'', f:{ name:'', from:'', to:'', time:'', mode:'sede', dia:'', note:'', pid:'', phone:'' } };
}
function bsManual(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.busy) return;
  m.rows = []; for (let i = 0; i < 12; i++) m.rows.push(bsBlankRow(m));
  m.manual = true; m.step = 'review'; m.err = ''; m.notes = []; m.empties = 0; m.photoOpen = true; m.only = false; m.pages = m.photos.filter(Boolean).length; renderModal();
}
function bsAddRow(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.step !== 'review') return;
  const row = Object.assign(bsBlankRow(m), { nr:null }); row.nrEdit = String(Math.max(0, ...m.rows.map(r => bsNr(r) || 0)) + 1);
  m.rows.push(row); renderModal();
  const last = document.querySelector('.bs-row:last-child input[data-k=name]'); if (last){ try { last.focus({ preventScroll:false }); } catch (e) { last.focus(); } }
}
function bsZoom(){ const m = UI.modal; if (!m || m.type !== 'bscan') return; m.zoom = !m.zoom; const el = document.querySelector('[data-role=bsphoto]'); if (el) el.classList.toggle('zoom', m.zoom); }
function bsPhotosHTML(m){
  if (!m.photos || !m.photos.some(Boolean)) return '';
  return `<details class="bs-photos" data-role="bsphotos" ${m.photoOpen ? 'open' : ''}><summary>Cela fotografija strani (za primerjavo)</summary>
    <div class="bs-photo ${m.zoom ? 'zoom' : ''}" data-role="bsphoto">${m.photos.map((u, i) => u ? `<img src="${u}" alt="Fotografija strani ${i + 1}">` : '').join('')}</div>
    <div class="row"><button type="button" class="btn sm" data-act="bsZoom">Povečaj / pomanjšaj</button></div></details>`;
}
const bsMk = r => Object.assign({}, r, { f:Object.assign({ phone:'' }, r.f), touched:{}, on:r.lvl !== 'bad', nrEdit:r.nr == null ? '' : String(r.nr) });
function bsLoad(m, res){
  let rows = res.rows.filter(r => !r.empty), blank = res.rows.filter(r => r.empty && r.blank && r.crop);
  /* če so vse kartice videti prazne, je verjetneje težava s fotografijo kot s stranjo: pokaži jih kot običajne vrstice */
  if (!rows.length && blank.length){ rows = blank.map(r => Object.assign(r, { empty:false, lvl:'bad' })); blank = []; }
  m.rows = rows.map(bsMk); m.blank = blank.map(r => Object.assign(bsMk(r), { on:true }));
  m.cardMode = res.pages.some(p => p.layout === 'card');
  m.empties = res.rows.length - rows.length; m.notes = res.notes || []; m.pages = res.pages.length; m.words = res.words;
  if (res.date && res.date.iso){ m.date = res.date.iso; m.dateSrc = 'ocr'; m.dateTouched = false; }
  if (!rows.length){ m.step = 'in'; m.err = 'Na sliki nisem našel nobene vpisane vrstice. Poskusi znova: stran naj bo ravna, v celoti v kadru in dobro osvetljena.'; return; }
  if (!m.doneTouched) m.done = bsDateOk(m.date) && m.date < todayStr();
  m.step = 'review'; m.err = ''; m.jumpKey = '';
}
/* prazna kartica, ki je vendarle izpolnjena: preselimo jo med vrstice za vnos */
function bsUnblank(key){
  const m = UI.modal; if (!m || m.type !== 'bscan' || !m.blank) return; const i = m.blank.findIndex(r => r.key === key); if (i < 0) return;
  const r = m.blank.splice(i, 1)[0]; r.lvl = 'bad'; r.empty = false; r.on = true; r.fl.name = Object.assign({}, r.fl.name, { lvl:'bad', why:['kartica je bila videti prazna: vpiši s slike'] });
  m.rows.push(r); m.rows.sort((a, b) => (bsNr(a) ?? 999) - (bsNr(b) ?? 999)); m.jumpKey = r.key; renderModal();
  const el = document.querySelector(`[data-bsrow="${key}"] input[data-k=name]`); if (el){ try { el.scrollIntoView({ block:'center' }); el.focus({ preventScroll:true }); } catch (e) { /* */ } }
}
/* ime izbrano iz baze pacientov: naslov in telefon se dopolnita, če sta prazna (rumeno: primerjaj z izrezom) */
function bsFromPatient(m, row){
  const pt = (S.patients || []).find(x => x.id === row.f.pid); if (!pt) return;
  const put = (k, v, why) => {
    if (!v || String(row.f[k] || '').trim()) return;
    row.f[k] = v; if (!row.manual){ row.fl[k] = { v, lvl:'chk', why:[why], sug:[] }; row.touched[k] = false; }
    const inp = document.getElementById(`bs-${row.key}-${k}`); if (inp) inp.value = v;
  };
  put('from', pt.addr, 'naslov iz baze pacientov: primerjaj z izrezom');
  put('phone', pt.phone, 'telefon iz baze pacientov: primerjaj z izrezom');
}
/* osvežitev prikaza brez ponovnega izrisa (ohrani fokus in drsenje) */
function bsPaintRow(m, row){
  const card = document.querySelector(`[data-bsrow="${row.key}"]`); if (!card) return;
  const l = bsRowLvl(m, row); card.dataset.lv = l;
  const lv = card.querySelector('[data-role=bslv]'); if (lv){ lv.innerHTML = `<span aria-hidden="true">${BS_SYM[l]}</span> ${BS_LABEL[l]}`; lv.hidden = !!row.manual && l === 'ok'; }
  const td = card.querySelector('[data-role=bstodo]'); if (td){ const t = bsTodo(m, row); td.textContent = t ? '· ' + t : ''; }
  const cf = card.querySelector('[data-role=bsconf]'); if (cf) cf.hidden = l === 'ok';
  const nr = card.querySelector('[data-bs=nr]'); if (nr) nr.dataset.lv = bsNrLvl(m, row);
  card.querySelectorAll('.bs-f[data-bsf]').forEach(w => {
    const k = w.dataset.bsf, lk = bsLvl(row, k); w.dataset.lv = lk;
    const r = w.querySelector('.bs-reason'); if (r) r.textContent = bsReason(row, k);
    const inp = w.querySelector('input'); if (inp){ if (lk === 'bad') inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
    const sg = w.querySelector('.bs-sugs'); if (sg && (lk === 'ok' || row.touched[k])) sg.innerHTML = '';
  });
}
function bsPaintAll(m){
  m.rows.forEach(r => bsPaintRow(m, r));
  const sm = document.querySelector('[data-role=bssum]'); if (sm) sm.innerHTML = bsSumHTML(m);
  const ap = document.querySelector('[data-role=bsapply]'); if (ap) ap.textContent = bsApplyLabel(m);
}
function bsPaintDate(m){
  const w = document.querySelector('[data-role=bsdate]'); if (!w) return;
  const wrap = document.createElement('div'); wrap.innerHTML = bsDateHTML(m);
  const nw = wrap.querySelector('[data-role=bsdate]'); w.dataset.lv = nw.dataset.lv; w.querySelector('.bs-reason').textContent = nw.querySelector('.bs-reason').textContent;
  const ap = document.querySelector('[data-role=bsapply]'); if (ap) ap.textContent = bsApplyLabel(m);
  const ban = w.nextElementSibling && w.nextElementSibling.classList.contains('banner') ? w.nextElementSibling : null, nb = wrap.querySelector('.banner');
  if (ban && !nb) ban.remove(); else if (ban && nb) ban.innerHTML = nb.innerHTML; else if (!ban && nb) w.insertAdjacentElement('afterend', nb);
}
function bsRow(m, key){ return m.rows.find(r => r.key === key); }
function bsConfirm(key){
  const m = UI.modal; if (!m || m.type !== 'bscan') return; const row = bsRow(m, key); if (!row) return;
  [...BS_KEYS, 'nr'].forEach(k => { row.touched[k] = true; });
  row.on = true; const cb = document.querySelector(`[data-bsrow="${key}"] [data-bs=on]`); if (cb) cb.checked = true;
  bsPaintAll(m);
}
function bsSug(el){
  const m = UI.modal; if (!m || m.type !== 'bscan') return; const [key, k, i] = String(el.dataset.k).split('|'), row = bsRow(m, key); if (!row) return;
  const s = (row.fl[k].sug || [])[+i]; if (!s) return;
  row.f[k] = s.label; row.touched[k] = true; if (k === 'name') row.f.pid = s.pid || '';
  const inp = document.getElementById(`bs-${key}-${k}`); if (inp) inp.value = s.label;
  bsPaintAll(m);
}
function bsJump(){
  const m = UI.modal; if (!m || m.type !== 'bscan') return;
  const all = [...document.querySelectorAll('.bs-row')];
  const from = m.jumpKey ? all.findIndex(c => c.dataset.bsrow === m.jumpKey) + 1 : 0;
  const next = all.slice(from).find(c => c.dataset.lv !== 'ok' && !c.hidden) || all.find(c => c.dataset.lv !== 'ok' && !c.hidden);
  if (!next){ toast('Nič več ni označeno'); return; }
  m.jumpKey = next.dataset.bsrow;
  try { next.scrollIntoView({ block:'center', behavior:'smooth' }); } catch (e) { next.scrollIntoView(); }
  next.classList.remove('bs-flash'); void next.offsetWidth; next.classList.add('bs-flash');
  const inp = next.querySelector('.bs-f[data-lv=bad] input, .bs-f[data-lv=chk] input') || next.querySelector('input[data-bs=f]');
  if (inp) { try { inp.focus({ preventScroll:true }); } catch (e) { inp.focus(); } }
}
function bsBack(){ const m = UI.modal; if (!m || m.type !== 'bscan') return; m.step = 'in'; m.rows = []; m.err = ''; m.notes = []; m.manual = false; m.photos = []; renderModal(); bsPaintWarm(m); }
function bsApply(){
  const m = UI.modal; if (!m || m.type !== 'bscan' || m.step !== 'review') return;
  if (!bsDateOk(m.date)){ m.err = 'Vpiši datum strani.'; renderModal(); return; }
  const date = m.date, mm = { y:+date.slice(0, 4), m:+date.slice(5, 7) - 1 };
  bkEnsure(mm);
  if (!BOOK.monthReady(mm.y, mm.m)){ m.err = 'Podatki za ta mesec se še nalagajo. Počakaj trenutek in poskusi znova.'; renderModal(); return; }
  const sel = m.rows.filter(r => r.on && bsFilled(r)).sort((a, b) => (bsNr(a) == null ? 999 : bsNr(a)) - (bsNr(b) == null ? 999 : bsNr(b)));
  if (!sel.length){ m.err = m.manual ? 'Vpiši vsaj eno vrstico (ime, od, do).' : 'Ni izbranih vrstic za vpis.'; renderModal(); return; }
  const a = ensureDay(date); let n = 0, dup = 0, moved = 0, flagged = 0; const put = [];
  for (const row of sel){
    const f = row.f, nr = bsNr(row), nm = String(f.name || '').trim(), fr = String(f.from || '').trim(), to = String(f.to || '').trim();
    if (!nm && !fr && !to) continue;
    if (a.some(x => isFilled(x) && !x.odpovedano && norm(x.name) === norm(nm) && norm(x.from) === norm(fr) && norm(x.to) === norm(to) && (x.time || '') === (f.time || ''))){ dup++; continue; }
    let i = -1;
    if (nr){ while (a.length < nr) a.push(blankRide()); if (!isFilled(a[nr - 1])) i = nr - 1; }
    if (i < 0){ i = a.findIndex(x => !isFilled(x)); if (i < 0){ a.push(blankRide()); i = a.length - 1; } if (nr) moved++; }
    const t = a[i], tm = f.time ? (BSCAN.parseTime(f.time).v || '') : '';
    Object.assign(t, blankRide(), { id:t.id, name:nm, from:fr, to, time:tm, mode:f.mode || 'sede', dia:f.dia || '', note:f.note || '', phone:String(f.phone || '').trim() });
    if (t.mode === 'vzorci' && !t.name) t.name = 'Vzorci';
    if (f.pid){ const ph = t.phone; applyPatientToRide(date, t.id, f.pid, { keepMode:!!f.mode }); t.from = fr || t.from; t.to = to || t.to; t.note = f.note || ''; if (ph) t.phone = ph; }
    if (m.done){ t.done = true; t.doneAt = ''; }
    t.chk = bsTodo(m, row); if (t.chk) flagged++;
    put.push({ t, ok:!t.chk }); n++;
  }
  save();
  put.forEach(({ t, ok }) => { try { afterAddressChange(date, t, 'to'); } catch (e) { /* kilometrina se izračuna pozneje */ } if (ok && t.from && typeof learnAddress === 'function') learnAddress(t.from); });
  audit('knjiga.skenirano', { dan:date, n, chk:flagged, strani:m.pages, rocno:m.manual ? 1 : 0 });
  UI.modal = null; renderModal(); UI.date = date;
  toast(`Vpisanih ${n} prevozov${flagged ? ` · ${flagged} z oznako ⚠ preveri` : ''}${dup ? ` · ${dup} že vpisanih preskočenih` : ''}${moved ? ` · ${moved} v drugo polje (zasedeno)` : ''}`);
  go('dan');
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('toggle', e => { const t = e.target, m = UI.modal; if (t && t.dataset && t.dataset.role === 'bsphotos' && m && m.type === 'bscan') m.photoOpen = t.open; }, true);
  document.addEventListener('input', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bscan' || !t.dataset) return;
    if (t.dataset.bs === 'f'){ const row = bsRow(m, t.dataset.key); if (row){ row.f[t.dataset.k] = t.value; if (t.dataset.k === 'name') row.f.pid = ''; } }
    else if (t.dataset.bs === 'nr'){ const row = bsRow(m, t.dataset.key); if (row) row.nrEdit = t.value; }
  });
  document.addEventListener('change', e => {
    const t = e.target, m = UI.modal; if (!t || !m || m.type !== 'bscan') return;
    if (t.id === 'bsFile' || t.id === 'bsCam'){ const fl = t.files ? Array.from(t.files) : []; t.value = ''; bsFiles(fl); return; }
    const b = t.dataset && t.dataset.bs; if (b === undefined) return;
    if (b === 'f'){
      const row = bsRow(m, t.dataset.key), k = t.dataset.k; if (!row) return;
      row.f[k] = t.value; if (k === 'name'){ const pt = t.value.trim() ? S.patients.find(x => norm(x.name) === norm(t.value)) : null; row.f.pid = pt ? pt.id : ''; }
      if (k === 'time'){ const p = BSCAN.parseTime(t.value); if (p.v){ row.f.time = p.v; t.value = p.v; } else if (p.dia){ row.f.dia = p.dia; row.f.time = ''; t.value = ''; } }
      if (['name', 'from', 'to', 'time', 'phone', 'mode'].includes(k)) row.touched[k] = true;
      if (k === 'name' && row.f.pid) bsFromPatient(m, row);
      if (k === 'mode' && t.value === 'vzorci') row.touched.from = true;
      bsPaintAll(m);
    } else if (b === 'nr'){ const row = bsRow(m, t.dataset.key); if (row){ row.nrEdit = t.value; row.touched.nr = true; bsPaintAll(m); } }
    else if (b === 'on'){ const row = bsRow(m, t.dataset.key); if (row){ row.on = t.checked; bsPaintAll(m); } }
    else if (b === 'only'){ m.only = t.checked; renderModal(); }
    else if (b === 'done'){ m.done = t.checked; m.doneTouched = true; }
    else if (b === 'date'){ m.date = t.value; m.dateTouched = true; m.dateSrc = 'user'; if (!m.doneTouched) { m.done = bsDateOk(m.date) && m.date < todayStr(); const cb = document.querySelector('[data-bs=done]'); if (cb) cb.checked = m.done; } bsPaintDate(m); }
  });
}

/* =====================================================================
   DOGODKI, PRIJAVA, ZAČETNI PODATKI, ZAGON
   ===================================================================== */
let CREWS_PIN = [];
const isStaffRole = () => !!(ME && (ME.role === 'skrbnik' || ME.role === 'dispecer'));
const STAFF_VIEWS = ['knjiga', 'dan', 'dispecer', 'zivo', 'pacienti', 'posebnosti', 'nastavitve'];
const logoInner = () => `${logoItem('zd')}<i></i>${logoItem('nmp')}`;
function fillLogos(){ ['authLogos', 'railLogos', 'crewLogos'].forEach(id => { const el = $('#' + id); if (el) el.innerHTML = logoInner(); }); }

function render(){
  if (!ME) return;
  setHeader(); renderNav();
  if (isCrew()){ renderCrewApp(); }
  else if (UI.view === 'knjiga') renderMonth();
  else if (UI.view === 'dan') renderDay();
  else if (UI.view === 'dispecer') renderDispatch();
  else if (UI.view === 'zivo') renderLive();
  else if (UI.view === 'pacienti') renderPatients();
  else if (UI.view === 'posebnosti') renderNotices();
  else renderSettings();
  if (UI.modal) renderModal();
  MAP.mountAll(document);
}
function rerender(){
  const y = window.scrollY, a = document.activeElement;
  const keep = a && a.id === 'quickIn' ? { v:a.value, s:a.selectionStart } : null;   // hitri vnos: besedilo in kazalec ostaneta, ko se stran osveži
  render(); window.scrollTo(0, y);
  if (keep){ const q = $('#quickIn'); if (q){ if (q !== a){ q.value = keep.v; q.focus(); try { q.setSelectionRange(keep.s, keep.s); } catch(e){} } } }
}
function go(view, push = true){
  if (isCrew()) view = 'moji';
  else if (!STAFF_VIEWS.includes(view)) view = 'knjiga';
  if (UI.view === 'pacienti' && view !== 'pacienti') cleanupEmptyPatient();
  UI.view = view; sgClose();
  if (isStaffRole()){
    if (view === 'dan') ensureRange(addDays(UI.date, -1), addDays(UI.date, 1));
    if (view === 'knjiga') ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`);
    if (view === 'nastavitve') loadRemoteUsers();
  }
  if (push && !isCrew()){ try { if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view); } catch(e){} }
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { const v = (location.hash || '').slice(1); if (ME && isStaffRole() && STAFF_VIEWS.includes(v) && v !== UI.view) go(v, false); });

/* ---------- Izvedba akcij ---------- */
const dutyList = date => (S.duty[date] = S.duty[date] || []);
function addDuty(date, name, team){
  const list = dutyList(date); if (list.some(d => norm(d.name) === norm(name))) return false;
  const standby = isStandby(date);
  const tm = standby ? 'pripravljenost' : (team || 'redna');
  const nV = list.filter(d => d.team === tm && d.role !== 'spremljevalec' && !isHelperRole(d.role)).length, nE = list.filter(d => d.team === tm && d.role === 'spremljevalec').length;
  const st = S.staff.find(s => norm(s.name) === norm(name));
  list.push({ id:uid(), name:name.trim(), staffId:st ? st.id : '', team: standby ? 'pripravljenost' : (team || 'redna'), role: (tm === 'NN' || tm === 'pripravljenost') && nV > nE ? 'spremljevalec' : 'voznik', from:'', to:'', ot:0, vehicleId:'' });
  return true;
}
function setPath(path, el){
  const parts = path.split('.'); let obj = S;
  for (let i = 0; i < parts.length - 1; i++){ obj = obj[parts[i]]; if (obj == null) return; }
  const key = parts[parts.length - 1];
  let val;
  if (el.dataset.bool) val = el.checked;
  else if (el.dataset.num){ val = parseFloat(el.value); if (!isFinite(val)) return; if (val < 0) val = 0; }
  else val = el.value;
  obj[key] = val;
  if (/^vehicles\.\d+\.(sede|leze|utila|skupaj)$/.test(path)){ // največ ne sme biti manj kot običajno
    const v = obj; ['sede', 'leze', 'utila', 'skupaj'].forEach(k => { if ((+v[k + 'Max'] || 0) < (+v[k] || 0)) v[k + 'Max'] = +v[k] || 0; });
  }
  save();
}
function onRideField(el){
  const art = el.closest('[data-ride]'); if (!art) return;
  const date = art.dataset.date, hit = rideById(date, art.dataset.ride); if (!hit) return;
  const r = hit.r, f = el.dataset.f;
  if (f === 'done'){ r.done = el.checked; r.doneAt = r.done ? new Date().toISOString() : ''; if (!r.done) r.doneBy = ''; else { const p = r.nalogId && patientById(r.patientId); const n = p && (p.naloge || []).find(x => x.id === r.nalogId); if (n && n.vrsta === 'enkratna' && !n.porabljen){ n.porabljen = date; } } }
  else if (f === 'odpovedano'){ r.odpovedano = el.checked; if (el.checked){ r.prevStatus = r.status; r.status = 'preklicana'; } else { r.status = r.prevStatus || 'nova'; r.prevStatus = ''; } }
  else if (f === 'stayOn'){ r.stayTouched = true; r.stayAuto = false; r.stay = el.checked ? (+r.stay > 0 ? +r.stay : (poiStay(geo(r.to)) || +S.settings.stayDef || 45)) : 0; }
  else if (f === 'stay'){ r.stayTouched = true; r.stayAuto = false; r.stay = Math.max(0, Math.min(480, parseInt(el.value, 10) || 0)); }
  else if (el.type === 'checkbox') r[f] = el.checked;
  else r[f] = el.value;
  save();
  if (art.classList.contains('box')) refreshBox(art);
  return { r, f };
}

/* ---------- Naslovi: CSV (WGS84 ali D96/TM), pretvorba koordinat ---------- */
function d96ToWgs84(E, N){
  const a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9999, lon0 = 15 * Math.PI / 180;
  const x = E - 500000, y = N + 5000000, M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(phi1), c = Math.cos(phi1), t = Math.tan(phi1);
  const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = x / (N1 * k0);
  const lat = phi1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lat:lat * 180 / Math.PI, lon:lon * 180 / Math.PI };
}
function parseCSV(text){
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { rows:[], err:'Datoteka je prazna.' };
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const split = l => { const out = []; let cur = '', q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === delim && !q){ out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0]).map(norm);
  const find = re => head.findIndex(h => re.test(h));
  const iU = find(/ulic|street|^ul_|ulica/), iH = find(/^hs$|hisn|^hs_|stevilk|number|^hn$/), iD = find(/^hd$|dodatek|suffix/), iN = find(/naselj|^na_|city|place|kraj/), iO = find(/obcin|^ob_/);
  const iLa = find(/^lat|^y_wgs|sirina/), iLo = find(/^lon|^lng|^x_wgs|dolzina/), iE = find(/^e$|^e_d96|^x$|^e_/), iNn = find(/^n$|^n_d96|^y$|^n_/);
  const geo84 = iLa >= 0 && iLo >= 0, d96 = !geo84 && iE >= 0 && iNn >= 0;
  if (!geo84 && !d96 || iN < 0) return { rows:[], err:'Manjkajo stolpci: naselje in koordinate (lat, lon ali E, N v D96/TM).' };
  const rows = []; let skipped = 0;
  for (let i = 1; i < lines.length && rows.length < 25000; i++){
    const c = split(lines[i]);
    if (iO >= 0 && c[iO] && !/brezic/.test(norm(c[iO]))){ skipped++; continue; }
    let lat, lon;
    if (geo84){ lat = parseFloat((c[iLa] || '').replace(',', '.')); lon = parseFloat((c[iLo] || '').replace(',', '.')); }
    else { const E = parseFloat((c[iE] || '').replace(',', '.')), N = parseFloat((c[iNn] || '').replace(',', '.')); if (!isFinite(E) || !isFinite(N)) continue; ({ lat, lon } = d96ToWgs84(E, N)); }
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat < 45.78 || lat > 46.08 || lon < 15.3 || lon > 15.95){ skipped++; continue; }   // izven okolice Občine Brežice
    const street = iU >= 0 ? c[iU] : '', num = ((iH >= 0 ? c[iH] : '') + (iD >= 0 ? (c[iD] || '') : '')).trim(), nas = c[iN] || '';
    const t = (street ? street + ' ' + num : nas + ' ' + num).trim() + (street && nas ? ', ' + nas : '');
    rows.push([t, +lat.toFixed(5), +lon.toFixed(5)]);
  }
  return { rows, skipped, err:rows.length ? '' : 'Ni naslovov znotraj okolice Občine Brežice. Preveri stolpce in koordinate.' };
}
function removeDemo(){
  const dutyDates = Object.keys(S.duty).filter(d => S.duty[d].some(x => x.demo));
  Object.keys(S.rides).forEach(d => { S.rides[d] = S.rides[d].map(r => r.demo ? blankRide() : r); });
  S.staff = S.staff.filter(s => !s.demo); S.patients = S.patients.filter(p => !p.demo);
  dutyDates.forEach(d => { S.duty[d] = S.duty[d].filter(x => !x.demo); if (!S.duty[d].length) delete S.duty[d]; if (S.crewBook[d]) delete S.crewBook[d]; });
  if (BACKEND !== 'firebase'){ USERS = USERS.filter(u => !u.demo); saveUsers(); }
  save();
}

/* ---------- Klik ---------- */
const armBtn = (el, label, ms = 3500) => { el.dataset.arm = '1'; el.dataset.old = el.innerHTML; el.textContent = label; setTimeout(() => { if (el.isConnected && el.dataset.arm){ el.removeAttribute('data-arm'); el.innerHTML = el.dataset.old; } }, ms); };
document.addEventListener('click', async e => {
  const t = e.target;
  if (!t.closest('#suggest') && !t.closest('[data-suggest]')) sgClose();
  $$('details.menu[open]').forEach(d => { if (!d.contains(t) || (t.closest('[data-act]') && !t.closest('summary'))) d.open = false; });
  const sgb = t.closest('#suggest button'); if (sgb){ sgPick(+sgb.dataset.i); return; }
  const nav = t.closest('[data-nav]'); if (nav){ if (nav.dataset.live) UI.lDate = nav.dataset.live; UI.modal = null; go(nav.dataset.nav); return; }
  const el = t.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, date = el.dataset.date;
  switch (a){
    case 'openDay': UI.date = date; go('dan'); break;
    case 'monthPrev': UI.month.m--; if (UI.month.m < 0){ UI.month.m = 11; UI.month.y--; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'monthNext': UI.month.m++; if (UI.month.m > 11){ UI.month.m = 0; UI.month.y++; } ensureRange(`${UI.month.y}-${pad(UI.month.m + 1)}-01`, `${UI.month.y}-${pad(UI.month.m + 1)}-31`); render(); break;
    case 'printMonth': printMonth(); break;
    case 'bkOpen': bkOpen(); break;
    case 'bsOpen': bsOpen(); break;
    case 'bsApply': bsApply(); break;
    case 'bsJump': bsJump(); break;
    case 'bsBack': bsBack(); break;
    case 'bsCancel': bsCancel(); break;
    case 'bsRetry': bsRetry(); break;
    case 'bsManual': bsManual(); break;
    case 'bsAddRow': bsAddRow(); break;
    case 'bsZoom': bsZoom(); break;
    case 'bsConfirm': bsConfirm(el.dataset.key); break;
    case 'bsUnblank': bsUnblank(el.dataset.key); break;
    case 'bsSug': bsSug(el); break;
    case 'chkOk': { const art = el.closest('[data-ride]'); const hit = art && rideById(art.dataset.date, art.dataset.ride); if (hit){ hit.r.chk = ''; save(); audit('knjiga.preverjeno', { dan:art.dataset.date, nr:hit.nr }); rerender(); toast(`Prevoz ${hit.nr} potrjen`); } break; }
    case 'bkPrint': bkPrint(); break;
    case 'bkTab': bkTab(); break;
    case 'bkPg': bkGoto(UI.modal, (UI.modal && UI.modal.pg || 1) + (parseInt(el.dataset.d, 10) || 0)); break;
    case 'bkList': printMonth(); break;
    case 'monthToday': { const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() }; render(); break; }
    case 'dayPrev': UI.date = addDays(UI.date, -1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayNext': UI.date = addDays(UI.date, 1); ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); break;
    case 'dayToday': UI.date = todayStr(); render(); break;
    case 'dayTomorrow': UI.date = addDays(todayStr(), 1); render(); break;
    case 'filter': UI.filter = el.dataset.k; $$('[data-act=filter]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); applyFilter(); break;
    case 'openRide': {
      const art = el.closest('[data-ride]'); if (!art) break; const id = art.dataset.ride, was = UI.openRide === id;
      UI.openRide = was ? '' : id; rerender();
      if (!was){ const nb = $(`[data-ride="${id}"]`); if (nb){ nb.scrollIntoView({ block:'nearest' }); const nm = $('[data-f=name]', nb); if (nm && !(rideById(UI.date, id).r.name || '').trim()) nm.focus(); } }
      break; }
    case 'closeRide': UI.openRide = ''; rerender(); break;
    case 'newRide': {
      const a2 = ensureDay(UI.date); let r = a2.find(x => !isFilled(x));
      if (!r){ addSlots(UI.date, 5); r = ensureDay(UI.date).find(x => !isFilled(x)); }
      UI.openRide = r.id; UI.filter = 'vsi'; UI.q = ''; rerender();
      const nb = $(`[data-ride="${r.id}"]`); if (nb){ nb.scrollIntoView({ block:'center' }); const nm = $('[data-f=name]', nb); if (nm) nm.focus(); }
      break; }
    case 'kmRecalc': {
      const art = el.closest('[data-ride]'); if (!art) break; el.disabled = true; el.textContent = 'Računam …';
      const r = await KM.ensure(art.dataset.date, art.dataset.ride, { force:true });
      if (r) toast(`Kilometrina: ${KM.fmtKm(r.km)} km (${KM.SRC[r.kmSrc] || ''})`); else { const nb = $(`[data-ride="${art.dataset.ride}"]`); if (nb) refreshKm(nb); }
      break; }
    case 'kmDay': {
      if (!KM.can()){ toast('Izračun kilometrine je izklopljen: vklopi iskanje naslovov in dejanske ceste (Nastavitve → Izračun)'); break; }
      el.disabled = true; toast('Računam kilometrino …'); const n = await KM.day(UI.date, { force:true }); toast(n ? `Kilometrina preračunana za ${n} prevozov` : 'Ni prevozov za izračun'); rerender(); break; }
    case 'pickPt': { const art = el.closest('[data-ride]'); if (art) openPick(art.dataset.date, art.dataset.ride); break; }
    case 'pickSide': { const m = UI.modal; if (!m || m.type !== 'pick' || m.side === el.dataset.s) break; UI.modal = { type:'pick', date:m.date, id:m.id, side:el.dataset.s }; renderModal(); pickLoad(UI.modal); break; }
    case 'pickSave': {
      const m = UI.modal; if (!m || m.type !== 'pick' || !m.pick) break;
      const txt = pickText(m); if (!txt) break; el.disabled = true;
      GEOC.setFix(txt, m.pick[1], m.pick[0]); audit('naslov.tocka.popravljena', {}); KM.refix(txt);
      const r = await KM.ensure(m.date, m.id, { force:true }); UI.modal = null; renderModal(); rerender();
      toast(r ? `Točka shranjena. Kilometrina: ${KM.fmtKm(r.km)} km` : 'Točka shranjena'); break; }
    case 'pickClear': {
      const m = UI.modal; if (!m || m.type !== 'pick') break; const txt = pickText(m); if (!txt || !GEOC.clearFix(txt)) break;
      audit('naslov.tocka.odstranjena', {}); KM.refix(txt); await KM.ensure(m.date, m.id, { force:true }); const m2 = { type:'pick', date:m.date, id:m.id, side:m.side }; UI.modal = m2; renderModal(); pickLoad(m2); rerender(); break; }
    case 'kmReport': UI.kmRep = !UI.kmRep; render(); break;
    case 'kmMonth': {
      if (!KM.can()){ toast('Izračun kilometrine je izklopljen: vklopi iskanje naslovov in dejanske ceste (Nastavitve → Izračun)'); break; }
      el.disabled = true; const { y, m } = UI.month, n = daysInMonth(y, m); let cnt = 0;
      for (let d = 1; d <= n; d++){ const dt = `${y}-${pad(m + 1)}-${pad(d)}`; el.textContent = `Računam … ${d}/${n}`; cnt += await KM.day(dt).catch(() => 0); }
      toast(cnt ? `Izračunano: ${cnt} prevozov` : 'Vsi prevozi imajo že kilometrino'); rerender(); break; }
    case 'kmCsv': {
      const { y, m } = UI.month, withNames = el.dataset.names === '1'; if (withNames) audit('km.csv.z.imeni', { mesec:`${y}-${pad(m + 1)}` });
      const u = URL.createObjectURL(new Blob(['\ufeff' + KM.csv(y, m, withNames)], { type:'text/csv;charset=utf-8' })); const l = document.createElement('a'); l.href = u; l.download = `kilometrina-${y}-${pad(m + 1)}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); break; }
    case 'diaTerm': { const p = patientById(el.dataset.id); if (p && p.dt){ p.dt.t = el.dataset.t; save(); rerender(); } break; }
    case 'diaDay': { const p = patientById(el.dataset.id); if (p && p.dt){ const d = +el.dataset.d, set = new Set(p.dt.d || []); if (set.has(d)) set.delete(d); else set.add(d); p.dt.d = [...set].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); save(); rerender(); } break; }
    case 'diaDel': { const p = patientById(el.dataset.id); if (p){ p.dt = null; save(); rerender(); toast('Pacient ni več na seznamu dialize. Obstoječi vpisi v knjigi ostanejo.'); } break; }
    case 'addPlace': { const clinic = el.dataset.k === 'clinic'; S.places.push({ id:uid(), parent:clinic ? 'UKC Ljubljana' : '', n:'', al:[], addr:'', lat:null, lon:null, stay:clinic ? 45 : null, extra:null }); save(); rerender(); const ins = $$('[data-pl$="|n"]'); const last = ins.find(i => i.dataset.pl.startsWith((S.places.length - 1) + '|')); if (last){ last.scrollIntoView({ block:'center' }); last.focus(); } break; }
    case 'delPlace': { const pl = S.places[+el.dataset.i]; if (!pl) break; if (el.dataset.arm){ S.places.splice(+el.dataset.i, 1); save(); rerender(); } else armBtn(el, 'Potrdi'); break; }
    case 'gkeySave': { const v = ($('#gkey').value || '').trim(); if (!/^[A-Za-z0-9_\-]{20,}$/.test(v)){ toast('Ključ ni videti veljaven (vsaj 20 znakov: črke, številke, - in _)'); break; } store.set('kp.gkey', v); GOOGLE.clear(); UI.gTest = null; audit('google.kljuc.shranjen', {}); toast('Ključ shranjen na tej napravi'); rerender(); break; }
    case 'gkeyClear': store.del('kp.gkey'); GOOGLE.forget(); UI.gTest = null; audit('google.kljuc.odstranjen', {}); toast('Ključ odstranjen s te naprave'); rerender(); break;
    case 'nsOpen': nsOpen(); break;
    case 'nsParse': { const m = UI.modal; if (m && m.type === 'nscan'){ nsSetText(m, m.text); renderModal(); } break; }
    case 'nsBack': { const m = UI.modal; if (m && m.type === 'nscan'){ m.step = 'in'; m.err = ''; renderModal(); } break; }
    case 'nsSave': nsSave(); break;
    case 'npOpen': npOpen(el.dataset.pid, el.dataset.id); break;
    case 'npPrint': npPrintGroup(el.dataset.k); break;
    case 'npDone': npDone(); break;
    case 'npCalib': NP.printCalib(el.dataset.p === 'b' ? 'b' : 'f'); break;
    case 'geoTest': { UI.geoTest = { running:true }; rerender(); UI.geoTest = await GEOC.test(); audit('naslovi.preizkus', { uspeh:!!UI.geoTest.ok }); rerender(); break; }
    case 'gTest': { UI.gTest = { running:true }; rerender(); UI.gTest = await GOOGLE.test(); audit('google.preizkus', { uspeh:!!UI.gTest.ok }); rerender(); break; }
    case 'loadDia': { const n = loadDialysis(UI.date); if (n && KM.auto()) KM.day(UI.date).catch(() => {}); toast(n ? `Dodanih ${n} dializnih prevozov` : 'Dializni pacienti so že v knjigi ali jih ni v bazi'); rerender(); break; }
    case 'addSlots': addSlots(UI.date, 5); rerender(); toast('Dodanih 5 polj'); break;
    case 'gotoDisp': UI.dDate = date; go('dispecer'); break;
    case 'mode': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit){ hit.r.mode = el.dataset.mode; save(); refreshBox(art); } break; }
    case 'clearRide': {
      if (el.dataset.arm){ const art = el.closest('[data-ride]'); const a2 = ensureDay(art.dataset.date); const i = a2.findIndex(r => r.id === art.dataset.ride); if (i >= 0){ a2[i] = blankRide(); if (UI.openRide === art.dataset.ride) UI.openRide = ''; save(); rerender(); toast(`Prevoz ${i + 1} počiščen`); } }
      else armBtn(el, 'Potrdi: počisti');
      break; }
    case 'savePat': { const art = el.closest('[data-ride]'); const p = savePatientFromRide(art.dataset.date, art.dataset.ride); if (p){ toast('Pacient shranjen v bazo'); rerender(); } else toast('Najprej vpiši ime pacienta'); break; }
    case 'rideView': { const art = el.closest('[data-ride]'); const hit = rideById(art.dataset.date, art.dataset.ride); if (hit) openPreview(`Prevoz št. ${hit.nr}`, rideVariants(art.dataset.date, hit.r, hit.nr)); break; }
    case 'openPatient': { if (UI.pid !== el.dataset.id) cleanupEmptyPatient(); UI.pid = el.dataset.id; UI.nid = ''; if (UI.view !== 'pacienti') go('pacienti'); else { render(); window.scrollTo(0, 0); } break; }
    case 'newPatient': { cleanupEmptyPatient(); const p = blankPatient({ color:nextColor() }); S.patients.push(p); UI.pid = p.id; UI.nid = ''; save(); render(); const n = $('#pf-name'); if (n) n.focus(); break; }
    case 'pBack': cleanupEmptyPatient(); UI.pid = ''; UI.nid = ''; render(); break;
    case 'pf': UI.pf = el.dataset.k; render(); break;
    case 'pfAlerts': UI.pf = 'opozorila'; UI.pid = ''; go('pacienti'); break;
    case 'pMode': { const p = patientById(UI.pid); if (p){ p.mode = el.dataset.mode; save(); $$('[data-act=pMode]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); refreshPatientList(); } break; }
    case 'pColor': { const p = patientById(UI.pid); if (p){ p.color = +el.dataset.c; save(); rerender(); } break; }
    case 'delPatient': { if (el.dataset.arm){ removePatient(el.dataset.id); UI.pid = ''; render(); toast('Pacient izbrisan'); } else armBtn(el, 'Potrdi brisanje'); break; }
    case 'addNalog': { const p = patientById(UI.pid); if (!p) break; const n = blankNalog(el.dataset.v); n.od = p.addr || ''; n.mode = p.mode; n.zdravnikVrsta = 'osebni'; if (p.dt && el.dataset.v === 'letna'){ n.razlog = 'Dializa'; n.do = 'SB Brežice – dializa'; } p.naloge = p.naloge || []; p.naloge.push(n); UI.nid = n.id; audit('nalog.dodan', { pid:p.id, vrsta:n.vrsta }); save(); render(); break; }
    case 'editNalog': { UI.nid = UI.nid === el.dataset.id ? '' : el.dataset.id; render(); break; }
    case 'previewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (p && n){ audit('nalog.predogled', { pid:p.id }); openPreview(`${NALOG_VRSTE[n.vrsta].l} nalog · ${p.name}`, nalogVariants(p, n)); } break; }
    case 'renewNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (!p || !n) break; const from = addDays(n.veljaDo, 1); const m = { ...clone(n), id:uid(), veljaOd:from, veljaDo:defaultValidTo(n.vrsta, from), auto:true, stevilka:'', preklican:false, porabljen:'', created:new Date().toISOString() }; p.naloge.push(m); UI.nid = m.id; audit('nalog.podaljsan', { pid:p.id }); save(); render(); toast('Nov nalog je pripravljen. Vpiši številko in preveri datume.'); break; }
    case 'usedNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.porabljen = n.porabljen ? '' : todayStr(); save(); render(); } break; }
    case 'cancelNalog': { const p = patientById(UI.pid), n = p && (p.naloge || []).find(x => x.id === el.dataset.id); if (n){ n.preklican = !n.preklican; audit('nalog.preklic', { pid:p.id, preklican:n.preklican }); save(); render(); } break; }
    case 'delNalog': { if (el.dataset.arm){ const p = patientById(UI.pid); if (p){ p.naloge = p.naloge.filter(x => x.id !== el.dataset.id); Object.values(S.rides).forEach(arr => arr.forEach(r => { if (r.nalogId === el.dataset.id) r.nalogId = ''; })); audit('nalog.izbrisan', { pid:p.id }); save(); render(); } } else armBtn(el, 'Potrdi'); break; }
    case 'closeModal': UI.modal = null; renderModal(); break;
    case 'pvVariant': UI.modal.idx = +el.dataset.i; renderModal(); break;
    case 'copyVariant': copyText(UI.modal.variants[UI.modal.idx].text, 'Kopirano'); break;
    case 'copyLine': copyText(UI.modal.variants[UI.modal.idx].text.split('\n')[+el.dataset.i], 'Vrstica kopirana'); break;
    case 'dDate': UI.dDate = date; render(); break;
    case 'lDate': UI.lDate = date; render(); break;
    case 'dayMode': { const d = UI.dDate; S.dayRules[d] = { ...(S.dayRules[d] || {}), mode:el.dataset.k }; audit('pravila.dan', { datum:d, nacin:el.dataset.k }); save(); rerender(); break; }
    case 'crewsAll': { const op = el.dataset.open === '1'; document.querySelectorAll('details.crewcard').forEach(d => { d.open = op; }); break; }
    case 'dayModeReset': { const rr = S.dayRules[UI.dDate]; if (rr){ delete rr.mode; if (!Object.keys(rr).length) delete S.dayRules[UI.dDate]; } save(); rerender(); break; }
    case 'ruleMode': { S.rules.mode = el.dataset.k; audit('pravila.privzeto', { nacin:el.dataset.k }); save(); render(); break; }
    case 'publish': {
      el.disabled = true; const r = await publishDay(date).catch(err => ({ ok:false, msg:String(err && err.message || err) })); el.disabled = false;
      if (r.ok) toast(`Objavljeno: ${r.runs} posadk, ${r.rides} prevozov` + (r.noAccount.length ? `. Brez računa: ${r.noAccount.join(', ')}` : '')); else toast(r.msg || 'Objava ni uspela');
      rerender(); break; }
    case 'reassign': { const hit = rideById(date, el.dataset.id); if (hit){ hit.r.status = 'nova'; hit.r.pin = ''; hit.r.runKey = ''; save(); toast('Prevoz je vrnjen v razpored. Objavi razpored znova.'); rerender(); } break; }
    case 'toggleStaffDummy': break;
    case 'toggleStaff': { const s = S.staff.find(x => x.id === el.dataset.id); if (!s) break; const list = dutyList(UI.dDate); const i = list.findIndex(d => norm(d.name) === norm(s.name)); if (i >= 0) list.splice(i, 1); else addDuty(UI.dDate, s.name, s.team); save(); rerender(); break; }
    case 'rmDuty': dutyList(UI.dDate).splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'copyDuty': { const prev = S.duty[addDays(UI.dDate, -1)] || []; if (!prev.length){ toast('Prejšnji dan nima vpisanega osebja'); break; } let n = 0; prev.forEach(d => { if (addDuty(UI.dDate, d.name, d.team === 'pripravljenost' ? 'redna' : d.team)) n++; }); save(); rerender(); toast(n ? `Kopiranih ${n} zaposlenih` : 'Vsi so že vpisani'); break; }
    case 'copyPlan': copyText(planText(UI.dDate), 'Razpored kopiran'); break;
    case 'closeNotice': { const n = S.notices.find(x => x.id === el.dataset.id); if (n){ n.closed = true; if (!n.to || n.to > todayStr()) n.to = todayStr(); save(); render(); } break; }
    case 'delNotice': S.notices = S.notices.filter(x => x.id !== el.dataset.id); save(); render(); break;
    case 'setTab': UI.setTab = el.dataset.k; if (UI.setTab === 'varnost') loadAudit(); if (UI.setTab === 'uporabniki') loadRemoteUsers(); render(); break;
    case 'addVeh': S.vehicles.push({ id:uid(), name:'Novo vozilo', reg:'', vrsta:'osebno', fn:'vse', tip:'sanitetno', ns:'redna', sede:3, leze:0, utila:0, skupaj:3, sedeMax:3, lezeMax:0, utilaMax:0, skupajMax:3, aktiv:true }); save(); rerender(); break;
    case 'delVeh': { const v = S.vehicles[+el.dataset.i]; if (!v) break; if (el.dataset.arm){ S.vehicles.splice(+el.dataset.i, 1); save(); rerender(); } else { el.dataset.arm = '1'; el.classList.add('danger'); el.style.width = 'auto'; el.style.padding = '0 8px'; el.textContent = 'Potrdi'; } break; }
    case 'delStaff': S.staff.splice(+el.dataset.i, 1); save(); rerender(); break;
    case 'exportAddr': {
      let rows = []; try { rows = JSON.parse(store.get('kp.addr') || '[]'); } catch(e){}
      if (!rows.length){ toast('Ni uvoženih naslovov za prenos'); break; }
      const u = URL.createObjectURL(new Blob([JSON.stringify(rows)], { type:'application/json' })); const l = document.createElement('a'); l.href = u; l.download = 'naslovi.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); audit('naslovi.izvoz', { vrstic:rows.length }); break; }
    case 'routeRetry': ROUTE.retry(); toast('Ponovni poskus prenosa cestnih podatkov'); rerender(); break;
    case 'routeTest': { if (!isAdmin()) break; UI.routeTest = { running:true }; rerender(); UI.routeTest = await ROUTE.test(); audit('cestni.podatki.preizkus', { uspeh:!!UI.routeTest.ok }); rerender(); break; }
    case 'routeWarm': {
      if (!isAdmin() || (UI.routeWarm && UI.routeWarm.running)) break;
      UI.routeWarm = { running:true, done:0, total:0 }; rerender();
      try { const n = await ROUTE.warm((d, t) => { UI.routeWarm.done = d; UI.routeWarm.total = t; const c = $('#routeProg'); if (c) c.textContent = `Prenos … ${d}/${t}`; }); UI.routeWarm = { msg:`Preneseno: ${n} novih relacij.` }; audit('cestni.podatki.prenos', { relacij:n }); }
      catch(err){ UI.routeWarm = { err:true, msg:'Prenos ni uspel: ' + String((err && err.message) || err) }; }
      rerender(); break; }
    case 'routeExport': {
      if (!isAdmin()) break;
      const o = ROUTE.exportShared(), tot = o.pts.length * (o.pts.length - 1);
      if (!tot || o.missing >= tot){ toast('Ni cestnih podatkov za izvoz. Najprej klikni »Predpripravi vse relacije«.'); break; }
      const u = URL.createObjectURL(new Blob([JSON.stringify(o)], { type:'application/json' })); const l = document.createElement('a'); l.href = u; l.download = 'razdalje.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
      audit('razdalje.izvoz', { tock:o.pts.length, manjka:o.missing }); toast(o.missing ? `Prenesena je datoteka razdalje.json (manjka ${o.missing} relacij). Naloži jo v mapo s config.js.` : 'Prenesena je datoteka razdalje.json. Naloži jo v isto mapo kot config.js.'); break; }
    case 'routeClear': if (!isAdmin()) break; ROUTE.clear(); UI.routeTest = null; UI.routeWarm = null; UI.maps = {}; rerender(); toast('Predpomnilnik cestnih podatkov izbrisan'); break;
    case 'tripMap': {
      const key = el.dataset.trip;
      if (UI.maps[key]){ delete UI.maps[key]; rerender(); break; }
      let hit = null; computePlan(UI.dDate).crews.forEach(c => c.trips.forEach(t => { if (tripKey(c, t) === key) hit = t; }));
      if (!hit) break;
      if (!ROUTE.enabled()){ UI.maps[key] = 'err:cestni podatki so izklopljeni'; rerender(); break; }
      UI.maps[key] = 'load'; rerender();
      try { await ROUTE.path(tripWaypoints(hit)); if (UI.maps[key]) UI.maps[key] = 'ok'; } catch(err){ if (UI.maps[key]) UI.maps[key] = 'err:' + String((err && err.message) || err).slice(0, 80); }
      if (UI.maps[key]) rerender();
      break; }
    case 'noteChip': {
      const art = el.closest('[data-ride]'); const hit = art && rideById(art.dataset.date, art.dataset.ride); if (!hit) break;
      const parts = String(hit.r.note || '').split(/\s*;\s*/).filter(Boolean), t = el.dataset.t, i = parts.findIndex(x => norm(x) === norm(t));
      if (i >= 0) parts.splice(i, 1); else parts.push(t);
      hit.r.note = parts.join('; '); save();
      el.setAttribute('aria-pressed', String(i < 0)); const ni = $('[data-f=note]', art); if (ni) ni.value = hit.r.note;
      refreshBox(art); break; }
    case 'repeatRide': {
      const art = el.closest('[data-ride]'); if (!art) break;
      const res = repeatRide(art.dataset.date, art.dataset.ride, el.dataset.how);
      toast(res.n ? `Prevoz dodan za ${res.n} ${res.n === 1 ? 'dan' : 'dni'}: ${res.dates.map(fmtShort).join(', ')}` : res.tried ? 'Prevoz je na teh dneh že vpisan' : 'Ni delovnih dni za ponovitev'); rerender(); break; }
    case 'copyOpen': { const src = prevDayWithRides(UI.date); ensureRange(src, UI.date); UI.copy = { src, sel:new Set(filledRides(src).filter(x => !x.r.odpovedano).map(x => x.r.id)) }; rerender(); break; }
    case 'copyClose': UI.copy = null; rerender(); break;
    case 'copyStep': { const src = addDays(UI.copy.src, +el.dataset.d); ensureRange(src, UI.date); UI.copy = { src, sel:new Set(filledRides(src).filter(x => !x.r.odpovedano).map(x => x.r.id)) }; rerender(); break; }
    case 'copyAll': UI.copy.sel = new Set(filledRides(UI.copy.src).filter(x => !x.r.odpovedano).map(x => x.r.id)); rerender(); break;
    case 'copyNone': UI.copy.sel = new Set(); rerender(); break;
    case 'copyDo': {
      if (!UI.copy || !UI.copy.sel.size) break;
      const res = copyRides(UI.copy.src, UI.date, [...UI.copy.sel]);
      filledRides(UI.date).forEach(({ r }) => { if (r.from && r.to && !r.km && KM.auto()) KM.schedule(UI.date, r.id); });
      UI.copy = null; rerender(); toast(res.n ? `Kopiranih prevozov: ${res.n}${res.skipped ? ' (' + res.skipped + ' že vpisanih preskočenih)' : ''}` : 'Vsi izbrani prevozi so že vpisani'); break; }
    case 'printDay': printDay(UI.date); break;
    case 'stopFocus': MAP.focus(el.dataset.mapkey, el.dataset.mapid); break;
    case 'dayMapCrew': { const h = UI.dayHide || (UI.dayHide = {}); h[el.dataset.veh] = !h[el.dataset.veh]; rerender(); break; }
    case 'mapTiles': store.set('kp.map.tiles', MAP.tilesOn() ? 'off' : 'on'); rerender(); break;
    case 'clearAddr': store.del('kp.addr'); loadAddr(); rerender(); toast('Uvoženi naslovi izbrisani'); break;
    case 'clearLearned': S.addrBook = []; save(); rerender(); toast('Naučeni naslovi izbrisani'); break;
    case 'delUser': { const u = USERS.find(x => x.id === el.dataset.id); USERS = USERS.filter(x => x.id !== el.dataset.id); S.staff.forEach(s => { if (s.userId === el.dataset.id) s.userId = ''; }); saveUsers(); audit('uporabnik.izbrisan', { uporabnik:u && u.username }); save(); rerender(); break; }
    case 'reloadUsers': await loadRemoteUsers(); rerender(); break;
    case 'selfTest': { UI.selfTest = { running:true }; rerender(); const results = await runSelfTest(); UI.selfTest = { running:false, results, at:Date.now() }; audit('varnostni.preizkus', { neuspesnih:results.filter(r => r.pass === false).length }); rerender(); break; }
    case 'loadAudit': await loadAudit(); break;
    case 'rmLogo': store.del('kp.logo.' + el.dataset.k); fillLogos(); rerender(); break;
    case 'exportData': {
      if (!isAdmin()) break;
      let days = null;   // v načinu Firebase izvozimo VSE dneve iz baze (ne samo naloženega obdobja)
      if (BACKEND === 'firebase'){ try { days = {}; (await DB.list('days')).forEach(x => { days[x.id] = x.data; }); } catch(err){ days = null; toast('Opozorilo: vsi dnevi niso bili preneseni, izvoz vsebuje le naloženo obdobje.'); } }
      const json = JSON.stringify({ app:'knjiga-prevozov', version:2, state:S, addr:ADDR.list.map(x => [x.t, x.lat, x.lon]), ...(days ? { days } : {}) });
      $('#dataBox').value = json.length < 1500000 ? json : ''; audit('podatki.izvoz', { dni:days ? Object.keys(days).length : 0 });
      try { const b = new Blob([json], { type:'application/json' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `knjiga-prevozov-${todayStr()}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch(err){}
      if (json.length < 1500000) copyText(json, 'Izvoz kopiran v odložišče'); else toast('Izvoz shranjen kot datoteka (prevelik za odložišče)'); break; }
    case 'importData': {
      if (!isAdmin()) break;
      try {
        const o = JSON.parse($('#dataBox').value); if (!o.state || !Array.isArray(o.state.vehicles)) throw new Error('bad');
        const def = defaultState(); S = mergeDefaults(o.state, def); normalizeState();
        if (Array.isArray(o.addr)) store.set('kp.addr', JSON.stringify(o.addr));
        if (BACKEND === 'firebase' && o.days && typeof o.days === 'object'){ for (const [d, doc] of Object.entries(o.days)){ if (/^\d{4}-\d{2}-\d{2}$/.test(d)) await DB.set('days/' + d, doc); } }
        SY.snap = {}; loadAddr(); PLAN_CACHE.clear(); rev++; audit('podatki.uvoz', { verzija:o.version || 1 }); await flush().catch(() => {}); toast('Podatki uvoženi'); rerender();
      } catch(err){ toast('Uvoz ni uspel: datoteka ni veljavna kopija'); } break; }
    case 'rmDemo': removeDemo(); rerender(); toast('Primeri odstranjeni'); break;
    case 'wipe': {
      if (BACKEND === 'firebase' || !isAdmin()) break;
      if (el.dataset.arm){ DB.wipe(); const keep = S.settings; S = defaultState(); S.settings = keep; SY.snap = {}; PLAN_CACHE.clear(); rev++; save(); rerender(); toast('Podatki izbrisani'); }
      else { el.dataset.arm = '1'; el.textContent = 'Klikni še enkrat za potrditev'; setTimeout(() => { if (el.isConnected){ el.removeAttribute('data-arm'); el.textContent = 'Izbriši vse podatke'; } }, 6000); }
      break; }
    // ----- posadka -----
    case 'cDate': UI.cDate = date; render(); break;
    case 'crewStep': { el.disabled = true; const ok = await sendStatus(UI.cDate, el.dataset.ride, el.dataset.st); if (ok) toast(`${STATUSI[el.dataset.st].s} ob ${timeOf(new Date().toISOString())}`); el.disabled = false; break; }
    case 'crewNoHome': { if (el.dataset.arm){ el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'ni_doma', { note:'Pacienta ni na naslovu' }); toast('Dispečer je obveščen'); } else armBtn(el, 'Potrdi: ni na naslovu'); break; }
    case 'crewDecline': { const inp = $(`[data-cnote="${el.dataset.ride}"]`); el.disabled = true; await sendStatus(UI.cDate, el.dataset.ride, 'odklonjena', { note:inp ? inp.value.trim() || 'Brez razloga' : '' }); toast('Dispečer je obveščen'); break; }
    case 'crewFix': {
      const inp = $(`[data-cfix="${el.dataset.ride}"]`); if (!inp || !inp.value) break;
      const doc = CREW.docs[UI.cDate]; const st = crewRideState(doc.runKey, el.dataset.ride); if (!st.last) break;
      const iso = new Date(`${UI.cDate}T${inp.value}:00`).toISOString();
      await sendStatus(UI.cDate, el.dataset.ride, st.last.status, { t:iso, corr:true }); toast('Ura popravljena'); break; }
  }
});

/* ---------- Vnos ---------- */
function setPf(el){
  const p = patientById(UI.pid); if (!p) return;
  const k = el.dataset.pf; p[k] = el.value;
  if (k === 'name' || k === 'phone' || k === 'addr') refreshPatientList();
  save();
}
function refreshPatientList(){
  const p = patientById(UI.pid); const rows = $('.prows'); if (!rows) return;
  const all = S.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'sl')).filter(patientMatches);
  rows.innerHTML = all.map(q => { const sm = patientNalogSummary(q); return `<button type="button" class="prow ${q.color >= 0 ? 'pc' + q.color : ''}" data-act="openPatient" data-id="${q.id}" aria-current="${UI.pid === q.id}">${avatarP(q)}<span class="pr-main"><b>${esc(q.name || '(brez imena)')}</b><span class="hint">${esc(q.addr || 'brez naslova')}${q.phone ? ' · ' + esc(q.phone) : ''}</span></span><span class="pr-side">${q.dt ? `<span class="chip">${DIA_TERMS[q.dt.t] ? 'dializa' : ''}</span>` : ''}${sm.n ? nalogChip(sm.n) : '<span class="chip">brez naloga</span>'}</span></button>`; }).join('') || '<div class="empty-state">Ni pacientov za ta filter.</div>';
  const h = $('.pdetail h3'); if (h && p) h.textContent = p.name || 'Nov pacient';
}
const lastNalogAudit = {};
function setNf(el){
  const p = patientById(UI.pid); const card = el.closest('[data-nalog]'); if (!p || !card) return;
  const n = (p.naloge || []).find(x => x.id === card.dataset.nalog); if (!n) return;
  const k = el.dataset.nf; n[k] = el.value;
  if (k === 'vrsta' || k === 'veljaOd'){ if (n.auto){ n.veljaDo = defaultValidTo(n.vrsta, n.veljaOd); const d = $('#nf-veljaDo', card); if (d) d.value = n.veljaDo; } }
  if (k === 'veljaDo'){ n.auto = false; }
  const head = $('.ncard-head', card), sum = $('.ncard-sum', card), hint = $('.nform-hint', card), pv = $('[data-act=previewNalog]', card);
  const tmp = document.createElement('div'); tmp.innerHTML = nalogCardHTML(p, n);
  if (head) head.innerHTML = $('.ncard-head', tmp).innerHTML; if (sum) sum.innerHTML = $('.ncard-sum', tmp).innerHTML; if (hint) hint.innerHTML = $('.nform-hint', tmp).innerHTML;
  if (pv) pv.disabled = missingNalog(n).length > 0;
  card.className = 'ncard ' + nalogState(n).tone;
  if (k === 'od' || k === 'do') learnAddress(el.value);
  const t = Date.now(); if (!lastNalogAudit[n.id] || t - lastNalogAudit[n.id] > 60000){ lastNalogAudit[n.id] = t; audit('nalog.spremenjen', { pid:p.id }); }
  save();
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-suggest]') && document.activeElement === el) sgOpen(el);
  if (el.dataset.f && el.type !== 'checkbox' && el.tagName !== 'SELECT') onRideField(el);
  if (el.dataset.pf && el.tagName !== 'SELECT') setPf(el);
  if (el.dataset.nf && el.tagName !== 'SELECT' && el.type !== 'date') setNf(el);
  if (el.id === 'dayNote'){ S.dayNote[UI.dDate] = el.value; if (!el.value) delete S.dayNote[UI.dDate]; save(); }
  if (el.id === 'quickIn'){ const pv = $('#quickPrev'); if (pv) pv.innerHTML = el.value.trim() ? (quickPreview(parseQuick(el.value)) || 'Vpiši ime, naslov ali cilj') : QUICK_HELP; }
  if (el.id === 'rideSearch'){ UI.q = el.value; applyFilter(); }
  if (el.id === 'patSearch'){ UI.pq = el.value; refreshPatientList(); }
});
/* Ustanova/klinika: samodejno čakanje na pregled; po spremembi naslovov novi izračun kilometrine */
function afterAddressChange(date, r, f){
  if (f === 'to'){
    const g = geo(r.to || ''), clinic = g.kind === 'poi' && g.poi && g.poi.clinic && rideDir(r) === 'to';
    if (clinic && !(+r.stay > 0) && !r.stayTouched){ r.stay = poiStay(g); r.stayAuto = true; save(); }
    else if (!clinic && r.stayAuto){ r.stay = 0; r.stayAuto = false; save(); }
  }
  KM.schedule(date, r.id);
}
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset && el.dataset.copy && UI.copy){ if (el.checked) UI.copy.sel.add(el.dataset.copy); else UI.copy.sel.delete(el.dataset.copy); rerender(); return; }
  if (el.id === 'copySrc' && UI.copy && el.value){ const src = el.value; ensureRange(src, UI.date); UI.copy = { src, sel:new Set(filledRides(src).filter(x => !x.r.odpovedano).map(x => x.r.id)) }; rerender(); return; }
  if (el.dataset.km === 'manual'){
    const art = el.closest('[data-ride]'); if (!art) return;
    KM.setManual(art.dataset.date, art.dataset.ride, el.value);
    if (!el.value.trim()) KM.ensure(art.dataset.date, art.dataset.ride, { force:true }).catch(() => {});
    refreshKm(art); const kb = $('[data-role=km]', art); if (kb) kb.innerHTML = kmBoxHTML(rideById(art.dataset.date, art.dataset.ride).r); return;
  }
  if (el.dataset.pl){
    const [i, k] = el.dataset.pl.split('|'), p = S.places[+i]; if (!p) return;
    const v = el.value.trim(), num = x => { const n = parseFloat(String(x).replace(',', '.')); return (x === '' || !isFinite(n)) ? null : n; };
    if (k === 'al') p.al = v ? v.split(',').map(x => x.trim()).filter(Boolean) : [];
    else if (k === 'stay' || k === 'extra') p[k] = num(v) == null ? null : Math.max(0, num(v));
    else if (k === 'lat' || k === 'lon') p[k] = num(v);
    else p[k] = v;
    save(); if (k === 'parent') rerender(); return;
  }
  if (el.dataset.f){
    const res = onRideField(el);
    if (res && (res.f === 'from' || res.f === 'to') && el.value.trim()) learnAddress(el.value);
    if (res && (res.f === 'from' || res.f === 'to')){ const art = el.closest('[data-ride]'), dt = art && art.dataset.date; if (dt) afterAddressChange(dt, res.r, res.f); if (art && art.classList.contains('box')) refreshBox(art); }
    if (res && ['from', 'to', 'time', 'mode', 'stay', 'stayOn'].includes(res.f)){ const art = el.closest('.box'); if (art){ if (res.f === 'stay' || res.f === 'stayOn') KM.schedule(art.dataset.date, res.r.id); refreshAssign(art); } }
    if (res && (res.f === 'odpovedano' || ((res.f === 'done' || res.f === 'nalogId' || res.f === 'exc') && (el.closest('.dispatch') || res.f === 'nalogId')))) rerender();
    return;
  }
  if (el.dataset.pf){ setPf(el); return; }
  if (el.dataset.nf){ setNf(el); return; }
  if (el.dataset.crew){ const [date, vid] = el.dataset.crew.split('|'); const book = S.crewBook[date] = S.crewBook[date] || {}; const cell = book[vid] = book[vid] || { text:'', manual:false }; cell.text = el.value; cell.manual = el.value.trim() !== ''; el.classList.toggle('auto', false); save(); return; }
  if (el.dataset.duty){ const i = +el.closest('[data-di]').dataset.di; const d = dutyList(UI.dDate)[i]; if (d){ d[el.dataset.duty] = el.dataset.duty === 'ot' ? (+el.value || 0) : el.value; save(); rerender(); } return; }
  if (el.dataset.act === 'daySplit'){ const d = UI.dDate, rr = S.dayRules[d] = S.dayRules[d] || {}; if (el.checked) rr.split = true; else delete rr.split; if (!Object.keys(rr).length) delete S.dayRules[d]; audit('pravila.dan', { datum:d, razdelitev:el.checked }); save(); rerender(); return; }
  if (el.dataset.act === 'vehToggle'){ const list = S.vehOff[UI.dDate] = S.vehOff[UI.dDate] || []; const i = list.indexOf(el.dataset.id); if (el.checked && i >= 0) list.splice(i, 1); if (!el.checked && i < 0) list.push(el.dataset.id); save(); rerender(); return; }
  if (el.dataset.act === 'pin'){ const hit = rideById(UI.dDate, el.dataset.ride); if (hit){ hit.r.pin = el.value; save(); rerender(); } return; }
  if (el.dataset.coord){ const [i, k] = el.dataset.coord.split('|').map(Number); const s = SETTLEMENTS[i]; const row = el.closest('tr'); const ins = $$('input', row); const lat = parseFloat(ins[0].value), lon = parseFloat(ins[1].value); if (!isFinite(lat) || !isFinite(lon)) return; if (lat === s.lat && lon === s.lon) delete S.coordOv[s.n]; else S.coordOv[s.n] = [lat, lon]; row.lastElementChild.innerHTML = S.coordOv[s.n] ? '<span class="chip accent">spremenjeno</span>' : ''; save(); return; }
  if (el.dataset.urole){ try { await DB.patch('users/' + el.dataset.urole, { set:{ role:el.value }, del:[], n:1 }); audit('uporabnik.vloga', { uid:el.dataset.urole, vloga:el.value }); toast('Vloga spremenjena'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.uactive){ try { await DB.patch('users/' + el.dataset.uactive, { set:{ active:el.checked }, del:[], n:1 }); audit('uporabnik.aktiven', { uid:el.dataset.uactive, aktiven:el.checked }); toast(el.checked ? 'Račun aktiviran' : 'Račun onemogočen'); } catch(err){ toast('Ni uspelo: ' + (err.code || err.message)); } loadRemoteUsers(); return; }
  if (el.dataset.path){ setPath(el.dataset.path, el); if (/^staff\.\d+\.userId$/.test(el.dataset.path)) audit('zaposleni.racun', {}); return; }
  if (el.dataset.logoFile){
    const f = el.files[0]; if (!f) return;
    if (f.size > 400 * 1024){ toast('Datoteka je prevelika (največ 400 KB)'); el.value = ''; return; }
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){ toast('Dovoljeni so PNG, JPEG, WebP in SVG'); el.value = ''; return; }
    const rd = new FileReader(); rd.onload = () => { store.set('kp.logo.' + el.dataset.logoFile, String(rd.result)); fillLogos(); rerender(); toast('Logotip naložen'); }; rd.readAsDataURL(f); return;
  }
  if (el.id === 'dayPick' && el.value){ UI.date = el.value; ensureRange(addDays(UI.date, -1), addDays(UI.date, 1)); render(); return; }
  if (el.id === 'dispPick' && el.value){ UI.dDate = el.value; render(); return; }
  if (el.id === 'csvFile' && el.files[0]){ const txt = await el.files[0].text(); const { rows, err, skipped } = parseCSV(txt); if (err){ toast(err); return; } store.set('kp.addr', JSON.stringify(rows)); loadAddr(); audit('naslovi.uvoz', { vrstic:rows.length }); toast(`Uvoženih ${rows.length} naslovov` + (skipped ? ` (preskočenih ${skipped} izven občine)` : '')); rerender(); return; }
  if (el.id === 'jsonFile' && el.files[0]){ $('#dataBox').value = await el.files[0].text(); toast('Datoteka prebrana. Klikni »Uvozi podatke«.'); }
});
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('[data-suggest]')) sgOpen(e.target); });
/* Ko se z imena pacienta premakneš naprej in ime natančno ustreza pacientu v bazi, se pacient poveže samodejno */
document.addEventListener('focusout', e => {
  const el = e.target; if (!(el.dataset && el.dataset.f === 'name')) return;
  const art = el.closest('[data-ride]'); if (!art) return;
  const hit = rideById(art.dataset.date, art.dataset.ride); if (!hit || hit.r.patientId || !hit.r.name.trim()) return;
  const p = S.patients.find(x => norm(x.name) === norm(hit.r.name)); if (!p) return;
  const next = e.relatedTarget; applyPatientToRide(art.dataset.date, art.dataset.ride, p.id); rerender();
  if (next && next.id){ const n2 = document.getElementById(next.id); if (n2) n2.focus(); }
});
document.addEventListener('mousedown', e => { if (e.target.closest('#suggest')) e.preventDefault(); });
/* Seznam predlogov se zapre, ko fokus zapusti polje (Tab, klik drugam), da ne zakriva polj pod njim */
document.addEventListener('focusout', e => { if (e.target.matches && e.target.matches('[data-suggest]')) setTimeout(() => { const a = document.activeElement; if (!(a && a.matches && a.matches('[data-suggest]'))) sgClose(); }, 120); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.modal){ UI.modal = null; renderModal(); return; }
  if (e.key === 'Tab' && UI.modal){ const f = $$('#modal button'); if (f.length){ const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); } } }
  if (!sg.input) return;
  const n = sg.items.length;
  if (e.key === 'ArrowDown'){ e.preventDefault(); sg.idx = (sg.idx + 1) % n; sgRender(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); sg.idx = (sg.idx - 1 + n) % n; sgRender(); }
  else if (e.key === 'Enter' && sg.idx >= 0){ e.preventDefault(); sgPick(sg.idx); }
  else if (e.key === 'Escape' || e.key === 'Tab') sgClose();
});
window.addEventListener('scroll', () => { if (sg.input) sgRender(); }, { passive:true });
window.addEventListener('resize', () => { if (sg.input) sgRender(); });

/* ---------- Obrazci ---------- */
const AUTH_ERR = { 'auth/invalid-credential':'Napačno uporabniško ime ali geslo.', 'auth/wrong-password':'Napačno uporabniško ime ali geslo.', 'auth/user-not-found':'Napačno uporabniško ime ali geslo.', 'auth/invalid-email':'Neveljavno uporabniško ime.', 'auth/too-many-requests':'Preveč poskusov. Počakaj nekaj minut in poskusi znova.', 'auth/network-request-failed':'Ni povezave z internetom.', 'auth/user-disabled':'Račun je onemogočen.',
  'auth/operation-not-allowed':'V Firebase je prijava z e-pošto in geslom izklopljena: Authentication → Sign-in method → Email/Password → Enable (razdelek 2.4).',
  'auth/configuration-not-found':'Authentication v tem Firebase projektu še ni vključen: Authentication → Get started (razdelek 2.4).',
  'auth/unauthorized-domain':'Ta naslov strani ni dovoljen v Firebase: Authentication → Settings → Authorized domains → dodaj naslov (razdelek 5.2).',
  'auth/invalid-api-key':'API ključ v config.js ni veljaven (apiKey).',
  'auth/internal-error':'Notranja napaka Firebase: preveri apiKey in omejitve ključa (5.3) in da je Authentication vključen.' };
/* »Preveri povezavo«: korak za korakom pove, kje se prijava ustavi (config → program → Authentication → baza) */
async function fbCheck(){
  const box = $('#fbCheckOut'); if (!box) return;
  const rows = []; const show = () => { box.innerHTML = rows.map(r => `<div class="fbc ${r.ok === true ? 'ok' : r.ok === false ? 'bad' : 'wait'}"><b>${r.ok === true ? '✓' : r.ok === false ? '✗' : '…'} ${esc(r.t)}</b>${r.d ? `<br><span>${esc(r.d)}</span>` : ''}</div>`).join(''); };
  const add = (ok, t, d) => { const r = { ok, t, d:d || '' }; rows.push(r); show(); return r; };
  const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code:'timeout' })), ms))]);
  const f = KPC.firebase || {};
  add(!CFG_BROKEN && !fbMissing().length, 'config.js', LOCAL_WHY || `projekt »${f.projectId}«, domena prijave »${f.authDomain}«, računi: ${FB_USER_DOMAINS.map(d => '…@' + d).join(' ali ')}`);
  add(!!(DB && DB.auth), 'Program Firebase je naložen', DB && DB.auth ? '' : 'Program ni naložen: preveri internet ali blokado www.gstatic.com.');
  if (!(DB && DB.auth)) return;
  const a = add(null, 'Authentication (račun, prijava z e-pošto in geslom)');
  try { await timeout(DB.AU.signInWithEmailAndPassword(DB.auth, `preverjanje-povezave@${FB_USER_DOMAIN}`, 'neveljavno-geslo-0000'), 15000); a.ok = true; a.d = 'Odgovor je prišel.'; }
  catch(e){
    const c = String((e && e.code) || '');
    if (/^auth\/(invalid-credential|wrong-password|user-not-found|invalid-email)$/.test(c)){ a.ok = true; a.d = 'Deluje: Email/Password je vključen, API ključ je veljaven (poskusna prijava je bila pričakovano zavrnjena).'; }
    else { a.ok = false; a.d = authErrText(e, FB_USER_DOMAIN) + (c ? ' [' + c + ']' : ''); }
  }
  show();
  const d = add(null, 'Baza Firestore');
  try { await timeout(DB.get('users/preverjanje'), 15000); d.ok = false; d.d = 'Baza odgovarja, vendar pravila dovoljujejo branje brez prijave: objavi firestore.rules (razdelek 3).'; }
  catch(e){
    const c = String((e && e.code) || '');
    if (c === 'permission-denied'){ d.ok = true; d.d = 'Baza odgovarja in zavrača nepooblaščen dostop, kot mora.'; }
    else { d.ok = false; d.d = c === 'timeout' || c === 'unavailable' ? 'Baza ne odgovarja (internet, blokada googleapis.com ali baza ni ustvarjena: razdelek 2.3).' : `Napaka baze [${c || 'neznana'}]: ` + (c === 'not-found' || c === 'failed-precondition' ? 'baza Firestore še ni ustvarjena (razdelek 2.3).' : 'preveri razdelka 2.3 in 3.'); }
  }
  show();
  add(rows.every(r => r.ok === true), rows.every(r => r.ok === true) ? 'Povezava je v redu' : 'Odpravi prvo rdečo točko in preveri znova', rows.every(r => r.ok === true) ? 'Če se vseeno ne moreš prijaviti, je težava v računu ali profilu: poskusi prijavo, sporočilo pove razlog (razdelek 6).' : '');
}
/* besedilo napake pri prijavi: razlog + ukrep (brez splošnega »Prijava ni uspela«) */
function authErrText(err, emails){
  const email = [].concat(emails).join(' ali ');
  const c = String((err && err.code) || ''), base = AUTH_ERR[c];
  if (/^auth\/(invalid-credential|wrong-password|user-not-found)$/.test(c)) return base + ` Aplikacija je poskusila: ${email}. Če ima račun v Firebase (Authentication → Users) drug e-naslov, vpiši pri prijavi celoten e-naslov ali v config.js nastavi userDomain na njegovo domeno (več domen: seznam).`;
  if (base) return base;
  if (/referer|blocked/i.test(c)) return 'Google je zavrnil zahtevo, ker je API ključ omejen na drug naslov strani: Google Cloud → APIs & Services → Credentials → ključ → HTTP referrers: dodaj naslov te strani (razdelek 5.3).';
  if (/api-key/i.test(c)) return 'API ključ v config.js ni veljaven ali nima dovoljenja (apiKey, razdelek 5.3).';
  return 'Prijava ni uspela' + (c ? ' (' + c + ')' : '') + '. Preveri internet, config.js in Firebase Authentication.';
}
/* po uspešni prijavi: zakaj profil (users/UID) ne pusti naprej */
function profileProblem(uid, prof, err){
  if (err) return `Prijava je uspela, vendar profila ni mogoče prebrati iz baze (${err.code || 'napaka'}). ` + (err.code === 'permission-denied' ? 'Pravila baze zavračajo dostop: prilepi firestore.rules (razdelek 3) in preveri, da je baza Firestore ustvarjena.' : 'Preveri, da je baza Firestore ustvarjena (razdelek 2.3) in da je naprava povezana v internet.');
  if (!prof) return `Prijava je uspela, vendar v Firestore manjka dokument users/${uid}. Skrbnik ga ustvari (razdelek 6 in 7.2): Document ID mora biti natanko ta UID.`;
  if (!ROLES[prof.role]) return `Dokument users/${uid} nima veljavne vloge (role: ${prof.role == null ? 'manjka' : '»' + prof.role + '«'}); dovoljene so skrbnik, dispecer, voznik, spremljevalec (natančno tako, male črke).`;
  if (prof.active !== true) return `Račun je onemogočen ali polje active ni boolean true (zdaj: ${prof.active === undefined ? 'manjka' : typeof prof.active === 'string' ? 'besedilo »' + prof.active + '«' : String(prof.active)}). Popravi dokument users/${uid} (razdelek 6, korak 10).`;
  return '';
}
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form || f.id;
  try {
    if (kind === 'quick'){
      const inp = $('#quickIn'), p = parseQuick(inp ? inp.value : ''); if (!p.ok){ toast('Vpiši vsaj ime, naslov ali cilj'); return; }
      const r = addQuickRide(UI.date, p); UI.filter = 'vsi'; UI.q = ''; if (inp) inp.value = ''; rerender();
      const i2 = $('#quickIn'); if (i2) i2.focus();
      toast(`Vpisano (št. ${rideById(UI.date, r.id).nr}): ${r.name || r.to || r.from}${r.time ? ' ob ' + r.time : ''}`);
    }
    else if (kind === 'addDuty'){ const name = (fd.get('name') || '').trim(); if (!name) return; if (!S.staff.some(s => norm(s.name) === norm(name))) S.staff.push({ id:uid(), name, team:'redna', userId:'' }); addDuty(UI.dDate, name, (S.staff.find(s => norm(s.name) === norm(name)) || {}).team); save(); rerender(); }
    else if (kind === 'addNotice'){ S.notices.push({ id:uid(), vehicleId:fd.get('vehicleId'), tip:fd.get('tip'), from:fd.get('from'), to:fd.get('to') || '', note:(fd.get('note') || '').trim(), closed:false }); save(); render(); toast('Posebnost dodana'); }
    else if (kind === 'diaAdd'){ const p = patientById(fd.get('pid')); if (!p){ toast('Izberi pacienta'); return; } p.dt = { t:fd.get('t') === 'pop' ? 'pop' : 'dop', d:[1, 3, 5] }; save(); rerender(); toast(`${p.name}: dodan na dializo (pon, sre, pet). Popravi dneve po potrebi.`); }
    else if (kind === 'addStaff'){ const name = (fd.get('name') || '').trim(); if (name){ S.staff.push({ id:uid(), name, team:fd.get('team'), userId:'' }); save(); rerender(); } }
    else if (kind === 'importStaff'){
      const r = parseStaffList(fd.get('list') || '', S.staff.map(s => s.name)), team = fd.get('team') === 'NN' ? 'NN' : 'redna';
      if (!r.add.length){ toast('Ni novih imen za dodajanje.'); return; }
      r.add.forEach(name => S.staff.push({ id:uid(), name, team, userId:'' }));
      audit('osebje.uvoz', { dodanih:r.add.length, preskocenih:r.dup.length });
      save(); rerender(); toast(`Dodanih ${r.add.length} zaposlenih${r.dup.length ? ` · ${r.dup.length} že na seznamu` : ''}`);
    }
    else if (kind === 'addUser'){
      if (!isAdmin()) return;
      const un = (fd.get('username') || '').trim(), pw = fd.get('pw') || '';
      if (USERS.some(u => u.username.toLowerCase() === un.toLowerCase())){ $('#userErr').textContent = 'To uporabniško ime že obstaja.'; return; }
      if (pw.length < 10){ $('#userErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const nu = await makeUser(un, fd.get('name') || '', fd.get('role'), pw, { staffId:fd.get('staffId') || '' }); USERS.push(nu); saveUsers();
      if (nu.staffId){ const st = S.staff.find(s => s.id === nu.staffId); if (st) st.userId = nu.id; }
      audit('uporabnik.dodan', { uporabnik:un, vloga:nu.role }); save(); rerender(); toast('Račun ustvarjen');
    }
    else if (kind === 'remoteRole'){
      if (!isAdmin()) return;
      const id = (fd.get('uid') || '').trim(); if (!/^[A-Za-z0-9]{20,40}$/.test(id)){ $('#userErr').textContent = 'UID ni veljaven (kopiraj ga iz Firebase konzole).'; return; }
      await DB.set('users/' + id, { name:(fd.get('name') || '').trim(), role:fd.get('role'), active:true });
      audit('uporabnik.vloga', { uid:id, vloga:fd.get('role') }); f.reset(); await loadRemoteUsers(); toast('Vloga shranjena');
    }
    else if (kind === 'chPw'){
      const nuPw = fd.get('pw') || ''; if (nuPw.length < 10){ $('#pwErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      if (BACKEND === 'firebase'){
        const u = DB.auth.currentUser; const cred = DB.AU.EmailAuthProvider.credential(u.email, fd.get('old'));
        try { await DB.AU.reauthenticateWithCredential(u, cred); await DB.AU.updatePassword(u, nuPw); } catch(err){ $('#pwErr').textContent = AUTH_ERR[err.code] || 'Gesla ni mogoče spremeniti.'; return; }
      } else {
        const cur = USERS.find(x => x.id === ME.id);
        const old = await hashPw(fd.get('old'), cur.salt, cur.iter); if (old !== cur.hash){ $('#pwErr').textContent = 'Staro geslo ni pravilno.'; return; }
        const nu = await makeUser(cur.username, cur.name, cur.role, nuPw, { staffId:cur.staffId || '', demo:cur.demo }); nu.id = cur.id; USERS[USERS.findIndex(u => u.id === cur.id)] = nu; saveUsers();
      }
      audit('geslo.spremenjeno', {}); f.reset(); $('#pwErr').textContent = ''; toast('Geslo spremenjeno');
    }
    else if (kind === 'setupForm'){
      const pw = fd.get('pw') || ''; if (pw.length < 10){ $('#authErr').textContent = 'Geslo mora imeti vsaj 10 znakov.'; return; }
      const u = await makeUser(fd.get('username') || '', fd.get('name') || '', 'skrbnik', pw); USERS.push(u); saveUsers();
      if (fd.get('demo')) await seedDemo(pw);
      await login(u);
    }
    else if (kind === 'loginForm'){
      if (Date.now() < lockUntil){ $('#authErr').textContent = `Preveč poskusov. Počakaj ${Math.ceil((lockUntil - Date.now()) / 1000)} s.`; return; }
      const un = (fd.get('username') || '').trim().toLowerCase();
      if (BACKEND === 'firebase'){
        const emails = un.includes('@') ? [un] : FB_USER_DOMAINS.map(d => `${un}@${d}`);   // brez @: poskusi vse domene iz config.js po vrsti
        let lastErr = null;
        try { await DB.AU.setPersistence(DB.auth, fd.get('remember') ? DB.AU.browserLocalPersistence : DB.AU.browserSessionPersistence); }
        catch(err){ lastErr = err; }
        if (!lastErr){
          for (const email of emails){
            try { await DB.AU.signInWithEmailAndPassword(DB.auth, email, fd.get('pw') || ''); fails = 0; return; }
            catch(err){ lastErr = err; if (!/^auth\/(invalid-credential|wrong-password|user-not-found|invalid-email)$/.test(String(err && err.code))) break; }   // druge napake (omrežje, izklopljena prijava …) ne preizkušajo naslednje domene
          }
        }
        fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; }
        $('#authErr').textContent = authErrText(lastErr, emails);
        return;
      }
      const u = USERS.find(x => x.username.toLowerCase() === un);
      const h = u ? await hashPw(fd.get('pw') || '', u.salt, u.iter) : null;
      if (u && h === u.hash){ fails = 0; await login(u); }
      else { fails++; if (fails >= 5){ lockUntil = Date.now() + 30000; fails = 0; } $('#authErr').textContent = 'Napačno uporabniško ime ali geslo.'; }
    }
  } catch(err){
    if (String(err.message) === 'nosubtle') { const m = $('#authErr'); if (m) m.textContent = 'Brskalnik ne podpira varne prijave. Odpri stran prek https.'; }
    else { console.error(err); toast('Napaka: ' + (err.code || err.message)); }
  }
});
let fails = 0, lockUntil = 0;

/* ---------- Prijava / odjava ---------- */
async function login(u){
  ME = { id:u.id, name:u.name, role:u.role, staffId:u.staffId || '', username:u.username || '' };
  if (BACKEND !== 'firebase') sess.set('kp.sess', JSON.stringify({ id:u.id, t:Date.now() }));
  lastActivity = Date.now();
  $('#auth').hidden = true; $('#app').hidden = false;
  document.body.dataset.role = ME.role; $('#app').classList.toggle('crewmode', isCrew());
  $('#crewLogos').hidden = !isCrew();
  $('#uName').textContent = ME.name; $('#uRole').textContent = ROLES[ME.role] || ME.role; $('#avatar').textContent = (ME.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  fillLogos();
  const d = new Date(); UI.month = { y:d.getFullYear(), m:d.getMonth() };
  UI.date = todayStr(); UI.dDate = d.getHours() >= 12 ? addDays(todayStr(), 1) : todayStr(); UI.lDate = todayStr();
  const h = (location.hash || '').slice(1); UI.view = isCrew() ? 'moji' : (STAFF_VIEWS.includes(h) ? h : 'knjiga');
  applyTheme();
  audit('prijava', {});
  if (isCrew()){ startCrew(); render(); }
  else { render(); await startSync(); loadRemoteUsers(); render(); }
}
async function logout(msg = ''){
  if (ME) audit('odjava', {});
  const wasFb = BACKEND === 'firebase';
  stopSync(); stopCrew(); ME = null; sess.del('kp.sess');
  $('#app').hidden = true; $('#auth').hidden = false; sgClose(); UI.modal = null; renderModal();
  try { ROUTE.forget(); GEOC.forget(); } catch(e){} UI.maps = {}; UI.routeTest = null; UI.routeWarm = null;
  S = defaultState(); normalizeState(); USERS_REMOTE = []; AUDIT.length = 0; Object.keys(EVENTS).forEach(k => delete EVENTS[k]); Object.keys(RUNS).forEach(k => delete RUNS[k]);
  if (wasFb){ try { await DB.shutdown(); } catch(e){} try { sessionStorage.setItem('kp.msg', msg); } catch(e){} location.reload(); return; }
  renderAuth('login', msg);
}
document.addEventListener('click', e => {
  if (e.target.closest('#logoutBtn')) logout();
  if (e.target.closest('#themeBtn')){ const cur = store.get('kp.theme') || 'auto'; const nx = { auto:'dark', dark:'light', light:'auto' }[cur]; store.set('kp.theme', nx); applyTheme(true); }
});
function applyTheme(force){
  const t = store.get('kp.theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else if (force) delete document.documentElement.dataset.theme;
  const b = $('#themeBtn'); if (b) b.textContent = 'Tema: ' + ({ dark:'temna', light:'svetla' }[t] || 'samodejno');
}

/* ---------- Primeri (izmišljeni podatki) ---------- */
async function seedDemo(pw){
  const today = todayStr(), tom = addDays(today, 1), d = n => addDays(today, n);
  const names = [['Matej V.','redna'],['Tina R.','redna'],['Luka B.','NN'],['Nina S.','redna'],['Boštjan Z.','redna'],['Maja T.','NN']];
  S.staff = names.map(([name, team]) => ({ id:uid(), name, team, demo:true, userId:'' }));
  const st = n => S.staff.find(s => s.name === n);
  // demo računi posadke (isto geslo kot skrbnik; odstranijo se z "Odstrani vse primere")
  for (const [un, nm, role, staff] of [['voznik.demo', 'Matej V. (demo)', 'voznik', 'Matej V.'], ['spremljevalec.demo', 'Nina S. (demo)', 'spremljevalec', 'Nina S.'], ['voznik2.demo', 'Boštjan Z. (demo)', 'voznik', 'Boštjan Z.']]){
    const u = await makeUser(un, nm, role, pw, { staffId:st(staff).id, demo:true }); USERS.push(u); st(staff).userId = u.id;
  }
  saveUsers();
  const mkDuty = (n, role, team) => ({ id:uid(), name:n, staffId:st(n).id, team:team || st(n).team, role:role || 'voznik', from:'', to:'', ot:0, vehicleId:'', demo:true });
  S.duty[today] = isStandby(today) ? [mkDuty('Matej V.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [mkDuty('Matej V.'), mkDuty('Boštjan Z.'), mkDuty('Maja T.')];
  S.duty[tom] = isStandby(tom) ? [mkDuty('Tina R.', 'voznik', 'pripravljenost'), mkDuty('Nina S.', 'spremljevalec', 'pripravljenost')] : [{ ...mkDuty('Matej V.'), from:'05:30' }, mkDuty('Tina R.'), mkDuty('Luka B.'), mkDuty('Nina S.', 'spremljevalec')];
  // pacienti in nalogi (različna stanja, da se vidijo opozorila)
  const nl = (vrsta, od, do_, extra = {}) => ({ ...blankNalog(vrsta, od), veljaDo:do_, auto:false, stevilka:'DEMO-' + Math.floor(1000 + Math.random() * 9000), narocnik:'ZD Brežice (osebni zdravnik)', zdravnik:'dr. Primer Vzorec', razlog:'Dializa', od:'', do:'SB Brežice – dializa', ...extra });
  const pt = (name, addr, phone, mode, dia, naloge) => { const p = blankPatient({ name, addr, phone, mode, dt:dia ? { t:diaTermOf(dia), d:dia === 'D3' ? [2, 4, 6] : [1, 3, 5] } : null, color:nextColor(), demo:true, naloge:naloge.map(n => ({ ...n, od:n.od || addr })) }); S.patients.push(p); return p; };
  pt('Milan Dializni', 'Velike Malence 3', '031 000 201', 'sede', 'D1', [nl('letna', d(-300), d(65))]);
  pt('Vida Dializna', 'Dobova 90', '031 000 202', 'sede', 'D1', [nl('letna', d(-347), d(18))]);
  pt('Tone Dializni', 'Bizeljsko 12', '031 000 203', 'leze', 'D2', [nl('letna', d(-370), d(-5))]);
  pt('Zora Dializna', 'Čatež ob Savi 4', '031 000 204', 'sede', 'SaD4', [nl('letna', d(-30), d(335))]);
  pt('Ludvik Dializni', 'Cerklje ob Krki 30', '031 000 205', 'sede', 'D3', [nl('letna', d(-120), d(245))]);
  pt('Rozalija Dializna', 'Pišece 18', '031 000 206', 'sede', 'D3', []);
  pt('Ivan Primer', 'Dobova 25', '031 000 101', 'sede', '', [nl('mesecna', d(-21), d(9), { razlog:'Rehabilitacija', do:'UKC Ljubljana' })]);
  pt('Marija Vzorec', 'Čatež ob Savi 12', '031 000 102', 'sede', '', [nl('enkratna', tom, tom, { razlog:'Specialistični pregled', do:'UKC Ljubljana' })]);
  pt('Franc Zgled', 'Cesta prvih borcev 14, Brežice', '031 000 103', 'leze', '', [nl('zdravljenje', d(-10), d(20), { razlog:'Obsevanje', do:'Onkološki inštitut Ljubljana' })]);
  pt('Slavka Zgled', 'Artiče 21', '031 000 108', 'sede', '', []);
  const put = (date, list) => { const a = ensureDay(date); list.forEach((x, i) => { const p = S.patients.find(q => q.name === x.name); Object.assign(a[i], { ...blankRide(), mode:'sede', ...x, demo:true, patientId:p ? p.id : '', nalogId:p && activeNalog(p, date) ? activeNalog(p, date).id : '' }); }); };
  put(tom, [
    { name:'Ivan Primer', time:'08:30', from:'Dobova 25', to:'UKC Ljubljana', phone:'031 000 101' },
    { name:'Marija Vzorec', time:'08:45', from:'Čatež ob Savi 12', to:'UKC Ljubljana', phone:'031 000 102' },
    { name:'Franc Zgled', time:'09:00', from:'Cesta prvih borcev 14, Brežice', to:'UKC Ljubljana', phone:'031 000 103', mode:'leze' },
    { name:'Ana Demo', time:'10:15', from:'Bizeljsko 40', to:'SB Novo mesto', phone:'031 000 104' },
    { name:'Jože Testni', time:'11:00', from:'Pišece 7', to:'SB Brežice', phone:'031 000 105' },
    { name:'Marta Primer', time:'10:30', from:'SB Brežice', to:'Cerklje ob Krki 15', phone:'031 000 106' },
    { name:'Anton Vzorec', time:'11:00', from:'SB Brežice', to:'Sromlje 9', phone:'031 000 107' },
    { name:'Slavka Zgled', time:'13:30', from:'Artiče 21', to:'Onkološki inštitut Ljubljana', phone:'031 000 108' },
    { name:'Peter Demo', time:'14:00', from:'Obrežje 5', to:'ZD Krško', phone:'031 000 109' }
  ]);
  put(today, [
    { name:'Darja Primer', time:'07:30', from:'Dobova 8', to:'SB Brežice', phone:'031 000 111', done:true, doneBy:'Matej V.' },
    { name:'Janez Vzorec', time:'09:00', from:'Mostec 4', to:'SB Brežice', phone:'031 000 112', done:true, doneBy:'Boštjan Z.' },
    { name:'Olga Zgled', time:'12:30', from:'SB Brežice', to:'Globoko 6', phone:'031 000 113' },
    { name:'Viktor Demo', time:'13:15', from:'Čatež ob Savi 31', to:'SB Celje', phone:'031 000 114', mode:'leze' }
  ]);
  [today, tom].forEach(dd => { loadDialysis(dd); });
}

/* ---------- Zagon ---------- */
async function boot(){
  applyTheme();
  S = defaultState(); normalizeState(); loadAddr(); loadSharedAddr(); fillLogos();
  KM.onUpdate = (date, id) => {      // kilometrina prevoza je izračunana: osveži vrstico; ko je čakalna vrsta prazna, še razpored (natančne koordinate)
    if (!ME) return;
    if (UI.view === 'dan' && UI.date === date){ const nb = $(`[data-ride="${id}"]`); if (nb) refreshKm(nb); if (KM.queued() === 0) scheduleRender(); }
    else if (['knjiga', 'dispecer'].includes(UI.view)) scheduleRender();
  };
  GOOGLE.onUpdate = () => { if (ME && UI.view === 'nastavitve' && UI.setTab === 'planiranje') scheduleRender(); };
  document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.sect){ const k = d.dataset.sect, was = !!UI.sect[k]; UI.sect[k] = d.open; if (k === 'daymap' && was !== d.open) rerender(); } }, true);
  ROUTE.onUpdate = () => { if (ME) scheduleRender(); }; ROUTE.init();     // cestni podatki: splošni predpomnilnik + razdalje.json; osveži prikaz, ko prispejo novi podatki
  let msg = ''; try { msg = sessionStorage.getItem('kp.msg') || ''; sessionStorage.removeItem('kp.msg'); } catch(e){}
  if (BACKEND === 'firebase'){
    $('#auth').hidden = false; renderAuth('login', 'Povezujem …');
    try { DB = await firebaseAdapter(); }
    catch(err){ console.error(err); renderAuth('login', 'Povezava s Firebase ni uspela. Preveri internet in config.js.'); return; }
    DB.onError = (what, err) => { if (err && err.code === 'permission-denied') toast('Dostop zavrnjen: ' + what); };
    let authMsg = msg;   // sporočilo, ki preživi odjavo (Firebase po signOut sproži še en klic z user = null)
    DB.AU.onAuthStateChanged(DB.auth, async user => {
      if (ME || !user){ if (!user && !ME){ renderAuth('login', authMsg); authMsg = ''; } return; }
      let prof = null, perr = null; try { prof = await DB.get('users/' + user.uid); } catch(e){ perr = e; }
      const prob = profileProblem(user.uid, prof, perr);
      if (prob){ authMsg = prob; await DB.AU.signOut(DB.auth); return; }
      await login({ id:user.uid, name:prof.name || user.email, role:prof.role });
    });
    return;
  }
  DB = localAdapter();
  try { USERS = JSON.parse(store.get('kp.users') || '[]'); } catch(e){ USERS = []; }
  let sessUser = null;
  try { const s = JSON.parse(sess.get('kp.sess') || 'null'); if (s) sessUser = USERS.find(u => u.id === s.id); } catch(e){}
  if (sessUser){ await login(sessUser); }
  else { $('#auth').hidden = false; renderAuth('login', msg); }
}
boot();
