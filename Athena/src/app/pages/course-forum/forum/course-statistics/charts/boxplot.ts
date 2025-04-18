import Plotly, { Data, Layout, PlotData } from 'plotly.js-dist-min';

interface SemesterGrades {
  semesters: {
    [semesterKey: string]: number[]; 
  };
}

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

export function creatBP(apiResponse?: SemesterGrades) {

  let data: Partial<PlotData>[] = []; // Több trace-t fogunk tárolni
  let plotTitle = 'Kurzus jegyeinek alakulása félévenként';
  let layout: Partial<Layout>;

  if (apiResponse && apiResponse.semesters && Object.keys(apiResponse.semesters).length > 0) {

    const semesters = apiResponse.semesters;
    const semesterKeys = Object.keys(semesters);

    for (const key of semesterKeys) {
      const grades = semesters[key];
      const semesterName = formatSemesterName(key); 

      if (grades && grades.length > 0) {
        const trace: Data = {
          y: grades, 
          type: 'box',
          name: semesterName, 
          boxpoints: 'all', 
          jitter: 0.3,     
          pointpos: -1.8,  
          hoverinfo: "y"
         
        };
        data.push(trace); 
      }
    }

    if (data.length === 0) {
        plotTitle = 'Nincsenek megjeleníthető jegyadatok a félévekhez';
         const traceEmpty: Data = { y: [], type: 'box', name: 'Nincs adat' };
         data = [traceEmpty];
    }

    layout = {
      title: {
          text: plotTitle
      },
      yaxis: {
          title: 'Jegyek',
          autorange: true,
          showgrid: true,
          zeroline: false,
          dtick: 1, 
          gridcolor: 'rgb(220, 220, 220)',
          gridwidth: 1,
      },
      xaxis: {
          title: 'Félévek',
          showticklabels: true, 

      },
      margin: { 
          l: 50,
          r: 30,
          b: 100, 
          t: 80
      },
      boxmode: 'group', 
      showlegend: false                 
    };

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

  const plotElement = document.getElementById('boxplot'); 
  if (plotElement) {
    Plotly.newPlot(plotElement, data, layout);
  } else {
    console.error("A 'boxplot' ID-val rendelkező elem nem található a DOM-ban.");
  }
}
