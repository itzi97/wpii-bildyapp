# ========================================
# BildyApp API - COMPLETE USER FLOW
# npm run dev first
# ========================================

# 1. REGISTER NEW USER
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bildy.app", "password": "Admin123!"}'

# 2. Check MongoDB for verification code:
# mongosh "your-mongodb-uri" 
# db.users.findOne({email: "admin@bildy.app"}, {verificationCode: 1})
# You can do this in the MongoDB atlas site which is what I did

# 3. VALIDATE EMAIL
curl -X PUT http://localhost:3000/api/user/validation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'

# 4. PERSONAL DATA ONBOARDING
curl -X PUT http://localhost:3000/api/user/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "lastName": "Bildy", 
    "nif": "12345678Z"
  }'

# 5. CREATE COMPANY
curl -X PATCH http://localhost:3000/api/user/company \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bildy SL",
    "cif": "B87654321",
    "address": {
      "street": "Gran Vía",
      "number": "1",
      "postal": "28013",
      "city": "Madrid",
      "province": "Madrid"
    },
    "isFreelance": false
  }'

# 6. UPLOAD COMPANY LOGO
curl -X PATCH http://localhost:3000/api/user/logo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "logo=@/path/to/logo.png"

# 7. INVITE EMPLOYEE
curl -X POST http://localhost:3000/api/user/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@bildy.app",
    "name": "Ana", 
    "lastName": "Martín"
  }'

# 8. LOGIN as employee (use tempPassword from response #7)
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@bildy.app", "password": "TempPass123!"}'

# 9. GET FULL USER PROFILE
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN"

# 10. CHANGE PASSWORD
curl -X PUT http://localhost:3000/api/user/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "NewPass456!"
  }'

# 11. REFRESH TOKEN
curl -X POST http://localhost:3000/api/user/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'

# 12. SOFT DELETE
curl -X DELETE "http://localhost:3000/api/user?soft=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 13. LOGOUT
curl -X POST http://localhost:3000/api/user/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 14. HARD DELETE
curl -X DELETE http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
