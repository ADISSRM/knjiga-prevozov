// Lokalni zanesljivi seznami za Občino Brežice (deluje vedno in povsod)
export const BREZICE_LOKACIJE = [
  "Aškerčeva ulica, Brežice", "Bizeljska cesta, Brežice", "Bohoričeva ulica, Brežice",
  "Cesta 4. julija, Brežice", "Cesta bratov Milavec, Brežice", "Cesta prvih borcev, Brežice",
  "Černelčeva cesta, Brežice", "Finžgarjeva ulica, Brežice", "Gregorčičeva ulica, Brežice",
  "Gubčeva ulica, Brežice", "Jurčičeva ulica, Brežice", "Kajuha ulica, Brežice",
  "Kettejeva ulica, Brežice", "Kidričeva ulica, Brežice", "Kovinarska ulica, Brežice",
  "Levstikova ulica, Brežice", "Ljubljanska cesta, Brežice", "Maistrova ulica, Brežice",
  "Mladinska ulica, Brežice", "Obšolska ulica, Brežice", "Opekarniška ulica, Brežice",
  "Prešernova cesta, Brežice", "Slomškova ulica, Brežice", "Slovenska ulica, Brežice",
  "Stara pot, Brežice", "Šolska ulica, Brežice", "Tomsičeva ulica, Brežice",
  "Tovarniška cesta, Brežice", "Trg izgnancev, Brežice", "Trg 7. oktobra, Brežice",
  "Trnje, Brežice", "Ulica 11. novembra, Brežice", "Ulica stare pravde, Brežice",
  "Vrtna ulica, Brežice", "Župančičeva ulica, Brežice",
  "Topliška cesta, Čatež ob Savi", "Ulica pod gradom, Čatež ob Savi", "Dvorce, Čatež ob Savi", "Prilipe, Čatež ob Savi",
  "Glavna ulica, Dobova", "Kapeška cesta, Dobova", "Mihalska cesta, Dobova", "Ulica 15. oktobra, Dobova", "Ulica Franca Valanta, Dobova",
  "Artiče, Artiče", "Arnovo selo, Artiče", "Dečno selo, Artiče", "Glogov Brod, Artiče", "Spodnja Štajerska, Artiče",
  "Bizeljsko, Bizeljsko", "Bizeljska Vas, Bizeljsko", "Drenovec pri Bukovju, Bizeljsko", "Orešje, Bizeljsko", "Stara vas - Bizeljsko, Bizeljsko",
  "Boršt, Cerklje ob Krki", "Cerklje ob Krki, Cerklje ob Krki", "Gazice, Cerklje ob Krki", "Skradno, Cerklje ob Krki", "Zasap, Cerklje ob Krki",
  "Globoko, Globoko", "Mali Vrh, Globoko", "Piršenbreg, Globoko",
  "Jereslavec, Kapele", "Kapele, Kapele", "Podvinje, Kapele",
  "Pavlova vas, Pišece", "Pišece, Pišece",
  "Bukošek, Brežice", "Cundrovec, Brežice", "Krška vas, Krška vas", "Mostec, Dobova",
  "Rigonce, Dobova", "Sela pri Dobovi, Dobova", "Velike Malence, Krška vas",
  "Veliki Obrež, Dobova", "Mali Obrež, Dobova", "Zakot, Brežice"
];

export function setupDynamicOSMAutocomplete(inputId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  let datalist = document.getElementById(`${inputId}-osm-list`);
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = `${inputId}-osm-list`;
    document.body.appendChild(datalist);
  }
  
  datalist.innerHTML = BREZICE_LOKACIJE.map(naslov => `<option value="${naslov}">`).join('');
  inputEl.setAttribute('list', datalist.id);
}
