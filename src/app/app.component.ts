import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { EditFormComponent, EditFormSubmitData } from 'src/app/edit-form/edit-form.component';
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
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
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

    this.snackBar.open('Indexing... You\'ll be able to filter the list once all the file is parsed.');
  }

  generateIndex(): void {
    if (!this.webWorkerSupported) {
      return;
    }

    const worker = new Worker('./generate-index.worker', { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data === 'file-not-found') {
        this.fileState = FileState.NOT_FOUND;
        this.snackBar.open('Error: The file was not found.', '', {
          duration: 3000
        });
      } else if (data.timeToIndex) {
        this.fileState = FileState.LOADED;
        this.timeToIndex = Math.round(data.timeToIndex / 1000);
        this.snackBar.open(`Done ! Indexing ${this.indexedLines.length} lines took ${this.timeToIndex} second(s).`, '', {
          duration: 3000
        });
      } else {
        this.indexedLines.push(...data.indexedLines);
        this.filteredLines.data = this.indexedLines;
      }

      this.cd.detectChanges();
    };
  }

  resetSearch(): void {
    this.searchForm.reset();
  }

  filterLines(lines: Line[], title: string, year: number): Line[] {
    if (!title && !year) {
      return lines;
    }

    return lines.filter(line => {
      if (title && !line.primaryTitle.includes(title) && !line.originalTitle.includes(title)) {
        return false;
      }

      if (year && line.year !== year) {
        return false;
      }

      return true;
    });
  }

  openDialog(line: Line): void {
    const dialogRef = this.dialog.open(EditFormComponent, {
      width: '400px',
      data: { line }
    });

    dialogRef.afterClosed().subscribe((formData: EditFormSubmitData) => {
      if (!formData) return;

      // At first I was using the line index from Material table but it wouldn't work if the list was filtered
      // Using the actual id is more reliable
      const lineIndex = this.indexedLines.findIndex(l => l.id === formData.id);

      this.indexedLines[lineIndex].originalTitle = formData.value.title;
      this.indexedLines[lineIndex].year = formData.value.year;

      this.indexedLines[lineIndex].genres = typeof formData.value.genres === 'string'
        ? formData.value.genres === '' ? [] : formData.value.genres.split(',')
        : formData.value.genres;

      this.refreshSearchResults();
    });
  }

  refreshSearchResults() {
    const title = this.searchForm.get('title').value;
    const year = this.searchForm.get('year').value;

    this.filteredLines.data = this.filterLines(this.indexedLines, title, year);
  }
}

