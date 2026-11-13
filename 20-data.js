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
      { id:'v04', name:'Avto 04', tip:'sanitetno', ns:'redna', sede:3, leze:1, utila:0, skupaj:4, sedeMax:3, lezeMax:1, utilaMax:0, skupajMax:4, aktiv:true },
      { id:'v13', name:'Avto 13', tip:'sanitetno', ns:'redna', sede:4, leze:0, utila:0, skupaj:4, sedeMax:6, lezeMax:0, utilaMax:0, skupajMax:6, aktiv:true },
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
