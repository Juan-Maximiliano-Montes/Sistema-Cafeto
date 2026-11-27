<#
.SYNOPSIS
    Expone el backend local de Django (Docker) con un túnel HTTPS de Cloudflare
    para que la SPA desplegada en Vercel pueda consumir /api/movil/ en vivo.

.DESCRIPTION
    1. Verifica que Django responda en http://127.0.0.1:<Puerto>.
    2. Busca cloudflared (PATH, Program Files o instalación de winget).
    3. Lanza `cloudflared tunnel --url http://localhost:<Puerto>` (Quick Tunnel,
       sin cuenta) y detecta la URL pública https://*.trycloudflare.com.
    4. Imprime exactamente qué cargar en Vercel y en settings.py de Django.
    El túnel queda abierto hasta presionar Ctrl+C (se cierra solo al salir).

.PARAMETER Puerto
    Puerto local de Django. Por defecto 8000.

.PARAMETER OrigenVercel
    URL pública de la app en Vercel (ej. https://sistema-cafeto.vercel.app),
    sólo para imprimir la línea exacta de CORS_ALLOWED_ORIGINS.

.PARAMETER SinVerificarBackend
    Omite la comprobación previa de Django (no recomendado).

.EXAMPLE
    npm run tunel

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/iniciar-tunel.ps1 -OrigenVercel https://sistema-cafeto.vercel.app
#>
[CmdletBinding()]
param(
    [int]$Puerto = 8000,
    [string]$OrigenVercel = 'https://<tu-proyecto>.vercel.app',
    [switch]$SinVerificarBackend
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

function Write-Paso([string]$Texto) { Write-Host "`n==> $Texto" -ForegroundColor Cyan }
function Write-Ok([string]$Texto) { Write-Host "    [OK] $Texto" -ForegroundColor Green }
function Write-Falla([string]$Texto) { Write-Host "    [X]  $Texto" -ForegroundColor Red }

# ---------------------------------------------------------------- 1. Backend
$urlLocal = "http://localhost:$Puerto"
if (-not $SinVerificarBackend) {
    Write-Paso "Verificando Django en http://127.0.0.1:$Puerto ..."
    $responde = $false
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:$Puerto/" -UseBasicParsing -TimeoutSec 6 -MaximumRedirection 0
        $responde = $true
    } catch [System.Net.WebException] {
        # Un 302 al login, un 403 o un 404 también prueban que Django está vivo.
        if ($_.Exception.Response) { $responde = $true }
    } catch {
        if ($_.Exception.Response) { $responde = $true }
    }

    if (-not $responde) {
        Write-Falla "Django no responde en el puerto $Puerto."
        Write-Host  "         Encendé Docker Desktop y levantá los contenedores:" -ForegroundColor Yellow
        Write-Host  "           docker start cafeto_db cafeto_web" -ForegroundColor Yellow
        Write-Host  "         (o 'docker compose up -d db web' desde la carpeta del backend)." -ForegroundColor Yellow
        exit 1
    }
    Write-Ok "Django responde en $urlLocal"
}

# ------------------------------------------------------------ 2. cloudflared
Write-Paso 'Buscando cloudflared ...'
$candidatos = @()
$enPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($enPath) { $candidatos += $enPath.Source }
$candidatos += @(
    (Join-Path $env:ProgramFiles 'cloudflared\cloudflared.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\cloudflared.exe')
)
$cloudflared = $candidatos | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $cloudflared) {
    Write-Falla 'cloudflared no está instalado.'
    Write-Host  '         Instalalo una sola vez con:' -ForegroundColor Yellow
    Write-Host  '           winget install --id Cloudflare.cloudflared' -ForegroundColor Yellow
    Write-Host  '         y abrí una terminal nueva antes de volver a ejecutar este script.' -ForegroundColor Yellow
    exit 1
}
Write-Ok "$cloudflared ($((& $cloudflared --version) -join ' '))"

# --------------------------------------------------------------- 3. Túnel
Write-Paso "Abriendo túnel HTTPS hacia $urlLocal (Ctrl+C para cerrarlo) ..."
$log = Join-Path ([System.IO.Path]::GetTempPath()) ("cafeto-tunel-{0}.log" -f [guid]::NewGuid().ToString('N'))
$logSalida = "$log.out"
$proceso = Start-Process -FilePath $cloudflared `
    -ArgumentList @('tunnel', '--no-autoupdate', '--url', $urlLocal) `
    -RedirectStandardError $log -RedirectStandardOutput $logSalida `
    -NoNewWindow -PassThru

try {
    $urlTunel = $null
    $limite = (Get-Date).AddSeconds(60)
    while (-not $urlTunel -and (Get-Date) -lt $limite -and -not $proceso.HasExited) {
        Start-Sleep -Milliseconds 500
        $texto = ''
        foreach ($archivo in @($log, $logSalida)) {
            if (Test-Path $archivo) { $texto += (Get-Content $archivo -Raw -ErrorAction SilentlyContinue) }
        }
        $coincidencia = [regex]::Match($texto, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($coincidencia.Success) { $urlTunel = $coincidencia.Value }
    }

    if (-not $urlTunel) {
        Write-Falla 'No se pudo obtener la URL del túnel. Salida de cloudflared:'
        foreach ($archivo in @($log, $logSalida)) {
            if (Test-Path $archivo) { Get-Content $archivo | Select-Object -Last 25 | ForEach-Object { Write-Host "         $_" } }
        }
        exit 1
    }

    $hostTunel = ([uri]$urlTunel).Host
    Write-Host ''
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host "   Túnel activo: $urlTunel" -ForegroundColor Green
    Write-Host '  ============================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host '  1) Vercel → Project → Settings → Environment Variables:' -ForegroundColor White
    Write-Host "       VITE_DJANGO_WEB = $urlTunel" -ForegroundColor Yellow
    Write-Host '     (VITE_API_URL es opcional: se arma sola como <VITE_DJANGO_WEB>/api/movil)' -ForegroundColor DarkGray
    Write-Host '     Después: Deployments → ... → Redeploy (Vite toma las variables al compilar).' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '  2) Django (settings.py del backend) y reiniciá cafeto_web:' -ForegroundColor White
    Write-Host "       CORS_ALLOWED_ORIGINS += ['$OrigenVercel']" -ForegroundColor Yellow
    Write-Host "       ALLOWED_HOSTS        += ['$hostTunel']   # o '.trycloudflare.com'" -ForegroundColor Yellow
    Write-Host "       CSRF_TRUSTED_ORIGINS += ['$urlTunel']   # sólo para el panel web de Django" -ForegroundColor Yellow
    Write-Host ''
    Write-Host "  3) Probá en el navegador: $urlTunel/api/movil/panel/ (debe responder 401 sin token)." -ForegroundColor White
    Write-Host ''
    Write-Host '  Cada vez que se reinicia el túnel la URL cambia: repetí los pasos 1 y 2.' -ForegroundColor DarkGray
    Write-Host '  Dejá esta ventana abierta durante la presentación. Ctrl+C cierra el túnel.' -ForegroundColor DarkGray
    Write-Host ''

    while (-not $proceso.HasExited) { Start-Sleep -Milliseconds 500 }
} finally {
    if ($proceso -and -not $proceso.HasExited) {
        Stop-Process -Id $proceso.Id -Force -ErrorAction SilentlyContinue
        Write-Host "`n    Túnel cerrado." -ForegroundColor Cyan
    }
    Remove-Item $log, $logSalida -Force -ErrorAction SilentlyContinue
}
