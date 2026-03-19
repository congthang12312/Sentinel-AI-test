# RequirementHash: f712e85c6a54acda8259941a4505ec65
@allure.label.epic:Authentication
@allure.label.suite:LoginModule

Feature: User Authentication
  As an OrangeHRM user
  I want to authenticate via the login portal
  So that I can access the system dashboard

  @allure.label.story:SuccessfulLogin
  Scenario: Successfully log in with valid credentials
    Given the user is on the login page
    When the user enters "Admin" into the "Username" field
    And the user enters "admin123" into the "Password" field
    And the user clicks the "Login" button
    Then the user should be redirected to the "Dashboard" page
    And the system should display the "Dashboard" header

  @allure.label.story:InvalidCredentials
  Scenario Outline: Attempt to log in with invalid credential combinations
    Given the user is on the login page
    When the user enters "<username>" into the "Username" field
    And the user enters "<password>" into the "Password" field
    And the user clicks the "Login" button
    Then the system should display the "Invalid credentials" error message

    Examples:
      | username | password |
      | Admin    | wrong123 |
      | invalid  | admin123 |
      | user     | password |

  @allure.label.story:FieldValidation
  Scenario Outline: Trigger required field validation messages
    Given the user is on the login page
    When the user enters "<username>" into the "Username" field
    And the user enters "<password>" into the "Password" field
    And the user clicks the "Login" button
    Then the system should display "<message>" under the "<field>" field

    Examples:
      | username | password | field    | message  |
      |          | admin123 | Username | Required |
      | Admin    |          | Password | Required |

  @allure.label.story:SecurityInjection
  Scenario: Prevent unauthorized access via SQL injection patterns
    Given the user is on the login page
    When the user enters "' OR 1=1 --" into the "Username" field
    And the user enters "password123" into the "Password" field
    And the user clicks the "Login" button
    Then the system should display the "Invalid credentials" error message

  @allure.label.story:InputBoundaries
  Scenario: Handle extreme input length in credentials
    Given the user is on the login page
    When the user enters a string of 256 characters into the "Username" field
    And the user enters a string of 256 characters into the "Password" field
    And the user clicks the "Login" button
    Then the system should display the "Invalid credentials" error message

  @allure.label.story:WhitespaceHandling
  Scenario: Verify login with trimmed leading and trailing whitespace
    Given the user is on the login page
    When the user enters " Admin " into the "Username" field
    And the user enters " admin123 " into the "Password" field
    And the user clicks the "Login" button
    Then the system should display the "Invalid credentials" error message