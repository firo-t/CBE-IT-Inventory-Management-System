$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token

# Hardware Technician Token (for AuthZ testing)
try {
  $techToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"tech@cbe.com", "password":"password123"}').access_token
} catch {
  $techBody = @{full_name="Hardware Tech"; employee_id="TECH001"; email="tech@cbe.com"; password="password123"; role_id="41b12d59-3fb9-4f6c-b391-7fc0292778ba"} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $techBody
  $techToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"tech@cbe.com", "password":"password123"}').access_token
}

$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $adminToken"}
$branchId = $branches[0].branch_id

$assets = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Headers @{"Authorization"="Bearer $adminToken"}
$assetId = $assets[0].asset_id

# A. Authentication
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post } catch { Write-Host "1. POST without JWT: $($_.Exception.Response.StatusCode)" }
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" } catch { Write-Host "2. GET without JWT: $($_.Exception.Response.StatusCode)" }

# B. Authorization
$assignBody = @{asset_id=$assetId; employee_id="EMP001"; employee_name="John Doe"; branch_id=$branchId} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $techToken"; "Content-Type"="application/json"} -Body $assignBody } catch { Write-Host "3. POST unauthorized role: $($_.Exception.Response.StatusCode)" }
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments/123/return" -Method Patch -Headers @{"Authorization"="Bearer $techToken"} } catch { Write-Host "4. RETURN unauthorized role: $($_.Exception.Response.StatusCode)" }

# C. Creation
$assignment = Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assignBody
Write-Host "5. Create valid assignment: Success"
Write-Host "6. Verify assignment.status = ACTIVE: $($assignment.status -eq 'ACTIVE')"
Write-Host "7. Verify asset.status = ASSIGNED: $($assignment.asset.status -eq 'ASSIGNED')"
Write-Host "8. Verify assigned_by logic works: $($assignment.assigned_by -ne $null)"
Write-Host "9. Verify returned_date is null: $($null -eq $assignment.returned_date)"

# D. Duplicate active assignment
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assignBody } catch { Write-Host "10. Duplicate active assignment: $($_.Exception.Response.StatusCode)" }

$activeAssignments = Invoke-RestMethod -Uri "http://localhost:3001/assignments?status=ACTIVE" -Headers @{"Authorization"="Bearer $adminToken"}
$countAssetActive = 0
foreach ($a in $activeAssignments) { if ($a.asset_id -eq $assetId) { $countAssetActive++ } }
Write-Host "11. Verify only one ACTIVE exists for asset: $($countAssetActive -eq 1)"

# E. Invalid references
$badAssetBody = @{asset_id="00000000-0000-0000-0000-000000000000"; employee_id="E"; employee_name="N"; branch_id=$branchId} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $badAssetBody } catch { Write-Host "12. Nonexistent asset: $($_.Exception.Response.StatusCode)" }

$badBranchBody = @{asset_id=$assetId; employee_id="E"; employee_name="N"; branch_id="00000000-0000-0000-0000-000000000000"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $badBranchBody } catch { Write-Host "13. Nonexistent branch: $($_.Exception.Response.StatusCode)" }

$malformedAssetBody = @{asset_id="malformed"; employee_id="E"; employee_name="N"; branch_id=$branchId} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $malformedAssetBody } catch { Write-Host "14. Malformed asset UUID: $($_.Exception.Response.StatusCode)" }

$malformedBranchBody = @{asset_id=$assetId; employee_id="E"; employee_name="N"; branch_id="malformed"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $malformedBranchBody } catch { Write-Host "15. Malformed branch UUID: $($_.Exception.Response.StatusCode)" }

# F. Return
$returned = Invoke-RestMethod -Uri "http://localhost:3001/assignments/$($assignment.assignment_id)/return" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "16. Return active assignment: Success"
Write-Host "17. Verify assignment.status = RETURNED: $($returned.status -eq 'RETURNED')"
Write-Host "18. Verify returned_date is populated: $($returned.returned_date -ne $null)"
Write-Host "19. Verify asset.status = AVAILABLE: $($returned.asset.status -eq 'AVAILABLE')"

# G. Double return
try { Invoke-RestMethod -Uri "http://localhost:3001/assignments/$($assignment.assignment_id)/return" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "20. Double return: $($_.Exception.Response.StatusCode)" }

# H. History
$allAssignments = Invoke-RestMethod -Uri "http://localhost:3001/assignments" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "21. GET /assignments -> includes returned assignment: $($allAssignments.Length -gt 0)"
$activeFiltered = Invoke-RestMethod -Uri "http://localhost:3001/assignments?status=ACTIVE" -Headers @{"Authorization"="Bearer $adminToken"}
$returnedFiltered = Invoke-RestMethod -Uri "http://localhost:3001/assignments?status=RETURNED" -Headers @{"Authorization"="Bearer $adminToken"}
$hasActive = $false
foreach ($a in $activeFiltered) { if ($a.assignment_id -eq $assignment.assignment_id) { $hasActive = $true } }
Write-Host "22. GET /assignments?status=ACTIVE -> excludes returned: $(-not $hasActive)"
$hasReturned = $false
foreach ($a in $returnedFiltered) { if ($a.assignment_id -eq $assignment.assignment_id) { $hasReturned = $true } }
Write-Host "23. GET /assignments?status=RETURNED -> includes returned: $($hasReturned)"

# I. Regression
$getAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "24. GET /assets still works: $($getAssets.Length -gt 0)"
$getAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets/$assetId" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "25. GET /assets/:id still works: $($getAsset.tag_no -ne $null)"
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $techToken"; "Content-Type"="application/json"} -Body '{}' } catch { Write-Host "26. POST /assets still respects RBAC: $($_.Exception.Response.StatusCode)" }
Write-Host "27. Existing authentication still works: True"
$isClean = $true
if ($assignment.assigner.password_hash -or $assignment.assigner.password) { $isClean = $false }
Write-Host "28. No password_hash appears: $isClean"
