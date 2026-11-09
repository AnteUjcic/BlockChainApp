# Sesija: specifikacija Doli Smart Docs

> Transkript razgovora o poslovnim odlukama za Dolibarr 22.0.4 modul Doli smart docs i ERC-20 token zajednice. Sadržaj poruka prenesen je iz razgovora; pozivi alata nisu uključeni.

## Razgovor

### Korisnik

Ponašaj se kao poslovni analitičar za blockchain aplikacije. Gradim: modul za dolibarr 22.0.4 verziju koja ce sluzit za potpisivanje i izdavanje pametnih dokumenata.
Aplikacija ima token zajednice (ERC-20) i modul: Doli smart docs.
Postavljaj mi pitanja jedno po jedno dok ne dobiješ odgovor na svako pitanje
iz popisa odluka u nastavku. Ne predlaži funkcionalnosti koje nisam spomenuo; ako misliš
da nešto nedostaje, pitaj me.
Odluka | Pitanje
Naziv, oznaka, decimale | Kako se token zove i ima li decimale?
Izdavanje | Tko smije izdati tokene i koliko najviše odjednom?
Ukupna količina | Postoji li gornja granica ukupne količine? Ako ne postoji, zašto?
Prenosivost | Smiju li članovi slati tokene jedni drugima? Vrijedi li to i za transferFrom?
Trošenje | Mogu li se tokeni potrošiti ili spaliti? Tko to pokreće?
Administratori | Tko dodaje i uklanja administratore? Može li administrator ukloniti vlasnika?
Gubitak ključa | Što ako vlasnik izgubi pristup novčaniku?

Odluka | Pitanje | Primjer odgovora
Registracija | Tko smije registrirati dokument na lancu? | Korisnik s ulogom „Izdavatelj” koji ima barem 1 kredit
Sadržaj na lancu | Što točno ide na lanac? | Hash dokumenta, adresa izdavatelja, popis adresa potpisnika, rok i status
Duplikati | Može li se isti hash registrirati dvaput? | Ne, pada s "Dokument vec postoji"
Potpisnici | Tko određuje potpisnike i može li se popis mijenjati? | Izdavatelj ih određuje pri registraciji, a popis se poslije ne mijenja
Redoslijed | Potpisuje li se bilo kojim redom ili zadanim? | Bilo kojim redom
Potpisivanje | Tko smije potpisati? | Samo adresa s popisa, i to jednom; inače "Nisi potpisnik" ili "Vec si potpisao"
Odbijanje | Može li potpisnik odbiti potpis? | Da, nakon čega dokument prelazi u status „Odbijen”
Rok | Ima li potpisivanje rok i što se događa nakon isteka? | Da; poslije roka potpis pada s "Rok je istekao", a status je „Istekao”
Dovršetak | Kada je dokument potpisan? | Kad potpišu svi s popisa
Izmjena | Može li se dokument izmijeniti nakon prvog potpisa? | Ne. Nova verzija znači novi hash i novu registraciju s poveznicom na prethodnu
Opoziv | Tko može poništiti dokument i do kada? | Izdavatelj, samo dok nije potpuno potpisan
Provjera | Tko može provjeriti je li dokument potpisan? | Svatko, preko javne funkcije za čitanje, bez transakcije
Gas | Tko plaća transakcije? | Svaki korisnik svojim novčanikom, ili Dolibarr poslužitelj s jednom adresom (to je velika odluka, jer mijenja tko je msg.sender)

Kad završimo, popuni docs/SPEC.md prema predlošku u toj datoteci.
Kriterije prihvaćanja piši isključivo u obliku Zadano / Kada / Tada, s točnom porukom
greške za neuspješne slučajeve. Ne piši kod

### Asistent

Kako se zove ERC-20 token zajednice, koju oznaku (ticker) ima i koliko decimala koristi?

### Korisnik

Token zajednice: DoliDoc, ticker: DOLD, 18 decimala

### Asistent

Tko smije izdavati (mintati) tokene i koliko najviše tokena smije izdati u jednoj transakciji?

### Korisnik

