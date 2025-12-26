# Monitor Guest Checkout Logs
# This script helps monitor the logs during E2E guest checkout testing

param(
    [string]$LogFile = "guest-checkout-test-*.log"
)

Write-Host "🔍 Monitoring guest checkout logs..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host ""

# Find the most recent log file
$latestLog = Get-ChildItem -Path . -Filter $LogFile -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if (-not $latestLog) {
    Write-Host "❌ No log file found. Make sure the server is running with logging enabled." -ForegroundColor Red
    exit 1
}

Write-Host "📄 Monitoring log file: $($latestLog.Name)" -ForegroundColor Green
Write-Host "📊 File size: $([math]::Round($latestLog.Length / 1KB, 2)) KB" -ForegroundColor Gray
Write-Host ""

# Key log patterns to highlight
$keyPatterns = @{
    "Order Creation" = "Order creation|Creating guest order|Guest email"
    "Payment Processing" = "Payment Success|Payment intent|payment_intent"
    "Webhook Received" = "WEBHOOK.*Starting|WEBHOOK.*Event type"
    "Order Updated" = "Order updated|Updating order to paid"
    "Stock Reduction" = "reduceOrderStock|reduceActualStock|Stock updated"
    "Email Sent" = "Email sent|Sending order confirmation"
    "Promotion Usage" = "recordPromotionUsage|Promotion usage"
    "Cart Cleanup" = "Cleaning up cart|Cart cleaned|cleanupCart"
    "ERROR" = "❌|Error|Failed|error"
    "SUCCESS" = "✅|Success|successfully"
}

# Monitor the log file
$lastPosition = 0
while ($true) {
    if (Test-Path $latestLog.FullName) {
        $currentSize = (Get-Item $latestLog.FullName).Length
        
        if ($currentSize -gt $lastPosition) {
            $stream = [System.IO.File]::Open($latestLog.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            $stream.Position = $lastPosition
            $reader = New-Object System.IO.StreamReader($stream)
            
            while ($null -ne ($line = $reader.ReadLine())) {
                # Check for key patterns and color code
                $color = "White"
                $matched = $false
                
                foreach ($pattern in $keyPatterns.GetEnumerator()) {
                    if ($line -match $pattern.Value) {
                        $matched = $true
                        switch ($pattern.Key) {
                            "ERROR" { $color = "Red"; break }
                            "SUCCESS" { $color = "Green"; break }
                            "Order Creation" { $color = "Cyan"; break }
                            "Payment Processing" { $color = "Yellow"; break }
                            "Webhook Received" { $color = "Magenta"; break }
                            "Stock Reduction" { $color = "Blue"; break }
                            "Email Sent" { $color = "Green"; break }
                            default { $color = "Gray"; break }
                        }
                        Write-Host "[$($pattern.Key)] " -NoNewline -ForegroundColor $color
                        break
                    }
                }
                
                if (-not $matched) {
                    $color = "White"
                }
                
                Write-Host $line -ForegroundColor $color
            }
            
            $lastPosition = $stream.Position
            $reader.Close()
            $stream.Close()
        }
    }
    
    Start-Sleep -Milliseconds 500
}



