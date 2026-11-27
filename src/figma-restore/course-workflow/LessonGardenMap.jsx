import React from 'react';
import { LessonGardenLandscapeDefs } from './LessonGardenLandmarks';

export const gardenHeight = 680;
export const gardenStops = {
  eng: { x: 141, y: 268, symbol: 'gate', frontX: 119, frontY: 253, width: 138 },
  emp: { x: 613, y: 207, symbol: 'bed', frontX: 590, frontY: 185, width: 146 },
  exc: { x: 327, y: 484, symbol: 'table', frontX: 353, frontY: 463, width: 143 },
  elv: { x: 711, y: 555, symbol: 'forum', frontX: 691, frontY: 541, width: 140 },
};

const { eng, emp, exc, elv } = gardenStops;
const point = ({ x, y }) => `${x} ${y}`;
// Enter through the arch, skirt the planting beds and pond, and finish inside the seating court.
const trail = `M119 245 Q126 259 ${point(eng)}
  C222 304 326 309 397 286 C466 263 509 190 ${point(emp)}
  C678 225 686 273 623 304 C545 341 468 321 398 351
  C328 379 273 402 276 439 Q280 469 ${point(exc)}
  C393 513 442 511 503 499 S610 506 654 540
  Q685 565 ${point(elv)} L710 546`;