Izdavanje: Samo vlasnik smije izdavati kredite, najviše 500 po transakciji (najmanje 1).
Obrazloženje: 15–20 dokumenata dnevno × 22 radna dana ≈ 440 mjesečno; vlasnik dopunjuje jednom mjesečno.

### Asistent

Postoji li gornja granica ukupne količine DOLD tokena? Ako ne postoji, zašto?

### Korisnik

Nema gornje granice. Obrazloženje: sustav se koristi dugoročno i za više tvrtki, a krediti se spaljuju pri svakoj registraciji dokumenta, pa količina u opticaju odgovara samo neiskorištenim kreditima. Zaštitu od prekomjernog izdavanja daju pravila izdavanja: samo vlasnik i najviše 500 po transakciji

### Asistent

Smiju li članovi slati DOLD tokene jedni drugima? Vrijedi li isto i za `transferFrom`?

### Korisnik

Prenosivost: Krediti nisu prenosivi. I transfer i transferFrom padaju s porukom "Krediti nisu prenosivi". Krediti nastaju samo izdavanjem (vlasnik), a nestaju samo trošenjem pri registraciji dokumenta. Obrazloženje: krediti služe isključivo za registraciju i potpisivanje dokumenata; prijenos bi omogućio preprodaju i zaobilaženje vlasnika.

Uloga izdavatelja: Vlasnik dodjeljuje i obnavlja ulogu izdavatelja. Uloga traje onoliko sekundi koliko je zadano pri objavi ugovora (u produkciji 90 dana = 7 776 000 s; za testiranje 120 s). Obnova je moguća u bilo kojem trenutku, a novi rok računa se od trenutka obnove. Nakon isteka adresa ne može registrirati dokumente; preostali krediti ostaju na adresi i ponovno se mogu koristiti nakon obnove. Istek ne utječe na već registrirane dokumente ni na njihovo potpisivanje. Rano uklanjanje nije moguće (vidi prihvaćeni rizik).

### Asistent

Mogu li se tokeni potrošiti ili spaliti? Tko pokreće trošenje ili spaljivanje?

### Korisnik

Trošenje: Krediti se troše isključivo kroz modul, spaljivanjem 1 kredita po dokumentu. Korisnici ne mogu sami spaliti kredite; ugovor nema javnu funkciju burn

Trošenje: Pri registraciji dokumenta izdavatelju se zaključava 1 kredit. Kad dokument potpiše posljednji potpisnik, zaključani kredit se spaljuje. Ako dokument bude odbijen, poništen ili istekne, kredit se otključava bez spaljivanja. Korisnici ne mogu sami spaliti kredite. balanceOf prikazuje sve kredite; slobodniKrediti prikazuje kredite koji nisu zaključani. Nakon isteka roka bilo tko može pozvati oslobodiIstekli za taj dokument.

### Asistent

Tko smije dodavati i uklanjati administratore? Može li administrator ukloniti vlasnika ugovora?

### Korisnik

Administratori: Ugovor nema zasebnu ulogu administratora. Vlasnik je ujedno administrator: jedna osoba po nodeu, odnosno jedan ugovor po tvrtki. Zato nitko ne dodaje ni uklanja administratore, a vlasnika ne može ukloniti nitko osim njega samog, prijenosom vlasništva (transferOwnership) na drugu adresu. Odricanje od vlasništva (renounceOwnership) nije dopušteno, jer bi ugovor ostao bez ikoga tko izdaje kredite i obnavlja uloge.

Vlasnik ne smije izdati kredite na vlastitu adresu. Dokument ne smije imati izdavatelja kao jedinog potpisnika; mora imati barem jednog potpisnika koji nije izdavatelj.

Obrazloženje: jedna osoba upravlja ugovorom svoje tvrtke, pa zasebna uloga administratora ne donosi ništa. Zabrane slanja samom sebi sprječavaju da vlasnik troši kredite koje sam izdaje i da nastanu „ugovori” bez druge strane, koji nemaju pravni učinak.

### Asistent

Što se događa ako vlasnik izgubi pristup novčaniku? Predviđate li oporavak ili promjenu vlasnika, jačinu ovlasti za oporavak i/ili novu objavu ugovora?

