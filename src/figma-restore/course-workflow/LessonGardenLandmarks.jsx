import React from 'react';

function Sprig({ transform }) {
  return (
    <g transform={transform} strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 0q1-9 0-20" fill="none" stroke="#628b70" strokeWidth="1.5" />
      <path d="M0-6q-7 0-9-7 8-1 9 7Zm.5-7q1-7 8-8 0 7-8 8Z" fill="#83b18b" stroke="#689975" strokeWidth="1" />
    </g>
  );
}

function Bloom({ transform, color }) {
  return (
    <g transform={transform} strokeLinejoin="round">
      <Sprig />
      <path d="M-1-24c-3-4-7-2-6 2-4 1-3 5 1 6-1 4 3 6 6 2 3 3 7 1 6-3 4-2 3-6-1-6 0-4-4-5-6-1Z" fill={color} />
      <circle cx="-.6" cy="-20" r="2.3" fill="#fbe6a6" />
    </g>
  );
}

export function LessonGardenLandscapeDefs() {
  return (
    <defs>
      <symbol id="lesson-garden-gate" viewBox="0 0 120 90">
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 76q13-4 28-4l4 4q-13 5-30 3Zm64 1q12-4 22-2l11 3q-14 4-32 2Z" fill="#cdd9bf" />
          <path d="m43 70 33 1 5 5-43 1Z" fill="#ede2be" />
          <path d="m45 70 29 1m-35 5 36-1" fill="none" stroke="#d8cba4" strokeWidth="1.1" />
          <path d="M33 71V42c0-18 10-29 27-30 15 0 29 11 29 29v32l-5 3-2-34c0-14-10-23-22-23-13 0-21 10-21 24v29Z" fill="#82a998" stroke="#688f82" strokeWidth="1.5" />
          <path d="M29 73V42c0-19 11-31 29-31s29 13 29 31v31h-7V42c0-15-9-24-22-24s-22 9-22 24v31Z" fill="#b6dac3" stroke="#6f9a87" strokeWidth="1.5" />
          <path d="M32 65V42c0-17 10-27 26-28m25 30v20" fill="none" stroke="#e2edd2" strokeWidth="1.6" />
          <path d="M24 67h15v7l-2 2H24Zm54 0h14v7l-2 2H78Z" fill="#f7ebc8" stroke="#b5a984" strokeWidth="1.3" />
          <path d="M25 72h11m43 0h10" fill="none" stroke="#c9bc94" strokeWidth="1.2" />
          <path d="M27 38q5-18 22-24m11 0q10 1 18 7" fill="none" stroke="#6d987c" strokeWidth="1.5" />
          <g fill="#76a780">
            <path d="M29 32q-8-2-7-9 7 0 7 9Zm3-5q0-7 7-9 1 6-7 9Zm8-11q-6-1-7-7 6-1 7 7Zm7-3q0-6 6-8 1 7-6 8Zm27 5q0-6 5-6 1 5-5 6Z" />
          </g>
          <g fill="#ecac91"><circle cx="34" cy="21" r="2.6" /><circle cx="40" cy="17" r="2.1" /><circle cx="78" cy="21" r="2" /></g>
          <path d="M8 70q-3-8 4-10-1-8 7-10 7-3 10 5 8-2 8 6 6 2 3 8-6 5-17 5t-15-4Z" fill="#9bc394" stroke="#729d78" strokeWidth="1.4" />
          <path d="M84 70q-2-6 3-8-1-6 5-8 6-2 9 3 7-1 8 6 5 1 3 6-3 5-13 5-12 2-15-4Z" fill="#a4cba0" stroke="#759f7e" strokeWidth="1.4" />
          <path d="M12 70q10-4 17 0m61-1q7-2 12 1" fill="none" stroke="#7fa987" strokeWidth="1.2" />
          <g fill="#f2cc88"><circle cx="16" cy="60" r="1.8" /><circle cx="24" cy="56" r="1.4" /><circle cx="99" cy="60" r="1.6" /></g>
        </g>
      </symbol>

      <symbol id="lesson-garden-bed" viewBox="0 0 120 90">
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 51 19 4 54-9-6-3Zm22 25 24 6 48-11-16-4Z" fill="#cedabe" />
          <path d="m13 39 54-10 23 8-1 9-54 10-22-8Z" fill="#d9b995" stroke="#b99876" strokeWidth="1.4" />
          <path d="m14 39 53-10 22 7-54 11Z" fill="#f5dcbc" stroke="#b99876" strokeWidth="1.2" />
          <path d="m20 39 47-7 15 4-47 8Z" fill="#a28f6a" />
          <Bloom transform="translate(36 39) scale(.75)" color="#d997ae" />
          <Bloom transform="translate(55 35) scale(.9)" color="#e8ad83" />
          <Bloom transform="translate(71 34) scale(.62)" color="#dca1af" />
          <path d="M35 48v6m16-10v6m20-10v6" stroke="#bd9d7c" fill="none" strokeWidth="1" />
          <path d="m35 64 50-11 23 8-1 9-49 12-23-9Z" fill="#ddb992" stroke="#b99876" strokeWidth="1.4" />
          <path d="m35 64 50-11 23 8-50 12Z" fill="#f8dfbc" stroke="#b99876" strokeWidth="1.2" />
          <path d="m42 64 42-8 16 5-43 9Z" fill="#ad9877" />
          <path d="M43 63q-4-5 2-6-1-7 5-6 4-5 8 1 6-1 6 5 1 5-9 7Z" fill="#94b89a" stroke="#7a9f83" strokeWidth="1.2" />
          <Bloom transform="translate(69 60) scale(.87)" color="#d5b4d6" />
          <Sprig transform="translate(85 58) rotate(10) scale(.71)" />
          <path d="m60 74-.5 6m18-10 0 6m19-11 0 6" stroke="#bf9f7f" fill="none" strokeWidth="1" />
          <path d="m96 60-2-18" fill="none" stroke="#9b826b" strokeWidth="2.3" />
          <path d="m85 41 15-3 2 8-15 3Z" fill="#fff0cc" stroke="#b69972" strokeWidth="1.3" />
          <path d="M90 45q0-4 5-4-1 4-5 4Z" fill="#8fae8c" />
        </g>
      </symbol>

      <symbol id="lesson-garden-table" viewBox="0 0 120 90">
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 69q19-5 39-5l40-8 11 4-53 14q-22 3-37-5Z" fill="#d1d9bf" />
          <g stroke="#72978b" strokeWidth="1.3">
            <path d="m27 44 5 1-1 23-5-1Zm53-13 5 1 1 25-5-1Z" fill="#88afa1" />
            <path d="m18 43 7 2-1 26-6-1Zm73-7 7-1 2 28-6 1Z" fill="#a1c5b1" />
            <path d="m22 58 68-12v4L23 63Z" fill="#a6c8b5" />
          </g>
          <path d="m13 39 60-14 34 10v7L47 58 13 46Z" fill="#82b3a9" stroke="#648e85" strokeWidth="1.6" />
          <path d="m13 39 61-14 33 10-60 16Z" fill="#b6dacc" stroke="#719d91" strokeWidth="1.4" />
          <path d="m24 42 60-14m-46 18 59-14" fill="none" stroke="#96c2b4" strokeWidth="1.1" />
          <path d="m46 52 0 5m4-5 52-13" fill="none" stroke="#87b7a7" strokeWidth="1" />
          <path d="M24 30q5 2 14-1l-1 9q-3 3-10 1Z" fill="#d79a81" stroke="#ba826e" strokeWidth="1.15" />
          <ellipse cx="31" cy="30" rx="8" ry="2.65" fill="#efb69b" stroke="#be8972" strokeWidth="1.05" />
          <Sprig transform="translate(31 29) scale(.73)" />
          <path d="M31 24q-1-7-5-10 6-1 8 6" fill="#aac698" />
          <path d="m53 37 13-4 12 3-13 4Z" fill="#fff1d3" stroke="#c5ba9e" strokeWidth=".9" />
          <path d="m67 34 3-1 8 2-4 2Z" fill="#d9cae2" />
          <path d="m87 32 9-4" fill="none" stroke="#b99470" strokeWidth="2.4" />
          <path d="m83 32 4-2 2 3-5 4-4-1Z" fill="#a0b8b6" stroke="#7e9b99" strokeWidth="1.1" />
          <path d="M39 72q12-4 27 0l-8 4q-11 2-19-1Z" fill="#d3d9bf" />
          <path d="m42 63 4 1-2 11-4-1Zm17 1 4-1 1 10-4 1Z" fill="#bd9f83" stroke="#a38970" strokeWidth="1.05" />
          <path d="m38 62 17-4 12 4v4l-17 5-12-5Z" fill="#e0bc8e" stroke="#b19570" strokeWidth="1.3" />
          <path d="m38 62 17-4 12 4-17 5Z" fill="#f3d7ae" stroke="#b19570" strokeWidth="1.1" />
        </g>
      </symbol>

      <symbol id="lesson-garden-forum" viewBox="0 0 120 90">
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 63c0-13 21-23 48-23s49 9 50 23l-5 3c-4-9-24-15-45-15S17 56 13 67Z" fill="#eddbb8" stroke="#c9b58f" strokeWidth="1.4" />
          <path d="M12 65c6-11 23-17 44-17 24 0 43 7 48 15v5c-8-9-24-15-48-15-21 0-37 6-43 15Z" fill="#d7c29c" />
          <path d="M18 70c1-10 17-18 38-18s37 7 39 16l-4 5c-5-7-18-11-35-11s-29 3-34 11Z" fill="#f3e3c6" stroke="#c9b58f" strokeWidth="1.35" />
          <path d="M20 72q11-12 35-12t38 10" fill="none" stroke="#d8c6a7" strokeWidth="1.4" />
          <path d="M81 59q6-8 5-21l-7-9 3-2 5 6 5-14 4 2-6 20-2 17Z" fill="#b79786" stroke="#997d70" strokeWidth="1.3" />
          <path d="M69 35q-10-2-9-10 0-6 6-8 1-10 11-10 8-6 16 0 10-2 14 6 8 3 6 12 4 6-3 12-7 8-19 4-12 4-22-6Z" fill="#c7bcdb" stroke="#9f90b6" strokeWidth="1.65" />
          <path d="M64 29q7 4 12-1 7 7 14 3 6 6 12 1 5 0 9-4 1 5-4 9-7 6-17 2-14 4-21-5Z" fill="#b1a8cd" />
          <g fill="#eaddf0"><circle cx="74" cy="17" r="2.5" /><circle cx="79" cy="14" r="1.6" /><circle cx="98" cy="22" r="2.1" /><circle cx="103" cy="19" r="1.5" /></g>
          <g stroke="#ab8b72" strokeWidth="1.2">
            <path d="m27 55 3-1v12l-3 1Zm17-5 3-1v12l-3 1Z" fill="#c3a387" />
            <path d="m24 53 22-6 2 4-22 6Zm1 7 22-6 4 3-22 7-4-2Z" fill="#e6bc95" />
            <path d="m68 51 3 1v11l-3-1Zm17 5 3 1v12l-3-1Z" fill="#c3a387" />
            <path d="m67 47 22 7-1 4-22-7Zm-3 10 5-3 21 7v3l-4 1Z" fill="#e6bc95" />
          </g>
        </g>
      </symbol>
    </defs>
  );
}
