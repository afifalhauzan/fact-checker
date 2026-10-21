<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Removes metadata (EXIF with GPS location, XMP, text chunks) from uploaded images without
 * re-encoding them, so the published picture is pixel-identical to the one that was analyzed.
 */
class ImageMetadata
{
    public const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public static function strip(string $bytes, string $mime): string
    {
        return match ($mime) {
            'image/jpeg' => self::stripJpeg($bytes),
            'image/png' => self::stripPng($bytes),
            'image/webp' => self::stripWebp($bytes),
            default => throw new InvalidArgumentException("Unsupported image type: {$mime}"),
        };
    }

    private static function stripJpeg(string $bytes): string
    {
        if (substr($bytes, 0, 2) !== "\xFF\xD8") {
            throw new InvalidArgumentException('Not a JPEG file');
        }

        $out = "\xFF\xD8";
        $offset = 2;
        $length = strlen($bytes);

        while ($offset + 4 <= $length && $bytes[$offset] === "\xFF") {
            $marker = ord($bytes[$offset + 1]);

            // Start of scan: the compressed image data follows, with no more metadata segments
            if ($marker === 0xDA) {
                return $out.substr($bytes, $offset);
            }

            $size = unpack('n', substr($bytes, $offset + 2, 2))[1];
            $segment = substr($bytes, $offset, $size + 2);

            // APP1 (EXIF, XMP), APP13 (IPTC) and comments can hold location and personal data
            if (! in_array($marker, [0xE1, 0xED, 0xFE], true)) {
                $out .= $segment;
            }

            $offset += $size + 2;
        }

        throw new InvalidArgumentException('Malformed JPEG file');
    }

    private static function stripPng(string $bytes): string
    {
        $signature = "\x89PNG\r\n\x1A\n";
        if (substr($bytes, 0, 8) !== $signature) {
            throw new InvalidArgumentException('Not a PNG file');
        }

        $out = $signature;
        $offset = 8;
        $length = strlen($bytes);

        while ($offset + 12 <= $length) {
            $size = unpack('N', substr($bytes, $offset, 4))[1];
            $type = substr($bytes, $offset + 4, 4);

            if (! in_array($type, ['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'], true)) {
                $out .= substr($bytes, $offset, $size + 12);
            }

            $offset += $size + 12;
            if ($type === 'IEND') {
                return $out;
            }
        }

        throw new InvalidArgumentException('Malformed PNG file');
    }

    private static function stripWebp(string $bytes): string
    {
        if (substr($bytes, 0, 4) !== 'RIFF' || substr($bytes, 8, 4) !== 'WEBP') {
            throw new InvalidArgumentException('Not a WebP file');
        }

        $chunks = '';
        $offset = 12;
        $length = strlen($bytes);

        while ($offset + 8 <= $length) {
            $type = substr($bytes, $offset, 4);
            $size = unpack('V', substr($bytes, $offset + 4, 4))[1];
            $chunk = substr($bytes, $offset, 8 + $size + ($size % 2));

            if ($type === 'VP8X') {
                // Clear the "has EXIF" and "has XMP" flags, since those chunks are dropped
                $chunk[8] = chr(ord($chunk[8]) & ~0x0C);
            }
            if ($type !== 'EXIF' && $type !== 'XMP ') {
                $chunks .= $chunk;
            }

            $offset += 8 + $size + ($size % 2);
        }

        return 'RIFF'.pack('V', strlen($chunks) + 4).'WEBP'.$chunks;
    }
}
