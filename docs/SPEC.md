# Specifikacija

## Korisnici i uloge

- **Vlasnik ugovora**: jedina adresa koja smije izdavati DOLD kredite i dodjeljivati/obnavljati ulogu Izdavatelj. Vlasnik je ujedno administrator ugovora; ne postoji zasebna uloga administratora. Vlasnik ne može izdavati kredite na vlastitu adresu i može registrirati dokument samo ako mu je dodijeljena uloga Izdavatelj.
- **Izdavatelj**: adresa kojoj je vlasnik dodijelio ulogu s vremenskim trajanjem. Vlasnik zadaje trajanje pri objavi ugovora; produkcijsko trajanje je 7 776 000 sekundi (90 dana), a testno 120 sekundi. Uloga se može obnoviti u bilo kojem trenutku, a novi rok računa se od trenutka obnove. Rano uklanjanje uloge nije moguće. Nakon isteka izdavatelj ne može registrirati dokumente, ali mu krediti ostaju i ponovno su raspoloživi nakon obnove. Istek uloge ne utječe na postojeće dokumente ni na njihovo potpisivanje ili poništavanje.
- **Potpisnik**: adresa navedena na popisu potpisnika određenog dokumenta. Potpisuje ili odbija dokument vlastitim novčanikom; može poduzeti najviše jednu od tih radnji po dokumentu.
- **Pozivatelj javnih funkcija**: svatko može besplatno, bez transakcije, čitati podatke dokumenta.

## Funkcije ugovora

### ERC-20 token zajednice

- Naziv: **DoliDoc**; oznaka: **DOLD**; decimale: **18**.
- Ukupna količina nema gornje granice. Sustav je namijenjen dugoročnoj upotrebi u više tvrtki. Krediti se zaključavaju pri registraciji, a spaljuju kad dokument bude potpisan; izdavanje je ograničeno na vlasnika i najviše 500 po transakciji.
- Samo vlasnik izdaje tokene. Izdavanje po transakciji mora biti najmanje 1 i najviše 500 tokena. Vlasnik ne smije izdati tokene na vlastitu adresu.
- Krediti nisu prenosivi. `transfer` i `transferFrom` moraju pasti s porukom **"Krediti nisu prenosivi"**.
- Korisnici nemaju javnu funkciju za spaljivanje kredita.
- Pri uspješnoj registraciji dokumenta izdavatelju se zaključava 1 kredit. Zaključani kredit se spaljuje kada posljednji potpisnik potpiše dokument. Ako dokument bude odbijen, poništen ili istekne, zaključani kredit se otključava bez spaljivanja.
- `balanceOf` prikazuje sve kredite na adresi; `slobodniKrediti` prikazuje kredite koji nisu zaključani.
- Vlasnik može prenijeti vlasništvo na drugu adresu putem `transferOwnership`. `renounceOwnership` nije dopušten.

### Uloga Izdavatelj

- Vlasnik dodjeljuje i obnavlja ulogu Izdavatelj.
- Uloga traje zadani broj sekundi od dodjele/obnove. U produkciji se postavlja na 7 776 000 sekundi, a za testiranje na 120 sekundi.
- Nakon isteka adresa ne može registrirati nove dokumente. Krediti ostaju na adresi; nakon obnove uloge mogu se ponovno koristiti.
- Rano uklanjanje uloge nije moguće.

### Dokumenti

