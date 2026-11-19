# Downloads every photo & video the Loadbay site uses into /assets, so nothing depends on hotlinks.
# Re-run any time:  powershell -ExecutionPolicy Bypass -File .\assets\fetch-assets.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$img = Join-Path $root "img"; $vid = Join-Path $root "video"
New-Item -ItemType Directory -Force $img, $vid | Out-Null

function Get-First($dest, $urls, $minKB) {
  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt ($minKB * 1KB))) { "SKIP $(Split-Path -Leaf $dest)"; return }
  foreach ($u in $urls) {
    curl.exe -sL -A "Mozilla/5.0" -o $dest $u
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt ($minKB * 1KB))) { "OK   $(Split-Path -Leaf $dest)  <- $u"; return }
  }
  if (Test-Path $dest) { Remove-Item $dest }
  "FAIL $(Split-Path -Leaf $dest)"
}

$U = "https://images.unsplash.com/photo-"
$Q = "?auto=format&fit=crop&w=1800&q=80"
$P = "?auto=format&fit=crop&w=600&h=600&q=80"

# Unsplash photos (Unsplash licence: free for commercial use). First working ID wins.
$images = [ordered]@{
  "hero-poster.jpg"   = @("1497366216548-37526070297c","1504384308090-c894fdcc538d","1556761175-b413da4baf72")
  "serve-b2b.jpg"     = @("1600880292203-757bb62b4baf","1542744173-8e7e53415bb0","1517245386807-bb43f82c33c4")
  "serve-agency.jpg"  = @("1522071820081-009f0129c71c","1519389950473-47ba0277781c","1551434678-e076c223a692")
  "serve-startup.jpg" = @("1556761175-b413da4baf72","1504384308090-c894fdcc538d","1521737604893-d14cc237f11d")
  "bay-web.jpg"       = @("1460925895917-afdab827c52f","1551288049-bebda4e38f71","1498050108023-c5249f4df085")
  "bay-eng.jpg"       = @("1461749280684-dccba630e2f6","1498050108023-c5249f4df085","1555066931-4365d14bab8c")
  "bay-growth.jpg"    = @("1551288049-bebda4e38f71","1460925895917-afdab827c52f","1543286386-713bdd548da4")
  "bay-auto.jpg"      = @("1531482615713-2afd69097998","1573164713988-8665fc963095","1551434678-e076c223a692")
  "work-1.jpg"        = @("1551434678-e076c223a692","1519389950473-47ba0277781c","1522071820081-009f0129c71c")
  "work-2.jpg"        = @("1552664730-d307ca884978","1553877522-43269d4ea984","1542744173-8e7e53415bb0")
  "work-3.jpg"        = @("1573164713988-8665fc963095","1531482615713-2afd69097998","1556157382-97eda2d62296")
  "work-4.jpg"        = @("1521737604893-d14cc237f11d","1517245386807-bb43f82c33c4","1600880292089-90a7e086ee0c")
  "partner.jpg"       = @("1553877522-43269d4ea984","1552664730-d307ca884978","1517245386807-bb43f82c33c4")
  "cta.jpg"           = @("1504384308090-c894fdcc538d","1497366216548-37526070297c","1556761175-b413da4baf72")
}
foreach ($k in $images.Keys) { Get-First (Join-Path $img $k) ($images[$k] | % { "$U$_$Q" }) 40 }

$people = [ordered]@{
  "p-1.jpg" = @("1507003211169-0a1dd7228f2d","1500648767791-00dcc994a43e")
  "p-2.jpg" = @("1494790108377-be9c29b29330","1438761681033-6461ffad8d80")
  "p-3.jpg" = @("1472099645785-5658abf4ff4e","1506794778202-cad84cf45f1d","1500648767791-00dcc994a43e")
  "p-4.jpg" = @("1544005313-94ddf0286df2","1534528741775-53994a69daeb","1438761681033-6461ffad8d80")
}
foreach ($k in $people.Keys) { Get-First (Join-Path $img $k) ($people[$k] | % { "$U$_$P" }) 15 }

# Mixkit stock videos (Mixkit licence: free for commercial use). First working ID wins.
$videos = [ordered]@{
  "hero-office.mp4" = @(918, 914, 917)        # busy startup office
  "code.mp4"        = @(41640, 1728, 41646)   # programmer at work
  "team.mp4"        = @(46680, 23043, 4809)   # brainstorming over the table
  "design.mp4"      = @(3257, 23043)          # two men working with design software
  "deal.mp4"        = @(32833, 46755, 4813)   # team closing a deal
  "datacenter.mp4"  = @(23375, 23158)         # engineers setting up a data center
  "call.mp4"        = @(4844, 4807)           # video call with a client
}
foreach ($k in $videos.Keys) {
  $urls = @(); foreach ($id in $videos[$k]) { $urls += "https://assets.mixkit.co/videos/$id/$id-720.mp4"; $urls += "https://assets.mixkit.co/videos/$id/$id-360.mp4" }
  Get-First (Join-Path $vid $k) $urls 200
}
"DONE"