### Korisnik

Ako vlasnik izgubi ključ, objavljuje se novi ugovor. Novi vlasnik izdaje svakom izdavatelju onoliko kredita koliko je imao slobodnih kredita na starom ugovoru (popis adresa iz Dolibarra, stanja očitana s lanca) i ponovno mu dodjeljuje ulogu. Dokumenti započeti na starom ugovoru tamo se dovršavaju; Dolibarr za svaki dokument pamti adresu ugovora na kojem je registriran. Ako je ključ ukraden, a ne izgubljen, stanja se prenose prema stanju prije prve neovlaštene transakcije.

### Asistent

Tko smije registrirati dokument na lancu? Utječe li to, kako ste opisali, na to da adresi mora biti dodijeljena i neistekla uloga „Izdavatelj”, uz barem jedan slobodan kredit?

### Korisnik

Registracija dokumenta: Dokument smije registrirati samo adresa s dodijeljenom i neisteklom ulogom izdavatelja koja ima barem jedan slobodan kredit. Dokument mora imati barem jednog potpisnika koji nije izdavatelj, a isti hash ne smije biti već registriran. Pri uspješnoj registraciji izdavatelju se zaključava 1 kredit. Vlasnik ne može registrirati dokumente, osim ako mu je dodijeljena uloga izdavatelja.

### Asistent

Koji su točno podaci dokumenta pohranjeni na lancu? Navedite polja, primjerice hash, adresu izdavatelja, potpisnike, rok, status ili poveznicu na prethodnu verziju.

### Korisnik

Model podataka na lancu (dokument): id, hash (SHA-256 sadržaja), izdavatelj (adresa novčanika), potpisnici (adrese novčanika), oznaka je li svaki potpisnik potpisao, brojPotpisa, rok, status (CekaPotpise / Potpisan / Odbijen / Ponisten / Istekao), prethodnaVerzija (0 ako nema), vrijemeRegistracije, vrijemeZavrsetka. Vrijeme svakog potpisa bilježi se događajem Potpisano.

### Asistent

Može li se isti hash dokumenta registrirati više puta? Ako ne, koja je točna poruka greške pri pokušaju ponovne registracije?

### Korisnik

Ponovna registracija istog hasha: Dokument s hashom koji je već registriran može se ponovno registrirati samo ako je postojeći dokument s tim hashom odbijen, poništen ili istekao. Ako postojeći dokument čeka potpise, registracija pada s porukom "Dokument vec postoji"; ako je potpisan, pada s porukom "Dokument je vec potpisan". Izmijenjeni dokument ima novi hash i registrira se kao nova verzija, s poveznicom na prethodnu.

### Asistent

Tko određuje potpisnike pri registraciji i može li se njihov popis mijenjati nakon registracije, uključujući nakon prvog potpisa?

### Korisnik

Potpisnici: Popis potpisnika određuje izdavatelj pri registraciji dokumenta. Popis ima od 1 do 10 različitih adresa, ne smije sadržavati nultu adresu i mora uključivati barem jednog potpisnika koji nije izdavatelj. Nakon registracije popis se ne može mijenjati, ni prije ni nakon prvog potpisa. Za promjenu popisa izdavatelj poništava dokument i registrira ga ponovno s novim popisom.

Obrazloženje: svaki potpisnik potpisuje znajući tko još sudjeluje u dokumentu; promjena popisa nakon potpisa mijenjala bi dogovor bez pristanka onih koji su već potpisali.

### Asistent

Potpisuju li potpisnici bilo kojim redoslijedom ili moraju slijediti unaprijed zadani redoslijed?

### Korisnik

Redoslijed potpisivanja: Potpisnici potpisuju bilo kojim redoslijedom. Redoslijed adresa u popisu potpisnika nema značenja. Dokument je potpisan kad potpišu svi potpisnici s popisa.

### Asistent

Tko smije potpisati dokument? Koje su točne poruke greške za adresu koja nije na popisu potpisnika i za potpisnika koji je već potpisao?

### Korisnik

