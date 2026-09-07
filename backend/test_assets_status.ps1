$ErrorActionPreference = "Stop"

$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$officerToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"officer@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$techToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"tech@cbe.com", "password":"SecureAdminPassword123!"}').access_token

# Get an AssetType ID
$assetTypes = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Headers @{"Authorization"="Bearer $adminToken"}
$assetTypeId = $assetTypes[0].asset_type_id

# 1. Missing JWT -> 401
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/00000000-0000-0000-0000-000000000000/status" -Method Patch -Body '{}' -Headers @{"Content-Type"="application/json"}
    Write-Host "1. Missing JWT -> FAILED (Expected 401)"
} catch {
    Write-Host "1. Missing JWT -> $($_.Exception.Response.StatusCode)"
}

# Create a test asset
$randomExt = Get-Random -Maximum 999999
$assetBody = @{tag_no="AST-STAT-$randomExt"; serial_no="STAT$randomExt"; asset_type_id=$assetTypeId} | ConvertTo-Json
$asset = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assetBody

# 7. Branch Manager -> 403
$statusBody = @{status="DAMAGED"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $mgrToken"; "Content-Type"="application/json"} -Body $statusBody
    Write-Host "7. Branch Manager -> FAILED (Expected 403)"
} catch {
    Write-Host "7. Branch Manager -> $($_.Exception.Response.StatusCode)"
}

# 8. Hardware Technician -> 403
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $techToken"; "Content-Type"="application/json"} -Body $statusBody
    Write-Host "8. Hardware Technician -> FAILED (Expected 403)"
} catch {
    Write-Host "8. Hardware Technician -> $($_.Exception.Response.StatusCode)"
}

# 9. Invalid status -> 400
$invalidStatusBody = @{status="INVALID_STATUS"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $invalidStatusBody
    Write-Host "9. Invalid status -> FAILED (Expected 400)"
} catch {
    Write-Host "9. Invalid status -> $($_.Exception.Response.StatusCode)"
}

# 12. Cannot manually set AVAILABLE -> 400
$availableBody = @{status="AVAILABLE"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $availableBody
    Write-Host "12. Cannot manually set AVAILABLE -> FAILED (Expected 400)"
} catch {
    Write-Host "12. Cannot manually set AVAILABLE -> $($_.Exception.Response.StatusCode)"
}

# 13. Cannot manually set ASSIGNED -> 400
$assignedBody = @{status="ASSIGNED"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assignedBody
    Write-Host "13. Cannot manually set ASSIGNED -> FAILED (Expected 400)"
} catch {
    Write-Host "13. Cannot manually set ASSIGNED -> $($_.Exception.Response.StatusCode)"
}

# 14. Cannot manually set IN_TRANSIT -> 400
$inTransitBody = @{status="IN_TRANSIT"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $inTransitBody
    Write-Host "14. Cannot manually set IN_TRANSIT -> FAILED (Expected 400)"
} catch {
    Write-Host "14. Cannot manually set IN_TRANSIT -> $($_.Exception.Response.StatusCode)"
}

# 15. Cannot manually set UNDER_MAINTENANCE -> 400
$maintBody = @{status="UNDER_MAINTENANCE"} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $maintBody
    Write-Host "15. Cannot manually set UNDER_MAINTENANCE -> FAILED (Expected 400)"
} catch {
    Write-Host "15. Cannot manually set UNDER_MAINTENANCE -> $($_.Exception.Response.StatusCode)"
}

# 10. Invalid asset UUID -> 400
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/invalid-uuid-format/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $statusBody
    Write-Host "10. Invalid asset UUID -> FAILED (Expected 400)"
} catch {
    Write-Host "10. Invalid asset UUID -> $($_.Exception.Response.StatusCode)"
}

# 11. Nonexistent asset -> 404
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assets/00000000-0000-0000-0000-000000000000/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $statusBody
    Write-Host "11. Nonexistent asset -> FAILED (Expected 404)"
} catch {
    Write-Host "11. Nonexistent asset -> $($_.Exception.Response.StatusCode)"
}

# 2. Admin -> can mark asset DAMAGED
$damagedBody = @{status="DAMAGED"} | ConvertTo-Json
$damagedRes = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $damagedBody
Write-Host "2. Admin -> can mark asset DAMAGED -> $($damagedRes.status)"

# 6. IT Inventory Officer -> can change status (LOST)
$lostBody = @{status="LOST"} | ConvertTo-Json
$lostRes = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $officerToken"; "Content-Type"="application/json"} -Body $lostBody
Write-Host "6. IT Inventory Officer -> can change status -> $($lostRes.status)"

# 3. Admin -> can mark asset RETIRED
$retiredBody = @{status="RETIRED"} | ConvertTo-Json
$retiredRes = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $retiredBody
Write-Host "3. Admin -> can mark asset RETIRED -> $($retiredRes.status)"

