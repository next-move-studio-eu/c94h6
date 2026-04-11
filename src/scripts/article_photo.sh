#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
AVIF_DIR="$ROOT_DIR/AVIF"

THUMB_MAX=640
PHOTO_MAX=1920

JPG_QUALITY=50

echo "Root dir: $ROOT_DIR"
echo "AVIF dir: $AVIF_DIR"

mkdir -p "$AVIF_DIR"

echo "Clearing AVIF directory..."
rm -f "$AVIF_DIR"/*

echo
echo "Converting images..."

echo
echo "Converting images..."

while IFS= read -r -d '' src; do
  filename="$(basename "$src")"
  base="${filename%.*}"
  ext="${filename##*.}"

  if [[ "$base" == *Thumbnail* ]]; then
    max="$THUMB_MAX"
    kind="THUMBNAIL"
  else
    max="$PHOTO_MAX"
    kind="PHOTO"
  fi

  out="$AVIF_DIR/$base.avif"

  case "${ext,,}" in
    jpg|jpeg)
      echo "$kind: $filename -> $out (lossy q=$JPG_QUALITY, max=${max}px)"
      magick "$src" -resize "${max}x${max}>" -quality "$JPG_QUALITY" "$out"
      ;;
    png)
      echo "$kind: $filename -> $out (lossless, max=${max}px)"
      magick "$src" -resize "${max}x${max}>" -define heic:lossless=true "$out"
      ;;
    *)
      echo "Skipping (unknown ext): $filename"
      ;;
  esac
done < <(
  find "$ROOT_DIR" \
    -maxdepth 1 \
    -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) \
    -print0
)


echo
read -n 1 -s -r -p "Press any key to exit..."
