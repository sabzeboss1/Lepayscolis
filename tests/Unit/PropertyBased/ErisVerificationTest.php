<?php

namespace Tests\Unit\PropertyBased;

use Eris\Generator;
use Eris\TestTrait;
use PHPUnit\Framework\TestCase;

/**
 * Verification test to ensure Eris property-based testing library is working correctly.
 * This test serves as a proof of installation and basic functionality.
 */
class ErisVerificationTest extends TestCase
{
    use TestTrait;

    /**
     * Property: String concatenation length equals sum of individual lengths
     * 
     * For any two strings a and b, the length of their concatenation
     * should equal the sum of their individual lengths.
     */
    public function testStringConcatenationLengthProperty()
    {
        $this->forAll(
            Generator\string(),
            Generator\string()
        )->then(function ($str1, $str2) {
            $concatenated = $str1 . $str2;
            $expectedLength = strlen($str1) + strlen($str2);
            
            $this->assertEquals(
                $expectedLength,
                strlen($concatenated),
                "Concatenation length should equal sum of individual lengths"
            );
        });
    }

    /**
     * Property: Array reverse is involutive (reversing twice returns original)
     * 
     * For any array, reversing it twice should return the original array.
     */
    public function testArrayReverseInvolutiveProperty()
    {
        $this->forAll(
            Generator\seq(Generator\int())
        )->then(function ($array) {
            $reversed = array_reverse($array);
            $doubleReversed = array_reverse($reversed);
            
            $this->assertEquals(
                $array,
                $doubleReversed,
                "Reversing an array twice should return the original array"
            );
        });
    }

    /**
     * Property: Addition is commutative
     * 
     * For any two integers a and b, a + b should equal b + a.
     */
    public function testAdditionCommutativeProperty()
    {
        $this->forAll(
            Generator\int(),
            Generator\int()
        )->then(function ($a, $b) {
            $this->assertEquals(
                $a + $b,
                $b + $a,
                "Addition should be commutative"
            );
        });
    }

    /**
     * Property: Absolute value is always non-negative
     * 
     * For any integer, its absolute value should be >= 0.
     */
    public function testAbsoluteValueNonNegativeProperty()
    {
        $this->forAll(
            Generator\int()
        )->then(function ($number) {
            $this->assertGreaterThanOrEqual(
                0,
                abs($number),
                "Absolute value should always be non-negative"
            );
        });
    }

    /**
     * Property: Email validation consistency
     * 
     * For any string that passes filter_var email validation,
     * it should contain an @ symbol.
     */
    public function testEmailValidationProperty()
    {
        $this->forAll(
            Generator\string()
        )->then(function ($string) {
            $isValidEmail = filter_var($string, FILTER_VALIDATE_EMAIL) !== false;
            
            if ($isValidEmail) {
                $this->assertStringContainsString(
                    '@',
                    $string,
                    "Valid email should contain @ symbol"
                );
            } else {
                // If not a valid email, this is expected behavior
                $this->assertTrue(true);
            }
        });
    }
}