# 4. Admin -> can mark asset DISPOSED
$disposedBody = @{status="DISPOSED"} | ConvertTo-Json
$disposedRes = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)/status" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $disposedBody
Write-Host "4. Admin -> can mark asset DISPOSED -> $($disposedRes.status)"

# Get branches for assignment/dispatch tests
$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $adminToken"}
$branchId = $branches[0].branch_id

# Create test employee details
$employee = @{employee_id="EMP-STAT-001"; full_name="Test Emp"}

# 21. LOST/RETIRED/DISPOSED assets cannot subsequently be assigned -> 400
$assignmentBody = @{asset_id=$asset.asset_id; branch_id=$branchId; employee_id=$employee.employee_id; employee_name=$employee.full_name} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assignmentBody
    Write-Host "21. Terminal assets cannot subsequently be assigned -> FAILED (Expected 400)"
} catch {
    Write-Host "21. Terminal assets cannot subsequently be assigned -> $($_.Exception.Response.StatusCode)"
}

# 22. LOST/RETIRED/DISPOSED assets cannot subsequently be dispatched -> 400
$dispatchBody = @{
    asset_id=$asset.asset_id; 
    destination_branch_id=$branchId; 
    source_location="HQ";
    receiver_name="Test Receiver";
    receiver_id="REC001";
    receiver_phone="1234567890";
    dispatched_by=$employee.full_name
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/dispatches" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $dispatchBody
    Write-Host "22. Terminal assets cannot subsequently be dispatched -> FAILED (Expected 400)"
} catch {
    Write-Host "22. Terminal assets cannot subsequently be dispatched -> $($_.Exception.Response.StatusCode)"
}

# Setup an asset for workflow tests
$workflowAssetBody = @{tag_no="AST-WF-$randomExt"; serial_no="WF$randomExt"; asset_type_id=$assetTypeId} | ConvertTo-Json
$workflowAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $workflowAssetBody

# 16. Existing assignment workflow still works
$validAssignmentBody = @{asset_id=$workflowAsset.asset_id; branch_id=$branchId; employee_id=$employee.employee_id; employee_name=$employee.full_name} | ConvertTo-Json
$assignment = Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $validAssignmentBody
Write-Host "16. Existing assignment workflow still works -> Success (Status: $($assignment.asset.status))"

# 17. Existing dispatch workflow still works
# We must first return the assignment to make the asset AVAILABLE again before dispatching
$returned = Invoke-RestMethod -Uri "http://localhost:3001/assignments/$($assignment.assignment_id)/return" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"}
$validDispatchBody = @{
    asset_id=$workflowAsset.asset_id; 
    destination_branch_id=$branchId; 
    source_location="HQ";
    receiver_name="Test Receiver";
    receiver_id="REC001";
    receiver_phone="1234567890";
    dispatched_by=$employee.full_name
} | ConvertTo-Json
$dispatch = Invoke-RestMethod -Uri "http://localhost:3001/dispatches" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $validDispatchBody
Write-Host "17. Existing dispatch workflow still works -> Success (Status: $($dispatch.asset.status))"

# 18. Existing receipt workflow still works
$receiptBody = @{received_by=$employee.full_name; condition="Good"} | ConvertTo-Json
$receipt = Invoke-RestMethod -Uri "http://localhost:3001/dispatches/$($dispatch.dispatch_id)/receive" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $receiptBody
Write-Host "18. Existing receipt workflow still works -> Success (Status: $($receipt.asset.status))"

# 19. Existing maintenance workflow still works
$maintBody = @{asset_id=$workflowAsset.asset_id; problem_description="Test Issue"} | ConvertTo-Json
$maintenance = Invoke-RestMethod -Uri "http://localhost:3001/maintenance/requests" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $maintBody
Write-Host "19. Existing maintenance workflow still works -> Success (Status: $($maintenance.asset.status))"

# 20. Status change creates an AuditLog entry
# Get the audit logs for the first asset we modified status on
$auditResponse = Invoke-RestMethod -Uri "http://localhost:3001/audit-logs?entity_id=$($asset.asset_id)" -Headers @{"Authorization"="Bearer $adminToken"}
$auditLogs = if ($auditResponse.data) { $auditResponse.data } else { $auditResponse }
$statusChangeLogs = @($auditLogs | Where-Object { $_.action -eq 'UPDATE' })
if ($statusChangeLogs.Count -gt 0) {
    Write-Host "20. Status change creates AuditLog entry -> Success (Found $($statusChangeLogs.Count) logs)"
} else {
    Write-Host "20. Status change creates AuditLog entry -> FAILED (No logs found)"
}

Write-Host "All tests completed."
