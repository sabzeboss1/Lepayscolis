# Property-Based Testing Guide with Eris

## Overview

This project uses **Eris** (giorgiosironi/eris v1.0.0) for property-based testing. Property-based testing is a powerful testing methodology that automatically generates test cases to verify that properties (universal rules) hold for all valid inputs.

## What is Property-Based Testing?

Instead of writing individual test cases with specific inputs, you define **properties** - characteristics that should always be true. The testing framework then:

1. **Generates** hundreds of random test cases
2. **Executes** your property check for each case
3. **Shrinks** failing cases to the minimal example
4. **Reports** the simplest failing input

## Installation Verification

✅ Eris is installed and verified. Run the verification tests:

```bash
php artisan test --filter=ErisVerificationTest
```

Expected output: 5 tests passed with ~600 assertions (100+ generated cases per property).

## Basic Usage

### 1. Create a Property Test Class

```php
<?php

namespace Tests\Unit\PropertyBased;

use Eris\Generator;
use Eris\TestTrait;
use PHPUnit\Framework\TestCase;

class MyPropertyTest extends TestCase
{
    use TestTrait;  // Required for Eris functionality

    public function testMyProperty()
    {
        $this->forAll(
            Generator\int()  // Generate random integers
        )->then(function ($number) {
            // Your property assertion here
            $this->assertGreaterThanOrEqual(0, abs($number));
        });
    }
}
```

### 2. Available Generators

Eris provides many built-in generators:

```php
// Primitive types
Generator\int()                    // Random integers
Generator\nat()                    // Natural numbers (>= 0)
Generator\pos()                    // Positive integers (> 0)
Generator\neg()                    // Negative integers (< 0)
Generator\float()                  // Random floats
Generator\bool()                   // Random booleans
Generator\string()                 // Random strings
Generator\char()                   // Random characters

// Constrained values
Generator\choose(1, 100)           // Integers between 1 and 100
Generator\elements(['a', 'b', 'c']) // Pick from array
Generator\constant('fixed')        // Always returns same value

// Collections
Generator\seq(Generator\int())     // Array of integers
Generator\vector(3, Generator\int()) // Fixed-size array
Generator\associative([
    'name' => Generator\string(),
    'age' => Generator\nat()
])                                 // Associative array

// Combinators
Generator\oneOf(
    Generator\int(),
    Generator\string()
)                                  // Either int or string

Generator\tuple(
    Generator\string(),
    Generator\int()
)                                  // Pair of values

// Custom generators
Generator\map(
    function ($n) { return $n * 2; },
    Generator\int()
)                                  // Transform generated values

Generator\suchThat(
    function ($n) { return $n > 0; },
    Generator\int()
)                                  // Filter generated values
```

## Project-Specific Examples

### Authentication Properties

```php
/**
 * Property 1: Registration creates user with hashed password
 * Validates: Requirements 1.1
 */
public function testRegistrationHashesPassword()
{
    $this->forAll(
        Generator\string(),  // email
        Generator\string(),  // password
        Generator\string(),  // name
        Generator\string()   // phone
    )->then(function ($email, $password, $name, $phone) {
        // Ensure valid email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return; // Skip invalid emails
        }
        
        // Create user
        $user = User::create([
            'email' => $email,
            'password' => bcrypt($password),
            'name' => $name,
            'phone' => $phone,
        ]);
        
        // Property: Password should be hashed (not equal to plaintext)
        $this->assertNotEquals($password, $user->password);
        $this->assertTrue(Hash::check($password, $user->password));
    });
}
```

### KYC Properties

```php
/**
 * Property 15: KYC file validation
 * Validates: Requirements 2.5
 */
public function testKYCFileValidation()
{
    $this->forAll(
        Generator\choose(1, 10 * 1024 * 1024),  // File size in bytes
        Generator\elements(['jpg', 'jpeg', 'png', 'pdf', 'txt', 'exe'])
    )->then(function ($fileSize, $extension) {
        $isValidType = in_array($extension, ['jpg', 'jpeg', 'png', 'pdf']);
        $isValidSize = $fileSize <= 5 * 1024 * 1024; // 5MB
        
        $shouldPass = $isValidType && $isValidSize;
        
        // Property: Validation should reject invalid files
        if (!$shouldPass) {
            $this->expectException(ValidationException::class);
        }
        
        // Perform validation
        $validator = Validator::make([
            'file' => $this->createMockFile($fileSize, $extension)
        ], [
            'file' => 'required|mimes:jpg,jpeg,png,pdf|max:5120'
        ]);
        
        if ($shouldPass) {
            $this->assertTrue($validator->passes());
        }
    });
}
```

### Trip Properties

