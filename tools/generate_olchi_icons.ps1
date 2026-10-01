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

function New-ResizedIcon([System.Drawing.Bitmap]$SourceBitmap, [int]$Size) {
  $target = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::GammaCorrected
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($SourceBitmap, (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size))
  } finally {
    $graphics.Dispose()
  }
  # At taskbar sizes, strengthen only the antialiased alpha edge. The geometry
  # and navy color stay untouched, but thin whiskers survive Windows scaling.
  if ($Size -le 48) {
    for ($y = 0; $y -lt $Size; $y++) {
      for ($x = 0; $x -lt $Size; $x++) {
        $pixel = $target.GetPixel($x, $y)
        if ($pixel.A -gt 0 -and $pixel.A -lt 255) {
          $strongerAlpha = [int][Math]::Round([Math]::Pow($pixel.A / 255.0, 0.72) * 255)
          $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($strongerAlpha, $pixel.R, $pixel.G, $pixel.B))
        }
      }
    }
  }
  return $target
}

function New-LightInkIcon([System.Drawing.Bitmap]$SourceBitmap, [int]$Size) {
  $target = New-ResizedIcon $SourceBitmap $Size
  for ($y = 0; $y -lt $Size; $y++) {
    for ($x = 0; $x -lt $Size; $x++) {
      $pixel = $target.GetPixel($x, $y)
      if ($pixel.A -gt 0) {
        # Preserve the exact source geometry and antialiased alpha; only the
        # ink colour changes for dark browser chrome.
        $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255))
      }
    }
  }
  return $target
}

# The source is flat navy artwork anti-aliased against a pale background.
# Recover the original navy ink as RGBA instead of inverting it: the distance
# from the known background to each pixel becomes alpha, while the ink color
# stays the source's dark navy. This preserves the exact drawing on a genuinely
# transparent canvas and avoids a second lossy redraw.
$background = [System.Drawing.Color]::FromArgb(246, 248, 249)
$ink = [System.Drawing.Color]::FromArgb(31, 57, 89)
$sourceBitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
$transparentSource = New-Object System.Drawing.Bitmap $sourceBitmap.Width, $sourceBitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$minX = $sourceBitmap.Width
$minY = $sourceBitmap.Height
$maxX = -1
$maxY = -1
try {
  for ($y = 0; $y -lt $sourceBitmap.Height; $y++) {
    for ($x = 0; $x -lt $sourceBitmap.Width; $x++) {
      $pixel = $sourceBitmap.GetPixel($x, $y)
      $alphaR = ($background.R - $pixel.R) / [double]($background.R - $ink.R)
      $alphaG = ($background.G - $pixel.G) / [double]($background.G - $ink.G)
      $alphaB = ($background.B - $pixel.B) / [double]($background.B - $ink.B)
      $alpha = [Math]::Max(0, [Math]::Min(1, ($alphaR + $alphaG + $alphaB) / 3))
      if ($alpha -lt 0.012) { $alphaByte = 0 }
      elseif ($alpha -gt 0.988) { $alphaByte = 255 }
      else { $alphaByte = [int][Math]::Round($alpha * 255) }
      $transparentSource.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alphaByte, $ink.R, $ink.G, $ink.B))
      if ($alphaByte -ge 8) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
} finally {
  $sourceBitmap.Dispose()
}

$contentWidth = $maxX - $minX + 1
$contentHeight = $maxY - $minY + 1
$cropSize = [Math]::Min([Math]::Min($transparentSource.Width, $transparentSource.Height), [Math]::Max($contentWidth, $contentHeight) + 8)
$centerX = ($minX + $maxX) / 2
$centerY = ($minY + $maxY) / 2
$sourceX = [Math]::Max(0, [Math]::Min($transparentSource.Width - $cropSize, [int][Math]::Floor($centerX - ($cropSize / 2))))
$sourceY = [Math]::Max(0, [Math]::Min($transparentSource.Height - $cropSize, [int][Math]::Floor($centerY - ($cropSize / 2))))

$master = New-Object System.Drawing.Bitmap 512, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($master)
try {
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::GammaCorrected
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($transparentSource, (New-Object System.Drawing.Rectangle 0, 0, 512, 512),
    $sourceX, $sourceY, $cropSize, $cropSize, [System.Drawing.GraphicsUnit]::Pixel)
} finally {
  $graphics.Dispose()
  $transparentSource.Dispose()
}

$masterPath = Join-Path $publicRoot 'olchi.png'
$master.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)

$sizes = @(16, 24, 32, 48, 64, 128, 192, 256, 512)
foreach ($size in $sizes) {
  $resized = New-ResizedIcon $master $size
  try {
    $resized.Save((Join-Path $iconRoot "olchi-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $resized.Dispose()
  }
}

foreach ($size in @(16, 32, 48)) {
  $darkIcon = New-LightInkIcon $master $size
  try {
    $darkIcon.Save((Join-Path $iconRoot "olchi-dark-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $darkIcon.Dispose()
  }
}

$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$payloads = @()
foreach ($size in $icoSizes) {
  # Unary comma keeps each PNG as one byte-array element; without it,
  # PowerShell flattens every payload into individual bytes.
  $payloads += ,([System.IO.File]::ReadAllBytes((Join-Path $iconRoot "olchi-$size.png")))
}
$icoPath = Join-Path $iconRoot 'olchi-favicon-v4.ico'
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
}

$darkIcoSizes = @(16, 32, 48)
$darkPayloads = @()
foreach ($size in $darkIcoSizes) {
  $darkPayloads += ,([System.IO.File]::ReadAllBytes((Join-Path $iconRoot "olchi-dark-$size.png")))
}
$darkIcoPath = Join-Path $iconRoot 'olchi-favicon-dark-v1.ico'
$darkStream = [System.IO.File]::Open($darkIcoPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
$darkWriter = New-Object System.IO.BinaryWriter $darkStream
try {
  $darkWriter.Write([UInt16]0)
  $darkWriter.Write([UInt16]1)
  $darkWriter.Write([UInt16]$darkIcoSizes.Count)
  $offset = 6 + (16 * $darkIcoSizes.Count)
  for ($i = 0; $i -lt $darkIcoSizes.Count; $i++) {
    $size = $darkIcoSizes[$i]
    $darkWriter.Write([byte]$size)
    $darkWriter.Write([byte]$size)
    $darkWriter.Write([byte]0)
    $darkWriter.Write([byte]0)
    $darkWriter.Write([UInt16]1)
    $darkWriter.Write([UInt16]32)
    $darkWriter.Write([UInt32]$darkPayloads[$i].Length)
    $darkWriter.Write([UInt32]$offset)
    $offset += $darkPayloads[$i].Length
  }
  foreach ($payload in $darkPayloads) { $darkWriter.Write($payload) }
} finally {
  $darkWriter.Dispose()
  $darkStream.Dispose()
  $master.Dispose()
}

Write-Output "Generated source-faithful navy app icons and white dark-chrome favicons from $sourcePath"
