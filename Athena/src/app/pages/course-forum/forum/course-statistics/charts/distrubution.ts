import Plotly, { Data, Layout } from 'plotly.js-dist-min';

// Interfész a backend válaszhoz
interface DistributionResponse {
  frequency: { [key: string]: number }; // Jegyek és darabszámuk (kulcs string!)
  mean: number;                         // Átlag
  std: number;                          // Szórás (standard deviation)
  totalCount: number;                   // Összes jegy száma
}

export function creatD(response?: DistributionResponse) {

    // Ellenőrizzük, hogy van-e érvényes válasz és adatok
    if (!response || !response.frequency || Object.keys(response.frequency).length === 0 || response.totalCount <= 0) {
        // Ha nincs adat, üres diagramot vagy hibaüzenetet jelenítünk meg
        const layout: Partial<Layout> = {
            title: { text: 'Nincsenek adatok a jegyek eloszlásához' },
            xaxis: { title: 'Jegy', range: [0, 6], dtick: 1 },
            yaxis: { title: 'Darabszám', rangemode: 'tozero' }
        };
        const data: Data[] = []; // Üres adat
        const plotElement = document.getElementById('distrubution');
        if (plotElement) {
            Plotly.newPlot(plotElement, data, layout);
        } else {
            console.error("A 'distrubution' ID-val rendelkező elem nem található.");
        }
        return; // Kilépünk a függvényből
    }

    // --- Adatok kinyerése a backend válaszból ---

    // 1. Hisztogram adatai (frequency objektumból)
    const gradeKeys = Object.keys(response.frequency); // Jegyek stringként: ["3", "4", "1", "5", "2"]
    // Fontos: Rendezzük a jegyeket numerikusan!
    const sortedGradeKeys = gradeKeys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)); // ["1", "2", "3", "4", "5"]

    const grades: number[] = sortedGradeKeys.map(key => parseInt(key, 10)); // [1, 2, 3, 4, 5]
    const counts: number[] = sortedGradeKeys.map(key => response.frequency[key]); // [3, 2, 5, 8, 2] (a rendezett kulcsok alapján)

    // 2. Statisztikák a normál eloszláshoz
    const mean = response.mean;
    const stdDev = response.std; // Figyelj a névre: 'std' a backend válaszban
    const totalCount = response.totalCount;

    console.log(`Backend adatok - Átlag: ${mean.toFixed(2)}, Szórás: ${stdDev.toFixed(2)}, Darabszám: ${totalCount}`);

    // --- Normál eloszlás görbék számítása ---

    // 1. Görbe: Valós adatok alapján (backend statisztikákkal)
    const normalDistributionX: number[] = [];
    const normalDistributionData: number[] = [];

    // 2. Görbe: Rögzített paraméterekkel (ideális normál eloszlás)
    const fixedMu = 3; // Rögzített átlag
    const fixedSigma = 1; // Rögzített szórás
    const idealNormalX: number[] = [];
    const idealNormalData: number[] = [];

    // X tengely pontjainak generálása a görbékhez
    const step = 0.1;
    const minX = 0; // Kezdőpont
    const maxX = 6; // Végpont (jegyek 1-5 skáláján túl)
    for (let x = minX; x <= maxX; x += step) {
        normalDistributionX.push(x);
        idealNormalX.push(x);

        // Valós adatokon alapuló normál eloszlás Y értékének számítása
        // Csak akkor számolunk, ha a szórás pozitív (nullával nem lehet osztani)
        let y1 = 0;
        if (stdDev > 0) {
            y1 = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
                 Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        }
        // Skálázás az oszlopdiagramhoz (hisztogram bin szélessége itt implicit 1)
        const scaledY1 = y1 * totalCount * 1; // A bin szélesség (1) szorzója elhagyható
        normalDistributionData.push(scaledY1);

        // Ideális (rögzített) normál eloszlás Y értékének számítása
        const y2 = (1 / (fixedSigma * Math.sqrt(2 * Math.PI))) *
                   Math.exp(-0.5 * Math.pow((x - fixedMu) / fixedSigma, 2));
        // Skálázás az oszlopdiagramhoz
        const scaledY2 = y2 * totalCount * 1; // A bin szélesség (1) szorzója elhagyható
        idealNormalData.push(scaledY2);
    }

    // --- Plotly Trace-ek összeállítása ---

    // Trace 1: Hisztogram (Oszlopdiagram)
    const trace1: Data = {
      x: grades, // A rendezett jegyek (számok)
      y: counts, // A hozzájuk tartozó darabszámok
      type: 'bar',
      name: 'Valós eloszlás',
      marker: {
        color: 'blue', // Vagy válassz dinamikus színt
        line: {
          color: 'rgb(8,48,107)',
          width: 1.5,
        },
      },
      // hovertemplate: 'Jegy: %{x}<br>Darabszám: %{y}<extra></extra>' // Opcionális tooltip testreszabás
    };

    // Trace 2: Normál eloszlás görbe (valós adatokból)
    const trace2: Data = {
      x: normalDistributionX,
      y: normalDistributionData,
      type: 'scatter',
      mode: 'lines',
      name: `Normál eloszlás (μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(2)})`, // Dinamikus név
      line: {
        color: 'red',
        width: 2,
      },
      hoverinfo: 'skip' // Ne jelenjen meg tooltip a görbén (opcionális)
    };

    // Trace 3: Ideális normál eloszlás görbe
    const trace3: Data = {
      x: idealNormalX,
      y: idealNormalData,
      type: 'scatter',
      mode: 'lines',
      name: `Ideális normál eloszlás (μ=${fixedMu}, σ=${fixedSigma})`, // Dinamikus név
      line: {
        color: 'green',
        width: 2,
        // dash: 'dash', // Opcionális: szaggatott vonal
      },
      hoverinfo: 'skip' // Ne jelenjen meg tooltip a görbén (opcionális)
    };

    // --- Layout összeállítása ---
    const layout: Partial<Layout> = { // Partial<Layout> használata
      title: { text: 'Jegyek Eloszlása és Normál Eloszlás Görbék' },
      xaxis: {
        title: 'Jegy',
        range: [minX - 0.5, maxX + 0.5], // Kicsit szélesebb tartomány a szebb megjelenésért
        dtick: 1,
      },
      yaxis: {
        title: 'Darabszám',
        rangemode: 'tozero'
      },
      bargap: 0.1, // Kis rés az oszlopok között (opcionális)
      // barmode: 'overlay', // Overlay helyett hagyd az alapértelmezett 'group'-ot, ha nem akarod, hogy a görbék elfedjék az oszlopokat
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      }
    };

    // --- Diagram kirajzolása ---
    const plotElement = document.getElementById('distrubution');
    if (plotElement) {
        Plotly.newPlot(plotElement, [trace1, trace2, trace3], layout); // Adatok tömbként átadva
    } else {
        console.error("A 'distrubution' ID-val rendelkező elem nem található.");
    }
}