- Registraciju može izvršiti samo adresa s dodijeljenom i neisteklom ulogom Izdavatelj te barem jednim slobodnim kreditom.
- Izdavatelj pri registraciji zadaje hash SHA-256 sadržaja dokumenta, od 1 do 10 različitih adresa potpisnika, trajanje roka u sekundama te neobavezni `prethodnaVerzija` (0 ako je nema).
- Popis potpisnika ne smije sadržavati nultu adresu i mora uključivati barem jednog potpisnika koji nije izdavatelj. Izdavatelj ne smije biti jedini potpisnik.
- Rok je najmanje 60 sekundi, najviše 1 209 600 sekundi (14 dana) i počinje u trenutku registracije.
- Prethodna verzija, ako je navedena, mora postojati i pripadati istom izdavatelju. Nova verzija ne mijenja ai status prethodne verzije; ako prethodna verzija još čeka potpise, izdavatelj poništava je zasebno. Oznaka verzije nalazi se i u samom dokumentu.
- Uspješna registracija zaključava 1 slobodan kredit izdavatelja.
- Hash se može ponovno registrirati ako prethodni dokument s tim hashom ima status Odbijen, Ponisten ili Istekao. Ako prethodni dokument čeka potpise, registracija pada s **"Dokument vec postoji"**; ako je potpisan, pada s **"Dokument je vec potpisan"**.
- Potpisnici potpisuju bilo kojim redoslijedom. Popis potpisnika nakon registracije nije promjenjiv. Za promjenu popisa izdavatelj poništava dokument i registrira ga ponovno.
- Samo adresa s popisa potpisnika može potpisati ili odbiti dokument; svaka adresa može poduzeti tu radnju samo jednom. Potpisivanje i odbijanje mogu se izvršiti dok je dokument u statusu CekaPotpise i rok nije istekao.
- Adresa koja nije potpisnik dobiva poruku **"Nisi potpisnik ovog dokumenta"**. Potpisnik koji je već potpisao ili odbio dobiva poruku **"Vec si potpisao"**. Ista pravila vrijede za odbijanje.
- Potpisnik koji još nije potpisao može odbiti dokument. Odbijanje ga trajno prebacuje u status Odbijen; prethodni potpisi ostaju zabilježeni, ali nemaju učinka. Zaključani kredit izdavatelja se otključava. Razlog odbijanja ne pohranjuje se na lanac; emitira se događaj `DokumentOdbijen`.
- Dokument je Potpisan odmah kad ga potpiše posljednji potpisnik. U istoj transakciji spaljuje se zaključani kredit, postavlja se vrijeme završetka i emitira događaj `DokumentPotpisan`. Potpis je valjan ako je dan najkasnije u trenutku isteka roka.
- Nakon isteka roka dokument se više ne može potpisati ni odbiti. Pokušaj pada s **"Rok je istekao, zatrazi novi dokument od izdavatelja"**. Bilo koja adresa može pozvati `oslobodiIstekli`; dokument prelazi u status Istekao, a zaključani kredit se otključava. Izdavatelj tada može ponovno registrirati isti ili izmijenjeni dokument.
- Samo izdavatelj dokumenta može ga poništiti dok dokument čeka potpise i rok nije istekao, uključujući slučaj kada su neki potpisnici već potpisali. Istek uloge izdavatelja ne sprječava poništavanje. Poništavanjem dokument prelazi u status Ponisten, zaključani kredit se otključava i emitira se događaj `DokumentPonisten`. Prethodni potpisi ostaju zabilježeni, ali nemaju učinka.
- Pokušaj poništavanja od strane neizdavatelja pada s **"Nisi izdavatelj ovog dokumenta"**. Dokument koji je potpisan pada s **"Dokument je vec potpisan"**; dokument odbijen, poništen ili istekao pada s **"Dokument vise nije aktivan"**. Ako je rok prošao, a dokument još nije označen kao istekao, pokušaj pada s **"Rok je istekao, koristi oslobodiIstekli"**.
- Sadržaj dokumenta se ne mijenja nakon registracije. Izmijenjeni sadržaj ima novi hash i registrira se kao novi dokument; pri registraciji se može povezati s prethodnom verzijom.

### Podaci na lancu i provjera

Dokument sadrži: `id`, hash SHA-256, adresu izdavatelja, popis adresa potpisnika, oznaku je li svaki potpisnik potpisao, `brojPotpisa`, rok, status (`CekaPotpise`, `Potpisan`, `Odbijen`, `Ponisten`, `Istekao`), `prethodnaVerzija` (0 ako nema), `vrijemeRegistracije` i `vrijemeZavrsetka`. Vrijeme svakog potpisa bilježi se događajem `Potpisano`.

Svatko može čitati podatke bez transakcije i troška. Dokument se pronalazi po id ili po hashu; pretraga po hashu vraća zadnji dokument s tim hashom. Čitanje vraća hash, izdavatelja, potpisnike i njihove oznake potpisa, broj potpisa od ukupnog broja potpisnika, status, vrijeme registracije, rok i vrijeme završetka. Ako je rok prošao, a dokument još nije označen kao istekao, provjera vraća status Istekao.

### Transakcije i ključ vlasnika

- Vlasnik, izdavatelj i potpisnik šalju transakcije sa svojih novčanika i sami plaćaju gas. Ugovor ovlasti provjerava prema adresi pošiljatelja preko `_msgSender()`.
- Meta-transakcije i plaćanje gasa preko Dolibarr-poslužitelja (ERC-2771/EIP-712) izvan su opsega.
- Ako vlasnik izgubi ključ, objavljuje se novi ugovor. Novi vlasnik izdaje svakom izdavatelju iznos jednak slobodnom saldu na starom ugovoru (adrese i stanja čitaju se iz Dolibarra i s lanca) te ponovno dodjeljuje ulogu. Dokumenti započeti na starom ugovoru dovršavaju se na njemu; Dolibarr za svaki dokument pamti adresu ugovora na kojem je registriran.
- Ako je ključ ukraden, a ne izgubljen, preneseni saldo temelji se na stanju prije prve neovlaštene transakcije.

