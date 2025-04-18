import Plotly, { Data, Layout } from 'plotly.js-dist-min';

// Interfész a válasz típusának definiálásához (ajánlott)
interface LinearRegressionResponse {
  m: number; // Meredekség (slope)
  b: number; // Tengelymetszet (intercept)
  pairs: [number, number][]; // Adatpárok [x, y] formátumban
  label: string[]; // Címkék az x tengelyhez
}

// Segédfüggvény a félév nevének formázásához (opcionális, ha a backend label nem elég szép)
// Ha a backend által küldött "label" tömb már a kívánt formátumú ("2023/2024 Ősz"),
// akkor erre a függvényre nincs is szükség itt.
function formatSemesterAxisLabel(key: string): string {
  const parts = key.split('-'); // Feltételezzük, hogy a backend "YYYY-S" formátumot küld
  if (parts.length !== 2) return key;

  const year = parseInt(parts[0], 10);
  const seasonCode = parseInt(parts[1], 10); // 1 = Ősz, 0 = Tavasz

  if (isNaN(year) || isNaN(seasonCode)) return key;

  if (seasonCode === 1) {
    return `${year}/${year + 1} Ősz`;
  } else if (seasonCode === 0) {
    return `${year - 1}/${year} Tavasz`;
  } else {
    return key;
  }
}


export function createLR(response?: LinearRegressionResponse) {
    // Ellenőrizzük, hogy van-e válasz és elegendő adatpont a regresszióhoz
    // (Legalább 2 pont kell egy egyeneshez)
    if (!response || !response.pairs || response.pairs.length < 2) {
      const data: Data[] = [
        {
          x: [],
          y: [],
          mode: 'markers',
          type: 'scatter'
        }
      ];
      const layout: Partial<Layout> = { // Partial<Layout> használata
        title: { text: 'Nincs elég adat a regressziós egyeneshez' },
        xaxis: { title: 'Félév' },
        yaxis: { title: 'Átlag' }
      };
      // Használd a megfelelő ID-t a HTML-ből
      const plotElement = document.getElementById('linearRegression');
      if (plotElement) {
        Plotly.newPlot(plotElement, data, layout);
      } else {
        console.error("A 'linearRegression' ID-val rendelkező elem nem található.");
      }
      return; // Kilépünk a függvényből, ha nincs elég adat
    }

    // Adatok kinyerése a válaszból
    const x = response.pairs.map((pair: [number, number]) => pair[0]); // Félév sorszámok (pl. 1, 2, 3...)
    const y = response.pairs.map((pair: [number, number]) => pair[1]); // Átlagok
    const semesterLabels = response.label.map(formatSemesterAxisLabel); // Formázott címkék az X tengelyhez
    const slope = response.m; // Meredekség a backendről
    const intercept = response.b; // Tengelymetszet a backendről

    // Regressziós egyenes y értékeinek számítása a backend által adott m és b alapján
    // Az egyenes kirajzolásához elég a kezdő és végpont x értékét használni
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const regressionLineX = [xMin, xMax]; // Csak a kezdő és végpont kell az egyeneshez
    const regressionLineY = regressionLineX.map(xVal => slope * xVal + intercept);

    // Plotly diagram összeállítása
    const layout: Partial<Layout> = { // Partial<Layout> használata
      title: { text: 'Lineáris regresszió' },
      xaxis: {
        title: 'Félév',
        tickmode: 'array', // Megadjuk a pontos helyeket és címkéket
        tickvals: x,       // Hol legyenek a tickek (az eredeti x értékeknél)
        ticktext: semesterLabels // Milyen szöveg jelenjen meg ott (a formázott félévnevek)
      },
      yaxis: {
        title: 'Átlag',
        rangemode: 'tozero' // Y tengely kezdődjön nullánál (vagy 'normal' ha nem kell)
      },
      legend: { // Jelmagyarázat beállításai (opcionális)
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      }
    };

    const data: Data[] = [
      {
        x: x, // Eredeti x értékek (félév sorszámok)
        y: y, // Eredeti y értékek (átlagok)
        mode: 'markers', // Pontokként jelenjenek meg
        type: 'scatter',
        name: 'Átlagok',
        hovertemplate: 'Félév: %{x}<br>Átlag: %{y}', // Jelmagyarázat szövege
        marker: { size: 8 } // Pontok mérete (opcionális)
      },
      {
        x: regressionLineX, // Az egyenes x koordinátái (elég a kezdő és végpont)
        y: regressionLineY, // Az egyenes y koordinátái (kiszámolva m és b alapján)
        mode: 'lines', // Vonalként jelenjen meg
        type: 'scatter',
        name: 'Regressziós egyenes', // Jelmagyarázat szövege
        hoverinfo: 'none',
        line: { color: 'red' } // Vonal színe (opcionális)
      }
    ];

    // Diagram kirajzolása
    const plotElement = document.getElementById('linearRegression');
    if (plotElement) {
      Plotly.newPlot(plotElement, data, layout);
    } else {
      console.error("A 'linearRegression' ID-val rendelkező elem nem található.");
    }
  }
