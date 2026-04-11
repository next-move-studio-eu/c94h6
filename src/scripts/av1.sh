#!/bin/bash

read -p "File: " IN
read -p "Height (540 / 720): " RES
read -p "From (in seconds): " FROM
read -p "To (in seconds): " TO
read -p "Speed (0-8, 6=fast, 4=quality): " CPU
read -p "FPS: " FPS

OUT="${IN%.*}_web.webm"

ffmpeg -i "$IN" -ss "$FROM" -to "$TO" \
    -vf "scale=-1:$RES" -r "$FPS" \
    -c:v libaom-av1 \
    -crf 33 -b:v 0 \
    -cpu-used "$CPU" \
    -tiles 2x2 \
    -c:a libopus -b:a 48k \
    -movflags +faststart \
    "$OUT"

echo "---"
echo "Done: $OUT"
du -h "$OUT"