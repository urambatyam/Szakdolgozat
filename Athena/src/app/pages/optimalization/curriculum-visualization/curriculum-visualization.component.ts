import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as htmlToImage from 'html-to-image';
import { MatButtonModule } from '@angular/material/button';
interface Course {
  id: number;
  name: string;
  kredit: number;
}

interface Semester {
  is_fall: boolean;
  courses: Course[];
  total_credits: number;
}

interface OptimizedPlan {
  semesters: Semester[];
  total_credits: number;
  total_courses: number;
  total_semesters: number;
  all_requirements_met: boolean;
  nodes_explored?: number;
}

@Component({
  selector: 'app-curriculum-visualization',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './curriculum-visualization.component.html',
  styleUrl: './curriculum-visualization.component.scss'
})
export class CurriculumVisualizationComponent implements OnInit {
  ngOnInit(): void {
    console.log("valmimvdf");
    console.log(this.optimizedPlan);
  }
    
  @Input() optimizedPlan: OptimizedPlan = {} as OptimizedPlan;
  @ViewChild('svgContainer') svgContainer!: ElementRef;


  downloadSvgAsPng() {
    const svg = this.svgContainer.nativeElement.querySelector('svg');
    if (svg) {
      htmlToImage.toPng(svg)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'curriculum-plan.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('oops, something went wrong!', error);
        });
    }
  }

  
  // Maximum kurzusok száma egy oszlopban
  private maxCoursesPerColumn = 4;
  // Félév alap szélessége
  private baseSemesterWidth = 200;
  // Kurzusok közötti távolság
  private courseSpacing = 100;
  // Oszlopok közötti távolság
  private columnSpacing = 150;



  // Visszaadja az SVG viewBox értékét
  getViewBox(): string {
    // Kiszámítjuk az összes félév szélességét + plusz hely az összegző doboznak
    const width = this.getTotalSemestersWidth() + 200+16;
    const height = this.getMaxHeight();
    return `-0.5 -0.5 ${width} ${height}`;
  }


  // Visszaadja a félévet reprezentáló vonal elérési útját
  getSemesterLinePath(semesterData: Semester): string {
    const width = Math.max(150,this.getSemesterWidth(semesterData));
    return `M 0 30 L ${width} 30`;
  }

  // Visszaadja a félév bal oldali jelölőjét
  getSemesterLeftTick(): string {
    return `M 0 22.5 L 0 37.5`;
  }

  // Visszaadja a félév jobb oldali jelölőjét
  getSemesterRightTick(semesterData: any): string {
    const width = Math.max(150,this.getSemesterWidth(semesterData));
    return `M ${width} 37.5 L ${width} 22.5`;
  }

  // Kiszámítja a félév szélességét a kurzusok száma alapján
  getSemesterWidth(semesterData: Semester): number {
    if (!semesterData?.courses || semesterData.courses.length === 0) {
      // Üres félév esetén visszaadjuk az egy oszlop szélességét
      return this.columnSpacing;
    }
    
    const numCourses = semesterData.courses.length;
    const columns = Math.ceil(numCourses / this.maxCoursesPerColumn);
    return columns * this.columnSpacing;
  }

  // Kiszámítja az X pozíciót egy adott félévhez
  getSemesterXPosition(semesterNumber: number): number {
    let position = 16; // kezdő pozíció
    
    // Hozzáadjuk az előző félévek szélességét
    for (let i = 1; i < semesterNumber; i++) {
      position += this.getSemesterWidth(this.optimizedPlan.semesters[i-1]);
    }
    
    return position;
  }





  // A kurzusok pozícionálása a féléveken belül (oszlopokban)
  getCourseTransform(index: number, totalCourses: number): string {
    const column = Math.floor(index / this.maxCoursesPerColumn);
    const row = index % this.maxCoursesPerColumn;
    
    const x = column * this.columnSpacing + 75; // oszlop * szélesség + középpont offset
    const y = row * this.courseSpacing + 120;   // sor * magasság + kezdő Y pozíció
    
    return `translate(${x}, ${y})`;
  }

  // Visszaadja a maximális félév számot
  getMaxSemesterNumber(): number {
    return this.optimizedPlan.total_semesters || 0;
  }

  // Kiszámítja az összes félév teljes szélességét
  getTotalSemestersWidth(): number {
    let totalWidth = 16; // kezdő pozíció
    this.optimizedPlan.semesters.forEach(semester => {
      totalWidth += this.getSemesterWidth(semester);
    })
  
    return totalWidth;
  }

  // Kiszámítja a maximális magasságot az SVG-hez
  getMaxHeight(): number {
    let maxCoursesInColumn = 0;
    this.optimizedPlan.semesters.forEach(semester => {
      if (semester?.courses) {
        const coursesPerColumn = Math.min(semester.courses.length, this.maxCoursesPerColumn);
        maxCoursesInColumn = Math.max(maxCoursesInColumn, coursesPerColumn);
      }
    });
    // Alap magasság + (max kurzusok száma oszloponként * kurzus távolság)
    return 100 + (maxCoursesInColumn * this.courseSpacing);
  }
}