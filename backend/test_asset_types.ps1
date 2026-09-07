$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token

# We need a branch manager token. The previous test might have left one, let's try getting it or creating one.
try {
  $mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"password123"}').access_token
} catch {
  # If not exists, create it
  $managerBody = @{full_name="Manager User"; employee_id="MGR001"; email="mgr@cbe.com"; password="password123"; role_id="3b8f5434-ea27-4832-b925-038a3c8841a7"} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $managerBody
  $mgrToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"mgr@cbe.com", "password":"password123"}').access_token
}

# A. No JWT
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types" } catch { Write-Host "A. Auth (No JWT): $($_.Exception.Response.StatusCode)" }

# B. Non-admin JWT
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Headers @{"Authorization"="Bearer $mgrToken"} } catch { Write-Host "B. AuthZ (Non-admin JWT): $($_.Exception.Response.StatusCode)" }

# C. Create Laptop
$laptopBody = @{type_name="Laptop"; description="Portable computer"} | ConvertTo-Json
$laptop = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $laptopBody
Write-Host "C. POST /asset-types: Success (ID: $($laptop.asset_type_id))"

# D. Duplicate Laptop
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $laptopBody } catch { Write-Host "D. POST Duplicate: $($_.Exception.Response.StatusCode)" }

# E. List
$types = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "E. GET /asset-types: Success (Count: $($types.Length))"

# F. Get Valid
$getLaptop = Invoke-RestMethod -Uri "http://localhost:3001/asset-types/$($laptop.asset_type_id)" -Headers @{"Authorization"="Bearer $adminToken"}
Write-Host "F. GET /asset-types/:id: Success ($($getLaptop.type_name))"

# G. Invalid ID
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types/malformed-id" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "G. Invalid ID: $($_.Exception.Response.StatusCode)" }

# H. Nonexistent ID
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types/00000000-0000-0000-0000-000000000000" -Headers @{"Authorization"="Bearer $adminToken"} } catch { Write-Host "H. Nonexistent ID: $($_.Exception.Response.StatusCode)" }

# I. Update
$updateBody = @{description="Updated portable computer"} | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "http://localhost:3001/asset-types/$($laptop.asset_type_id)" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $updateBody
Write-Host "I. PATCH /asset-types/:id: Success ($($updated.description))"

# Setup for J
$desktopBody = @{type_name="Desktop"} | ConvertTo-Json
$desktop = Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $desktopBody

# J. Duplicate update
$dupUpdateBody = @{type_name="Desktop"} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types/$($laptop.asset_type_id)" -Method Patch -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $dupUpdateBody } catch { Write-Host "J. PATCH Duplicate: $($_.Exception.Response.StatusCode)" }

# K. Empty type_name
$emptyBody = @{type_name=""} | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://localhost:3001/asset-types" -Method Post -Headers @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"} -Body $emptyBody } catch { Write-Host "K. POST Empty name: $($_.Exception.Response.StatusCode)" }
