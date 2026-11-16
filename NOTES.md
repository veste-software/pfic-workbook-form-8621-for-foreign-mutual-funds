# Notes

- `src/data/top-rates.json` (highest individual rate 2003–2026) was written from general knowledge of IRC §1 and needs human verification before launch.
- `src/data/irs-underpayment-rates.json` still lacks 2003-Q1 to 2016-Q4; interest for holdings that start before 2017 is flagged, never computed at 0%.
- Interest on line 16f is computed on the line 16c tax per year (line 16d is not netted per year). Check this reading of the i8621 instructions.
