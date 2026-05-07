Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("public/images/mediq-logo.png")
$bmp = New-Object System.Drawing.Bitmap 600, 600
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.DrawImage($img, 0, 0, 600, 600)
$bmp.Save("public/images/mediq-logo-small.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
