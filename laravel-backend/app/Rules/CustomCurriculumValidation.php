<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CustomCurriculumValidation implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (isset($value['specializations'])) {
            foreach ($value['specializations'] as $index => $specialization) {
              if(isset($specialization['categories'])){
                foreach ($specialization['categories'] as $categoryIndex => $category) {
    
                    if ($category['min'] < 0) {
                        $fail("A specializations[{$index}].categories[{$categoryIndex}].min nem lehet negatív.");
                        return;
                    }
    
                    if ($category['min'] > $specialization['min']) {
                        $fail("A specializations[{$index}].categories[{$categoryIndex}].min nem lehet nagyobb, mint a specializations[{$index}].min.");
                        return;
                    }
                }
              }

                $categoryMinsSum = array_sum(array_column($specialization['categories'], 'min'));
    
                if ($categoryMinsSum > $specialization['min']) {
                    $fail("A specializations[{$index}].categories min értékeinek összege nem lehet nagyobb, mint a specializations[{$index}].min.");
                    return;
                }
            }
        
        }
    }


    
}