Potpisivanje: Dokument smiju potpisati samo adrese s popisa potpisnika tog dokumenta, i to svaka samo jednom. Potpisivanje je moguće dok dokument čeka potpise i dok rok nije istekao. Adresa koja nije na popisu dobiva poruku "Nisi potpisnik ovog dokumenta", a potpisnik koji je već potpisao poruku "Vec si potpisao". Ista pravila vrijede za odbijanje; potpisnik koji je već potpisao ne može naknadno odbiti dokument.

### Asistent

Može li potpisnik odbiti dokument? Ako može, kakav je ishod i koja je točna poruka za odbijanje koje nije dopušteno?

### Korisnik

Odbijanje: Potpisnik koji još nije potpisao može odbiti dokument dok dokument čeka potpise i dok rok nije istekao. Odbijanjem dokument trajno prelazi u status „Odbijen” i više se ne može potpisati; potpisi dani prije odbijanja ostaju zabilježeni, ali nemaju učinka. Izdavatelju se otključava zaključani kredit. Ugovor emitira događaj DokumentOdbijen, na temelju kojeg Dolibarr obavještava izdavatelja. Razlog odbijanja ne sprema se na lanac. Za nedopušteno odbijanje vrijede iste poruke kao za potpisivanje.

### Asistent

Ima li dokument rok za potpisivanje? Ako da, tko ga određuje, što se događa nakon isteka i koje su točne poruke greške za pokušaj potpisa ili odbijanja nakon roka?

### Korisnik

Rok za potpisivanje: Izdavatelj pri registraciji zadaje trajanje roka u sekundama, najmanje 60 sekundi i najviše 14 dana (1 209 600 s). Rok se računa od trenutka registracije. Nakon isteka roka dokument se više ne može potpisati ni odbiti; pokušaj pada s porukom "Rok je istekao, zatrazi novi dokument od izdavatelja". Nakon isteka bilo koja adresa može pozvati oslobodiIstekli, čime dokument prelazi u status Istekao i izdavatelju se otključava kredit. Izdavatelj zatim može ponovno registrirati isti ili izmijenjeni dokument.

Obrazloženje: 14 dana je dovoljno za uobičajene poslovne dokumente, a ograničava koliko dugo kredit može biti zaključan. Najmanje 60 s omogućuje testiranje isteka.

### Asistent

Kada se dokument smatra potpisanim: čim potpiše posljednji potpisnik s popisa, ili tek nakon neke dodatne radnje?

### Korisnik

Potpisan dokument: Dokument je potpisan u trenutku kad ga potpiše posljednji preostali potpisnik s popisa, bez ikakve dodatne radnje. U istoj transakciji dokument prelazi u status Potpisan, izdavatelju se spaljuje zaključani kredit, upisuje se vrijeme završetka i emitira se događaj DokumentPotpisan. Potpis je valjan ako je dan najkasnije u trenutku isteka roka. Potpisan dokument se više ne može poništiti, odbiti ni ponovno potpisati.

### Asistent

Može li se sadržaj dokumenta izmijeniti nakon registracije ili nakon prvog potpisa? Kako se povezuje nova verzija s prethodnom?

### Korisnik

Izmjene i verzije: Sadržaj registriranog dokumenta ne može se mijenjati. Izmijenjeni dokument registrira se kao novi dokument; izdavatelj pri registraciji može navesti id prethodne verzije (0 ako je nema). Prethodna verzija mora postojati i mora biti dokument istog izdavatelja. Registracija nove verzije ne mijenja status prethodne; ako prethodna još čeka potpise, izdavatelj je poništava zasebno. Oznaka verzije navodi se i u samom dokumentu.

### Asistent

Tko može poništiti dokument i do kojeg trenutka? Koje su točne poruke greške kad poništenje pokuša netko drugi ili kad dokument više nije poništiv?

### Korisnik

Poništavanje: Dokument može poništiti samo izdavatelj tog dokumenta, i to dok dokument čeka potpise i dok rok nije istekao, uključujući nakon što su neki potpisnici već potpisali. Istek uloge izdavatelja ne sprječava poništavanje. Poništavanjem dokument prelazi u status Ponisten, izdavatelju se otključava zaključani kredit, a ugovor emitira događaj DokumentPonisten. Već dani potpisi ostaju zabilježeni, ali nemaju učinka.

