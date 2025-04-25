import Plotly, { Data, Layout } from 'plotly.js-dist-min';
import { formatSemesterAxisLabel, LinearRegressionResponse, NOdatalayout } from './common';

/**
 * Létrehoz és megjelenít egy Plotly scatter diagramot, amely a kurzus jegyinek félévenkét vett átlagának
 * lineáris regresszióját mutatja. Tartalmazza az eredeti átlagpontokat
 * és a számított regressziós egyenest.
 * Ha nincs elegendő adat a regresszióhoz (kevesebb mint 2 adatpár),
 * egy "Nincs elég adat" üzenetet jelenít meg a diagram helyett az `NOdatalayout` alapján.
 *
 * @param targetElement - A HTMLDivElement, amelybe a diagramot rajzolni kell.
 * @param response - A `LinearRegressionResponse` objektum, amely tartalmazza a regresszióhoz
 */
export function createLR(targetElement: HTMLDivElement, response?: LinearRegressionResponse) {
    if (!response || !response.pairs || response.pairs.length < 2) {
      const data: Data[] = [
        {
          x: [],
          y: [],
          mode: 'markers',
          type: 'scatter'
        }
      ];
      const layout: Partial<Layout> = NOdatalayout as Partial<Layout>;
      const config = { responsive: true };
      Plotly.newPlot(targetElement, data, layout, config);
      return;
    }

    const x = response.pairs.map((pair: [number, number]) => pair[0]);
    const y = response.pairs.map((pair: [number, number]) => pair[1]);
    const semesterLabels = response.label.map(formatSemesterAxisLabel);
    const slope = response.m;
    const intercept = response.b;

    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const regressionLineX = [xMin, xMax];
    const regressionLineY = regressionLineX.map(xVal => slope * xVal + intercept);

    const layout: Partial<Layout> = {
      autosize: true,
      margin: { l: 50, r: 100, b: 100, t: 50 },
      xaxis: {
        tickmode: 'array',
        tickvals: x,
        ticktext: semesterLabels,
        tickangle: 45
      },
      yaxis: {
        rangemode: 'tozero'
      },
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      }
    };

    const data: Data[] = [
      {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        name: 'Átlagok', 
        hovertemplate: 'Félév: %{x}<br>Átlag: %{y}', 
        marker: { size: 8 }
      },
      {
        x: regressionLineX,
        y: regressionLineY,
        mode: 'lines',
        type: 'scatter',
        name: 'Regressziós egyenes', 
        hoverinfo: 'none',
        line: { color: 'red' }
      }
    ];
    const config = { responsive: true };
    Plotly.newPlot(targetElement, data, layout, config);
  }
