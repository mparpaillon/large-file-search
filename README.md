# Large file search

## How to use

Paste a big file in the assets folder and name it "large-file.tsv" (it's not versionned for obvious reasons).

To properly work, its structure should look like this:

```
tconst	titleType	primaryTitle	originalTitle	isAdult	startYear	endYear	runtimeMinutes	genres
tt0000001	short	Carmencita	Carmencita	0	1894	\N	1	Documentary,Short
tt0000002	short	Le clown et ses chiens	Le clown et ses chiens	0	1892	\N	5	Animation,Short
tt0000003	short	Pauvre Pierrot	Pauvre Pierrot	0	1892	\N	4	Animation,Comedy,Romance
tt0000004	short	Un bon bock	Un bon bock	0	1892	\N	12	Animation,Short
tt0000005	short	Blacksmith Scene	Blacksmith Scene	0	1893	\N	1	Comedy,Short
tt0000006	short	Chinese Opium Den	Chinese Opium Den	0	1894	\N	1	Short
```

Source: https://datasets.imdbws.com/title.basics.tsv.gz

Then run it with `ng serve` or build it with `ng build`

## How does it work

- Fetch + getReader to parse the file by chunks
- Web Worker to avoid using the main thread and freezing the UI
- UI done with Material design

## Ideas to improve

- Better UX to edit the genres (material chips + inline form)
- Pre-format original data to remove unused data
  - I could have done it but the exercise is more interesting with a huge file
- It would be nice to be able to filter while indexing but with that much data it had really bad performance (further search should be able to improve this)
