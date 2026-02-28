# Configuration
$port = 8000
$url = "http://localhost:$port/"
$root = $PSScriptRoot

# Création du listener HTTP
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

# Vérification si le port est libre avant de démarrer
try {
    $listener.Start()
} catch {
    Write-Host "Erreur : Le port $port est probablement déjà utilisé par une autre application." -ForegroundColor Red
    Write-Host "Fermez l'autre application ou modifiez la variable `$port au début de ce script." -ForegroundColor Yellow
    Pause
    exit
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Serveur V.A.L.O.R. démarré sur : $url" -ForegroundColor Green
Write-Host "Dossier racine : $root" -ForegroundColor Gray
Write-Host "Fermez cette fenêtre pour arrêter le serveur." -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# --- LANCEMENT AUTOMATIQUE DU NAVIGATEUR ---
# Choix du navigateur : "msedge.exe" (Edge) ou "chrome.exe" (Chrome)
$browser = "msedge.exe" 

# Arguments : Plein écran (--start-fullscreen) et Zoom global à 77% (--force-device-scale-factor=0.77)
$browserArgs = "--start-fullscreen", "--force-device-scale-factor=0.77", "$url"

Write-Host "Lancement du navigateur..." -ForegroundColor Cyan
Start-Process $browser -ArgumentList $browserArgs
# -------------------------------------------

# Dictionnaire des types MIME étendu (Indispensable pour le navigateur et le DSFR)
$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".csv"   = "text/csv; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".pdf"   = "application/pdf"
    ".json"  = "application/json; charset=utf-8"
    ".ico"   = "image/x-icon"
    ".svg"   = "image/svg+xml"       # Pour les icônes vectorielles DSFR
    ".woff"  = "font/woff"           # Pour les polices DSFR
    ".woff2" = "font/woff2"          # Pour les polices modernes DSFR
    ".ttf"   = "font/ttf"            # Pour les polices standards
    ".eot"   = "application/vnd.ms-fontobject" # Pour compatibilité ancienne
}

try {
    while ($listener.IsListening) {
        # Attente d'une connexion
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Nettoyage du chemin de fichier
        $localPath = $root + $request.Url.LocalPath.Replace('/', '\')
        
        # Si c'est un dossier, chercher index.html
        if ((Test-Path $localPath -PathType Container)) {
            $localPath = Join-Path $localPath "index.html"
        }

        if (Test-Path $localPath -PathType Leaf) {
            # Lecture du fichier
            $content = [System.IO.File]::ReadAllBytes($localPath)
            
            # Détection du type MIME
            $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
            if ($mimeTypes.ContainsKey($extension)) {
                $response.ContentType = $mimeTypes[$extension]
            } else {
                $response.ContentType = "application/octet-stream"
            }

            # Envoi de la réponse
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
            Write-Host "200 OK  : $($request.Url.LocalPath)" -ForegroundColor Green
        } else {
            # Fichier non trouvé (404)
            $response.StatusCode = 404
            Write-Host "404 ERR : $($request.Url.LocalPath)" -ForegroundColor Red
        }

        $response.Close()
    }
} catch {
    Write-Host "Arrêt du serveur."
} finally {
    $listener.Stop()
}
