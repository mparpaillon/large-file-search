import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

enum FileState {
  LOADING,
  LOADED,
  NOT_FOUND
}

// Declaring some type aliases to make it more readable
type PrimaryTitle = string;
type OriginalTitle = string;
type Year = number;
type Genre = string;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  searchForm: FormGroup;
  FileState = FileState;
  fileState: FileState = FileState.LOADING;
  filteredLines: Array<[ PrimaryTitle, OriginalTitle, Year, Genre ]> = [];
  indexedLines: Array<[ PrimaryTitle, OriginalTitle, Year, Genre ]> = [];
  indexedLinesByYear: { [ year: number ]: number[] } = {};
  displayedColumns = [ 'primaryTitle', 'originalTitle', 'year', 'genre', 'action' ];
  webWorkerSupported = typeof Worker !== 'undefined';

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
      }

      this.cd.detectChanges();
    };
    // worker.postMessage('hello');
  }

  onSubmit(searchData: { title: string, year: number }): void {
    console.log(searchData);
  }
}
