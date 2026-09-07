$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"password123"}').access_token

$allAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Headers @{"Authorization"="Bearer $adminToken"}
$testAsset = $allAssets[0]

Write-Host "1. GET /assets: Count $($allAssets.Length)"

$searchAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?search=Dell" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "2. GET /assets?search=Dell: Count $($searchAssets.Length)"

$tagAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?tag_no=AST-0001" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "3. GET /assets?tag_no=AST-0001: Count $($tagAssets.Length)"

$serialAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?serial_no=$($testAsset.serial_no)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "4. GET /assets?serial_no: Count $($serialAssets.Length)"

$typeAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?asset_type_id=$($testAsset.asset_type_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "5. GET /assets?asset_type_id: Count $($typeAssets.Length)"

$branchAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?current_branch_id=$($testAsset.current_branch_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "6. GET /assets?current_branch_id: Count $($branchAssets.Length)"

$statusAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?status=AVAILABLE" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "7. GET /assets?status=AVAILABLE: Count $($statusAssets.Length)"

$conditionAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?condition=$($testAsset.condition)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "8. GET /assets?condition: Count $($conditionAssets.Length)"

$combinedAssets = Invoke-RestMethod -Uri "http://localhost:3001/assets?status=AVAILABLE&current_branch_id=$($testAsset.current_branch_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "9. GET /assets?status=AVAILABLE&current_branch_id: Count $($combinedAssets.Length)"

$searchAndFilter = Invoke-RestMethod -Uri "http://localhost:3001/assets?search=Dell&status=AVAILABLE" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "10. GET /assets?search=Dell&status=AVAILABLE: Count $($searchAndFilter.Length)"

try { Invoke-RestMethod -Uri "http://localhost:3001/assets?asset_type_id=malformed" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "11. Invalid asset_type_id: $($_.Exception.Response.StatusCode)" }

try { Invoke-RestMethod -Uri "http://localhost:3001/assets?current_branch_id=malformed" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "12. Invalid current_branch_id: $($_.Exception.Response.StatusCode)" }

try { Invoke-RestMethod -Uri "http://localhost:3001/assets?status=INVALID_STATUS" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "13. Invalid status: $($_.Exception.Response.StatusCode)" }

$noResults = Invoke-RestMethod -Uri "http://localhost:3001/assets?search=NonexistentSuperComputer" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "14. Search with no results: Count $($noResults.Length)"

try { Invoke-RestMethod -Uri "http://localhost:3001/assets" } catch { Write-Host "15. GET /assets without JWT: $($_.Exception.Response.StatusCode)" }

try {
  $testBody = @{tag_no="AST-AUTHZ-2"; asset_type_id=$testAsset.asset_type_id} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $mgrToken"; "Content-Type"="application/json"} -Body $testBody
} catch {
  Write-Host "16. Existing non-authorized role (POST): $($_.Exception.Response.StatusCode)"
}

$isClean = $true
if ($allAssets[0].current_branch.manager.password_hash -or $allAssets[0].current_branch.manager.password) {
  $isClean = $false
}
Write-Host "17. Sensitive data hidden: $isClean"

Write-Host "18. Regression Check:"
$getAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($testAsset.asset_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "- GET /assets/:id works"

$patchBody = @{description="Updated regression check"} | ConvertTo-Json
$patchedAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($testAsset.asset_id)" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $patchBody
Write-Host "- PATCH /assets/:id works ($($patchedAsset.description))"
