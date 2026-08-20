param(
  [string]$Source = 'C:\Users\topli\Desktop\olchi.png'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$publicRoot = Join-Path $repoRoot 'public'
$iconRoot = Join-Path $publicRoot 'icons'
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
New-Item -ItemType Directory -Path $iconRoot -Force | Out-Null

function New-ResizedBadge([System.Drawing.Bitmap]$SourceBitmap, [int]$Size) {
  $target = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  try {
    $graphics.Clear([System.Drawing.Color]::Black)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::GammaCorrected
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($SourceBitmap, (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size))
  } finally {
    $graphics.Dispose()
  }
  for ($y = 0; $y -lt $Size; $y++) {
    for ($x = 0; $x -lt $Size; $x++) {
      $pixel = $target.GetPixel($x, $y)
      if ($pixel.A -ne 255) {
        $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
      }
    }
  }
  return $target
}

# The source is navy line art on warm paper. For a Windows taskbar icon, keep
# the original drawing but convert the dark ink to white on an opaque black
# badge. This remains legible on both light and dark taskbars and avoids the
# low-contrast transparent navy icon Chrome previously cached.
$sourceBitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
$canvas = New-Object System.Drawing.Bitmap 640, 640, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
try {
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 247, 248, 246))
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $crop = [Math]::Min($sourceBitmap.Width, $sourceBitmap.Height)
  $sourceX = [int](($sourceBitmap.Width - $crop) / 2)
  $sourceY = [int](($sourceBitmap.Height - $crop) / 2)
  $graphics.DrawImage($sourceBitmap, (New-Object System.Drawing.Rectangle 14, 14, 612, 612),
    $sourceX, $sourceY, $crop, $crop, [System.Drawing.GraphicsUnit]::Pixel)
} finally {
  $graphics.Dispose()
  $sourceBitmap.Dispose()
}

$badge = New-Object System.Drawing.Bitmap 640, 640, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt 640; $y++) {
  for ($x = 0; $x -lt 640; $x++) {
    $pixel = $canvas.GetPixel($x, $y)
    $luma = (0.2126 * $pixel.R) + (0.7152 * $pixel.G) + (0.0722 * $pixel.B)
    if ($luma -ge 232) {
      $ink = 0
    } else {
      $ink = [Math]::Min(255, [Math]::Round((232 - $luma) * 1.55))
    }
    $badge.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $ink, $ink, $ink))
  }
}
$canvas.Dispose()

$masterPath = Join-Path $publicRoot 'olchi.png'
$badge.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)

$sizes = @(16, 24, 32, 48, 64, 128, 192, 256, 512)
foreach ($size in $sizes) {
  $resized = New-ResizedBadge $badge $size
  try {
    $resized.Save((Join-Path $iconRoot "olchi-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $resized.Dispose()
  }
}

foreach ($size in @(16, 32, 48)) {
  [System.IO.File]::Copy(
    (Join-Path $iconRoot "olchi-$size.png"),
    (Join-Path $iconRoot "olchi-dark-$size.png"),
    $true
  )
}

$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$payloads = @()
foreach ($size in $icoSizes) {
  # Unary comma keeps each PNG as one byte-array element; without it,
  # PowerShell flattens every payload into individual bytes.
  $payloads += ,([System.IO.File]::ReadAllBytes((Join-Path $iconRoot "olchi-$size.png")))
}
$icoPath = Join-Path $iconRoot 'olchi-favicon-v3.ico'
$stream = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
$writer = New-Object System.IO.BinaryWriter $stream
try {
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]$icoSizes.Count)
  $offset = 6 + (16 * $icoSizes.Count)
  for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $size = $icoSizes[$i]
    $writer.Write([byte]($(if ($size -eq 256) { 0 } else { $size })))
    $writer.Write([byte]($(if ($size -eq 256) { 0 } else { $size })))
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$payloads[$i].Length)
    $writer.Write([UInt32]$offset)
    $offset += $payloads[$i].Length
  }
  foreach ($payload in $payloads) { $writer.Write($payload) }
} finally {
  $writer.Dispose()
  $stream.Dispose()
  $badge.Dispose()
}

Write-Output "Generated Olchi taskbar icons from $sourcePath"
