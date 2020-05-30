/// <reference lib="webworker" />

import { Genres, Line, OriginalTitle, PrimaryTitle, Year } from 'src/app/line.type';

let reader: ReadableStreamDefaultReader<Uint8Array>;
let indexedLines: Line[] = [];
let chunkRest: string = null;

console.time('Time to index');

fetch('./assets/large-file.tsv').then(response => {
  if (response.ok) {
    reader = response.body.getReader();
    reader.read().then(processText);
  } else {
    postMessage('file-not-found');
  }
});

function processText({ done, value }): Promise<void> {
  if (done) {
    console.timeEnd('Time to index');
    postMessage('index-done');
    return Promise.resolve();
  }

  const chunk = new TextDecoder('utf-8').decode(value);
  chunk.split('\n').forEach(chunkLine => parseLine(chunkLine, false));

  postMessage(indexedLines);
  indexedLines = [];

  return reader.read().then(processText);
}

function parseLine(chunkLine, retry = true): void {
  const splitLine = chunkLine.split('\t');

  // Ignore first line
  if (splitLine[0] === 'tconst') {
    return;
  }

  // If the line looks complete, we index it
  if (splitLine.length === 9) {
    const lineIndex = indexedLines.length - 1;
    return indexLine(splitLine, lineIndex);
  }

  // If we get here, we have an incomplete line, but let's give it a chance (only 1 retry)
  if (retry) {
    // If we have some text left from the previous chunk...
    if (chunkRest) {
      // ...we fix the line by concatenating both
      const fixedLine = chunkRest + chunkLine;
      chunkRest = null;
      return parseLine(fixedLine, false);
    }

    // ...else we save this part for the next chunk
    chunkRest = chunkLine;
  }
}

function indexLine(line: string[], lineIndex: number): void {
  const primaryTitle: PrimaryTitle = line[2];
  const originalTitle: OriginalTitle = line[3];
  const year: Year = parseInt(line[5], 10);
  const genres: Genres = line[8].split(',');

  // indexedLinesByYear[year] = [
  //   ...(indexedLinesByYear[year] || []),
  //   lineIndex
  // ];

  // Could also be written like this (@todo Check perf diff)
  /*
    if (indexedLinesByYear[year]) {
      indexedLinesByYear[year].push(lineIndex);
    } else {
      indexedLinesByYear[year] = [ lineIndex ];
    }
  */

  indexedLines.push([ primaryTitle, originalTitle, year, genres ]);
}