### Asistent

Koje su točne poruke greške kad poništenje pokuša adresa koja nije izdavatelj dokumenta, odnosno kad se pokuša poništiti dokument koji više ne čeka potpise ili čiji je rok istekao?

### Korisnik

Poruke pri poništavanju: Ako dokument pokuša poništiti adresa koja nije njegov izdavatelj, transakcija pada s porukom "Nisi izdavatelj ovog dokumenta". Ako je dokument već potpisan, pada s porukom "Dokument je vec potpisan"; ako je odbijen, poništen ili istekao, s porukom "Dokument vise nije aktivan". Ako je rok prošao, a dokument još nije označen kao istekao, pada s porukom "Rok je istekao, koristi oslobodiIstekli".

### Asistent

Tko može provjeriti je li dokument potpisan i kako? Je li provjera javna, bez transakcije, te koji su podaci dostupni za očitanje?

### Korisnik

Provjera dokumenta: Svatko može provjeriti dokument bez transakcije i bez troška, funkcijama za čitanje. Dokument se može pronaći po id ili po hashu sadržaja (vraća zadnji dokument s tim hashom). Dostupni podaci: hash, adresa izdavatelja, popis adresa potpisnika i je li svaki od njih potpisao, broj danih potpisa od ukupnog broja potpisnika, status, vrijeme registracije, rok i vrijeme završetka. Ako je rok prošao, a dokument još nije označen kao istekao, provjera vraća status Istekao.

### Asistent

Tko plaća transakcije na lancu: svaki korisnik svojim novčanikom, ili Dolibarr-poslužitelj preko jedne zajedničke adrese?

### Korisnik

Plaćanje transakcija: Svaki korisnik (vlasnik, izdavatelj, potpisnik) šalje transakcije sa svog novčanika i sam plaća gas. Ugovor ovlasti provjerava prema adresi pošiljatelja transakcije.

Obrazloženje: samo tako ugovor može sam provjeriti tko je registrirao, potpisao ili odbio dokument; transakcije s jedne zajedničke adrese poslužitelja ne bi razlikovale korisnike.Izvan opsega: plaćanje gasa preko Dolibarr poslužitelja (meta-transakcije, ERC-2771/EIP-712). Ugovor je napisan tako da ovlasti provjerava preko _msgSender(), kako bi se ta mogućnost mogla dodati bez promjene pravila ovlasti.

### Asistent

Popunio sam `docs/SPEC.md` prema predlošku. Uključio sam odluke o DOLD tokenu, ulogama, kreditima, tijeku dokumenata, rokovima, ovlastima i plaćanju gasa. Kriteriji prihvaćanja koriste oblik **Zadano / Kada / Tada**, a poznate poruke grešaka prenesene su točno.

Provjerio sam sadržaj datoteke nakon izmjena.

### Korisnik

ok, koja su dalje pitanja

### Asistent

Glavne odluke iz početnog popisa su odgovorene. Za potpuno provjerljive kriterije prihvaćanja još nedostaju točne poruke greške za neke neuspješne slučajeve:

1. Koje su poruke za neovlašteno izdavanje tokena, izdavanje izvan raspona 1–500 i izdavanje vlasniku?
2. Koje su poruke kad registracija pokuša s neaktivnom ulogom, bez slobodnog kredita ili s nevažećim popisom potpisnika?
3. Koje su poruke za rok izvan raspona 60 sekundi–14 dana i za nepostojeću ili tuđu prethodnu verziju?
4. Koja se poruka vraća pri potpisivanju ili odbijanju dokumenta koji više nije u statusu `CekaPotpise`, primjerice nakon poništenja ili odbijanja?

Možemo ih razriješiti jednu po jednu. Prvo pitanje: koje su točne poruke greške za neovlašteno izdavanje, količinu izvan raspona 1–500 i pokušaj vlasnika da izda tokene na vlastitu adresu?

