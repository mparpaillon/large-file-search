import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
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
export class AppComponent {
  searchForm: FormGroup;
  FileState = FileState;
  fileState: FileState = FileState.LOADING;
  indexedLines: Line[] = [];
  displayedColumns = [ 'primaryTitle', 'originalTitle', 'year', 'genre', 'action' ];
  webWorkerSupported = typeof Worker !== 'undefined';
  nbTotalLines = 6844030;
  filteredLines = new MatTableDataSource<Line>();

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

  generateIndex(): void {
    if (!this.webWorkerSupported) {
      return;
    }

    const worker = new Worker('./generate-index.worker', { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data === 'file-not-found') {
        this.fileState = FileState.NOT_FOUND;
      } else if (data === 'index-done') {
        this.fileState = FileState.LOADED;
      } else {
        this.indexedLines.push(...data);

        /*
        Pre allocating array size should (apparently) be a huge performance boost
        But since I couldn't see any difference I chose the simplest code

        Source: https://dev.to/uilicious/javascript-array-push-is-945x-faster-than-array-concat-1oki
        */

        // const prevLength = this.indexedLines.length;
        // this.indexedLines.length += data.length;

        // for (let i = 0; i < data.length; i++){
        //   this.indexedLines[prevLength + i] = data[i];
        // }

        this.filteredLines.data = this.indexedLines;
        this.filteredLines.paginator = this.paginator;
      }

      this.cd.detectChanges();
    };
  }

  resetSearch() {
    this.searchForm.reset();
  }

  onSubmit(searchData: { title: string, year: number }): void {
    const filteredLines = this.indexedLines.filter(line => {
      if (searchData.title && !line[0].includes(searchData.title) && !line[1].includes(searchData.title)) {
        return false;
      }

      if (searchData.year && line[2] !== searchData.year) {
        return false;
      }

      return true;
    });

    this.filteredLines.data = filteredLines;
    this.filteredLines.paginator = this.paginator;
  }
}

