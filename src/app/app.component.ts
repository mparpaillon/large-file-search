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
  reader: ReadableStreamDefaultReader<Uint8Array>;
  chunkRest: string = null;
  filteredLines: Array<[ PrimaryTitle, OriginalTitle, Year, Genre ]> = [];
  indexedLines: Array<[ PrimaryTitle, OriginalTitle, Year, Genre ]> = [];
  indexedLinesByYear: { [ year: number ]: number[] } = {};
  displayedColumns = [ 'primaryTitle', 'originalTitle', 'year', 'genre', 'action' ];

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
    fetch('./assets/large-file.tsv').then(response => {
      if (response.ok) {
        this.reader = response.body.getReader();
        this.reader.read().then(this.processText.bind(this));
      } else {
        this.fileState = FileState.NOT_FOUND;
        this.cd.detectChanges();
      }
    });
  }

  private processText({ done, value }): Promise<void> {
    if (done) {
      return this.done();
    }

    const chunk = new TextDecoder('utf-8').decode(value);
    chunk.split('\n').forEach(chunkLine => this.parseLine(chunkLine, false));

    return this.reader.read().then(this.processText.bind(this));
  }

  private parseLine(chunkLine, retry = true): void {
    const splitLine = chunkLine.split('\t');

    // Ignore first line
    if (splitLine[0] === 'tconst') {
      return;
    }

    // If the line looks complete, we index it
    if (splitLine.length === 9) {
      const lineIndex = this.indexedLines.length - 1;
      return this.indexLine(splitLine, lineIndex);
    }

    // If we get here, we have an incomplete line, but let's give it a chance (only 1 retry)
    if (retry) {
      // If we have some text left from the previous chunk...
      if (this.chunkRest) {
        // ...we fix the line by concatenating both
        const fixedLine = this.chunkRest + chunkLine;
        this.chunkRest = null;
        return this.parseLine(fixedLine, false);
      }

      // ...else we save this part for the next chunk
      this.chunkRest = chunkLine;
    }
  }

  private indexLine(line: string[], lineIndex: number): void {
    const primaryTitle = line[2];
    const originalTitle = line[3];
    const year = parseInt(line[5], 10);
    const genre = line[8];

    this.indexedLinesByYear[year] = [
      ...(this.indexedLinesByYear[year] || []),
      lineIndex
    ];

    // Could also be written like this (@todo Check perf diff)
    /*
      if (this.indexedLinesByYear[year]) {
        this.indexedLinesByYear[year].push(lineIndex);
      } else {
        this.indexedLinesByYear[year] = [ lineIndex ];
      }
    */

    this.indexedLines.push([ primaryTitle, originalTitle, year, genre ]);
  }

  private done(): Promise<void> {
    this.fileState = FileState.LOADED;
    this.cd.detectChanges();

    return Promise.resolve();
  }

  onSubmit(searchData: { title: string, year: number }): void {
    console.log(searchData);
  }
}
