import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Line } from 'src/app/line.type';

enum FileState {
  LOADING,
  LOADED,
  NOT_FOUND
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  searchForm: FormGroup;
  FileState = FileState;
  fileState: FileState = FileState.LOADING;
  indexedLines: Line[] = [];
  displayedColumns = [ 'originalTitle', 'year', 'genre', 'action' ];
  webWorkerSupported = typeof Worker !== 'undefined';
  filteredLines = new MatTableDataSource<Line>();
  timeToIndex: number;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private cd: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      title: '',
      year: ''
    });

    this.generateIndex();
  }

  ngOnInit() {
    this.filteredLines.data = [];
    this.filteredLines.paginator = this.paginator;
  }

  generateIndex(): void {
    if (!this.webWorkerSupported) {
      return;
    }

    const worker = new Worker('./generate-index.worker', { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data === 'file-not-found') {
        this.fileState = FileState.NOT_FOUND;
      } else if (data.timeToIndex) {
        this.fileState = FileState.LOADED;
        this.timeToIndex = Math.round(data.timeToIndex / 1000);
      } else {
        this.indexedLines.push(...data.indexedLines);
        this.filteredLines.data = this.indexedLines;
      }

      this.cd.detectChanges();
    };
  }

  resetSearch() {
    this.searchForm.reset();
  }

  filterLines(lines: Line[], title: string, year: number): Line[] {
    if (!title && !year) {
      return lines;
    }

    return lines.filter(line => {
      if (title && !line[0].includes(title) && !line[1].includes(title)) {
        return false;
      }

      if (year && line[2] !== year) {
        return false;
      }

      return true;
    });
  }

  onSubmit(searchData: { title: string, year: number }): void {
    const { title, year } = searchData;
    this.filteredLines.data = this.filterLines(this.indexedLines, title, year);
  }
}