function GardenTerrain() {
  return (
    <>
      <defs>
        <g id="garden-canopy" strokeLinejoin="round">
          <ellipse cx="2" cy="4" rx="22" ry="6" fill="#b1c4a1" opacity=".4" />
          <path d="M-2 3v-20" stroke="#a48e70" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M-6-8c-12 1-20-6-18-15-1-8 5-14 11-15 4-11 19-13 25-4 9 1 14 8 12 16 5 10-2 19-12 19q-10 4-18-1Z" fill="#a9c9ab" stroke="#88ae92" strokeWidth="1.35" />
          <path d="M-20-17q8 5 14 0 7 6 14 1 9 3 16-6 0 12-14 14-18 5-30-9Z" fill="#93b99e" />
          <path d="M-15-30q4-6 8-5" fill="none" stroke="#cfe2be" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g id="garden-grass" stroke="#94aa86" fill="none" strokeLinecap="round" strokeWidth="1.5">
          <path d="m-5 0-3-3m6 3 2-6m3 6 4-3" />
        </g>
        <g id="garden-flowers">
          <path d="m-4 0-2-8m7 7 4-10" fill="none" stroke="#819c81" strokeWidth="1.4" />
          <circle cx="-6" cy="-8" r="3.2" fill="#e0a994" /><circle cx="5" cy="-12" r="3" fill="#e6bc86" />
        </g>
      </defs>
      <rect width="1000" height="680" fill="#edf1e4" />
      <path d="M0 0h1000v50c-94 21-121 62-210 51-86-10-116-47-209-40-94 7-147 41-233 39C207 97 122 58 0 103Z" fill="#e3ead9" />
      <path d="M0 0h1000v23c-95 22-128 49-199 41-77-8-134-42-225-39-109 4-143 35-229 31C203 49 123 16 0 63Z" fill="#d5e3cc" />
      <path d="M0 335c64-38 139-31 194 3 48 31 65 75 51 110-26 66-125 66-164 120-16 23-23 51-18 112H0Z" fill="#e0ebd9" />
      <path d="M1000 249c-43-19-91-16-128 11-43 34-43 88-111 114-35 13-58 33-52 63 5 27 39 52 84 48 81-7 112-41 207-18Z" fill="#e0ead7" />
      <path d="M0 680v-57c93-41 153 6 234-11 66-14 86-53 148-52 89 2 121 72 219 65 71-5 101-54 155-44 52 8 97 50 158 40 31-5 60-17 86-14v73Z" fill="#e1e9d6" />
      <path d="M0 680v-22c99-47 163 5 242-15s96-50 146-44c77 7 126 67 217 56 79-10 112-47 163-29 80 28 110 47 232 16v38Z" fill="#d6e3cd" />

      {/* The walk follows the north and west banks toward the potting table. */}
      <g transform="translate(27 0)">
        <path d="M396 397c25-26 57-38 98-41 45-3 67-19 100-16 33 4 53 28 43 50-15 32-68 30-104 39-44 11-62 34-105 29-38-5-54-33-32-61Z" fill="#d5dfc8" />
        <path d="M404 398c23-22 54-33 91-35 44-3 67-19 96-15 29 3 43 22 33 40-14 23-59 24-95 33-45 10-66 32-101 27-34-5-44-26-24-50Z" fill="#b7dcd5" stroke="#9dc8bf" strokeWidth="1.4" />
        <path d="M409 401c25-22 55-31 88-33 40-3 62-15 86-15" fill="none" stroke="#d8eee2" strokeWidth="3" strokeLinecap="round" />
        <g fill="none" stroke="#8fbfb8" strokeWidth="1.3" strokeLinecap="round">
          <path d="M451 408q8 2 16 0m35-23q9 2 18 0m46 1q7 2 14 0" />
        </g>
        <g fill="#95bea0"><ellipse cx="581" cy="364" rx="6" ry="2.5" /><ellipse cx="592" cy="368" rx="4" ry="2" /></g>
        <path d="M402 430q0-9-5-13m5 13q2-13 7-17m-6 17q5-7 8-8" fill="none" stroke="#8fac8a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <path d="M0 260q30-17 61-14m79-16q20-16 40-20m297-61q27-21 65-19" fill="none" stroke="#aec6a7" strokeWidth="11" strokeLinecap="round" />
      <path d="M0 257q30-17 61-14m79-16q20-16 40-20m297-61q27-21 65-19" fill="none" stroke="#c3d7b6" strokeWidth="8" strokeLinecap="round" />
      <g fill="none" stroke="#c8d6bb" strokeWidth="1.4" strokeLinecap="round">
        <path d="M18 332q41-23 87-15m615 108q13 25 48 25m50-104q36-16 45-47" />
      </g>
      <use href="#garden-canopy" transform="translate(17 174) scale(.75)" /><use href="#garden-canopy" transform="translate(38 185) scale(.93)" />
      <use href="#garden-canopy" transform="translate(844 55) scale(.72)" /><use href="#garden-canopy" transform="translate(875 60) scale(.98)" />
      <use href="#garden-canopy" transform="translate(906 63) scale(.68)" />
      <use href="#garden-canopy" transform="translate(958 369) scale(.85)" /><use href="#garden-canopy" transform="translate(989 379) scale(1.05)" />
      <use href="#garden-canopy" transform="translate(132 623) scale(.8)" /><use href="#garden-canopy" transform="translate(157 636)" />
      <g opacity=".8">
        <use href="#garden-grass" transform="translate(209 334)" /><use href="#garden-grass" transform="translate(452 179)" />
        <use href="#garden-grass" transform="translate(706 334)" /><use href="#garden-grass" transform="translate(476 569)" />
        <use href="#garden-flowers" transform="translate(510 152)" /><use href="#garden-flowers" transform="translate(494 157) scale(.7)" />
        <use href="#garden-flowers" transform="translate(185 617) scale(.8)" /><use href="#garden-flowers" transform="translate(702 596)" />
      </g>
    </>
  );
}

export function LessonGardenMap() {
  return (
    <svg className="lesson-roadmap-trail" viewBox={`0 0 1000 ${gardenHeight}`} aria-hidden="true">
      <LessonGardenLandscapeDefs />
      <GardenTerrain />
      <g fill="#eee3cd">
        <ellipse cx="123" cy="251" rx="46" ry="12" /><ellipse cx="583" cy="190" rx="60" ry="16" />
        <ellipse cx="349" cy="470" rx="59" ry="20" /><ellipse cx="696" cy="542" rx="62" ry="24" />
      </g>
      <g className="garden-walk">
        <path className="trail-edge" d={trail} />
        <path className="trail-surface" d={trail} />
        <path className="trail-marks" d={trail} />
      </g>
      {Object.entries(gardenStops).map(([key, stop]) => (
        <use key={key} className="lesson-garden-landmark" href={`#lesson-garden-${stop.symbol}`}
          x={stop.frontX - stop.width / 2} y={stop.frontY - stop.width * 81 / 120}
          width={stop.width} height={stop.width * 90 / 120} />
      ))}
    </svg>
  );
}
