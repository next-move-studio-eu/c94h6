#!/usr/bin/env bash
set -e

# --- Configuration ---
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
AVIF_DIR="$ROOT_DIR/AVIF"
EXIFTOOL_BIN="$ROOT_DIR/exiftool/exiftool.exe"

PHOTO_MAX=2000
JPG_QUALITY=50

echo "--- STARTING CONVERSION ---"

# Check if exiftool exists
if [[ ! -f "$EXIFTOOL_BIN" ]]; then
    echo "ERROR: exiftool.exe not found at: $EXIFTOOL_BIN"
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi

mkdir -p "$AVIF_DIR"

echo "Clearing AVIF directory..."
rm -f "$AVIF_DIR"/*.avif

echo "Sorting images by date..."

# 1. We get all dates, sort them, and for each unique file we take the earliest date found.
# 2. Then we sort the final list of files by those dates.
files_to_process=$("$EXIFTOOL_BIN" -quiet -if '$FileType eq "JPEG" or $FileType eq "PNG"' \
    -p '$DateTimeOriginal|$Directory/$FileName' \
    -p '$CreateDate|$Directory/$FileName' \
    -p '$FileModifyDate|$Directory/$FileName' "$ROOT_DIR" 2>/dev/null \
    | sort -t'|' -k1,1 \
    | awk -F'|' '!seen[$2]++ {print $2}')

if [[ -z "$files_to_process" ]]; then
    echo "No JPG or PNG files found."
else
    counter=1
    echo "$files_to_process" | while IFS= read -r src; do
        [[ -z "$src" ]] || [[ ! -f "$src" ]] && continue
        [[ "$src" == "$AVIF_DIR"* ]] && continue

        filename="$(basename "$src")"
        ext="${filename##*.}"
        out="$AVIF_DIR/$counter.avif"

        case "${ext,,}" in
            jpg|jpeg)
                echo "[$counter] Converting: $filename"
                magick "$src" -resize "${PHOTO_MAX}x${PHOTO_MAX}>" -quality "$JPG_QUALITY" "$out"
                ((counter++))
                ;;
            png)
                echo "[$counter] Converting: $filename"
                magick "$src" -resize "${PHOTO_MAX}x${PHOTO_MAX}>" -define heic:lossless=true "$out"
                ((counter++))
                ;;
        esac
    done
    echo "---------------------------"
    echo "Done! Processed $((counter-1)) images."
fi

echo
read -n 1 -s -r -p "Press any key to exit..."
