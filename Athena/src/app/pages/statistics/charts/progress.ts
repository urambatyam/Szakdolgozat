import Plotly, { Data, Layout } from 'plotly.js-dist-min';

interface CategoryData {
  name: string;
  earnedCredits: number;
  totalCredits: number;
}

interface SpecializationData {
  name: string;
  categories: CategoryData[];
}

export function createP(data: SpecializationData[]) {
  const traces: Data[] = [];
  const categoryColors: { [key: string]: string } = {
    Matematika: 'rgb(255, 127, 14)',
    Informatika: 'rgb(31, 119, 180)',
    // ... további kategóriák és színek
  };

  const categories = new Set<string>();
  data.forEach(specialization => {
    specialization.categories.forEach(category => categories.add(category.name));
  });
  const sortedCategories = Array.from(categories).sort();

  sortedCategories.forEach(categoryName => {
    const yValues: number[] = [];
    const textValues: string[] = [];
    const xValues: string[] = [];

    data.forEach(specialization => {
      const category = specialization.categories.find(c => c.name === categoryName);
      if (category) {
        yValues.push(category.earnedCredits);
        textValues.push(`${category.earnedCredits}/${category.totalCredits}`);
        xValues.push(specialization.name);
      } else {
        yValues.push(0);
        textValues.push('');
        xValues.push(specialization.name);
      }
    });

    traces.push({
      x: xValues,
      y: yValues,
      text: textValues,
      textposition: 'auto',
      name: categoryName,
      type: 'bar',
      marker: {
        color: categoryColors[categoryName] || 'rgb(128,128,128)', // Alapértelmezett szín, ha nincs megadva
      },
    });
  });

  const layout: Partial<Layout> = {
    barmode: 'stack',
    title: 'Előrehaladás Specializációnként',
    xaxis: { title: 'Specializáció' },
    yaxis: { title: 'Megszerzett Kreditek' },
    legend: { title: { text:'Kategóriák' }},
  };

  Plotly.newPlot('progress', traces, layout, { responsive: true });
}
