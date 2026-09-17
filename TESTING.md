# Testing Plan and Results

Run the automated API suite with:

```bash
npm test
```

The test suite uses a temporary SQLite file and does not modify the development database. It starts the server on an ephemeral port, exercises HTTP endpoints, and removes the temporary database after completion.

## Test case matrix

| ID | Test description | Input | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- |
| TC-01 | Create a student using valid data | Valid student JSON | HTTP 201 and saved record | HTTP 201; record returned with generated ID | Passed |
| TC-02 | Create with missing fields | Empty name/email and missing academic fields | HTTP 400 with field errors | HTTP 400; validation errors returned | Passed |
| TC-03 | Create with invalid email | `not-an-email` | HTTP 400 with email error | HTTP 400; email error returned | Passed |
| TC-04 | Duplicate register number | Existing register number | HTTP 409 conflict | HTTP 409; register number conflict returned | Passed |
| TC-05 | Duplicate email | Existing email | HTTP 409 conflict | HTTP 409; email conflict returned | Passed |
| TC-06 | Read all student records | `GET /api/students` | HTTP 200 and records | HTTP 200; one record returned | Passed |
| TC-07 | Read one student | Existing ID | HTTP 200 and matching record | HTTP 200; returned name matched input | Passed |
| TC-08 | Read nonexistent student | ID `999999` | HTTP 404 | HTTP 404; not-found response returned | Passed |
| TC-09 | Update existing student | Valid changed payload | HTTP 200 and changed record | HTTP 200; year and name changes persisted | Passed |
| TC-10 | Update nonexistent student | ID `999999` | HTTP 404 | HTTP 404; not-found response returned | Passed |
| TC-11 | Delete existing student | Existing ID | HTTP 200 and record removed | HTTP 200; delete response returned | Passed |
| TC-12 | Delete nonexistent student | ID `999999` | HTTP 404 | HTTP 404 after the record was deleted | Passed |
| TC-13 | Search functionality | Search by name/register/email | Only matching records returned | HTTP 200; Ravi search returned one match | Passed |
| TC-14 | Department and year filters | Department + year query | Matching records returned | HTTP 200; combined filter returned one match | Passed |
| TC-15 | Dashboard statistics | `GET /api/dashboard/stats` | Totals and grouped counts returned | HTTP 200; total matched the created record | Passed |
| TC-16 | Mobile responsiveness | Browser viewport under 720px | Navigation collapses and content remains usable | Manual check required | Not run |
| TC-17 | Backend unavailable | Stop API and load client | Error notification shown | Manual check required | Not run |

## Manual test procedure

1. Run `npm run dev`.
2. Open the Vite URL in a browser.
3. Resize to desktop, tablet, and a mobile width.
4. Add a student, inspect it in the table, open details, edit it, and delete it.
5. Try duplicate register number/email and invalid form values.
6. Stop the backend and confirm the interface reports an error rather than showing a false success.
7. Add screenshots to `PROJECT_REPORT.md`.

The automated test results below are intentionally updated only after the test command has been executed.