<?php

namespace Tests\Unit;

use App\Support\ImageMetadata;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class ImageMetadataTest extends TestCase
{
    private function pngChunk(string $type, string $data): string
    {
        return pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
    }

    private function webpChunk(string $type, string $data): string
    {
        return $type.pack('V', strlen($data)).$data.(strlen($data) % 2 ? "\0" : '');
    }

    public function test_png_text_and_exif_chunks_are_removed(): void
    {
        $png = "\x89PNG\r\n\x1A\n"
            .$this->pngChunk('IHDR', str_repeat("\0", 13))
            .$this->pngChunk('tEXt', "Author\0Rina")
            .$this->pngChunk('eXIf', 'GPS')
            .$this->pngChunk('IDAT', 'pixels')
            .$this->pngChunk('IEND', '');

        $stripped = ImageMetadata::strip($png, 'image/png');

        $this->assertStringNotContainsString('Rina', $stripped);
        $this->assertStringNotContainsString('eXIf', $stripped);
        $this->assertStringContainsString('IDAT', $stripped);
        $this->assertStringEndsWith($this->pngChunk('IEND', ''), $stripped);
    }

    public function test_webp_exif_is_removed_and_the_header_stays_consistent(): void
    {
        $chunks = $this->webpChunk('VP8X', "\x0C".str_repeat("\0", 9))
            .$this->webpChunk('VP8 ', 'frame')
            .$this->webpChunk('EXIF', 'GPS-SECRET');
        $webp = 'RIFF'.pack('V', strlen($chunks) + 4).'WEBP'.$chunks;

        $stripped = ImageMetadata::strip($webp, 'image/webp');

        $this->assertStringNotContainsString('GPS-SECRET', $stripped);
        $this->assertSame(strlen($stripped) - 8, unpack('V', substr($stripped, 4, 4))[1]);
        // VP8X flags byte no longer claims EXIF or XMP
        $this->assertSame(0, ord($stripped[20]) & 0x0C);
    }

    public function test_a_file_that_is_not_the_claimed_type_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        ImageMetadata::strip('not an image', 'image/jpeg');
    }
}
