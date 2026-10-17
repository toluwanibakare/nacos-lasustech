<?php
/**
 * Photo crop maths shared (by spec) between the browser editor and the card
 * renderer. The browser must use the exact same formula, see
 * src/lib/photo-crop.ts, so the preview matches the printed card.
 *
 * A crop is ['zoom' => 1..5, 'cx' => 0..1, 'cy' => 0..1].
 * The visible area is a SQUARE of side min(W,H)/zoom centred on
 * (cx*W, cy*H), then shifted if needed so it stays inside the photo.
 */

const CROP_MIN_ZOOM = 1.0;
const CROP_MAX_ZOOM = 5.0;

/** Returns a clean crop array, or null when none/invalid is supplied. */
function parse_crop($zoom, $cx, $cy): ?array
{
    if ($zoom === null || $cx === null || $cy === null || $zoom === '' || $cx === '' || $cy === '') {
        return null;
    }
    if (!is_numeric($zoom) || !is_numeric($cx) || !is_numeric($cy)) {
        return null;
    }
    $zoom = (float) $zoom;
    $cx = (float) $cx;
    $cy = (float) $cy;
    if ($zoom < CROP_MIN_ZOOM || $zoom > CROP_MAX_ZOOM || $cx < 0 || $cx > 1 || $cy < 0 || $cy > 1) {
        return null;
    }
    return ['zoom' => $zoom, 'cx' => $cx, 'cy' => $cy];
}

/** Crop stored on a students/freshers row, or null for legacy rows. */
function crop_from_row(array $row): ?array
{
    return parse_crop($row['photo_zoom'] ?? null, $row['photo_cx'] ?? null, $row['photo_cy'] ?? null);
}

/**
 * Source rectangle (square) to copy out of a W x H photo.
 * Returns [srcX, srcY, side] as ints.
 */
function crop_source_square(int $w, int $h, ?array $crop): array
{
    $short = min($w, $h);

    if ($crop === null) {
        // Legacy behaviour: centred square, nudged up 15% for portrait photos.
        $side = $short;
        $x = (int) (($w - $side) / 2);
        $y = (int) (($h - $side) / 2);
        if ($h > $w) {
            $y = (int) max(0, $y - ($h - $w) * 0.15);
        }
        return [$x, $y, $side];
    }

    $side = $short / $crop['zoom'];
    $x = $crop['cx'] * $w - $side / 2;
    $y = $crop['cy'] * $h - $side / 2;
    $x = max(0.0, min($x, $w - $side));
    $y = max(0.0, min($y, $h - $side));

    return [(int) round($x), (int) round($y), (int) round($side)];
}
