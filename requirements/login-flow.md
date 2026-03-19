# Login Flow — OrangeHRM
**Module:** auth
## User Story
As an OrangeHRM user, I want to log in with my username and password
so that I can access the dashboard.

## Application
- URL: https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
- Platform: React SPA (OrangeHRM 5.x)

## Acceptance Criteria
1. User navigates to the login page
2. User enters valid username "Admin" and password "admin123"
3. User clicks the "Login" button
4. System redirects to dashboard page
5. Dashboard displays the "Dashboard" heading

## Error Cases
- Wrong password → show "Invalid credentials" message
- Empty username → show "Required" validation message
- Empty password → show "Required" validation message

## Senior QA Test Coverage Expectations
Please generate a comprehensive suite of edge cases and negative scenarios, such as:
- SQL Injection attempts in the username field (e.g., `' OR 1=1 --`)
- Extremely long strings in username/password fields
- Leading and trailing spaces in valid credentials
- Case sensitivity testing for the Username ("admin" vs "Admin")
- Maximize the test coverage up to 8 scenarios.