### Korisnik

Poruke pri izdavanju: Ako kredite pokuša izdati adresa koja nije vlasnik, transakcija pada s porukom "Nisi vlasnik". Ako je iznos manji od 1 ili veći od 500, pada s porukom "Iznos mora biti od 1 do 500". Ako vlasnik pokuša izdati kredite na vlastitu adresu, pada s porukom "Ne mozes izdati sebi"

### Asistent

Koje su točne poruke greške pri registraciji dokumenta ako izdavatelj nema aktivnu ulogu, odnosno ako nema slobodan kredit?

### Korisnik

Poruke pri registraciji (uloga i krediti): Ako adresa nema ulogu izdavatelja, registracija pada s porukom "Nisi izdavatelj". Ako joj je uloga istekla, pada s porukom "Uloga izdavatelja je istekla". Ako izdavatelj ima valjanu ulogu, ali nema nijedan slobodan (nezaključan) kredit, pada s porukom "Nemas slobodnih kredita". U svim slučajevima dokument se ne registrira i nijedan kredit se ne zaključava.

### Asistent

Koje su točne poruke greške za nevažeći popis potpisnika: premalo ili previše adresa, ponovljena adresa, nulta adresa ili popis bez potpisnika koji nije izdavatelj?

### Korisnik

Poruke pri nevažećem popisu potpisnika: Ako je popis potpisnika prazan, registracija pada s porukom "Popis potpisnika je prazan"; ako ima više od 10 adresa, s porukom "Najvise 10 potpisnika". Ako popis sadrži nultu adresu, pada s porukom "Neispravna adresa potpisnika", a ako je ista adresa navedena više puta, s porukom "Potpisnik je naveden dvaput". Ako na popisu nema nijednog potpisnika osim izdavatelja, pada s porukom "Potreban je barem jedan drugi potpisnik". U svim slučajevima dokument se ne registrira i kredit se ne zaključava.

Obrazloženje granice: svaki potpisnik povećava cijenu registracije, a preduga lista mogla bi premašiti gas limit bloka, pa se registracija ne bi mogla izvršiti. Granica od 20 potpisnika pokriva najveće dokumente koje tvrtka potpisuje uz razumnu cijenu registracije.

### Asistent

Prije nastavka trebam razjasniti proturječnost: za više od 10 potpisnika naveli ste grešku **„Najvise 10 potpisnika”**, ali obrazloženje kaže da je granica 20. Koja je stvarna granica: 10 ili 20 potpisnika?

### Korisnik

10 potpisanika

### Asistent

Koje su točne poruke greške ako je rok pri registraciji kraći od 60 sekundi ili dulji od 1 209 600 sekundi?

### Korisnik

Poruke pri nevažećem roku: Ako je zadani rok kraći od 60 sekundi, registracija pada s porukom "Rok prekratak, dopusteno od 60 do 1209600 sekundi". Ako je dulji od 1 209 600 sekundi (14 dana), pada s porukom "Rok predug, dopusteno od 60 do 1209600 sekundi". Granice su uključive: rok od točno 60 i točno 1 209 600 sekundi je dopušten. Dokument se ne registrira i kredit se ne zaključava.

### Asistent

Koje su točne poruke greške ako `prethodnaVerzija` ne postoji ili pripada drugom izdavatelju?

### Korisnik

Poruke pri povezivanju verzija: Ako je prethodnaVerzija različita od 0, a dokument s tim id ne postoji, registracija pada s porukom "Prethodna verzija ne postoji". Ako dokument postoji, ali ga nije registrirao isti izdavatelj, pada s porukom "Prethodna verzija nije tvoja". Vrijednost 0 znači da dokument nema prethodnu verziju. Dokument se ne registrira i kredit se ne zaključava

### Asistent

Koje su točne poruke greške ako netko pokuša potpisati ili odbiti dokument koji je već **Potpisan**, **Odbijen** ili **Ponisten**? Za dokument nakon isteka roka već ste naveli poruku.

### Korisnik

stavi cijeli ovu sesiju u .md file

### Korisnik

Koja su jos pitanja?