## Tko smije što

| Radnja | Tko |
|---|---|
| Izdavati DOLD | Vlasnik ugovora; 1–500 po transakciji; ne na vlastitu adresu |
| Dodijeliti ili obnoviti ulogu Izdavatelj | Vlasnik ugovora |
| Prenijeti vlasništvo | Trenutni vlasnik putem `transferOwnership`; odricanje nije dopušteno |
| Prenijeti tokene putem `transfer` ili `transferFrom` | Nitko; prijenos nije dopušten |
| Spaliti kredit | Ugovor pri dovršetku dokumenta; korisničko spaljivanje nije dostupno |
| Registrirati dokument | Izdavatelj s aktivnom ulogom i barem jednim slobodnim kreditom |
| Odrediti potpisnike i rok | Izdavatelj pri registraciji |
| Potpisati ili odbiti | Samo potpisnik s popisa, jednom po dokumentu, prije isteka roka |
| Poništiti | Izdavatelj dokumenta dok čeka potpise i rok nije istekao |
| Označiti dokument isteklim i osloboditi kredit | Bilo koja adresa putem `oslobodiIstekli` nakon isteka roka |
| Provjeriti dokument | Svatko, besplatno putem funkcije čitanja |

## Što se NE sprema na blockchain

- Sadržaj dokumenta; na lancu se sprema samo SHA-256 hash sadržaja.
- Razlog odbijanja.
- Dokumenti i zapisi iz starih ugovora ne migriraju se automatski na novi ugovor pri gubitku vlasničkog ključa; dokumenti se dovršavaju na izvornom ugovoru.
- Dolibarr čuva popis adresa izdavatelja i podatke potrebne za ponovno izdavanje kredita pri objavi zamjenskog ugovora; iznosi se usklađuju sa slobodnim saldom na lancu.

## Kriteriji prihvaćanja

