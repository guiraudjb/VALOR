# Configuration
$port = 8000
$url = "http://localhost:$port/"
$root = $PSScriptRoot

# Création du listener HTTP
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Serveur V.A.L.O.R. démarré sur : $url" -ForegroundColor Green
Write-Host "Dossier racine : $root" -ForegroundColor Gray
Write-Host "Fermez cette fenêtre pour arrêter le serveur." -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# Dictionnaire des types MIME (Indispensable pour que le navigateur comprenne les fichiers)
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".pdf"  = "application/pdf"
    ".json" = "application/json; charset=utf-8"
    ".ico"  = "image/x-icon"
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
