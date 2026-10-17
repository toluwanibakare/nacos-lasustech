<?php
/**
 * ID card renderer (PHP GD). Ported from the old generate.php; the only
 * behavioural change is that the photo is cropped with the student's saved
 * crop settings (see crop.php) instead of always centre-cropping.
 * Template is 720x1080; the photo circle is centred at (374,469), radius 215.
 */
require_once __DIR__ . '/crop.php';

function card_open_image(string $path)
{
    if (!is_file($path)) {
        return null;
    }
    $mime = @mime_content_type($path);
    if ($mime === 'image/jpeg') return @imagecreatefromjpeg($path);
    if ($mime === 'image/png') return @imagecreatefrompng($path);
    if ($mime === 'image/webp' && function_exists('imagecreatefromwebp')) return @imagecreatefromwebp($path);
    return null;
}

function card_text_width(string $text, float $size, string $font): int
{
    $box = @imagettfbbox($size, 0, $font, $text);
    return $box === false ? 0 : abs($box[2] - $box[0]);
}

function card_fit_text(string $text, string $font, int $maxWidth, int $startSize, int $minSize = 18): int
{
    for ($size = $startSize; $size >= $minSize; $size--) {
        $w = card_text_width($text, $size, $font);
        if ($w > 0 && $w <= $maxWidth) return $size;
    }
    return $minSize;
}

function card_fonts(string $root): array
{
    $pick = static function (array $names) use ($root): ?string {
        foreach ($names as $n) {
            if (is_file("$root/assets/$n")) return "$root/assets/$n";
        }
        return null;
    };
    $black = $pick(['ariblk.ttf']);
    $bold = $pick(['arialbd.ttf', 'impact.ttf']);
    $regular = $pick(['arial.ttf']);
    $black = $black ?? $bold ?? $regular;
    $bold = $bold ?? $black ?? $regular;
    $regular = $regular ?? $bold;
    return ['black' => $black, 'bold' => $bold, 'regular' => $regular];
}

function card_draw_centered($card, float $size, int $y, int $color, string $font, string $text, int $passes = 1): void
{
    $x = (int) ((imagesx($card) - card_text_width($text, $size, $font)) / 2);
    if ($passes <= 1) {
        imagettftext($card, $size, 0, $x, $y, $color, $font, $text);
        return;
    }
    $offsets = [[0, 0], [1, 0], [0, 1], [1, 1]];
    if ($passes >= 3) {
        $offsets = array_merge($offsets, [[2, 0], [0, 2], [2, 1], [1, 2]]);
    }
    foreach ($offsets as [$ox, $oy]) {
        imagettftext($card, $size, 0, $x + $ox, $y + $oy, $color, $font, $text);
    }
}

function card_overlay_photo($card, $photo, int $cx, int $cy, int $radius, ?array $crop): void
{
    [$srcX, $srcY, $side] = crop_source_square(imagesx($photo), imagesy($photo), $crop);
    $d = $radius * 2;

    $tmp = imagecreatetruecolor($d, $d);
    imagealphablending($tmp, false);
    imagesavealpha($tmp, true);
    $clear = imagecolorallocatealpha($tmp, 0, 0, 0, 127);
    imagefill($tmp, 0, 0, $clear);
    imagecopyresampled($tmp, $photo, 0, 0, $srcX, $srcY, $d, $d, $side, $side);

    $rSq = $radius * $radius;
    $inner = ($radius - 1.5) * ($radius - 1.5);
    for ($py = 0; $py < $d; $py++) {
        $dy = $py - $radius;
        for ($px = 0; $px < $d; $px++) {
            $dx = $px - $radius;
            $distSq = $dx * $dx + $dy * $dy;
            if ($distSq > $rSq) {
                imagesetpixel($tmp, $px, $py, $clear);
            } elseif ($distSq > $inner) {
                $alpha = (int) min(127, max(0, (sqrt($distSq) - ($radius - 1.5)) / 1.5 * 127));
                $rgb = imagecolorat($tmp, $px, $py);
                imagesetpixel($tmp, $px, $py, imagecolorallocatealpha($tmp, ($rgb >> 16) & 0xFF, ($rgb >> 8) & 0xFF, $rgb & 0xFF, $alpha));
            }
        }
    }
    imagealphablending($card, true);
    imagecopy($card, $tmp, $cx - $radius, $cy - $radius, 0, 0, $d, $d);
    imagedestroy($tmp);
}

/**
 * Renders one student's card to $outputPath (PNG). The student row must have a
 * matric number; callers are responsible for refusing freshers without one.
 */
function card_render(array $student, string $outputPath, $templateBase, array $fonts, string $root): bool
{
    if (!$templateBase) return false;

    $rel = ltrim((string) $student['image_path'], '/');
    $photoPath = strpos($rel, 'uploads/') === 0 ? "$root/$rel" : "$root/uploads/$rel";
    $photo = card_open_image($photoPath);
    if (!$photo) return false;

    $card = imagecreatetruecolor(imagesx($templateBase), imagesy($templateBase));
    imagealphablending($card, false);
    imagesavealpha($card, true);
    imagecopy($card, $templateBase, 0, 0, 0, 0, imagesx($templateBase), imagesy($templateBase));
    imagealphablending($card, true);

    card_overlay_photo($card, $photo, 374, 469, 215, crop_from_row($student));
    imagedestroy($photo);

    $green = imagecolorallocate($card, 6, 96, 0);
    $white = imagecolorallocate($card, 255, 255, 255);
    imagefilledrectangle($card, 180, 802, 570, 915, $white);

    $fullName = strtoupper(trim((string) $student['full_name']));
    $matric = strtoupper(trim((string) $student['matric_no']));
    $post = trim((string) $student['post']);
    $level = trim((string) $student['level']);

    $parts = preg_split('/\s+/', $fullName, 2);
    $surname = $parts[0] ?? '';
    $others = $parts[1] ?? '';

    card_draw_centered($card, card_fit_text($surname, $fonts['black'], 600, 48, 28), 735, $green, $fonts['black'], $surname, 3);
    if ($others !== '') {
        card_draw_centered($card, card_fit_text($others, $fonts['bold'], 600, 31, 16), 775, $green, $fonts['bold'], $others);
    }
    $matricLine = 'MATRIC: ' . $matric;
    $postLine = 'POST: ' . $post . ', ' . $level . 'Lvl';
    card_draw_centered($card, card_fit_text($matricLine, $fonts['bold'], 600, 26, 16), 840, $green, $fonts['bold'], $matricLine);
    card_draw_centered($card, card_fit_text($postLine, $fonts['bold'], 600, 24, 16), 890, $green, $fonts['bold'], $postLine);

    $ok = imagepng($card, $outputPath);
    imagedestroy($card);
    return $ok;
}