- **Zadano** da vlasnik izda između 1 i 500 DOLD tokena na adresu koja nije njegova, **Kada** transakcija izdavanja uspije, **Tada** se tokeni izdaju toj adresi.
- **Zadano** da izdavanje pokuša netko tko nije vlasnik, **Kada** pozove funkciju izdavanja, **Tada** transakcija se odbija.
- **Zadano** da vlasnik izda 0 ili više od 500 tokena u jednoj transakciji, **Kada** pokuša izdavanje, **Tada** transakcija se odbija.
- **Zadano** da vlasnik pokuša izdati tokene na vlastitu adresu, **Kada** pošalje transakciju izdavanja, **Tada** transakcija se odbija.
- **Zadano** da bilo koja adresa pokuša `transfer` ili `transferFrom`, **Kada** se pozove funkcija prijenosa, **Tada** transakcija pada s porukom **"Krediti nisu prenosivi"**.
- **Zadano** da korisnik pokuša spaliti tokene izravno, **Kada** pozove javnu funkciju spaljivanja, **Tada** takva javna funkcija nije dostupna.
- **Zadano** da vlasnik dodjeljuje ili obnavlja ulogu Izdavatelj, **Kada** transakcija uspije, **Tada** uloga vrijedi zadano trajanje od trenutka dodjele ili obnove.
- **Zadano** da je uloga Izdavatelj istekla, **Kada** adresa pokuša registrirati dokument, **Tada** registracija ne uspije; nakon obnove postojeći slobodni krediti ponovno su dostupni.
- **Zadano** da vlasnik pokuša rano ukloniti ulogu Izdavatelj, **Kada** zatraži uklanjanje prije isteka, **Tada** uklanjanje nije moguće.
- **Zadano** da vlasnik prenese vlasništvo drugoj adresi, **Kada** pozove `transferOwnership`, **Tada** nova adresa postane vlasnik.
- **Zadano** da vlasnik pokuša odustati od vlasništva, **Kada** pozove `renounceOwnership`, **Tada** odricanje nije dopušteno.
- **Zadano** da izdavatelj ima aktivnu ulogu, barem jedan slobodan kredit i valjane podatke dokumenta, **Kada** registrira dokument, **Tada** dokument se pohrani sa statusom `CekaPotpise` i 1 kredit se zaključa.
- **Zadano** da registrator nema aktivnu ulogu ili nema slobodan kredit, **Kada** pokuša registrirati dokument, **Tada** registracija ne uspije.
- **Zadano** da se registrira hash koji već pripada dokumentu u statusu `CekaPotpise`, **Kada** se pokuša registracija, **Tada** transakcija pada s porukom **"Dokument vec postoji"**.
- **Zadano** da se registrira hash koji već pripada dokumentu u statusu `Potpisan`, **Kada** se pokuša registracija, **Tada** transakcija pada s porukom **"Dokument je vec potpisan"**.
- **Zadano** da postojeći dokument s istim hashom ima status `Odbijen`, `Ponisten` ili `Istekao`, **Kada** ga izdavatelj ponovno registrira valjano, **Tada** nova registracija uspije.
- **Zadano** da izdavatelj zada 1–10 različitih, nenultih potpisnika uključujući barem jednog koji nije izdavatelj te rok od 60 do 1 209 600 sekundi, **Kada** registrira dokument, **Tada** dokument se registrira s tim popisom i rokom.
- **Zadano** da popis potpisnika ima manje od 1 ili više od 10 adresa, ponovljenu ili nultu adresu, ili samo izdavatelja, **Kada** se pokuša registracija, **Tada** registracija ne uspije.
- **Zadano** da je navedena prethodna verzija koja ne postoji ili pripada drugom izdavatelju, **Kada** se pokuša registracija nove verzije, **Tada** registracija ne uspije.
- **Zadano** da je dokument u statusu `CekaPotpise` i potpisnik je na popisu, **Kada** potpisnik potpiše prije isteka roka, **Tada** njegov potpis i vrijeme potpisa se zabilježe.
- **Zadano** da potpisnik nije na popisu, **Kada** pokuša potpisati ili odbiti dokument, **Tada** transakcija pada s porukom **"Nisi potpisnik ovog dokumenta"**.
- **Zadano** da je potpisnik već potpisao ili odbio dokument, **Kada** pokuša ponovno potpisati ili odbiti, **Tada** transakcija pada s porukom **"Vec si potpisao"**.
- **Zadano** da potpisnik koji još nije potpisao odbije dokument dok je aktivan i prije isteka roka, **Kada** odbijanje uspije, **Tada** status postaje `Odbijen`, potpisi ostaju zabilježeni, razlog se ne sprema na lanac, emitira se `DokumentOdbijen` i zaključani kredit se otključava.
- **Zadano** da potpisnik pokuša potpisati ili odbiti nakon isteka roka, **Kada** pošalje transakciju, **Tada** transakcija pada s porukom **"Rok je istekao, zatrazi novi dokument od izdavatelja"**.
- **Zadano** da posljednji preostali potpisnik potpiše prije ili točno u trenutku isteka roka, **Kada** transakcija uspije, **Tada** status odmah postaje `Potpisan`, vrijeme završetka se bilježi, zaključani kredit se spaljuje i emitira se `DokumentPotpisan`.
- **Zadano** da je rok istekao, **Kada** bilo koja adresa pozove `oslobodiIstekli`, **Tada** status postaje `Istekao` i zaključani kredit se otključava.
- **Zadano** da izdavatelj dokumenta poništi dokument koji čeka potpise prije isteka roka, **Kada** transakcija uspije, **Tada** status postaje `Ponisten`, zaključani kredit se otključava i emitira se `DokumentPonisten`.
- **Zadano** da poništavanje pokuša adresa koja nije izdavatelj dokumenta, **Kada** pošalje transakciju, **Tada** transakcija pada s porukom **"Nisi izdavatelj ovog dokumenta"**.
- **Zadano** da se pokuša poništiti potpisan dokument, **Kada** se pošalje transakcija, **Tada** transakcija pada s porukom **"Dokument je vec potpisan"**.
- **Zadano** da se pokuša poništiti odbijen, poništen ili istekao dokument, **Kada** se pošalje transakcija, **Tada** transakcija pada s porukom **"Dokument vise nije aktivan"**.
- **Zadano** da je rok prošao, a dokument još nije označen kao istekao, **Kada** se pokuša poništenje, **Tada** transakcija pada s porukom **"Rok je istekao, koristi oslobodiIstekli"**.
- **Zadano** da bilo tko zatraži dokument po id ili hashu kroz funkciju čitanja, **Kada** funkcija čitanja bude pozvana, **Tada** se vrate dostupni podaci bez transakcije i bez troška; pretraga po hashu vrati zadnji dokument s tim hashom.
- **Zadano** da je rok prošao, a dokument nije označen kao istekao, **Kada** se status čita kroz funkciju provjere, **Tada** funkcija vrati status `Istekao`.
- **Zadano** da vlasnik, izdavatelj ili potpisnik poduzme radnju na lancu, **Kada** transakciju pošalje sa svog novčanika, **Tada** ovlasti se provjere prema adresi pošiljatelja, a pošiljatelj plaća gas.
