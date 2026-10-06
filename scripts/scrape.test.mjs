import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDMH,parseHistory} from '../web/hydrology.ts';
import {mergeReadings} from './scrape.mjs';
test('An incomplete source cannot replace a valid snapshot',()=>assert.throws(()=>parseDMH('<html>unavailable</html>')));
test('Corrections replace the same day without duplicating records',()=>assert.deepEqual(mergeReadings([{date:'2026-10-01',level:1}],[{date:'2026-10-01',level:1.2},{date:'2026-10-02',level:-.2}]),[{date:'2026-10-01',level:1.2},{date:'2026-10-02',level:-.2}]));
test('Negative levels and missing days remain actual observations',()=>assert.deepEqual(parseHistory('<table><tr><td>02-10-2026</td><td>-0.20m</td></tr><tr><td>30-09-2026</td><td>0.10m</td></tr></table>',{station:'test'}).map(r=>[r.date,r.level]),[['2026-10-02',-.2],['2026-09-30',.1]]));
