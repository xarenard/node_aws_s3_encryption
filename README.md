### S3 Encryption Test

```
AWS S3 Test
    Creating Random S3 bucket
      ✓ Should succeed (796ms)
      Created bucket
        ✓ should exists in S3 (283ms)
      Listing bucket
        - should return one bucket
      Uploading an object in S3
        Without encryption
          ✓ should be successfull (372ms)
          ✓ And the object should exist in S3 (288ms)
          ✓ And the object can be retrieved back (495ms)
        With SSE-S3 (AES256) encryption
          ✓ Should be successfull (374ms)
          ✓ And the object should exist in S3 (279ms)
          ✓ And the object can be retrieved back (462ms)
        With SSE-C(AES256) encryption
          ✓ Should be successfull (390ms)
          ✓ And the object should exist in S3 (297ms)
          ✓ And the the object can be read back with correct key (884ms)
          ✓ And the object can not be read back with wrong key (296ms)
        With SSE-KMS Encryption
          ✓ The call should succeed (556ms)
          ✓ And the object should exist in S3 (291ms)
          ✓ And the object can be retrieved back (426ms)
    Deleting S3 bucket
      - Deleting files
      - Deleting S3 bucket

```
