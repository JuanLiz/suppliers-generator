#!/bin/bash
#cp -r public .next/standalone/ &&
npm run build
cp -r .next/static .next/standalone/.next/

#node .next/standalone/server.js
