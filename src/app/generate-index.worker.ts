/// <reference lib="webworker" />

import { Line } from 'src/app/line.type';

let reader: ReadableStreamDefaultReader<Uint8Array>;
let indexedLines: Line[] = [];
let chunkRest: string = null;

const timeStart = Date.now();

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
    postMessage({ timeToIndex: Date.now() - timeStart });
    return Promise.resolve();
  }

  const chunk = new TextDecoder('utf-8').decode(value);
  chunk.split('\n').forEach(chunkLine => parseLine(chunkLine, false));

  postMessage({ indexedLines });
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
    return indexLine(splitLine);
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

function indexLine(lineData: string[]): void {
  const line: Line = {
    id: lineData[0],
    primaryTitle: lineData[2],
    originalTitle: lineData[3],
    year: parseInt(lineData[5], 10),
    genres: lineData[8].split(','),
  };

  indexedLines.push(line);
}
