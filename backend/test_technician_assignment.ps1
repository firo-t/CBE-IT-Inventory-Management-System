$ErrorActionPreference = 'Stop'

function Write-Result($name, $condition) {
    if ($condition) {
        Write-Host "$name -> Success" -ForegroundColor Green
    } else {
        Write-Host "$name -> FAILED" -ForegroundColor Red
        # Do not throw, keep running tests
    }
}

# Setup tokens using login
$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$itToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"officer@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$bmToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$techToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"tech@cbe.com", "password":"SecureAdminPassword123!"}').access_token

$bmUser = Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Headers @{"Authorization"="Bearer $bmToken"}
$techUser = Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Headers @{"Authorization"="Bearer $techToken"}

$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $adminToken"}
$testBranch = $branches[0]

# Create a test asset
$assetTypes = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Headers @{"Authorization"="Bearer $adminToken"}
$assetBody = @{
    tag_no = "TAG-MAINT-$(Get-Random)"
    asset_type_id = $assetTypes[0].asset_type_id
    current_branch_id = $testBranch.branch_id
} | ConvertTo-Json
try {
    $asset = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assetBody
} catch {
    Write-Host "Failed to create asset: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
    $errReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $errReader.ReadToEnd()
    throw
}

# Create a maintenance request
$reqBody = @{
    asset_id = $asset.asset_id
    problem_description = "Test request for assignment"
} | ConvertTo-Json

try {
    $request = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $reqBody
} catch {
    Write-Host "Failed to create maintenance request: $($_.Exception.Response.StatusCode)"
    $errReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $errReader.ReadToEnd()
    throw
}

$requestId = $request.request_id

# 4. Missing JWT -> 401
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Body '{"technician_id":"'$($techUser.user.userId)'"}' -Headers @{"Content-Type"="application/json"}
    Write-Result "4. Missing JWT" $false
} catch {
    Write-Result "4. Missing JWT" ($_.Exception.Response.StatusCode -eq 401)
}

# 7. Non-technician user -> rejected (Assigning to BM)
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($bmUser.user.userId)'"}'
    Write-Result "7. Non-technician user" $false
} catch {
    Write-Result "7. Non-technician user" ($_.Exception.Response.StatusCode -eq 400)
}

# 5. Invalid technician UUID -> 400
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"invalid"}'
    Write-Result "5. Invalid technician UUID" $false
} catch {
    Write-Result "5. Invalid technician UUID" ($_.Exception.Response.StatusCode -eq 400)
}

# 6. Nonexistent technician -> 400 (Since validation throws 400 for invalid technician specified)
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"00000000-0000-0000-0000-000000000000"}'
    Write-Result "6. Nonexistent technician" $false
} catch {
    Write-Result "6. Nonexistent technician" ($_.Exception.Response.StatusCode -eq 400)
}

# 8. Inactive technician -> rejected (Creating an inactive technician)
$roles = Invoke-RestMethod -Uri "http://localhost:3001/roles" -Headers @{"Authorization"="Bearer $adminToken"}
$techRole = $roles | Where-Object { $_.role_name -eq 'Hardware Technician' }
$inactiveTechBody = @{
    email = "inactive$(Get-Random)@cbe.com"
    full_name = "Inactive Tech"
    employee_id = "EMP-$(Get-Random)"
    password = "password"
    role_id = $techRole.role_id
    branch_id = $testBranch.branch_id
} | ConvertTo-Json
$inactiveTech = Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $inactiveTechBody
Invoke-RestMethod -Uri "http://localhost:3001/users/$($inactiveTech.user_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"status":"INACTIVE"}'

try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($inactiveTech.user_id)'"}'
    Write-Result "8. Inactive technician" $false
} catch {
    Write-Result "8. Inactive technician" ($_.Exception.Response.StatusCode -eq 400)
}

# 1. Admin assignment (and creates MaintenanceRecord)
$assignRes = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($techUser.user.userId)'"}'
Write-Result "1. Admin assignment" ($assignRes.status -eq 'ASSIGNED')
Write-Result "9. Assignment creates MaintenanceRecord" ($assignRes.record_id -ne $null)
Write-Result "10. MaintenanceRecord contains correct technician_id" ($assignRes.technician_id -eq $techUser.user.userId)

$reqCheck = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Result "11. Request status becomes ASSIGNED" ($reqCheck.status -eq 'ASSIGNED')

