import Plotly, { Data, Layout, PlotData } from 'plotly.js-dist-min';
function formatSemesterName(key: string): string {
  const parts = key.split(' ');
  if (parts.length !== 2) return key; 

  const year = parseInt(parts[0], 10);
  // A leírásod alapján: 1 = Ősz, 0 = Tavasz
  const seasonCode = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(seasonCode)) return key;

  if (seasonCode === 1) { 
    return `${year}/${year + 1} Ősz`;
  } else if (seasonCode === 0) { 
   
    return `${year - 1}/${year} Tavasz`;
  } else {
    return key; 
  }
}
export function createT(response?:any){
    let data: Partial<PlotData>[] = []; // Több trace-t fogunk tárolni
    let plotTitle = 'Kurzus jegyeinek alakulása félévenként';
    let layout: Partial<Layout>;
  
    if (response && response.data && response.data.length > 0) {
      const semesterLabels: string[] = response.label.map(formatSemesterName);
      const tans:Partial<PlotData> = {
        y: response.data, 
        type: 'scatter'
      };
      layout = {
          title: 'Tanulmányi átlag lineáris regressziója',
          xaxis: { 
            title: 'Félév',
            tickmode: 'array',
            tickvals: Object.keys(response.label).map(Number),
            ticktext: semesterLabels
          },
          yaxis: { title: 'Átlag' }
        };
      data.push(tans);
    } else {
      plotTitle = 'A kurzushoz nincsenek féléves jegyadatok';
       const traceEmpty: Data = {
          y: [],
          type: 'box',
          name: 'Nincsenek adatok',
          hovertemplate: 'Nincs adat<extra></extra>'
       };
       data = [traceEmpty];
       layout = {
          title: { text: plotTitle },
          yaxis: { title: 'Jegyek', dtick: 1, range: [0.5, 5.5] }, 
          xaxis: { showticklabels: false }
       };
    }
  
    const plotElement = document.getElementById('tan'); 
    if (plotElement) {
      Plotly.newPlot(plotElement, data, layout);
    } else {
      console.error("A 'boxplot' ID-val rendelkező elem nem található a DOM-ban.");
    }
}