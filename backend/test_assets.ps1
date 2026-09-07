$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token
$mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"password123"}').access_token

# Get an AssetType ID
$assetTypes = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Headers @{"Authorization"="Bearer $adminToken"}
$assetTypeId = $assetTypes[0].asset_type_id

# Get a Branch ID
$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $adminToken"}
$branchId = $branches[0].branch_id

# 1. Auth (No JWT)
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" } catch { Write-Host "1. Auth (No JWT): $($_.Exception.Response.StatusCode)" }

# 2. AuthZ (Non-authorized role POST)
$testBody = @{tag_no="AST-AUTHZ"; asset_type_id=$assetTypeId} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $mgrToken"; "Content-Type"="application/json"} -Body $testBody } catch { Write-Host "2. AuthZ (Branch Mgr POST): $($_.Exception.Response.StatusCode)" }

# 3. Create
$assetBody = @{tag_no="AST-0001"; serial_no="SN123456"; asset_type_id=$assetTypeId; model="Dell Latitude 5440"; current_branch_id=$branchId} | ConvertTo-Json
$asset = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assetBody
Write-Host "3. POST /assets: Success (ID: $($asset.asset_id))"

# 4. Duplicate tag
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assetBody } catch { Write-Host "4. POST Duplicate tag: $($_.Exception.Response.StatusCode)" }

# Setup second asset for update test
$assetBody2 = @{tag_no="AST-0002"; asset_type_id=$assetTypeId} | ConvertTo-Json
$asset2 = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $assetBody2

# 5. Invalid AssetType
$badTypeBody = @{tag_no="AST-0003"; asset_type_id="00000000-0000-0000-0000-000000000000"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $badTypeBody } catch { Write-Host "5. Invalid AssetType: $($_.Exception.Response.StatusCode)" }

# 6. Invalid Branch
$badBranchBody = @{tag_no="AST-0003"; asset_type_id=$assetTypeId; current_branch_id="00000000-0000-0000-0000-000000000000"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assets" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $badBranchBody } catch { Write-Host "6. Invalid Branch: $($_.Exception.Response.StatusCode)" }

# 7. List
$assets = Invoke-RestMethod -Uri "http://localhost:3001/assets" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "7. GET /assets: Success (Count: $($assets.Length))"

# 8. Get
$getAsset = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "8. GET /assets/:id: Success ($($getAsset.tag_no))"

# 9. Nonexistent
try { Invoke-RestMethod -Uri "http://localhost:3001/assets/00000000-0000-0000-0000-000000000000" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "9. Nonexistent ID: $($_.Exception.Response.StatusCode)" }

# 10. Update
$updateBody = @{description="Updated laptop"} | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $updateBody
Write-Host "10. PATCH /assets/:id: Success ($($updated.description))"

# 11. Duplicate update
$dupUpdateBody = @{tag_no="AST-0002"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/assets/$($asset.asset_id)" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $dupUpdateBody } catch { Write-Host "11. PATCH Duplicate: $($_.Exception.Response.StatusCode)" }

# 12. Invalid UUID
try { Invoke-RestMethod -Uri "http://localhost:3001/assets/malformed-id" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "12. Invalid UUID: $($_.Exception.Response.StatusCode)" }

# 13. Check sensitive
$isClean = $true
if ($getAsset.current_branch.manager.password_hash -or $getAsset.current_branch.manager.password) {
  $isClean = $false
}
Write-Host "13. Sensitive data hidden: $isClean"