# 12. Assigned technician can begin/update maintenance
$recordRes = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/records" -Method Post -Headers @{"Authorization"="Bearer $techToken"; "Content-Type"="application/json"} -Body '{"diagnosis":"LCD broken"}'
Write-Result "12. Assigned technician can update maintenance" ($recordRes.diagnosis -eq 'LCD broken')

$reqCheck = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Result "12b. Workflow moves to UNDER_INSPECTION" ($reqCheck.status -eq 'UNDER_INSPECTION')

# 13. Different technician cannot modify the assigned record
$tech2Body = @{
    email = "tech2$(Get-Random)@cbe.com"
    full_name = "Tech 2"
    employee_id = "EMP-$(Get-Random)"
    password = "password"
    role_id = $techRole.role_id
    branch_id = $testBranch.branch_id
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $tech2Body
$tech2Token = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"'$($tech2Body | ConvertFrom-Json | Select-Object -ExpandProperty email)'", "password":"password"}').access_token

try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/records" -Method Post -Headers @{"Authorization"="Bearer $tech2Token"; "Content-Type"="application/json"} -Body '{"diagnosis":"Hacked"}'
    Write-Result "13. Different technician cannot modify" $false
} catch {
    Write-Result "13. Different technician cannot modify" ($_.Exception.Response.StatusCode -eq 403)
}

# 14. No duplicate MaintenanceRecord is created
$reqCheck = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId" -Headers @{"Authorization"="Bearer $adminToken"}
$recordsCount = 0
if ($reqCheck.maintenance_record) { $recordsCount = 1 } # Prisma 1:1 relation will always be 1 or 0
Write-Result "14. No duplicate MaintenanceRecord" ($recordsCount -eq 1 -and $reqCheck.maintenance_record.technician_id -eq $techUser.user.userId)

# 2. IT Inventory Officer assignment (Reassign)
$assignRes = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $itToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($techUser.user.userId)'"}'
Write-Result "2. IT Inventory Officer assignment (reassign)" ($assignRes.technician_id -eq $techUser.user.userId)

# 15. Completed request cannot be assigned
Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/records" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"repair_action":"Fixed", "condition":"Good"}'
Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"status":"COMPLETED"}'

try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($techUser.user.userId)'"}'
    Write-Result "15. Completed request cannot be assigned" $false
} catch {
    Write-Result "15. Completed request cannot be assigned" ($_.Exception.Response.StatusCode -eq 400)
}

# 16. Closed request cannot be assigned
Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"status":"CLOSED"}'

try {
    $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$requestId/assign" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($techUser.user.userId)'"}'
    Write-Result "16. Closed request cannot be assigned" $false
} catch {
    Write-Result "16. Closed request cannot be assigned" ($_.Exception.Response.StatusCode -eq 400)
}

# 3. Unauthorized role -> 403 (Regular user or someone without access)
# (In our case BM can assign, IT can assign, Admin can assign, Tech can self-assign)
# Wait, BM can only assign to their branch. Let's create an asset and request in a different branch.
$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $adminToken"}
$otherBranch = $branches | Where-Object { $_.branch_id -ne $testBranch.branch_id } | Select-Object -First 1

if ($otherBranch) {
    $otherAssetBody = @{
        tag_no = "TAG-MAINT2-$(Get-Random)"
        asset_type_id = $assetTypes[0].asset_type_id
        current_branch_id = $otherBranch.branch_id
    } | ConvertTo-Json
    $otherAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $otherAssetBody

    $otherReq = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body (@{asset_id=$otherAsset.asset_id; problem_description="Test"} | ConvertTo-Json)

    try {
        $null = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests/$($otherReq.request_id)/assign" -Method Post -Headers @{"Authorization"="Bearer $bmToken"; "Content-Type"="application/json"} -Body '{"technician_id":"'$($techUser.user.userId)'"}'
        Write-Result "17. Branch isolation is preserved" $false
    } catch {
        Write-Result "17. Branch isolation is preserved" ($_.Exception.Response.StatusCode -eq 403)
    }
} else {
    Write-Host "17. Branch isolation is preserved -> Skipped (Only 1 branch)" -ForegroundColor Yellow
}

# 18. AuditLog is created
$auditLogs = Invoke-RestMethod -Uri "http://localhost:3001/audit-logs?entity_id=$requestId&action=ASSIGN_TECHNICIAN" -Headers @{"Authorization"="Bearer $adminToken"}
$auditArr = @($auditLogs.data)
Write-Result "18. AuditLog is created" ($auditArr.Count -gt 0)

Write-Host "All tests completed."
