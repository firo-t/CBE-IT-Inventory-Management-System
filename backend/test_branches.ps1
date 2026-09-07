$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWExMGQzYi1lM2NiLTRhYWYtODU4YS0xYTI5YTU2ODg3N2YiLCJlbWFpbCI6ImFkbWluQGNiZS5jb20iLCJyb2xlIjoiU3lzdGVtIEFkbWluaXN0cmF0b3IgLyBBZG1pbiIsImlhdCI6MTc4ODQxOTEwOCwiZXhwIjoxNzg4NTA1NTA4fQ.UdwtMJOJeFTKhFIcq54uNc6lnyrjteIv69FJDx3yQb4"

try {
  $managerBody = @{full_name="Manager User"; employee_id="MGR001"; email="mgr@cbe.com"; password="password123"; role_id="3b8f5434-ea27-4832-b925-038a3c8841a7"} | ConvertTo-Json
  $manager = Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $managerBody
  Write-Host "Created Branch Manager: $($manager.user_id)"
} catch {
  Write-Host "Manager user likely already exists"
  $manager = Invoke-RestMethod -Uri "http://localhost:3001/users" -Headers @{"Authorization"="Bearer $token"} | Where-Object { $_.email -eq "mgr@cbe.com" }
}

$branchBody = @{branch_code="B002"; branch_name="Second Branch"; location="Dire Dawa"} | ConvertTo-Json
$branch = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Method Post -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $branchBody
Write-Host "1. POST /branches: Success (Branch ID: $($branch.branch_id))"

$branches = Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $token"}
Write-Host "2. GET /branches: Success (Count: $($branches.Length))"

$b1 = Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Headers @{"Authorization"="Bearer $token"}
Write-Host "3. GET /branches/:id (Valid): Success"

try { Invoke-RestMethod -Uri "http://localhost:3001/branches/malformed" -Headers @{"Authorization"="Bearer $token"} } catch { Write-Host "3. GET /branches/:id (Malformed): $($_.Exception.Response.StatusCode)" }
try { Invoke-RestMethod -Uri "http://localhost:3001/branches/00000000-0000-0000-0000-000000000000" -Headers @{"Authorization"="Bearer $token"} } catch { Write-Host "3. GET /branches/:id (Nonexistent): $($_.Exception.Response.StatusCode)" }

$updateBody = @{branch_name="Updated Second Branch"} | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Method Patch -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $updateBody
Write-Host "4. PATCH /branches/:id (Update name): Success ($($updated.branch_name))"

$dupBody = @{branch_code="B001"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Method Patch -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $dupBody } catch { Write-Host "4. PATCH /branches/:id (Duplicate code): $($_.Exception.Response.StatusCode)" }

$nonexistentMgr = @{manager_id="00000000-0000-0000-0000-000000000000"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Method Patch -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $nonexistentMgr } catch { Write-Host "5. Manager validation (Nonexistent user): $($_.Exception.Response.StatusCode)" }

$adminUser = Invoke-RestMethod -Uri "http://localhost:3001/users" -Headers @{"Authorization"="Bearer $token"} | Where-Object { $_.email -eq "admin@cbe.com" }
$wrongRoleMgrBody = @{manager_id=$adminUser.user_id} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Method Patch -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $wrongRoleMgrBody } catch { Write-Host "5. Manager validation (Wrong role): $($_.Exception.Response.StatusCode)" }

$goodMgr = @{manager_id=$manager.user_id} | ConvertTo-Json
$mgrAssigned = Invoke-RestMethod -Uri "http://localhost:3001/branches/$($branch.branch_id)" -Method Patch -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $goodMgr
Write-Host "5. Manager validation (Valid manager): Success ($($mgrAssigned.manager.user_id))"

try { Invoke-RestMethod -Uri "http://localhost:3001/branches" } catch { Write-Host "6. Auth (No JWT): $($_.Exception.Response.StatusCode)" }

$mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"password123"}').access_token
try { Invoke-RestMethod -Uri "http://localhost:3001/branches" -Headers @{"Authorization"="Bearer $mgrToken"} } catch { Write-Host "7. AuthZ (Non-admin JWT): $($_.Exception.Response.StatusCode)" }
