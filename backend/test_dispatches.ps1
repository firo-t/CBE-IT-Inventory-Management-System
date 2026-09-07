$adminToken = (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@cbe.com", "password":"SecureAdminPassword123!"}').access_token

function GetToken($email, $password, $roleName, $empId) {
    try {
        return (Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body "{""email"":""$email"", ""password"":""$password""}").access_token
    } catch {
        $roles = Invoke-RestMethod -Uri "http://localhost:3001/users" -Headers @{"Authorization"="Bearer $adminToken"} # we can just fetch from DB but users route has them? No, let's just fetch roles from DB... Wait, I will hardcode the create user request.
        # It's easier if I use prisma to create them or fetch them, but using API is cleaner.
        $roleId = ""
        # The database has seeded roles.
        # But I don't have a GET /roles endpoint in the test script. 
    }
}

# Instead of creating new users, let's use the DB directly to get roles or use Prisma via node script?
# To save time, we will query Prisma via a quick inline Node script to generate our tokens.
