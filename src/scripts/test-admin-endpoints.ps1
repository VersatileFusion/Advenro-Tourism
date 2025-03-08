$baseUrl = "http://localhost:3000/api/v1"

# Login and get token
$loginBody = @{
    email = "admin@tourism.com"
    password = "admin123456"
} | ConvertTo-Json

Write-Host "Logging in as admin..."
$loginResponse = Invoke-WebRequest -Method Post -Uri "$baseUrl/auth/login" -Body $loginBody -ContentType "application/json"
$token = ($loginResponse.Content | ConvertFrom-Json).token

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Function to make API requests
function Invoke-AdminEndpoint {
    param (
        [string]$method,
        [string]$endpoint,
        [string]$description,
        [object]$body = $null
    )
    
    Write-Host "`nTesting: $description"
    try {
        if ($body) {
            $response = Invoke-WebRequest -Method $method -Uri "$baseUrl$endpoint" -Headers $headers -Body ($body | ConvertTo-Json) -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Method $method -Uri "$baseUrl$endpoint" -Headers $headers -ErrorAction Stop
        }
        Write-Host "Success! Status: $($response.StatusCode)"
        Write-Host "Response: $($response.Content)"
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host "Error! Status: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Message: $($_.Exception.Message)"
        return $null
    }
}

# Test Dashboard endpoint
$dashboardResponse = Invoke-AdminEndpoint -method "GET" -endpoint "/admin/dashboard" -description "Admin Dashboard"

# Test Activity and Performance endpoints
$activityResponse = Invoke-AdminEndpoint -method "GET" -endpoint "/admin/activity" -description "User Activity Logs"
$userId = $activityResponse.data[0]._id
Write-Host "`nUsing user ID: $userId"

Invoke-AdminEndpoint -method "GET" -endpoint "/admin/performance" -description "System Performance Metrics"
Invoke-AdminEndpoint -method "GET" -endpoint "/admin/content" -description "Content Management Stats"

# Test User Management endpoints
$updateRoleBody = @{
    role = "admin"
}
Invoke-AdminEndpoint -method "PUT" -endpoint "/admin/users/$userId/role" -description "Update User Role" -body $updateRoleBody

$banUserBody = @{
    isBanned = $true
    reason = "Test ban"
}
Invoke-AdminEndpoint -method "PUT" -endpoint "/admin/users/$userId/ban" -description "Ban User" -body $banUserBody

# Test System Configuration endpoints
$configBody = @{
    maintenanceMode = $false
    allowNewRegistrations = $true
}
Invoke-AdminEndpoint -method "PUT" -endpoint "/admin/system/config" -description "Update System Configuration" -body $configBody

# Test Notification Management
$notificationBody = @{
    title = "Test Notification"
    message = "This is a test notification"
    type = "SYSTEM"
    userIds = @($userId)
}
Invoke-AdminEndpoint -method "POST" -endpoint "/admin/notifications/bulk" -description "Send Bulk Notifications" -body $notificationBody

# Test Audit Logs
Invoke-AdminEndpoint -method "GET" -endpoint "/admin/audit-logs" -description "Get Audit Logs"

Write-Host "`nAdmin endpoint testing completed!" 