```php
/**
 * Property 23: Trip date validation
 * Validates: Requirements 3.3, 3.4
 */
public function testTripDateValidation()
{
    $this->forAll(
        Generator\int(),  // Days offset for departure
        Generator\int()   // Days offset for arrival
    )->then(function ($departureDays, $arrivalDays) {
        $departureDate = now()->addDays($departureDays);
        $arrivalDate = now()->addDays($arrivalDays);
        
        $isValidDeparture = $departureDate->isAfter(now());
        $isValidArrival = $arrivalDate->isAfter($departureDate);
        
        // Property: Valid trips must have future departure and arrival after departure
        $shouldBeValid = $isValidDeparture && $isValidArrival;
        
        $validator = Validator::make([
            'departure_date' => $departureDate->format('Y-m-d'),
            'arrival_date' => $arrivalDate->format('Y-m-d'),
        ], [
            'departure_date' => 'required|date|after:today',
            'arrival_date' => 'required|date|after:departure_date',
        ]);
        
        $this->assertEquals($shouldBeValid, $validator->passes());
    });
}
```

## Best Practices

### 1. Write Clear Property Descriptions

```php
/**
 * Property: [Clear description of what should always be true]
 * 
 * For any [input description], [expected behavior].
 * 
 * Validates: Requirements X.Y
 */
public function testPropertyName()
{
    // Implementation
}
```

### 2. Handle Invalid Inputs Gracefully

```php
$this->forAll(
    Generator\string()
)->then(function ($email) {
    // Skip invalid inputs instead of failing
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    
    // Test valid inputs
    // ...
});
```

### 3. Use Appropriate Generators

```php
// ❌ Bad: Too broad, generates invalid data
Generator\string()  // For email field

// ✅ Good: Constrained to valid domain
Generator\map(
    function ($name) { return $name . '@example.com'; },
    Generator\string()
)
```

### 4. Combine with Unit Tests

Property tests complement (not replace) unit tests:
- **Property tests**: Verify universal rules across many inputs
- **Unit tests**: Verify specific scenarios and edge cases

### 5. Configure Test Iterations

```php
public function testWithMoreIterations()
{
    $this->minimumEvaluationRatio(0.5)  // At least 50% should pass preconditions
         ->forAll(
             Generator\int()
         )
         ->then(function ($n) {
             // Test logic
         });
}
```

## Running Property Tests

### Run All Tests
```bash
php artisan test
```

### Run Only Property Tests
```bash
php artisan test --filter=PropertyBased
```

### Run Specific Property Test
```bash
php artisan test --filter=testRegistrationHashesPassword
```

### Run with Verbose Output
```bash
php artisan test --filter=PropertyBased --verbose
```

## Debugging Failed Properties

When a property test fails, Eris will:

1. **Show the failing input** - The specific values that caused the failure
2. **Shrink the example** - Find the minimal failing case
3. **Report the assertion** - Show which assertion failed

Example output:
```
Failed asserting that 'password123' does not equal 'password123'
Failed with input: ['email' => 'test@example.com', 'password' => 'password123', ...]
Shrunk to: ['email' => 'a@b.c', 'password' => 'a', ...]
```

## Integration with CI/CD

Property tests run automatically with PHPUnit:

```yaml
# .github/workflows/tests.yml
- name: Run Tests
  run: php artisan test
```

No special configuration needed - Eris integrates seamlessly with PHPUnit.

## Resources

- **Eris GitHub**: https://github.com/giorgiosironi/eris
- **Property-Based Testing Concepts**: https://hypothesis.works/articles/what-is-property-based-testing/
- **Laravel Testing Docs**: https://laravel.com/docs/11.x/testing

## Project Properties to Implement

This project has **112 properties** defined in the design document:

- **Properties 1-10**: Authentication (Task 4.4)
- **Properties 11-21**: KYC Verification (Task 7.5)
- **Properties 22-32**: Trip Management (Task 8.5)
- **Properties 33-44**: Shipment Management (Task 9.6)
- **Properties 45-55**: Messaging System (Task 11.5)
- **Properties 56-70**: Rating System (Task 14.5)
- **Properties 71-80**: Payment System (Task 15.5)
- **Properties 81-90**: File Management (Task 6.2)
- **Properties 91-102**: Notification System (Task 13.6)
- **Properties 103-112**: Additional system properties

Each property test validates specific requirements from the requirements document.

## Conclusion

Property-based testing with Eris provides:
- ✅ Automatic test case generation
- ✅ Edge case discovery
- ✅ Minimal failing examples
- ✅ Confidence in universal rules
- ✅ Seamless PHPUnit integration

Start writing property tests for your features following the examples in this guide!
