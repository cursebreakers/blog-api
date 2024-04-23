#!/bin/bash

# Replace YOUR_JWT_TOKEN_HERE with the actual JWT token
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjI4MTEzNGUyNGRiZmRlMzI4NTY4OTciLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzEzOTAyNjQ5LCJleHAiOjE3MTM5MDYyNDl9.fO2Sax_erRiwhq_Fw7bAw73zXbY5_ZwytEY0SfVJD5g"

POST_ID="662817d64c57719520e8c2b4"

# cURL command to retrieve the post by ID
curl -X GET \
  http://localhost:6969/posts \
  -H "Authorization: Bearer $JWT_TOKEN"
