Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("public/images/mediq-logo.png")
$bmp = New-Object System.Drawing.Bitmap 64, 64
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.DrawImage($img, 0, 0, 64, 64)
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = New-Object System.IO.FileStream("public/favicon.ico", [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp.Dispose()
$img.Dispose()
