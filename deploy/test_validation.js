// Simulate the validation logic
const ValidationRules = {
    diameter: {
        required: true,
        type: 'number',
        allowed: [1.75, 2.85],
        message: 'Diameter must be 1.75mm or 2.85mm'
    }
};

function validateFieldType(value, rule, fieldName) {
    if (rule.type === 'number' && value !== '') {
        const num = parseFloat(value);
        console.log('DEBUG diameter type conversion:', {
            originalValue: value,
            originalType: typeof value,
            convertedNum: num,
            isNaN: isNaN(num)
        });
        if (isNaN(num)) {
            return {
                valid: false,
                message: fieldName + ' must be a number'
            };
        }
        return num;
    }
    return value;
}

function validateFieldAllowed(value, rule, fieldName) {
    console.log('DEBUG diameter validation:', {
        value,
        valueType: typeof value,
        allowed: rule.allowed,
        allowedType: typeof rule.allowed,
        includesCheck: rule.allowed.includes(value)
    });
    if (rule.allowed && !rule.allowed.includes(value)) {
        return {
            valid: false,
            message: rule.message || fieldName + ' must be one of: ' + rule.allowed.join(', ')
        };
    }
    return { valid: true };
}

function validateField(fieldName, value) {
    const rule = ValidationRules[fieldName];
    if (!rule) return { valid: true };

    // Type validation
    value = validateFieldType(value, rule, fieldName);
    if (typeof value === 'object' && !value.valid) {
        return value;
    }

    // Allowed values validation
    const allowedResult = validateFieldAllowed(value, rule, fieldName);
    if (!allowedResult.valid) {
        return allowedResult;
    }

    return { valid: true };
}

console.log('=== Testing with string value from HTML select (1.75) ===');
const result1 = validateField('diameter', '1.75');
console.log('Result:', result1);

console.log('\n=== Testing with string value from HTML select (2.85) ===');
const result2 = validateField('diameter', '2.85');
console.log('Result:', result2);