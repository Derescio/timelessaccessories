# Analyze Guest Checkout Logs
# This script analyzes the logs after E2E testing to verify all actions completed

param(
    [string]$LogFile = "guest-checkout-test-*.log"
)

Write-Host "📊 Analyzing Guest Checkout Logs" -ForegroundColor Cyan
Write-Host ""

# Find the most recent log file
$latestLog = Get-ChildItem -Path . -Filter $LogFile -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if (-not $latestLog) {
    Write-Host "❌ No log file found." -ForegroundColor Red
    exit 1
}

Write-Host "📄 Analyzing: $($latestLog.Name)" -ForegroundColor Green
$content = Get-Content $latestLog.FullName -Raw

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "CHECKLIST - Post-Payment Actions" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Check for each critical action
$checks = @{
    "1. Order Created (Guest)" = @("Creating guest order", "Guest email", "Order creation")
    "2. Payment Intent Created" = @("Payment intent", "payment_intent", "Stripe.*payment")
    "3. Payment Successful" = @("Payment.*successful", "Payment status.*succeeded", "payment.*succeeded")
    "4. Webhook Received" = @("WEBHOOK.*Starting", "WEBHOOK.*Event type", "checkout\.session\.completed")
    "5. Order Updated to PROCESSING" = @("Updating order to paid", "Order updated.*paid", "status.*PROCESSING")
    "6. Payment Record Created" = @("Payment.*COMPLETED", "payment.*status.*COMPLETED")
    "7. Stock Reduced" = @("reduceOrderStock", "reduceActualStock", "Stock updated", "Reducing stock")
    "8. Reserved Stock Released" = @("reservedStock.*decrement", "releasedReservedStock", "released.*reserved")
    "9. Email Sent" = @("Email sent", "Sending order confirmation", "Email.*successfully")
    "10. Cart Cleaned Up" = @("Cleaning up cart", "Cart cleaned", "cleanupCart", "Cart.*deleted")
    "11. Promotion Usage Recorded" = @("recordPromotionUsage", "Promotion usage.*recorded")
}

$allPassed = $true
foreach ($check in $checks.GetEnumerator()) {
    $found = $false
    foreach ($pattern in $check.Value) {
        if ($content -match $pattern) {
            $found = $true
            break
        }
    }
    
    if ($found) {
        Write-Host "✅ $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Key) - NOT FOUND" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "ERROR ANALYSIS" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Count errors
$errorLines = Select-String -Path $latestLog.FullName -Pattern "❌|Error|Failed|error" -CaseSensitive:$false
if ($errorLines) {
    Write-Host "⚠️  Found $($errorLines.Count) error/warning lines:" -ForegroundColor Yellow
    $errorLines | Select-Object -First 10 | ForEach-Object {
        Write-Host "   $($_.Line.Trim())" -ForegroundColor Red
    }
    if ($errorLines.Count -gt 10) {
        Write-Host "   ... and $($errorLines.Count - 10) more" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ No errors found in logs" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "WEBHOOK TIMELINE" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Extract webhook timeline
$webhookLines = Select-String -Path $latestLog.FullName -Pattern "WEBHOOK" | Select-Object -First 20
if ($webhookLines) {
    $webhookLines | ForEach-Object {
        $line = $_.Line
        if ($line -match "✅") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "❌") {
            Write-Host $line -ForegroundColor Red
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  No webhook logs found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

if ($allPassed) {
    Write-Host "✅ All critical actions completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Some actions may be missing. Review the checklist above." -ForegroundColor Red
}

Write-Host ""
Write-Host "📄 Full log file: $($latestLog.FullName)" -ForegroundColor Gray



