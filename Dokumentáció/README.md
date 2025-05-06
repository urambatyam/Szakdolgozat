# Felhasználói dokumentáció
## Belépés
![Hiba történt!](/Dokumentáció/képernyőképek/login.png "Belépés")  
Először minden felhsználó ezzel az oldallal találkozik. Itt lehet bejelentkezni a Athéna kód jelszó párossal. A jelszót és a belépési kódót majd ilyen emailben küldjük el Önnek.  
![Hiba történt!](/Dokumentáció/képernyőképek/regmail.png "Belépés")  
A felsó sáv a türkiszkék sáv a menü sáv. Belépés után itt jelenek meg a navigáló gombok amikkel az oldalak között lehet úgrálni a.(A menüsáv tartalma jogosultságtól függöen változhat)
Kismeéretü képernyök esetében a menü sáv balről nyiló behuzható menüvé válik amita hamburhe menü ikon ra katintva nyithat meg.  
![Hiba történt!](/Dokumentáció/képernyőképek/kiskep.png "Belépés")  
A nyelv váltás bejelentkezsé nélkül is elérthető választhat magyar(hu) és angol(en) között a menü sávban.  
![Hiba történt!](/Dokumentáció/képernyőképek/lang.png "Belépés") 
## Tanterv
Belépés után közvetelen tanterv oldara írányitjuk. Itt megnézheti a tanterveket és a felső meüvel (balról-jobbra haldva) szürhet tantervre specializációra kurzusra. Az utsó legördülő menüben a azt álithatja be hogy a táblázat milyen oszlopai jelenjenek meg.
Diák felhasználó esetén a tantervek között nem lehet választani. mindig a hozzá tartozó tanterv jellenik. 
A kiválaszottt tanterv egymásba ágyazott kártyákkal jelenik meg. A legkülső kártya tartalmaza az egész tantervet itt felül meg jelnik a tanterv neve és a benne foglalt spacializációk kártyái. Egy Specializáció kártyában szerepel a specializáció neve az hogy a teljesitéséhez összesen menyi kerediett kell teljseiteni és a hozzá tartozó kategóriák kártyái. Egy kategória kártyájában szerepel a kategória neve hogy maximum hány kredit tartozik hozzá és hogy ebőll menyit kell elérni a teljseítéshez, illetve a hozzá tartzó kurzusok táblázata amikből a szükséges kredit elérhető.
A kurzsuk táblázata 8 oszlopból áll:
- Név - Kurzus neve  
- ID - Kurzus azonósítója  
- Kredit - Kurzus kredit értéke
- Ajánlott félév - Amikor a kurzus felvétele ajánlott
- Tárgyfeleős - Annak a felhasználónak az Athéna kódja aki felelős a kurzusért.
- Szezon - A kurzus szezonja amikor elinditják a kurzust Őssz/Tavasz/Őssz-Tavasz  
- Felvétel - Erre a gombra katintva képesek a diákok felveni a kurzust. Csak azoknál akurzusoknűl jelenik meg amik a jellengi szezonban felvehetőek. Tanár és admin felhasználoknál midig üres mivel ök nem vehetnek fel kurzust.
- KurzusForum - erre hombra katintva átléphetünk a adott kurzus kurzusForumába ahol meg nézhetjük a kurzus adatait közelebbről.  
![Hiba történt!](/Dokumentáció/képernyőképek/curriculum.png "Tanterv")  
A diák felhasználoknál plus funkció hogy a tantervben megjelenitett kurzusok szin kódal jelzik hogy a diák felvete a kurzus(sárga) elvégezte(zöld) más esetben a kurzusok hátérszine fehér marad.
![Hiba történt!](/Dokumentáció/képernyőképek/curriculum2.png "Tanterv")  
## Profil
![Hiba történt!](/Dokumentáció/képernyőképek/profil.png "Profil")
A profil oldalon minden felhasználó megnézheti a következő adatait:
- `Név` - a felhasználó neve
- `Email` - a felhasználó email címe
- `Rang` - a felhaszná jogosultsági szintje
- `Athéna kód` - a felhasználó egyedi azonósitója
### A jelszó megváltoztatása  
A profiloldalon képesek vagyunk megváltoztatni a  jelszvunkat csak anyit kell tenünk hogy rákatintunk a `Jelszó megváltoztatása` nevü gombra. Ekkor meg fog jelleni egy felugró ablak ahol is meg kell adnuk a régi és új jelszavunkat majd az `ok` gombras katintva véglegesítjük a müveletet. Ha mégse akarunk változtani akkor a `Mégse` gombra katinva abba bezárhatjuk a felugró ablakot változtatás nélkül.
### A Email cím megváltoztatása  
A profiloldalon képesek vagyunk megváltoztatni az email címünket csak anyit kell tenünk hogy rákatintunk a `Email megváltoztatása` nevü gombra. Ekkor meg fog jelleni egy felugró ablak ahol meg kell adnuk a jelszavunkat a és az új email címünket majd az `ok` gombras katintva véglegesítjük a müveletet.Ha mégse akarunk változtani akkor a `Mégse` gombra katinva abba bezárhatjuk a felugró ablakot változtatás nélkül.
## Optimalizáció
Ezzen az oldalon vagyunk képesek optimalizált tanterv tervet generálni. Meg nyitáskor látunk a egy 7 menü pontot és egy gombot.
Baról jobbra haladva:
- `Tanterv` - egy legördülő menü amivel a tantervet választhatunk(diákok csak a saját tantervüket képesek választani)
- `Specializáció` - gy legördülő menü amivel a specializációt választhatunk.Legalább egyet választanuk kell az optimalizáláshoz.(A tnaterv kötelező specializációja mindig kiválasztásra kerül)
- `Negativ` - Bele katintva a tantervhez tartozó kurzusok közül egyet vagy akár többet is ki választhatunk. Azok kurzusok amiket kiválasztunk az ugyenevezet *negatív kurzusok* makiet az optimalizáláskor figyelem kívül hagyunk.  
- `Pozitív` - Bele katintva a tantervhez tartozó kurzusok közül egyet vagy akár többet is kiválaszthatunk. Azok kurzusok amiket kiválasztunk az ugyenevezet *pozitív kurzusok* makiet az optimalizáláskor miden képen hozzáadjuk a tervhez.
- `Kredit limit` - Ebbe az input mezőbe adhatjuk meg a hogy félévenként maximum hány kreditet akarsz felveni.(minimuma 1)
- `Algoritmus` - Ebben a menüpontban lehet kiválastani hogy melyik optimalizális algorimtussaé készitsuk el a tanterv tervet. *Elágazás és Korlátozás* vagy *Mohó* algorimussal.
- `Ajánlott félév` - Ezzel a checkboxxal álithatjuk be hogy az optimalizálás sorrán figyelembe vegyük-e a ajánlott féléveket vagy sem.
- `Tanterv optimalizációja` - A beálittot feltételek utná erre a gombra katintva kezdödik el az optimalizálás. Ha az optimalizáció nem ad eredményt azonnal ne essünk pánikba eltarhat egy ideig. Azonban 1 perc futás útán automatikusan leáll, ekkor és bármilyne más essetben amikor nem talál erdményt egy piros szinü hibaüzent jelenik meg a képernyőn. Sikkeres optimalizációnál megjelnik az optimalizált tanterv háló amit a letöltés gomra katintava letült hetünk png-ként és ábra amit specializációnként mutaja hogy az optimalizált terv hány krediet teljesit.
![Hiba történt!](/Dokumentáció/képernyőképek/opt.png "Optimalizáció")
![Hiba történt!](/Dokumentáció/képernyőképek/opt2.png "Optimalizáció")
![Hiba történt!](/Dokumentáció/képernyőképek/opt3.png "Optimalizáció")
## Regisztráció
Ezzen az oladalon lehet új felhasználót regisztrálni. Az új felhasználó hoz meg kell adni (fülüröl-lefelé):
- Név - felhasználó neve
- Email - felhasználó email címe
- Rang - felhasználó jogosultsági szintje
- tanterv - felhasználóhoz tartozó tanterv kivalasztása. Csak a diákhoz tartozik tanterv. Ha az új felhasználó nem diák ez az oprció nem jelenik meg.
A mezők kitöltése utána a `Regisztráció` gombra katintva hozhatja létre az admin felhasználó az új felhasználót.
![Hiba történt!](/Dokumentáció/képernyőképek/regisztracio.png "Regisztráció")
## Statisztikák
Ez az oldal csak a diák felhasználoknál jelenik meg. A felhasználóhoz tartozó statisztikákat mutaja meg. A lap alján a türkiszkék sávban van két fehér nyil ezek gomobént müködnke és velülk képes vagy a következő diagram típusara ugrik. összesen négy statisztika van Ekörehaladás, Tanulmányi általgm Lineáris regreszió,és Minden diák tanulmányi átlaga.
![Hiba történt!](/Dokumentáció/képernyőképek/stat1.png "Személyes Satisztiák")  
![Hiba történt!](/Dokumentáció/képernyőképek/stat2.png "Személyes Satisztiák")
![Hiba történt!](/Dokumentáció/képernyőképek/stat3.png "Személyes Satisztiák")
![Hiba történt!](/Dokumentáció/képernyőképek/stat4.png "Személyes Satisztiák")
## Tanterv készitő
Ez az oldat csak admin felhasználó ér el. Itt tusz léttehozni új tanterveket.Elsőnek egy táblázatot látsz amiben a tantervek vannak felserolva a következő oszlopkkal:
- Név - a tanterv neve
- Módosítás - erre a hombra katintava felület meg változik és képes vagy módsítani a tantervet
- Törlés - Ebben az oszlopban gombok vanak amikre katintva törlhetet a tnatervet
A táblázat alján jobboldat van egy plusz ikon erre katinva a felület meg változik. Ezzen az újfelülten kées vagy létrehozni új tanterveket.
![Hiba történt!](/Dokumentáció/képernyőképek/tankesz.png "Tanterv készitő")
### A tanterv módosító/létrehozó felület
Ezen  afelületen egy dinamikus ürlap van. amihez a balaul látható plusz gombokkal tudsz hozzáadni és ajoboldali minus jelekel tusz elveni elemeket.
Egy üres tantervnél csak a Tanterv neve nevü input mező jelenik meg ebben kell megadnod a tanterv nevét.
a plusz gombbra katinva tudsz új specializációkat hozzáadni.
A specilaizáció felüről lefelé haldva megadhatod a nevét beálthatod kötelezönek (cska egyet lehet köteleözönek beálitani) és hozzá adhat új kategóriákat.
A kategória szintén megadhatod a nevét hogy minumum hány kreditet kell teljesiteni hozzá ílletve egy legördülő menüvel hozzáadhat új kurzusakat.
A tanterv kialakitása után a `Mentés` gombbal tudod menteni az új tantervet vagy a módosítást. A `Mégse`gombbal elveted a változtatásokat.
![Hiba történt!](/Dokumentáció/képernyőképek/tankesz2.png "Tanterv készitő")
## Ellenőrző
Ez az oldal csak az diák felhasználoknál jelenik meg.
Az odlaon egy táblázatban fel van sorolva a diák minden jegye. A táblázat a következő oszlopkból áll:
- Kurzus neve - A Kurzus neve
- Osztályzat - a jegy ([1-5] vagy még nem teljesítet jegy esetében Ø)
- Tárgy leadás - Azoknál a kurzusoknál amit ebben a félévben vetél fel megjelenik egy gomb amire katinva leadhatod.
A táblázat felet van egy keresü mező amivel a kurzus névre kereshetsz rá, és egy legördülő menü amivel félévekre.
A táblázat korlátozot menyi ségü jegyet jelenit meg. Azt hogy elemet jelenitsen meg a táblázat jobb alsó sarkában lévő legördülő menüvel állthatod és nyilakkal lapozhatsz a következő  jegyekhez.
![Hiba történt!](/Dokumentáció/képernyőképek/conroller.png "Ellenőrző")
## JegyBeírás
Ez az oldal csak az diák felhasználoknál nem jelenik meg. Azoldal a menüsávból nem érhető el csak kurzusforum oldalról kurzusokat felsorló táblázaténak az ellenörző gombjával. Az oldanon felvan sorolv az összes a kiválaszott kurzushoz tartzó jegy. A tábláaztban szerepel a diák Athéna kódja a hozzátartzó jegy(hanincs jegy akkor Ø) és egy lefelé mutató nyil.
![Hiba történt!](/Dokumentáció/képernyőképek/jegy.png "JegyBeírás")
A nyilra katintva egy új sorjelenikmeg ahol az osztályzat átálitható.
![Hiba történt!](/Dokumentáció/képernyőképek/jegy2.png "JegyBeírás")
A táblázat felet van egy keresü mező amivel a diák Ahéna kódjára kereshetsz rá, és egy legördülő menü amivel félévekre.
A táblázat korlátozot menyi ségü jegyet jelenit meg. Azt hogy elemet jelenitsen meg a táblázat jobb alsó sarkában lévő legördülő menüvel állthatod és nyilakkal lapozhatsz a következő  jegyekhez.
## Kurzus késizitő
Ez az oldal csak az diák felhasználoknál nem jelenik meg. Az oldal a menüsávból a Kurzusforum menüpontra katinva érhető el. Egy táblázatban kilistáza a  kurzust. Admin esetében ez az összes kurzust jelenti tanár esetében csak azokat aminek ő a tárgyfelelőse. A táblázat feleti kereső mezőben a kurzus nevére kereshetünkrá. A kuzusokat listázó táblázat a következő oszlopokból áll:
- Kurzus neve - A kurzus neve
- Módsoítás - A felület megváltozik a módosítás/létrehozés felületre
- Törlés - tröli a kurzust
- Ellenörző - A jegybeírás felületre visz.
- Forum - A kurzusforumra visz ahol a kurzus adatait nézhetőek meg.
![Hiba történt!](/Dokumentáció/képernyőképek/kurkesz.png "Kurzus késizitő")
### A kurzus módosító/létrehozó felület
Ezen a felületen a kurzus nevét keredit értékét ajánlott félévét tárgyfelelősét és előkövetelményeit álithatod be a `Mentés` gombal véglegesíthated míg a `Mégse` gombbal elvetheted a változtatásokat.
![Hiba történt!](/Dokumentáció/képernyőképek/kurkesz.png "Kurzus késizitő")
## Kurzusforum
Az oldal baloldalán (Kisképenyöknél a tején) van egy álandó menü ami a kurzus általános adatai melet lehetövéteszi hogy a Forum-ról át lépj a Kurzus statisztikákihoz és tárgytemaitkáihoz a menüben lévő gombokal:
- `Statisztikák` - kurzus statisztikák megjelnités
- `Forum` - A kurzus forum (alapértlemezet)
- `Tárgytematika` - A kurzus tárgytematikájának megjelenitése
### Forum
Ezen a felüten vagy képes a kurzus forumára üzeneteket posztolni az az alsó szöveg dobozba a "Szolj hozzá" szövegel tudod beleírni a véleményedet és a `Küldés` gombal elküldeni. Az üentek felte jelenek meg görkethető fromában.
![Hiba történt!](/Dokumentáció/képernyőképek/forum.png "forum")
### statisztikák
Itt megjelenek a kurzus staitistikáik. Az lasó türkiszkéksávban tusz lapozni a közötük. Ha nicns elég adata kurzus staisztikáinak megjelenitésére akkor a "nincs adat" jelnik meg.
![Hiba történt!](/Dokumentáció/képernyőképek/kurstat.png "Kurzus statisztikák")
### Tárgytematika
Itjelenik meg a tárgytematika ami alapértemezeten üres. Belehet írni és a `Mentés` gombbal frisiteni.
![Hiba történt!](/Dokumentáció/képernyőképek/targy.png "Tárgytematika")