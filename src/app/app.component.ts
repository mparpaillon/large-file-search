import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  searchForm: FormGroup;
  fileState: 'loading' | 'loaded' | 'not-found' = 'loading';
  reader: ReadableStreamDefaultReader<Uint8Array>;
  lines: Array<{ primaryTitle: string, originalTitle: string, year: number, genre: string }> = [];
  chunkRest: string = null;

  constructor(
    private cd: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      title: '',
      year: ''
    });

    fetch('./assets/medium-file.tsv')
    // Retrieve its body as ReadableStream
    .then(response => {
      this.reader = response.body.getReader();
      this.reader.read().then(this.processText.bind(this));
    })
    .catch(() => {
      this.fileState = 'not-found';
      this.cd.detectChanges();
    });
  }

  private processText({ done, value }) {
    if (done) {
      return this.done();
    }

    const chunk = new TextDecoder('utf-8').decode(value);
    chunk.split('\n').forEach(chunkLine => this.parseLine(chunkLine, false));

    return this.reader.read().then(this.processText.bind(this));
  }

  private parseLine(chunkLine, retry = true) {
    const splitLine = chunkLine.split('\t');

    // First line
    if (splitLine[0] === 'tconst') {
      return;
    }

    // Each chunk may have an incomplete line
    if (splitLine.length !== 9 && retry) {
      if (this.chunkRest) {
        const fixedLine = this.chunkRest + chunkLine;
        this.chunkRest = null;
        this.parseLine(fixedLine, false);
      } else {
        this.chunkRest = chunkLine;
      }
    }

    const primaryTitle = splitLine[2];
    const originalTitle = splitLine[3];
    const year = parseInt(splitLine[5], 10);
    const genre = splitLine[8];
    this.lines.push({ primaryTitle, originalTitle, year, genre });
  }

  private done() {
    this.fileState = 'loaded';
    this.cd.detectChanges();

    console.log(this.lines);
  }

  onSubmit(searchData: { title: string, year: number }) {
    console.log(searchData);
  }
}
