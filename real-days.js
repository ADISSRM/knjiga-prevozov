'use strict';
/* ANONIMIZIRANA preslikava desetih dni iz fotografij papirne knjige (7., 8., 20., 22. 10. ter 5., 6., 9., 10., 11. in 12. 11. 2026), za umerjanje razporeda.
   Enaki so cilji, ure, načini prevoza, število in sestava posadk ter razporeditev, ki jo je naredil dispečer (polje real).
   Izmišljena so imena (»Pacient NN«), telefoni in naslovi (samo kraj ali ulica brez hišne številke). `row` = številka vrstice v knjigi;
   več pacientov v eni vrstici (dializa) so prevozi z isto številko. Uporaba: tests/run.js (preizkus »resnični dnevi«) ali  node tests/real-eval.js  */
const R = (row, name, from, to, time, mode, extra) => Object.assign({ row, name, from, to, time, mode:mode || 'sede', phone:'031 000 000' }, extra || {});
const OI = 'O.I. LJ', KK = 'Dializa KK';
const DAY5 = {
  date:'2026-11-05', dow:'četrtek',
  rides:[
    R(1, 'Pacient 61', 'Križe', 'SB NM urologija', '10:30', 'utila', { note:'s spremljevalcem' }),
    R(2, 'Pacient 62', 'Vrhje', OI, '13:00'),
    R(3, 'Pacient 63', 'Stara vas', 'SB NM', '08:20'),
    R(4, 'Pacient 64', 'Čurnovec', OI, '08:00'),
    R(5, 'Pacient 65', 'Cesta bratov Milavcev', OI, '08:00'),
    R(6, 'Pacient 66', 'Zakot', OI, '07:30'),
    R(7, 'Pacient 67', 'Hrastje pri Cerkljah', 'Ginekolog LJ', '12:30', 'sede', { note:'brez naloga' }),
    R(8, 'Pacient 68', 'Aškerčeva ulica, Brežice', 'SB Trbovlje UZ AVF', '16:30'),
    R(9, 'Pacient 69', 'Čurnovec', 'UKC LJ očesna', '08:00'),
    R(10, 'Pacient 70', 'Doma', KK, '', 'utila', { dia:'dop' }),
    R(10, 'Pacient 71', 'Doma', KK, '', 'utila', { dia:'dop' }),
    R(11, 'Pacient 72', 'Cesta svobode', OI, '08:00'),
    R(12, 'Pacient 64 (dvojnik)', 'Čurnovec', OI, '08:00', 'sede', { odpovedano:true }),
    R(13, 'Pacient 73', 'Carlos/Spar', OI, '11:00'),
    R(14, 'Pacient 74', 'Selice', 'SB NM očesna', '10:00', 'utila'),
    R(15, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(16, 'Pacient 75', 'Cesta prvih borcev', OI, '08:45', 'sede', { note:'prej pokliči' }),
    R(17, 'Pacient 76', 'Trebež', 'ORL klinika LJ', '09:15')
  ],
  veh:["03","17","18"],
  duty:[["Voznik F","D1","voznik","18"],["Voznik G","D1","voznik","03"],["Voznik H","NN","voznik","17"],["Spremljevalec H","NN","spremljevalec","17"]],
  real:{"17":[10,1,3,14],"18":[2,7,13,8],"03":[4,5,6,9,11,15,16,17]}, realStart:{"17":"06:00","18":"08:00","03":"06:00"}
};
const DAY6 = {
  date:'2026-11-06', dow:'petek',
  rides:[
    R(1, 'Pacient 81', 'Obrežje', 'SB Brežice gastroskopija', '08:45', 'sede', { note:'odpovedano: v zdravilišču', odpovedano:true }),
    R(2, 'Pacient 82', 'DSO', 'SB B. – krg. amb.', '09:15', 'utila'),
    R(3, 'Pacient 83', 'Jesenice', 'Poliklinika LJ', '11:40'),
    R(4, 'Pacient 84', 'Čurnovec', OI, '08:00', 'sede', { odpovedano:true }),
    R(5, 'Pacient 85', 'Gornji Lenart', OI, '13:45'),
    R(6, 'Pacient 86', 'Jesenice', 'SB NM očesna', '09:45'),
    R(7, 'Pacient 87', 'Cesta bratov Milavcev', 'UKC LJ', '12:00', 'sede', { note:'odpove, se bo peljal sam', odpovedano:true }),
    R(8, 'Pacient 88', 'Doma', KK, '', 'sede', { dia:'pop' }),
    R(8, 'Pacient 89', 'SB Brežice', KK, '', 'utila', { dia:'pop' }),
    R(8, 'Pacient 90', 'Doma', KK, '', 'leze', { dia:'pop' }),
    R(9, 'Pacient 91', 'Prešernova ulica, Brežice', 'SB B. – krg. amb.', '09:50', 'leze'),
    R(10, 'Pacient 92', 'Cesta svobode', OI, '08:00', 'sede', { odpovedano:true }),
    R(11, 'Pacient 93', 'Carlos/Spar', OI, '11:00', 'sede', { odpovedano:true }),
    R(12, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(13, 'Pacient 94', 'Cesta prvih borcev', OI, '08:45'),
    R(14, 'Pacient 95', 'SB Brežice KT', 'Stara vas', '', 'utila', { note:'popoldne, javijo uro' }),
    R(15, 'Pacient 96', 'Veliki Obrež', 'SB Brežice ITP', '08:00', 'utila'),
    R(16, 'Pacient 97', 'DSO', 'SB B. – krg. amb.', '09:00', 'leze')
  ],
  veh:["03","07","17","18"],
  duty:[["Voznik I","D1","voznik","03"],["Voznik J","D2","voznik","18"],["Voznik K","D1","voznik","07"],["Voznik L","NN","voznik","17"],["Spremljevalec L","NN","spremljevalec","17"]],
  real:{"17":[2,8,9,14,15,16],"18":[6],"03":[3,12,13],"07":[5]}, realStart:{"17":"08:00","03":"06:00"}
};
const DAY9 = {
  date:'2026-11-09', dow:'ponedeljek',
  rides:[
    R(1, 'Pacient 21', 'Nova vas', 'UKC LJ', '11:30'),
    R(2, 'Pacient 22', 'Cesta bratov Milavcev, Brežice', 'Lj - Onkološko', '12:00'),
    R(3, 'Pacient 23', 'Dolenja vas 2 pri Artičah', 'ZD KK zobar', '08:30', 'utila'),
    R(4, 'Pacient 24', 'Doma', KK, '14:00', 'sede', { dia:'pop' }),
    R(5, 'Pacient 25', 'Cerklje ob Krki', 'SBB', '14:55', 'sede', { odpovedano:true }),
    R(6, 'Pacient 26', 'Cesta prvih borcev', OI, '08:45'),
    R(7, 'Pacient 27', 'ZD', OI, '09:30'),
    R(8, 'Pacient 28', 'Čurnovec', OI, '08:00'),
    R(9, 'Pacient 29', 'Cesta svobode', OI, '08:00'),
    R(10, 'Pacient 30', 'Hrastje pri Cerkljah', OI, '09:00'),
    R(11, 'Pacient 31', 'Carlos/Spar', OI, '11:00', 'sede', { note:'prej pokliči' }),
    R(12, 'Pacient 32', 'INT II.', KK, '13:00', 'utila', { dia:'pop' })
  ],
  veh:["07","17","18"],
  duty:[["Voznik D","D2","voznik","07"],["Voznik B","D2","voznik","18"],["Voznik E","NN","voznik","17"],["Spremljevalec E","NN","spremljevalec","17"]],
  real:{"17":[3,4,12],"18":[6,7,8,9,10],"07":[1,2,11]}, realStart:{"17":"08:00","18":"06:00"}
};
const DAY10 = {
  date:'2026-11-10', dow:'torek',
  rides:[
    R(1, 'Pacient 01', 'Obrežje', 'SB NM okulist', '11:30'),
    R(2, 'Pacient 02', 'Veliki Obrež', 'UKC LJ', '10:00', 'sede', { note:'brez spremljevalca' }),
    R(3, 'Pacient 03', 'DSO', 'ZD Brežice', '08:15', 'sede', { odpovedano:true }),
    R(4, 'Pacient 04', 'Mihalovec', OI, '11:00'),
    R(5, 'Pacient 05', 'Artiče', OI, '09:30'),
    R(6, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(7, 'Pacient 07', 'Cesta prvih borcev', OI, '08:45'),
    R(8, 'Pacient 08', 'Čurnovec', OI, '08:00'),
    R(9, 'Pacient 09', 'Cesta svobode', OI, '08:00'),
    R(10, 'Pacient 10', 'Doma', KK, '07:00', 'utila', { dia:'dop' }),
    R(11, 'Pacient 11', 'Velika Dolina', 'SB B. – krg. amb.', '14:00', 'utila'),
    R(12, 'Pacient 12', 'Carlos/Spar', OI, '11:00')
  ],
  veh:["03","16","17"],
  duty:[["Voznik A","D1","voznik","03"],["Voznik B","D2","voznik","16"],["Voznik C","NN","voznik","17"],["Spremljevalec C","NN","spremljevalec","17"]],
  real:{"16":[10],"17":[11],"03":[2,4,5,6,7,8,9,12]}, realStart:{"16":"06:00","03":"06:00"}
};
const DAY11 = {
  date:'2026-11-11', dow:'sreda',
  rides:[
    R(1, 'Pacient 41', 'Podgorje pri Pišecah', 'SB NM ortopedija', '08:00'),
    R(2, 'Pacient 42', 'Žejno', 'ZD Sevnica kardiolog', '07:00'),
    R(3, 'Pacient 43', 'Blatno', OI, '13:30'),
    R(4, 'Pacient 44', 'Cerklje ob Krki', OI, '08:00'),
    R(5, 'Pacient 45', 'DSO', 'SB NM dermatolog', '', 'utila'),
    R(6, 'Pacient 46', 'DSO', 'SB Brežice dermatolog', '', 'utila'),
    R(7, 'Pacient 47', 'Gabrje', 'SB B. – krg. amb.', '11:50', 'utila'),
    R(8, 'Pacient 48', 'Obrežje', 'SB NM', '12:30', 'sede', { note:'2 reševalca, s spremljevalcem' }),
    R(9, 'Pacient 49', 'Doma', KK, '', 'utila', { dia:'pop' }),
    R(9, 'Pacient 50', 'Doma', KK, '', 'leze', { dia:'pop' }),
    R(10, 'Pacient 51', 'Carlos/Spar', OI, '11:00'),
    R(11, 'Pacient 52', 'Cesta svobode', OI, '08:00'),
    R(12, 'Pacient 53', 'Čurnovec', OI, '08:00'),
    R(13, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(14, 'Pacient 54', 'Cesta prvih borcev', OI, '08:45')
  ],
  veh:["03","16","17","18"],
  duty:[["Voznik M","D2","voznik","03"],["Voznik N","D1","voznik","18"],["Spremljevalec N","D1","spremljevalec","18"],["Voznik O","D2","voznik","16"],["Voznik P","NN","voznik","17"],["Spremljevalec P","NN","spremljevalec","17"]],
  real:{"16":[6],"17":[1,5,7,9],"18":[2,3],"03":[4,10,11,12,13,14,8]}, realStart:{"18":"06:00","03":"06:00"}
};
/* ---- Dnevi iz fotografij 11. 11. 2026 (7., 8., 20., 22. 10. in 12. 11. 2026). Prevozi vozijo tudi NN-posadke v Ljubljano (kdor ima ležeče/utila bolnike),
   zato imajo ta vozila ns:'oboje' (polje vehOv). Ure v zadnjem stolpcu knjige so na fotografijah delno odrezane: kjer manjkajo, so izpeljane iz ure odhoda (≈ odhod + 2 h). ---- */
const D07 = {
  date:'2026-10-07', dow:'sreda',
  rides:[
    R(1, 'Pacient 101', 'Cesta svobode', OI, '09:30'),
    R(2, 'Pacient 102', 'Arnovo selo', 'UKC LJ PET/CT', '10:45', 'utila'),
    R(3, 'Pacient 103', 'Gornje Skopice', 'Golnik CT', '11:50'),
    R(4, 'Pacient 120', 'Doma', KK, '', 'sede', { dia:'dop', note:'dializa že od jutra' }),
    R(4, 'Pacient 121', 'Doma', KK, '', 'sede', { dia:'dop', note:'dializa že od jutra' }),
    R(5, 'Pacient 104', 'Cerklje ob Krki', 'UKC LJ', '13:30', 'sede', { note:'s spremljevalko', odpovedano:true }),
    R(6, 'Pacient 105', 'SB Brežice INT I', KK, '', 'sede', { dia:'pop', odpovedano:true, note:'odpuščen domov' }),
    R(7, 'Pacient 106', 'NBO', KK, '', 'leze', { dia:'pop' }),
    R(8, 'Pacient 107', 'Cesta svobode', KK, '', 'utila', { dia:'pop' }),
    R(9, 'Pacient 117', 'Globoko', KK, '', 'utila', { dia:'dop' }),
    R(10, 'Pacient 118', 'Ribnica', 'SB Brežice diabetolog', '08:00', 'leze'),
    R(11, 'Pacient 119', 'Hrastje pri Cerkljah', 'ORL klinika LJ', ''),
    R(12, 'Pacient 108', 'Gubčeva ulica, Brežice', 'UKC Maribor', '08:00', 'leze', { note:'s spremljevalko' }),
    R(13, 'Pacient 109', 'Dobova', 'UKC LJ', '08:15'),
    R(14, 'Pacient 110', 'Pišece', 'SB Brežice očesna', '09:20'),
    R(15, 'Pacient 122', 'SB Brežice INT I', 'OŠ Brežice zobna amb.', '08:00', 'utila'),
    R(16, 'Pacient 123', 'SB Brežice INT II', 'SB NM koronarografija', '08:30', 'utila', { odpovedano:true, note:'odpade' }),
    R(17, 'Pacient 124', 'NBO', 'Zdravilišče Laško', '10:00', 'leze', { note:'sprejem med 10. in 12. uro, po 9h' }),
    R(18, 'Pacient 125', 'NBO', 'DSO', '10:00', 'leze', { note:'med 10. in 12. uro, po 9h' }),
    R(19, 'Pacient 126', 'Krška vas', OI, '08:00'),
    R(20, 'Pacient 127', OI, 'Obrežje', '', 'sede', { note:'vrnitev, prej pokliči' })
  ],
  veh:["09","15","16","17"], vehOv:{ "16":{ ns:'oboje' }, "17":{ ns:'oboje' } },
  duty:[["Voznik Q","NN","voznik","15"],["Spremljevalec Q","NN","spremljevalec","15"],["Voznik R","D1","voznik","09"],["Voznik S","D2","voznik","17"],["Voznik T","D2","voznik","16"]],
  real:{"15":[12,7,8],"09":[1,2,3,20,11,13,19],"17":[9,4,10,17,18],"16":[14,15]}, realStart:{"15":"06:00","09":"06:00","17":"06:00","16":"06:00"}
};
const D08 = {
  date:'2026-10-08', dow:'četrtek',
  rides:[
    R(1, 'Pacient 131', 'Črešnjice pri Cerkljah', 'Poliklinika LJ', '10:40', 'sede', { odpovedano:true, note:'odpovedano' }),
    R(2, 'Pacient 123', 'Levstikova ulica', OI, '07:00'),
    R(3, 'Pacient 120', 'Doma', KK, '', 'sede', { dia:'dop', note:'dializa že od jutra' }),
    R(3, 'Pacient 121', 'Doma', KK, '', 'sede', { dia:'dop', note:'dializa že od jutra' }),
    R(4, 'Pacient 119', 'Hrastje pri Cerkljah', 'Poliklinika LJ', '08:00', 'sede', { note:'po 8h' }),
    R(5, 'Pacient 132', 'Krška vas', OI, '08:00'),
    R(6, 'Pacient 133', 'Čatež ob Savi', 'Poliklinika LJ', '09:00'),
    R(7, 'Pacient 111', 'Čurnovec', OI, '08:00'),
    R(8, 'Pacient 134', 'NBO', 'DSO Loka', '09:00', 'leze', { note:'ure' }),
    R(9, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(10, 'Pacient 135', 'Orešje', KK, '07:00', 'utila', { dia:'dop' }),
    R(11, 'Pacient 136', 'Bizeljsko', KK, '07:00', 'utila', { dia:'dop' }),
    R(12, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci')
  ],
  veh:["15","17","18"], vehOv:{ "17":{ ns:'oboje' } },
  duty:[["Voznik U","NN","voznik","15"],["Spremljevalec U","NN","spremljevalec","15"],["Voznik V","D1","voznik","17"],["Voznik W","D2","voznik","18"]],
  real:{"15":[3,10,11],"17":[8],"18":[2,4,5,6,7,9,12]}, realStart:{"15":"06:00","17":"06:00","18":"06:00"}
};
const D20 = {
  date:'2026-10-20', dow:'torek',
  rides:[
    R(1, 'Pacient 141', 'Dečno selo', 'Poliklinika LJ kardiologija', '11:15', 'sede', { odpovedano:true, note:'spremenjen datum' }),
    R(2, 'Pacient 117', 'Globoko', 'UKC LJ nevrologija', '09:30', 'utila'),
    R(3, 'Pacient 118', 'Ribnica', 'UKC LJ travmatologija', '08:00', 'leze', { note:'sprejem' }),
    R(4, 'Pacient 142', 'Jesenice na Dolenjskem', 'Poliklinika LJ hematološka amb.', '13:30', 'sede', { note:'odhod 11:00' }),
    R(5, 'Pacient 114', 'Cesta svobode', OI, '08:00'),
    R(6, 'Pacient 143', 'DSO', 'Zobozdravnik Brežice', '16:00', 'utila', { note:'MRSA' }),
    R(7, 'Pacient 112', 'Cesta svobode', OI, '09:00'),
    R(8, 'Pacient 144', 'Stara vas', 'Stomatološka klinika LJ', '08:30', 'utila'),
    R(9, 'Pacient 113', 'Levstikova ulica', OI, '08:00'),
    R(10, 'Pacient 145', 'SB Brežice', 'Šmarješke Toplice', '08:00', 'utila', { note:'sprejem' }),
    R(11, 'Pacient 111', 'Čurnovec', OI, '09:30'),
    R(12, 'Pacient 146', 'Levstikova ulica', 'SB NM krg. amb.', '09:00', 'utila'),
    R(13, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(14, 'Pacient 147', 'SB Brežice INT II', 'Poliklinika LJ krg. amb.', '13:00', 'leze', { note:'ne prej' }),
    R(15, 'Pacient 148', 'Velika Dolina', 'SB B. – krg. amb.', '15:00', 'leze', { note:'2 reševalca' }),
    R(16, 'Pacient 149', 'Nova vas pri Mokricah', 'URI Soča', '14:00', 'sede', { note:'odhod 11:00' }),
    R(17, 'Pacient 115', 'Doma', KK, '', 'utila', { dia:'pop' }),
    R(17, 'Pacient 116', 'Doma', KK, '', 'utila', { dia:'pop' })
  ],
  veh:["09","16","17"], vehOv:{ "16":{ ns:'oboje' }, "17":{ ns:'oboje' } },
  duty:[["Voznik X","NN","voznik","17"],["Spremljevalec X","NN","spremljevalec","17"],["Voznik Y","D1","voznik","16"],["Voznik Z","D2","voznik","09"]],
  real:{"17":[3,10,12,4,14,16,15],"16":[2,17,6],"09":[5,7,8,9,11,13]}, realStart:{"17":"06:00","16":"06:00","09":"08:00"}
};
const D22 = {
  date:'2026-10-22', dow:'četrtek',
  rides:[
    R(1, 'Pacient 114', 'Cesta svobode', OI, '13:00'),
    R(2, 'Pacient 113', 'Levstikova ulica', OI, '13:00', 'sede', { note:'ura 17x?' }),
    R(3, 'Pacient 151', 'Žejno', OI, '11:00'),
    R(4, 'Pacient 152', 'Brežice', OI, '11:00'),
    R(5, 'Pacient 112', 'Cesta svobode', OI, '08:30'),
    R(6, 'Pacient 115', 'Orešje', KK, '07:00', 'utila', { dia:'dop' }),
    R(6, 'Pacient 116', 'Orešje', KK, '07:00', 'utila', { dia:'dop' }),
    R(7, 'Pacient 111', 'Čurnovec', OI, '09:15'),
    R(8, 'Pacient 122', 'NBO', 'UKC LJ ORL klinika', '08:00', 'leze', { odpovedano:true, note:'odpovedano' }),
    R(9, 'Pacient 153', 'DSO', 'Dermatološka klinika LJ', '', 'sede', { note:'dopoldne' }),
    R(10, 'Pacient 154', 'DSO', 'Dermatološka klinika LJ', '', 'utila', { note:'dopoldne, s spremstvom zaporedne' }),
    R(11, 'Pacient 155', 'Cesta svobode', 'URI Soča', '08:30'),
    R(12, 'Pacient 117', 'Globoko', KK, '', 'utila', { dia:'dop', note:'dodatna dializa' }),
    R(13, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci'),
    R(14, 'Pacient 156', 'SB Brežice INT II', 'UKC LJ', '07:45', 'utila')
  ],
  veh:["16","07","17"], vehOv:{ "16":{ ns:'oboje' }, "07":{ ns:'oboje' }, "17":{ ns:'oboje' } },
  duty:[["Voznik AA","D1","voznik","16"],["Voznik AB","NN","voznik","07"],["Voznik AC","NN","voznik","17"]],
  split:true, real:{"16":[6,12,1,2,3,4],"07":[5,7,11],"17":[9,10,13,14]}, realStart:{"16":"06:00","07":"06:30","17":"06:00"}
};
const D12 = {
  date:'2026-11-12', dow:'četrtek',
  rides:[
    R(1, 'Pacient 161', 'Dolenja vas pri Artičah', 'Poliklinika LJ', '08:00', 'utila', { note:'laboratorij' }),
    R(2, 'Pacient 162', 'Cesta bratov Milavcev', 'SB NM CT', '07:30'),
    R(3, 'Pacient 123', 'Levstikova ulica', OI, '08:00'),
    R(4, 'Pacient 163', 'Cesta svobode', OI, '08:00'),
    R(5, 'Pacient 164', 'Cesta svobode', 'Poliklinika LJ', '11:50', 'sede', { note:'s spremljevalcem, pozor' }),
    R(6, 'Pacient 165', 'DSO', 'SB Brežice krg. amb.', '11:30', 'sede', { odpovedano:true, note:'prestavljen na 19. 11.' }),
    R(7, 'Pacient 166', 'DSO', 'Zobozdravnik Brežice', '11:30', 'utila', { note:'s spremljevalcem' }),
    R(8, 'Pacient 167', 'Cesta bratov Milavcev', 'SB NM', '12:50'),
    R(9, 'Pacient 168', 'Dolenje Skopice', 'Golnik', '08:30'),
    R(10, 'Pacient 169', 'Križe', OI, '09:00', 'sede', { odpovedano:true, note:'bo sin odpeljal' }),
    R(11, 'Pacient 170', 'Jesenice na Dolenjskem', 'UKC LJ', '09:00'),
    R(12, 'Pacient 171', 'Gorenja Pirošica', OI, '08:00'),
    R(13, 'Pacient 172', 'Terme Čatež', 'Krško', '08:30'),
    R(14, 'Pacient 115', 'Doma', KK, '', 'utila', { dia:'dop' }),
    R(14, 'Pacient 116', 'Doma', KK, '', 'utila', { dia:'dop' }),
    R(15, 'Pacient 173', 'Gubčeva ulica, Brežice', 'SB B. – krg. amb.', '11:00', 'utila'),
    R(16, 'Pacient 112', 'Cesta svobode', OI, '08:00'),
    R(17, 'Pacient 111', 'Čurnovec', OI, '08:00'),
    R(18, 'Pacient 113', 'Carlos/Spar', OI, '09:00'),
    R(19, 'Pacient 174', 'Cesta prvih borcev', OI, '09:00'),
    R(20, 'Pacient 122', 'NBO', 'DSO Loka', '', 'leze', { note:'sprejem' }),
    R(21, 'Pacient 175', 'ZD Brežice', 'SB NM', '', 'sede', { note:'pride pred reševalno postajo' }),
    R(22, 'IMI Ljubljana vzorci', '', 'IMI LJ', '', 'vzorci')
  ],
  veh:["03","18","15","17"], vehOv:{ "17":{ ns:'oboje' } },
  duty:[["Voznik BA","D1","voznik","03"],["Voznik BB","D2","voznik","18"],["Voznik BC","D1","voznik","15"],["Voznik BD","NN","voznik","17"],["Spremljevalec BD","NN","spremljevalec","17"]],
  real:{"03":[3,4,9,12,16,17],"18":[5,11,18,19,13,22],"15":[1,2,8,21],"17":[14,7,20,15]}, realStart:{"03":"06:00","18":"07:00","15":"06:00","17":"06:00"}
};
const VEH = {
 "16": { "id": "v16", "name": "16", "tip": "resevalni", "ns": "redna", "fn": "dializa", "sede": 4, "leze": 0, "utila": 2, "skupaj": 4, "sedeMax": 4, "lezeMax": 0, "utilaMax": 2, "skupajMax": 4, "aktiv": true },
 "17": { "id": "v17", "name": "17", "tip": "resevalni", "ns": "NN", "sede": 2, "leze": 1, "utila": 2, "skupaj": 4, "sedeMax": 3, "lezeMax": 1, "utilaMax": 2, "skupajMax": 4, "aktiv": true },
 "18": { "id": "v18", "name": "18", "tip": "transportni", "ns": "redna", "sede": 6, "leze": 0, "utila": 0, "skupaj": 6, "sedeMax": 6, "lezeMax": 0, "utilaMax": 0, "skupajMax": 6, "aktiv": true },
 "03": { "id": "v03", "name": "03", "tip": "transportni", "ns": "redna", "sede": 8, "leze": 0, "utila": 0, "skupaj": 8, "sedeMax": 8, "lezeMax": 0, "utilaMax": 0, "skupajMax": 8, "aktiv": true },
 "09": { "id": "v09", "name": "09", "tip": "resevalni", "ns": "redna", "sede": 4, "leze": 0, "utila": 1, "skupaj": 4, "sedeMax": 4, "lezeMax": 0, "utilaMax": 1, "skupajMax": 4, "aktiv": true },
 "15": { "id": "v15", "name": "15", "tip": "resevalni", "ns": "oboje", "sede": 2, "leze": 1, "utila": 2, "skupaj": 4, "sedeMax": 3, "lezeMax": 1, "utilaMax": 2, "skupajMax": 4, "aktiv": true },
 "07": { "id": "v07", "name": "07", "tip": "transportni", "ns": "redna", "sede": 6, "leze": 0, "utila": 0, "skupaj": 6, "sedeMax": 6, "lezeMax": 0, "utilaMax": 0, "skupajMax": 6, "aktiv": true } };
/* Postavi dan v naloženo aplikacijo (ev = vm.runInContext). Brez cestnih podatkov (ocena), samodejni način. */
function setup(ev, day, set){
  ev(`(function(day, VEH, SET){
    S.settings.routing = { on:false, factor:1 }; S.vehicles = day.veh.map(k => Object.assign({}, VEH[k], (day.ov || {})[k])); S.settings.window = 90; S.settings.nnMaxKm = 60;
    S.duty[day.date] = day.duty.map((d, i) => ({ id:'d' + i, staffId:'', name:d[0], team:d[1] === 'NN' ? 'NN' : 'redna', role:d[2], from:'', to:'', ot:0, vehicleId:'' }));
    S.dayRules[day.date] = { mode:'samodejno', split:!!day.split }; Object.assign(S.settings, SET || {});
    const a = ensureDay(day.date); day.rides.forEach((r, i) => { while (a.length <= i) a.push(blankRide()); const o = Object.assign({}, r); delete o.row; Object.assign(a[i], blankRide(), o, { id:'r' + (i + 1) }); }); rev++; PLAN_CACHE.clear(); })(${JSON.stringify({ date:day.date, rides:day.rides, veh:day.veh, ov:day.vehOv, split:day.split, duty:day.duty })}, ${JSON.stringify(VEH)}, ${JSON.stringify(set || {})})`);
}
/* Ujemanje z dispečerjem: delež parov prevozov, ki so v razporedu in v resnici v istem (oziroma različnem) vozilu. plan = { 'številka polja': 'vozilo' } */
function agreement(day, plan){
  const realOf = {}; for (const [v, rows] of Object.entries(day.real)) rows.forEach(rw => day.rides.forEach((r, i) => { if (r.row === rw) realOf[i + 1] = v; }));
  const act = day.rides.map((r, i) => ({ nr:i + 1, row:r.row })).filter((r, i) => !day.rides[i].odpovedano);
  let pairs = 0, ok = 0;
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++){
    const a = act[i], b = act[j], sp = plan[a.nr] && plan[a.nr] === plan[b.nr], sr = realOf[a.nr] && realOf[a.nr] === realOf[b.nr];
    pairs++; if (!!sp === !!sr) ok++;
  }
  return { ok, pairs, share:ok / pairs };
}
/* Pripne prevoze na vozila, ki jih je v knjigo vpisal dispečer (polje real), da se njegov razpored oceni z isto oceno kot razpored aplikacije. */
function pinReal(ev, day){
  const m = {}; for (const [v, rows] of Object.entries(day.real)) rows.forEach(rw => day.rides.forEach((r, i) => { if (r.row === rw) m[i] = v; }));
  ev(`(function(m){ const a = ensureDay('${day.date}'); a.forEach((r, i) => { if (m[i]) r.pin = 'v' + m[i]; }); rev++; PLAN_CACHE.clear(); })(${JSON.stringify(m)})`);
}
/* Ocena razporeda: km, prevozi z zamudo, minute zamude, nerazporejeni prevozi in skupna ocena optimizatorja (manj = bolje). */
function planStats(ev, date){
  return JSON.parse(ev(`JSON.stringify((() => { const p = computePlan('${date}'); return { km:Math.round(p.totals.km), late:p.totals.late, lateMin:Math.round(p.totals.lateMin), un:p.unassigned.length, obj:Math.round(planObjective(p)) }; })())`));
}
module.exports = { DAYS:{ 5:DAY5, 6:DAY6, 9:DAY9, 10:DAY10, 11:DAY11, '7.10':D07, '8.10':D08, '12.11':D12, '20.10':D20, '22.10':D22 }, VEH, setup, agreement, pinReal, planStats };
